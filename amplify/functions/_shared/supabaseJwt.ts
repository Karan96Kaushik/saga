import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { readEnv } from './secrets.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const url = new URL(`${readEnv('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`);
    jwks = createRemoteJWKSet(url);
  }
  return jwks;
}

export async function verifySupabaseJwt(token: string): Promise<JWTPayload> {
  const supabaseUrl = readEnv('SUPABASE_URL');
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `${supabaseUrl}/auth/v1`,
    audience: 'authenticated',
  });
  return payload;
}
