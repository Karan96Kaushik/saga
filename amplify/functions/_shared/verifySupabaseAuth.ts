import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { HttpError } from './http.js';
import { verifySupabaseJwt } from './supabaseJwt.js';
import { bindUser, type RequestUser } from './supabaseUser.js';

function bearerToken(event: APIGatewayProxyEventV2): string | null {
  const header = event.headers.authorization ?? event.headers.Authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export async function optionalUser(event: APIGatewayProxyEventV2): Promise<RequestUser | null> {
  const token = bearerToken(event);
  if (!token) return null;
  try {
    const payload = await verifySupabaseJwt(token);
    if (!payload.sub) return null;
    return { id: payload.sub, token };
  } catch {
    return null;
  }
}

export async function requireUser(event: APIGatewayProxyEventV2): Promise<RequestUser> {
  const token = bearerToken(event);
  if (!token) throw new HttpError(401, 'Missing session');
  try {
    const payload = await verifySupabaseJwt(token);
    if (!payload.sub) throw new HttpError(401, 'Invalid session');
    const user = { id: payload.sub, token };
    return user;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Invalid session');
  }
}

export async function withRequiredUser<T>(
  event: APIGatewayProxyEventV2,
  fn: () => Promise<T>,
): Promise<T> {
  const user = await requireUser(event);
  return bindUser(user, fn);
}
