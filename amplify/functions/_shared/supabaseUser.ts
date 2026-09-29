import { AsyncLocalStorage } from 'node:async_hooks';
import { HttpError } from './http.js';

export type RequestUser = {
  id: string;
  token: string;
};

const storage = new AsyncLocalStorage<RequestUser>();

export function bindUser<T>(user: RequestUser, fn: () => Promise<T>): Promise<T> {
  return storage.run(user, fn);
}

export function currentUser(): RequestUser {
  const user = storage.getStore();
  if (!user) throw new HttpError(401, 'Missing session');
  return user;
}
