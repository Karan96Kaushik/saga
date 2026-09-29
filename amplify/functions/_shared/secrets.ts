import { HttpError } from './http.js';

export function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new HttpError(500, `Missing environment ${name}`);
  return value;
}
