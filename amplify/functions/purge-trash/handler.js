import { json, withHttp } from '../_shared/http.js';
import { mediaPathsFromContent } from '../_shared/noteMedia.js';
import { assertRateLimit } from '../_shared/rateLimit.js';
import { createUserClient } from '../_shared/userClient.js';
import { currentUser } from '../_shared/supabaseUser.js';
import { withRequiredUser } from '../_shared/verifySupabaseAuth.js';
async function purge(event) {
    return withRequiredUser(event, async () => {
        const user = currentUser();
        assertRateLimit(`purge-trash:${user.id}`, 10);
        const supabase = createUserClient(user.token);
        const { data, error } = await supabase.from('notes').select('id, content').not('trashed_at', 'is', null);
        if (error)
            return json(400, { error: error.message });
        const rows = data ?? [];
        const ids = rows.map((row) => row.id);
        const paths = rows.flatMap((row) => mediaPathsFromContent(row.content));
        if (ids.length > 0) {
            const { error: deleteError } = await supabase.from('notes').delete().in('id', ids);
            if (deleteError)
                return json(400, { error: deleteError.message });
        }
        if (paths.length > 0) {
            await supabase.storage.from('note-media').remove(paths);
        }
        return json(200, { deleted: ids.length });
    });
}
export const handler = withHttp(purge);
