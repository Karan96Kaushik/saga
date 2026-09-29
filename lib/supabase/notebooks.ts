import type { NotebookRow } from '@/lib/supabase/types';
import { supabase } from '@/utils/supabase';

export async function listNotebooks(): Promise<NotebookRow[]> {
  const { data, error } = await supabase
    .from('notebooks')
    .select('id, user_id, name, created_at, updated_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createNotebook(userId: string, name: string): Promise<NotebookRow> {
  const { data, error } = await supabase
    .from('notebooks')
    .insert({ user_id: userId, name: name.trim() })
    .select('id, user_id, name, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function renameNotebook(id: string, name: string): Promise<NotebookRow> {
  const { data, error } = await supabase
    .from('notebooks')
    .update({ name: name.trim() })
    .eq('id', id)
    .select('id, user_id, name, created_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNotebook(id: string): Promise<void> {
  const { error } = await supabase.from('notebooks').delete().eq('id', id);
  if (error) throw error;
}
