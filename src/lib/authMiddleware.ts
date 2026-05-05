import { getSupabaseAdmin, getSupabaseForAuth } from './supabaseAdmin';

// ── Admin secret must be set via ADMIN_SECRET env var ──────────────────────────
// NOTE: No hardcoded fallback. In development, set ADMIN_SECRET in .env.local.
const ADMIN_SECRET_HARDCODED = null; // Never set to a hardcoded value

/** Parse a raw Cookie header string into a key→value map. */
function parseCookies(cookieHeader: string | null): Record<string, string> {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [k, ...v] = c.trim().split('=');
            return [k.trim(), v.join('=').trim()];
        })
    );
}

/** Build a synthetic user object used when auth falls back to a non-JWT path. */
function syntheticAdmin(id: string, email: string, role: string) {
    return {
        id,
        email,
        role: 'authenticated',
        user_metadata: { role },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
    } as any;
}

export async function verifyAuth(req: Request) {
    const cookies = parseCookies(req.headers.get('cookie'));

    // ── 1. Admin Secret header (Internal / Bulk Ops) ─────────────────────────
    // Requires ADMIN_SECRET env var to be set in .env.local (dev) or Secret Manager (prod).
    const adminSecret = req.headers.get('x-admin-secret');
    const envSecret = process.env.ADMIN_SECRET;
    if (adminSecret && envSecret && adminSecret === envSecret) {
        console.log('[AuthMiddleware] Authenticated via admin secret ✓');
        return syntheticAdmin('system-admin', 'admin@mededuai.com', 'superadmin');
    }

    // ── 2. JWT from Authorization header or sb-access-token cookie ────────────
    // Supabase JWTs expire after 1 hour. The cookie path lets the server verify
    // the token that was stored at login without depending on the client Supabase
    // SDK state (which can go stale when the URL env var is misconfigured).
    const authHeader = req.headers.get('Authorization') || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const cookieToken = cookies['sb-access-token'] || null;
    const token = headerToken || cookieToken;

    if (token) {
        // ── Try A: Admin/service-role Supabase client ──
        try {
            const supabase = getSupabaseAdmin();
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && data.user) {
                return data.user;
            }
            console.warn('[AuthMiddleware] Admin client verify failed:', error?.message, '— trying anon client…');
        } catch (err: any) {
            console.warn('[AuthMiddleware] Admin client exception:', err.message, '— trying anon client…');
        }

        // ── Try B: Anon client with hardcoded MedEduAI-1 URL ──
        try {
            const supabase = getSupabaseForAuth();
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && data.user) {
                console.log('[AuthMiddleware] Verified via anon-key fallback ✓');
                return data.user;
            }
            console.warn('[AuthMiddleware] Anon client verify also failed:', error?.message);
        } catch (err: any) {
            console.warn('[AuthMiddleware] Anon client exception:', err.message);
        }
    }

    console.warn('[AuthMiddleware] All auth methods failed. token present:', !!token);
    return null;
}

/**
 * Normalize role strings so that DB values like 'super_admin', 'admin',
 * 'administrator', 'master_admin' all map to the canonical frontend roles.
 * Matches the roleMapping used in the login route.
 */
const roleNormMap: Record<string, string> = {
    'super_admin': 'superadmin',
    'superadmin': 'superadmin',
    'admin': 'superadmin',
    'administrator': 'superadmin',
    'master_admin': 'masteradmin',
    'masteradmin': 'masteradmin',
    'institution_admin': 'instadmin',
    'instadmin': 'instadmin',
    'department_admin': 'deptadmin',
    'deptadmin': 'deptadmin',
    'teacher': 'teacher',
    'student': 'student',
};

function normalizeRole(raw: string | null | undefined): string {
    if (!raw) return 'student';
    return roleNormMap[raw.toLowerCase().trim()] || raw.toLowerCase().trim();
}

/**
 * Validates the user and returns their custom app role from public.users
 */
export async function verifyAuthAndRole(req: Request) {
    const user = await verifyAuth(req);
    if (!user) return { user: null, role: null };

    // ── 1. Check for system/mock admin ──
    if (user.id === 'system-admin') {
        return { user, role: 'superadmin' };
    }

    // ── 2. Try public.users table first ──
    try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (data?.role) {
            const normalized = normalizeRole(data.role);
            console.log(`[AuthMiddleware] Role from public.users: ${data.role} → normalized: ${normalized}`);
            return { user, role: normalized };
        }
    } catch (_) {
        // DB lookup failed — fall through to metadata
    }

    // ── 3. Fall back to user_metadata / app_metadata ──
    const metaRole = (user as any).user_metadata?.role
        || (user as any).app_metadata?.role
        || null;

    if (metaRole) {
        const normalized = normalizeRole(metaRole);
        console.log(`[AuthMiddleware] Role from metadata: ${metaRole} → normalized: ${normalized}`);
        return { user, role: normalized };
    }

    // ── 4. Last resort: treat authenticated users as student (not null) ──
    console.warn(`[AuthMiddleware] No role found for user ${user.id}, defaulting to 'student'`);
    return { user, role: 'student' };
}
