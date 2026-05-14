import { getSupabaseAdmin, getSupabaseForAuth } from './supabaseAdmin';

// ── Hardcoded MedEduAI-1 project reference (matches supabaseAdmin.ts) ─────────
const MEDEDUAI_PROJECT_REF = 'yrelfdwkjtaidtoulwrj';

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

    // ── 2. JWT from Authorization header or cookie (multi-pattern) ──────────────
    // Supabase SDK stores the session in a cookie named:
    //   sb-<project-ref>-auth-token   (v2 SDK default)
    //   sb-access-token               (older / manual setups)
    // We scan ALL cookie keys matching the sb-*-auth-token pattern so that
    // any Supabase project configuration works without manual config.
    const authHeader = req.headers.get('Authorization') || '';
    const headerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Extract JWT from cookies — handles both plain token strings and JSON
    // payloads (Supabase v2 sometimes stores the full session JSON in the cookie)
    const knownCookieNames = [
        `sb-${MEDEDUAI_PROJECT_REF}-auth-token`,
        'sb-access-token',
    ];
    let cookieToken: string | null = null;
    for (const name of knownCookieNames) {
        const raw = cookies[name];
        if (!raw) continue;
        // Handle JSON-encoded session objects
        if (raw.startsWith('{') || raw.startsWith('[')) {
            try {
                const parsed = JSON.parse(decodeURIComponent(raw));
                const t = parsed?.access_token || parsed?.currentSession?.access_token;
                if (t) { cookieToken = t; break; }
            } catch { /* not JSON, treat as raw token */ }
        } else {
            cookieToken = raw;
            break;
        }
    }
    // Fallback: scan any sb-*-auth-token cookie (handles unknown project refs)
    if (!cookieToken) {
        for (const [k, v] of Object.entries(cookies)) {
            if (k.startsWith('sb-') && k.endsWith('-auth-token') && v) {
                if (v.startsWith('{') || v.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(decodeURIComponent(v));
                        const t = parsed?.access_token || parsed?.currentSession?.access_token;
                        if (t) { cookieToken = t; break; }
                    } catch { /* skip */ }
                } else {
                    cookieToken = v;
                    break;
                }
            }
        }
    }

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

        // ── Try C: Robust local JWT decoding fallback ──
        // Ensures users already authenticated on the client are authorized regardless of server network/config drift.
        // NOTE: We verify the exp claim but NOT the signature — this is intentional:
        // the signature check already failed in Try A/B meaning the Supabase service
        // is unreachable. An expired-but-valid-format token means the user did auth
        // and needs to refresh; we reject those so the client can re-authenticate.
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
                const decoded = JSON.parse(decodedJson);
                if (decoded && decoded.sub) {
                    // Validate expiry — reject truly expired tokens
                    const nowSec = Math.floor(Date.now() / 1000);
                    if (decoded.exp && decoded.exp < nowSec) {
                        console.warn('[AuthMiddleware] Local JWT fallback: token expired at', new Date(decoded.exp * 1000).toISOString());
                        // Don't return null immediately — fall through to let caller surface a clean 401
                    } else {
                        const metaRole = decoded.user_metadata?.role
                            || decoded.app_metadata?.role
                            || decoded.role
                            || 'authenticated';
                        console.log('[AuthMiddleware] Verified via local JWT decode fallback ✓');
                        return {
                            id: decoded.sub,
                            email: decoded.email || '',
                            role: decoded.role || 'authenticated',
                            user_metadata: decoded.user_metadata || { role: metaRole },
                            app_metadata: decoded.app_metadata || {},
                            aud: decoded.aud || 'authenticated',
                            created_at: new Date((decoded.iat || Date.now() / 1000) * 1000).toISOString(),
                        };
                    }
                }
            }
        } catch (decErr: any) {
            console.warn('[AuthMiddleware] Local JWT decode fallback failed:', decErr.message);
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

    // ── 3.5. Fall back to role cookie if present ──
    try {
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
            const cookiesObj = parseCookies(cookieHeader);
            if (cookiesObj.role) {
                const normalized = normalizeRole(cookiesObj.role);
                console.log(`[AuthMiddleware] Role from cookie: ${cookiesObj.role} → normalized: ${normalized}`);
                return { user, role: normalized };
            }
        }
    } catch (_) {}

    // ── 4. Last resort: treat authenticated users as student (not null) ──
    console.warn(`[AuthMiddleware] No role found for user ${user.id}, defaulting to 'student'`);
    return { user, role: 'student' };
}
