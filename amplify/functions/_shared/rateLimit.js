import { HttpError } from './http.js';
const buckets = new Map();
export function assertRateLimit(key, limit = 30, windowMs = 60_000) {
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || now > current.reset) {
        buckets.set(key, { count: 1, reset: now + windowMs });
    }
    else {
        current.count += 1;
        if (current.count > limit)
            throw new HttpError(429, 'Too many requests');
    }
    if (buckets.size > 1000) {
        for (const [entryKey, bucket] of buckets) {
            if (now > bucket.reset)
                buckets.delete(entryKey);
        }
    }
}
