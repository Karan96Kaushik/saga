-- File library. Not versioned. The app deletes the object, then the row.
-- This trigger clears the storage record if the row goes away on its own.

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

create or replace function public.delete_library_object()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects
  where bucket_id = 'library'
    and name = old.storage_path;
  return old;
end;
$$;

create trigger files_delete_object
before delete on public.files
for each row
execute function public.delete_library_object();

revoke all on function public.delete_library_object() from public;
grant execute on function public.delete_library_object() to authenticated;

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
