import { supabase } from '@/utils/supabase';
export async function getProfile(id) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
export async function upsertProfile(id, displayName) {
    const { data, error } = await supabase
        .from('profiles')
        .upsert({ id, display_name: displayName.trim() })
        .select('id, display_name, created_at, updated_at')
        .single();
    if (error)
        throw error;
    return data;
}
