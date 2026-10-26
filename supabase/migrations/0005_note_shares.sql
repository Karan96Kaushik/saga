-- Share links and realtime updates for notes.
-- The share id is unguessable. Anonymous clients can read that one note
-- through get_shared_note. They cannot list shares or notes.

create table public.note_shares (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null unique references public.notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.note_shares is
  'Public link id for a note. Access is through get_shared_note, not a table read.';

alter table public.note_shares enable row level security;

create policy note_shares_select on public.note_shares
for select to authenticated
using (user_id = auth.uid());

create policy note_shares_insert on public.note_shares
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.notes n
    where n.id = note_id and n.user_id = auth.uid() and n.trashed_at is null
  )
);

create policy note_shares_delete on public.note_shares
for delete to authenticated
using (user_id = auth.uid());

create or replace function public.get_shared_note(p_share_id uuid)
returns table (
  share_id uuid,
  note_id uuid,
  title text,
  content jsonb,
  updated_at timestamptz,
  is_owner boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select s.id, n.id, n.title, n.content, n.updated_at, auth.uid() is not distinct from n.user_id
  from public.note_shares s
  join public.notes n on n.id = s.note_id
  where s.id = p_share_id
    and n.trashed_at is null;
$$;

create or replace function public.save_shared_note(
  p_share_id uuid,
  p_title text,
  p_content jsonb,
  p_plain_text text
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
    plain_text = left(coalesce(p_plain_text, ''), 20000)
  where id = target
  returning updated_at into saved;

  return saved;
end;
$$;

revoke all on function public.get_shared_note(uuid) from public;
grant execute on function public.get_shared_note(uuid) to anon, authenticated;

revoke all on function public.save_shared_note(uuid, text, jsonb, text) from public;
grant execute on function public.save_shared_note(uuid, text, jsonb, text) to authenticated;

alter table public.notes replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
