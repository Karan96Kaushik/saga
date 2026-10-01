import { defineFunction } from '@aws-amplify/backend';
export const purgeTrash = defineFunction({
    name: 'purge-trash',
    entry: './handler.ts',
    timeoutSeconds: 30,
    memoryMB: 256,
    environment: {
        SUPABASE_URL: process.env.VITE_SUPABASE_URL_SAGA ?? '',
        SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY_SAGA ?? '',
    },
});
