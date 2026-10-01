import { supabase } from '@/utils/supabase';
export async function listNoteVersions(noteId) {
    const { data, error } = await supabase
        .from('note_versions')
        .select('id, note_id, user_id, title, content, version_number, created_at')
        .eq('note_id', noteId)
        .order('version_number', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
export async function checkpointNote(noteId) {
    const { data, error } = await supabase.rpc('checkpoint_note', { p_note_id: noteId });
    if (error)
        throw error;
    return data;
}
