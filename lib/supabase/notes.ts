import type { Database, Json, NoteRow, NoteSummary } from '@/lib/supabase/types';
import { supabase } from '@/utils/supabase';

type NoteUpdate = Database['public']['Tables']['notes']['Update'];

const SUMMARY_COLUMNS =
  'id, user_id, notebook_id, title, plain_text, is_pinned, is_hidden, trashed_at, created_at, updated_at' as const;

const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, content` as const;

export async function listNotes(): Promise<NoteSummary[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(SUMMARY_COLUMNS)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getNote(id: string): Promise<NoteRow> {
  const { data, error } = await supabase.from('notes').select(DETAIL_COLUMNS).eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createNote(input: {
  userId: string;
  notebookId: string | null;
  title?: string;
  hidden?: boolean;
}): Promise<NoteSummary> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: input.userId,
      notebook_id: input.notebookId,
      title: input.title ?? 'Untitled',
      content: [],
      plain_text: '',
      is_hidden: input.hidden ?? false,
    })
    .select(SUMMARY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(
  id: string,
  patch: {
    notebookId?: string | null;
    title?: string;
    content?: Json;
    plainText?: string;
    isPinned?: boolean;
    isHidden?: boolean;
    trashedAt?: string | null;
  },
): Promise<NoteSummary> {
  const update: NoteUpdate = {};
  if (patch.notebookId !== undefined) update.notebook_id = patch.notebookId;
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.content !== undefined) update.content = patch.content;
  if (patch.plainText !== undefined) update.plain_text = patch.plainText;
  if (patch.isPinned !== undefined) update.is_pinned = patch.isPinned;
  if (patch.isHidden !== undefined) update.is_hidden = patch.isHidden;
  if (patch.trashedAt !== undefined) update.trashed_at = patch.trashedAt;

  const { data, error } = await supabase.from('notes').update(update).eq('id', id)
    .select(SUMMARY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNotes(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('notes').delete().in('id', ids);
  if (error) throw error;
}

export async function listTrashedDocuments(): Promise<Pick<NoteRow, 'id' | 'content'>[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, content')
    .not('trashed_at', 'is', null);
  if (error) throw error;
  return data ?? [];
}
