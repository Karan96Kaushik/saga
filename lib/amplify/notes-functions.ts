import { callFunction } from '@/lib/amplify/client';

export type PurgeTrashResponse = {
  deleted: number;
};

export function purgeTrash(): Promise<PurgeTrashResponse> {
  return callFunction<PurgeTrashResponse>('purgeTrashUrl', {}, { auth: 'required' });
}
