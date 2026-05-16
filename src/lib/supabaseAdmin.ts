import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Hardcoded MedEduAI-1 project reference ─────────────────────────────────
// Used to detect when Cloud Run env vars still point to a stale project
// (e.g. PGMentor). We compare the project ref embedded in the JWT payload.
const MEDEDUAI_PROJECT_REF = 'yrelfdwkjtaidtoulwrj';
const MEDEDUAI_URL = `https://${MEDEDUAI_PROJECT_REF}.supabase.co`;

/**
 * Extracts the "ref" claim from a Supabase JWT without verifying the signature.
 * Supabase service role keys encode the project ref in their payload.
 */
function getJwtRef(jwt: string): string | null {
    try {
        const payload = jwt.split('.')[1];
        if (!payload) return null;
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
        return decoded?.ref ?? null;
    } catch {
        return null;
    }
}

/**
 * Returns a Supabase admin client using the service role key.
 * Called lazily at request-time — NOT at module level — so the
 * SUPABASE_SERVICE_ROLE_KEY env var is not required at build time.
 *
 * Falls back to the anon key if the service role key points to a stale project.
 */
export function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || MEDEDUAI_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Detect stale project: if the service key encodes a different project ref
    // (e.g. Cloud Run env vars not yet updated), fall back to anon key.
    let keyToUse = serviceKey;
    if (serviceKey) {
        const keyRef = getJwtRef(serviceKey);
        if (keyRef && keyRef !== MEDEDUAI_PROJECT_REF) {
            console.warn(`[getSupabaseAdmin] SUPABASE_SERVICE_ROLE_KEY points to project "${keyRef}" — expected "${MEDEDUAI_PROJECT_REF}". Falling back to anon key.`);
            keyToUse = anonKey || serviceKey; // use anon key if available
        }
    }

    // ── Non-throwing fallback: if no key is configured (e.g. cold Cloud Run
    // startup before secrets are injected), return a client pointed at the
    // correct project with a dummy key.  auth.getUser() will return an error
    // that the caller (verifyAuth) can safely handle rather than crashing.
    const resolvedKey = keyToUse || anonKey || 'no-key-configured';
    if (!keyToUse && !anonKey) {
        console.warn('[getSupabaseAdmin] No Supabase key found — auth will rely on local JWT fallback.');
    }

    // Always use the correct MedEduAI-1 URL regardless of env var
    const resolvedUrl = url.includes(MEDEDUAI_PROJECT_REF) ? url : MEDEDUAI_URL;

    return createClient(resolvedUrl, resolvedKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * Returns a lightweight Supabase client (anon key) used only for JWT verification.
 * auth.getUser(token) works with both anon and service role keys.
 */
export function getSupabaseForAuth(): SupabaseClient {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    // Always returns a usable client; falls back gracefully without throwing.
    const resolvedKey = anonKey || 'no-anon-key-configured';
    if (!anonKey) {
        console.warn('[getSupabaseForAuth] NEXT_PUBLIC_SUPABASE_ANON_KEY not set — auth will rely on local JWT fallback.');
    }
    return createClient(MEDEDUAI_URL, resolvedKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

