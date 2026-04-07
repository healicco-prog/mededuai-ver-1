import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase admin client using the service role key.
 * Called lazily at request-time — NOT at module level — so the
 * SUPABASE_SERVICE_ROLE_KEY env var is not required at build time.
 */
export function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('[getSupabaseAdmin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
