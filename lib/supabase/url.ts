/** Strip a trailing `/rest/v1` so a Data API URL can be used as the project origin. */
export function normalizeSupabaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/rest\/v1$/, '');
}

export function supabaseProjectRef(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.split('.')[0] || 'local';
  } catch {
    return 'local';
  }
}
