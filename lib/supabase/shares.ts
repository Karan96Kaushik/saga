import type { Json, SharedNote } from '@/lib/supabase/types';
import { supabase } from '@/utils/supabase';

const SHARE_COLUMNS = 'id, note_id, user_id, created_at' as const;

export async function getNoteShare(noteId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('note_shares')
    .select(SHARE_COLUMNS)
    .eq('note_id', noteId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function createNoteShare(userId: string, noteId: string): Promise<string> {
  const existing = await getNoteShare(noteId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from('note_shares')
    .insert({ user_id: userId, note_id: noteId })
    .select(SHARE_COLUMNS)
    .single();
  if (error) throw error;
  return data.id;
}

export async function revokeNoteShare(noteId: string): Promise<void> {
  const { error } = await supabase.from('note_shares').delete().eq('note_id', noteId);
  if (error) throw error;
}

export async function getSharedNote(shareId: string): Promise<SharedNote | null> {
  const { data, error } = await supabase.rpc('get_shared_note', { p_share_id: shareId });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function saveSharedNote(input: {
  shareId: string;
  title: string;
  content: Json;
  plainText: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('save_shared_note', {
    p_share_id: input.shareId,
    p_title: input.title,
    p_content: input.content,
    p_plain_text: input.plainText,
  });
  if (error) throw error;
  return data;
}
