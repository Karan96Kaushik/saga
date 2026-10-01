import { AsyncLocalStorage } from 'node:async_hooks';
import { HttpError } from './http.js';
const storage = new AsyncLocalStorage();
export function bindUser(user, fn) {
    return storage.run(user, fn);
}
export function currentUser() {
    const user = storage.getStore();
    if (!user)
        throw new HttpError(401, 'Missing session');
    return user;
}
