-- Saga schema. Apply this file in the Supabase SQL editor.
--
-- notes.content is the BlockNote document (native JSON) and the source of truth.
-- plain_text is a derived search field. Markdown is not stored.
-- note_versions keeps earlier documents. A before-update trigger writes the
-- previous title and content at most once a minute.
-- files is a separate library. It has no versions. The app deletes the object
-- through the Storage API, then deletes the row.
-- note_shares holds the public id for a shared note. Reading that note does
-- not require a session. Editing it does.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 80)
);

-- ---------------------------------------------------------------------------
-- Notebooks
-- ---------------------------------------------------------------------------

create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notebooks_name_length check (char_length(btrim(name)) between 1 and 120)
);

create index notebooks_user_created_idx on public.notebooks (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notebook_id uuid references public.notebooks (id) on delete set null,
  title text not null default '',
  content jsonb not null default '[]'::jsonb,
  plain_text text not null default '',
  is_pinned boolean not null default false,
  is_hidden boolean not null default false,
  editor_id uuid,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(plain_text, ''))
  ) stored,
  constraint notes_title_length check (char_length(title) <= 500)
);

comment on column public.notes.content is
  'BlockNote document JSON. Source of truth. Do not replace with Markdown.';

comment on column public.notes.is_hidden is
  'Hidden notes stay out of the usual lists. They are not versioned separately.';

comment on column public.notes.editor_id is
  'Editor instance that last saved. That editor ignores its echo. Another open copy, including the same account on another device, still applies the change.';

create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_user_notebook_idx on public.notes (user_id, notebook_id);
create index notes_user_trashed_idx on public.notes (user_id, trashed_at);
create index notes_search_idx on public.notes using gin (search_vector);

-- ---------------------------------------------------------------------------
-- Versions
-- ---------------------------------------------------------------------------

create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content jsonb not null,
  version_number integer not null,
  created_at timestamptz not null default now(),
  constraint note_versions_number_positive check (version_number > 0),
  constraint note_versions_note_number_unique unique (note_id, version_number)
);

comment on table public.note_versions is
  'Earlier BlockNote documents for a note. Append-only.';

create index note_versions_note_number_idx
  on public.note_versions (note_id, version_number desc);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_name_length check (char_length(btrim(name)) between 1 and 40)
);

create unique index tags_user_name_lower_idx on public.tags (user_id, lower(name));

create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (note_id, tag_id)
);

create index note_tags_tag_idx on public.note_tags (tag_id);
create index note_tags_user_idx on public.note_tags (user_id);

-- ---------------------------------------------------------------------------
-- Timestamps
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

create trigger notebooks_touch_updated_at
before update on public.notebooks
for each row
execute function public.touch_updated_at();

create or replace function public.touch_note_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.title is distinct from new.title
     or old.content is distinct from new.content
     or old.plain_text is distinct from new.plain_text
     or old.notebook_id is distinct from new.notebook_id then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create trigger notes_touch_updated_at
before update on public.notes
for each row
execute function public.touch_note_updated_at();

-- ---------------------------------------------------------------------------
-- Version snapshots
-- ---------------------------------------------------------------------------

create or replace function public.snapshot_note_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_at timestamptz;
  next_number integer;
  latest_title text;
  latest_content jsonb;
begin
  if old.title is not distinct from new.title
     and old.content is not distinct from new.content then
    return new;
  end if;

  -- The starter document is not worth a version.
  if coalesce(old.plain_text, '') = ''
     and coalesce(old.title, '') in ('', 'Untitled') then
    return new;
  end if;

  select created_at, version_number, title, content
    into last_at, next_number, latest_title, latest_content
  from public.note_versions
  where note_id = old.id
  order by version_number desc
  limit 1;

  if latest_content is not null
     and latest_title is not distinct from old.title
     and latest_content is not distinct from old.content then
    return new;
  end if;

  if last_at is not null and now() - last_at < interval '60 seconds' then
    return new;
  end if;

  insert into public.note_versions (note_id, user_id, title, content, version_number)
  values (old.id, old.user_id, old.title, old.content, coalesce(next_number, 0) + 1);

  return new;
end;
$$;

create trigger notes_snapshot_version
before update of title, content on public.notes
for each row
when (old.title is distinct from new.title or old.content is distinct from new.content)
execute function public.snapshot_note_before_update();

create or replace function public.checkpoint_note(p_note_id uuid)
returns public.note_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  n public.notes;
  next_number integer;
  latest_title text;
  latest_content jsonb;
  created public.note_versions;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select * into n
  from public.notes
  where id = p_note_id and user_id = auth.uid();

  if not found then
    raise exception 'Note not found';
  end if;

  select version_number, title, content
    into next_number, latest_title, latest_content
  from public.note_versions
  where note_id = n.id
  order by version_number desc
  limit 1;

  if latest_content is not null
     and latest_title is not distinct from n.title
     and latest_content is not distinct from n.content then
    select * into created
    from public.note_versions
    where note_id = n.id
    order by version_number desc
    limit 1;
    return created;
  end if;

  insert into public.note_versions (note_id, user_id, title, content, version_number)
  values (n.id, n.user_id, n.title, n.content, coalesce(next_number, 0) + 1)
  returning * into created;

  return created;
end;
$$;

revoke all on function public.touch_updated_at() from public;
revoke all on function public.touch_note_updated_at() from public;
revoke all on function public.snapshot_note_before_update() from public;
grant execute on function public.touch_updated_at() to authenticated;
grant execute on function public.touch_note_updated_at() to authenticated;
grant execute on function public.snapshot_note_before_update() to authenticated;

revoke all on function public.checkpoint_note(uuid) from public;
grant execute on function public.checkpoint_note(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- New accounts get a profile and an Inbox notebook
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1), '')
  );

  insert into public.notebooks (user_id, name)
  values (new.id, 'Inbox');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.notebooks enable row level security;
alter table public.notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;

create policy profiles_select on public.profiles
for select to authenticated
using (id = auth.uid());

create policy profiles_insert on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy profiles_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy notebooks_all on public.notebooks
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notes_all on public.notes
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy note_versions_select on public.note_versions
for select to authenticated
using (user_id = auth.uid());

create policy tags_all on public.tags
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy note_tags_all on public.note_tags
for all to authenticated
using (
  user_id = auth.uid()
  and exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
)
with check (
  user_id = auth.uid()
  and exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid())
  and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Shared notes. The share id is the link. Anonymous clients can read one
-- note through get_shared_note. They cannot list the table.
-- ---------------------------------------------------------------------------

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

create or replace function public.save_shared_note(
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
  if p_title is null or char_length(p_title) > 500 then
    raise exception 'Title is too long';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'array' then
    raise exception 'Note content must be a document';
  end if;

  if p_editor_id is null then
    raise exception 'Editor id is required';
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

alter table public.notes replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Image storage. Public read keeps BlockNote image URLs stable.
-- Writes are limited to a folder named with the signed-in user id.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-media',
  'note-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy note_media_public_read on storage.objects
for select to public
using (bucket_id = 'note-media');

create policy note_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'note-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy note_media_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'note-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- File library. One row per file, no history. The app deletes the object
-- through the Storage API, then deletes the row. Supabase rejects direct
-- deletes from storage.objects.
-- ---------------------------------------------------------------------------

create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now(),
  constraint files_name_length check (char_length(btrim(name)) between 1 and 200),
  constraint files_size_positive check (size_bytes > 0),
  constraint files_path_unique unique (storage_path)
);

comment on table public.files is
  'User files. Not versioned. Delete removes the row and the stored object.';

create index files_user_created_idx on public.files (user_id, created_at desc);

alter table public.files enable row level security;

create policy files_select on public.files
for select to authenticated
using (user_id = auth.uid());

create policy files_insert on public.files
for insert to authenticated
with check (user_id = auth.uid());

create policy files_delete on public.files
for delete to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit)
values ('library', 'library', false, 26214400)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

create policy library_select on storage.objects
for select to authenticated
using (
  bucket_id = 'library'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy library_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'library'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy library_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'library'
  and (storage.foldername(name))[1] = auth.uid()::text
);
