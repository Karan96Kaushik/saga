import { callFunction } from '@/lib/amplify/client';
export function purgeTrash() {
    return callFunction('purgeTrashUrl', {}, { auth: 'required' });
}
