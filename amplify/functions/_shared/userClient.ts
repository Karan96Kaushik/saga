import { createClient } from '@supabase/supabase-js';
import { readEnv } from './secrets.js';

export function createUserClient(token: string) {
  return createClient(readEnv('SUPABASE_URL'), readEnv('SUPABASE_PUBLISHABLE_KEY'), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
