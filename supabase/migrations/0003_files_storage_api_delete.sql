-- Supabase rejects DELETE on storage.objects ("use the Storage API instead").
-- Drop the trigger that did that. The app deletes the object through the
-- Storage API, then deletes the files row.

drop trigger if exists files_delete_object on public.files;
drop function if exists public.delete_library_object();
