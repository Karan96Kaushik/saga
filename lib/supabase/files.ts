import { fileDisplayName, MAX_FILE_BYTES } from '@/lib/files/format';
import type { FileRow } from '@/lib/supabase/types';
import { supabase } from '@/utils/supabase';

const FILE_COLUMNS = 'id, user_id, name, storage_path, mime_type, size_bytes, created_at' as const;

export async function listFiles(): Promise<FileRow[]> {
  const { data, error } = await supabase
    .from('files')
    .select(FILE_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFile(id: string): Promise<FileRow | null> {
  const { data, error } = await supabase.from('files').select(FILE_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadLibraryFile(userId: string, file: File): Promise<FileRow> {
  if (file.size <= 0) throw new Error('That file is empty.');
  if (file.size > MAX_FILE_BYTES) throw new Error('Files must be 25MB or smaller.');

  const id = crypto.randomUUID();
  const name = fileDisplayName(file.name);
  const storageName = name.replace(/[^\w.\- ()]+/g, '').trim() || 'file';
  const storagePath = `${userId}/${id}/${storageName}`;
  const { error: uploadError } = await supabase.storage.from('library').upload(storagePath, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('files')
    .insert({
      id,
      user_id: userId,
      name,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
    })
    .select(FILE_COLUMNS)
    .single();
  if (error) {
    await supabase.storage.from('library').remove([storagePath]);
    throw error;
  }
  return data;
}

/** Removes the stored object through the Storage API, then deletes the row. */
export async function deleteLibraryFile(id: string): Promise<void> {
  const file = await getFile(id);
  if (!file) return;
  const { error: storageError } = await supabase.storage.from('library').remove([file.storage_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from('files').delete().eq('id', id);
  if (error) throw error;
}

export async function openLibraryFile(file: FileRow): Promise<void> {
  const { data, error } = await supabase.storage.from('library').createSignedUrl(file.storage_path, 60, {
    download: file.name,
  });
  if (error || !data?.signedUrl) throw error ?? new Error('Could not open that file.');
  const anchor = document.createElement('a');
  anchor.href = data.signedUrl;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
