import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl, supabaseProjectRef } from '@/lib/supabase/url';
const OTP_TYPES = [
    'signup',
    'invite',
    'magiclink',
    'recovery',
    'email_change',
    'email',
];
function readAuthCallback() {
    if (typeof window === 'undefined') {
        return { type: null, errorDescription: null, tokenHash: null, isRecovery: false };
    }
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const search = new URLSearchParams(window.location.search);
    const typeValue = hash.get('type') ?? search.get('type');
    const type = OTP_TYPES.find((candidate) => candidate === typeValue) ?? null;
    const errorDescription = (hash.get('error_description') ?? search.get('error_description'))?.replace(/\+/g, ' ');
    return {
        type,
        errorDescription: errorDescription ?? null,
        tokenHash: search.get('token_hash'),
        isRecovery: type === 'recovery' || window.location.pathname === '/reset-password',
    };
}
export const authCallback = readAuthCallback();
const rawUrl = import.meta.env.VITE_SUPABASE_URL_SAGA ?? '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY_SAGA ?? '';
const supabaseUrl = rawUrl ? normalizeSupabaseUrl(rawUrl) : '';
export const supabaseConfigured = Boolean(supabaseUrl && publishableKey);
if (!supabaseConfigured) {
    console.warn('Supabase is not configured. Set VITE_SUPABASE_URL_SAGA and VITE_SUPABASE_PUBLISHABLE_KEY_SAGA.');
}
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', publishableKey || 'placeholder-key', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: `saga-auth-${supabaseProjectRef(supabaseUrl || 'https://placeholder.supabase.co')}`,
    },
});
