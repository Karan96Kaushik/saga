import { logTiming } from './timing.js';
export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}
export function json(status, body) {
    return {
        statusCode: status,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    };
}
export function parseBody(event) {
    if (!event.body)
        return {};
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new HttpError(400, 'Invalid JSON');
    }
}
export function withHttp(handle) {
    return async (event) => {
        const started = Date.now();
        const route = event.rawPath || 'function';
        try {
            const method = event.requestContext.http.method;
            if (method === 'OPTIONS')
                return json(204, {});
            if (method !== 'POST')
                throw new HttpError(405, 'Method not allowed');
            return await handle(event);
        }
        catch (error) {
            if (error instanceof HttpError)
                return json(error.status, { error: error.message });
            console.error(error);
            return json(500, { error: 'Internal error' });
        }
        finally {
            logTiming(route, Date.now() - started);
        }
    };
}
