import { readFileSync, existsSync } from 'node:fs';
import { normalizeSupabaseUrl } from '../lib/supabase/url.js';

function applyEnvFile(path: string, override: boolean) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (override || process.env[key] === undefined) process.env[key] = value;
  }
}

applyEnvFile('.env', false);
applyEnvFile('.env.local', true);

if (process.env.VITE_SUPABASE_URL_SAGA) {
  process.env.VITE_SUPABASE_URL_SAGA = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL_SAGA);
}
