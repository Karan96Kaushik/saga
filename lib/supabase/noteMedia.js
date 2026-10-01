import { supabase } from '@/utils/supabase';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
};
export async function uploadNoteImage(userId, noteId, file) {
    if (!ALLOWED_TYPES.has(file.type)) {
        throw new Error('Use a JPEG, PNG, GIF, or WebP image.');
    }
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Images must be 10MB or smaller.');
    }
    const extension = EXTENSIONS[file.type] ?? 'img';
    const path = `${userId}/${noteId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('note-media').upload(path, file, {
        contentType: file.type,
        upsert: false,
    });
    if (error)
        throw error;
    const { data } = supabase.storage.from('note-media').getPublicUrl(path);
    return data.publicUrl;
}
export async function removeNoteMedia(paths) {
    if (paths.length === 0)
        return;
    const { error } = await supabase.storage.from('note-media').remove(paths);
    if (error)
        throw error;
}
