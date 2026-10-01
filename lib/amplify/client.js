import outputs from '../../amplify_outputs.json';
import { supabase } from '@/utils/supabase';
const custom = outputs.custom ?? {};
export function functionsConfigured() {
    return Object.values(custom).some((url) => typeof url === 'string' && url.length > 0);
}
export async function callFunction(key, body, options) {
    const url = custom[key];
    if (!url) {
        throw new Error(`Missing ${key}. Run npm run amplify:sandbox to generate function URLs.`);
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token && options.auth === 'required') {
        throw new Error('Sign in required.');
    }
    const headers = { 'content-type': 'application/json' };
    if (token)
        headers.authorization = `Bearer ${token}`;
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body ?? {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = typeof payload === 'object' &&
            payload !== null &&
            'error' in payload &&
            typeof payload.error === 'string'
            ? payload.error
            : 'Request failed.';
        throw new Error(message);
    }
    return payload;
}
