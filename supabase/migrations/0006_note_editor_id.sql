-- Each save is stamped with the editor that wrote it.
-- That editor ignores the echo. Another open copy of the same account still applies it.

alter table public.notes
  add column if not exists editor_id uuid;

comment on column public.notes.editor_id is
  'Editor instance that last saved. That editor ignores its echo. Another open copy, including the same account on another device, still applies the change.';

drop function if exists public.get_shared_note(uuid);
drop function if exists public.save_shared_note(uuid, text, jsonb, text);

create function public.get_shared_note(p_share_id uuid)
returns table (
  share_id uuid,
  note_id uuid,
  title text,
  content jsonb,
  updated_at timestamptz,
  editor_id uuid,
  is_owner boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select s.id, n.id, n.title, n.content, n.updated_at, n.editor_id, auth.uid() is not distinct from n.user_id
  from public.note_shares s
  join public.notes n on n.id = s.note_id
  where s.id = p_share_id
    and n.trashed_at is null;
$$;

create function public.save_shared_note(
  p_share_id uuid,
  p_title text,
  p_content jsonb,
  p_plain_text text,
  p_editor_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  saved timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Sign in to edit this note';
  end if;
  if p_editor_id is null then
    raise exception 'Editor id is required';
  end if;
  if p_title is null or char_length(p_title) > 500 then
    raise exception 'Title is too long';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'array' then
    raise exception 'Note content must be a document';
  end if;

  select n.id into target
  from public.note_shares s
  join public.notes n on n.id = s.note_id
  where s.id = p_share_id
    and n.trashed_at is null;

  if target is null then
    raise exception 'This link is not active';
  end if;

  update public.notes
  set
    title = coalesce(nullif(btrim(p_title), ''), 'Untitled'),
    content = p_content,
    plain_text = left(coalesce(p_plain_text, ''), 20000),
    editor_id = p_editor_id
  where id = target
  returning updated_at into saved;

  return saved;
end;
$$;

revoke all on function public.get_shared_note(uuid) from public;
grant execute on function public.get_shared_note(uuid) to anon, authenticated;

revoke all on function public.save_shared_note(uuid, text, jsonb, text, uuid) from public;
grant execute on function public.save_shared_note(uuid, text, jsonb, text, uuid) to authenticated;
