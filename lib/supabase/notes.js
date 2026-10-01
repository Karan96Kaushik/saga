import { supabase } from '@/utils/supabase';
const SUMMARY_COLUMNS = 'id, user_id, notebook_id, title, plain_text, is_pinned, trashed_at, created_at, updated_at';
const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, content`;
export async function listNotes() {
    const { data, error } = await supabase
        .from('notes')
        .select(SUMMARY_COLUMNS)
        .order('updated_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
export async function getNote(id) {
    const { data, error } = await supabase.from('notes').select(DETAIL_COLUMNS).eq('id', id).single();
    if (error)
        throw error;
    return data;
}
export async function createNote(input) {
    const { data, error } = await supabase
        .from('notes')
        .insert({
        user_id: input.userId,
        notebook_id: input.notebookId,
        title: input.title ?? 'Untitled',
        content: [],
        plain_text: '',
    })
        .select(SUMMARY_COLUMNS)
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateNote(id, patch) {
    const update = {};
    if (patch.notebookId !== undefined)
        update.notebook_id = patch.notebookId;
    if (patch.title !== undefined)
        update.title = patch.title;
    if (patch.content !== undefined)
        update.content = patch.content;
    if (patch.plainText !== undefined)
        update.plain_text = patch.plainText;
    if (patch.isPinned !== undefined)
        update.is_pinned = patch.isPinned;
    if (patch.trashedAt !== undefined)
        update.trashed_at = patch.trashedAt;
    const { data, error } = await supabase.from('notes').update(update).eq('id', id)
        .select(SUMMARY_COLUMNS)
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteNotes(ids) {
    if (ids.length === 0)
        return;
    const { error } = await supabase.from('notes').delete().in('id', ids);
    if (error)
        throw error;
}
export async function listTrashedDocuments() {
    const { data, error } = await supabase
        .from('notes')
        .select('id, content')
        .not('trashed_at', 'is', null);
    if (error)
        throw error;
    return data ?? [];
}
