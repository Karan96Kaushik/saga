import { supabase } from '@/utils/supabase';
export async function listTags() {
    const { data, error } = await supabase
        .from('tags')
        .select('id, user_id, name, created_at')
        .order('name', { ascending: true });
    if (error)
        throw error;
    return data ?? [];
}
export async function createTag(userId, name) {
    const { data, error } = await supabase
        .from('tags')
        .insert({ user_id: userId, name: name.trim() })
        .select('id, user_id, name, created_at')
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteTag(id) {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error)
        throw error;
}
export async function listNoteTags() {
    const { data, error } = await supabase.from('note_tags').select('note_id, tag_id, user_id');
    if (error)
        throw error;
    return data ?? [];
}
export async function replaceNoteTags(userId, noteId, tagIds) {
    const { data: existing, error } = await supabase
        .from('note_tags')
        .select('tag_id')
        .eq('note_id', noteId);
    if (error)
        throw error;
    const current = new Set((existing ?? []).map((row) => row.tag_id));
    const next = new Set(tagIds);
    const toRemove = [...current].filter((id) => !next.has(id));
    const toAdd = [...next].filter((id) => !current.has(id));
    if (toRemove.length > 0) {
        const { error: removeError } = await supabase
            .from('note_tags')
            .delete()
            .eq('note_id', noteId)
            .in('tag_id', toRemove);
        if (removeError)
            throw removeError;
    }
    if (toAdd.length > 0) {
        const { error: addError } = await supabase.from('note_tags').insert(toAdd.map((tagId) => ({
            note_id: noteId,
            tag_id: tagId,
            user_id: userId,
        })));
        if (addError)
            throw addError;
    }
}
