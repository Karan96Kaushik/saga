import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logTiming } from './timing.js';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function json(status: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function parseBody<T>(event: APIGatewayProxyEventV2): T {
  if (!event.body) return {} as T;
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

export function withHttp(
  handle: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>,
): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2> {
  return async (event) => {
    const started = Date.now();
    const route = event.rawPath || 'function';
    try {
      const method = event.requestContext.http.method;
      if (method === 'OPTIONS') return json(204, {});
      if (method !== 'POST') throw new HttpError(405, 'Method not allowed');
      return await handle(event);
    } catch (error) {
      if (error instanceof HttpError) return json(error.status, { error: error.message });
      console.error(error);
      return json(500, { error: 'Internal error' });
    } finally {
      logTiming(route, Date.now() - started);
    }
  };
}
