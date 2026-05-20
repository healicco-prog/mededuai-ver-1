import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
    ADMIN_SESSION_COOKIE,
    ADMIN_SESSION_MAX_AGE_SECONDS,
    signAdminSession,
} from '@/lib/adminSessionCookie';

// Normalises any variant the DB might store to the canonical lowercase frontend key.
function mapRole(raw: string): string {
    const r = (raw || '').toLowerCase().replace(/[_\s]+/g, '');
    const map: Record<string, string> = {
        superadmin:       'superadmin',
        admin:            'superadmin',
        administrator:    'superadmin',
        masteradmin:      'masteradmin',
        institutionadmin: 'instadmin',
        instadmin:        'instadmin',
        departmentadmin:  'deptadmin',
        deptadmin:        'deptadmin',
        teacher:          'teacher',
        student:          'student',
    };
    return map[r] ?? 'student';
}

const roleMapping: Record<string, string> = {
    'super_admin': 'superadmin',
    'master_admin': 'masteradmin',
    'institution_admin': 'instadmin',
    'department_admin': 'deptadmin',
    'instadmin': 'instadmin',
    'deptadmin': 'deptadmin',
    'superadmin': 'superadmin',
    'masteradmin': 'masteradmin',
    'admin': 'superadmin',
    'administrator': 'superadmin',
    'teacher': 'teacher',
    'student': 'student',
};

const dashboardMap: Record<string, string> = {
    superadmin: '/dashboard/admin',
    masteradmin: '/dashboard/admin',
    instadmin: '/dashboard/admin',
    deptadmin: '/dashboard/admin',
    teacher: '/dashboard/teacher',
    student: '/dashboard/student',
};

// ── Authoritative MedEduAI-1 project reference ───────────────────────────
// Mirrors supabaseAdmin.ts: we never trust the URL env var to be correct
// (Cloud Run revisions can carry stale or missing values from older deploys).
// The hardcoded ref guarantees auth always targets the right project.
const MEDEDUAI_PROJECT_REF = 'yrelfdwkjtaidtoulwrj';
const MEDEDUAI_URL = `https://${MEDEDUAI_PROJECT_REF}.supabase.co`;

// Recognises transient upstream-reachability failures so we retry instead of leaking
// raw Node fetch internals (e.g. "fetch failed", "ENOTFOUND") into the UI.
function isTransientNetworkError(err: any): boolean {
    const msg = (err?.message || err?.cause?.message || '').toLowerCase();
    const code = (err?.cause?.code || err?.code || '').toString().toUpperCase();
    if (['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_SOCKET', 'ABORT_ERR'].includes(code)) return true;
    if (err?.name === 'AbortError' || err?.name === 'TimeoutError') return true;
    return /fetch failed|failed to fetch|network|socket hang up|timeout|getaddrinfo|und_err|aborted/.test(msg);
}

// Wraps fetch with a hard timeout so a hung TCP/TLS connection to Supabase
// surfaces a clean AbortError instead of holding the Cloud Run request open
// until the 5-minute task timeout.
function fetchWithTimeout(timeoutMs: number): typeof fetch {
    return (input: RequestInfo | URL, init: RequestInit = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        const signal = init.signal
            ? AbortSignal.any([init.signal, controller.signal])
            : controller.signal;
        return fetch(input, { ...init, signal }).finally(() => clearTimeout(id));
    };
}

async function signInWithRetry(supabase: any, email: string, password: string) {
    let lastErr: any;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            return await supabase.auth.signInWithPassword({ email, password });
        } catch (err) {
            lastErr = err;
            if (!isTransientNetworkError(err)) throw err;
            await new Promise(r => setTimeout(r, 400));
        }
    }
    throw lastErr;
}

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const emailLower = (email || '').trim().toLowerCase();

        // ── Resilient URL resolution ──
        // Always force the MedEduAI-1 URL. Even if NEXT_PUBLIC_SUPABASE_URL on
        // Cloud Run is empty, missing, or points to a stale project (e.g. a
        // legacy PGMentor revision), we connect to the right project.
        const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const supabaseUrl = envUrl.includes(MEDEDUAI_PROJECT_REF) ? envUrl : MEDEDUAI_URL;

        // Anon key has no fallback — check multiple env var names so we don't
        // 503 just because Cloud Run uses a slightly different name.
        const supabaseAnonKey =
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            '';

        if (!supabaseAnonKey) {
            console.error('[login] Supabase anon key missing on server runtime — check Cloud Run env vars');
            return NextResponse.json(
                { error: 'Authentication service is temporarily unavailable. Please try again in a moment.' },
                { status: 503 }
            );
        }

        // Diagnostic log (no secrets): visible in Cloud Run logs to debug stale config.
        console.log(`[login] target=${new URL(supabaseUrl).host} keyPrefix=${supabaseAnonKey.slice(0, 8)}…`);

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
            global: { fetch: fetchWithTimeout(10_000) },
        });

        const { data: authData, error: authError } = await signInWithRetry(supabase, email, password);

        if (authError || !authData.user) {
            const rawMsg = (authError?.message || '').toLowerCase();
            // Translate Supabase's terse messages into something that points the
            // admin at the right next step. The Control Panel surfaces this
            // string verbatim under the email field, so keep it tight.
            let friendly = authError?.message || 'Login failed';
            if (rawMsg.includes('invalid login credentials')) {
                friendly =
                    'Invalid login credentials. If this is a new install or the password ' +
                    'was rotated, run RESET_ADMIN_LOGIN.bat (or `node reset_admin_login.mjs`) ' +
                    'from the project root to re-sync the admin accounts.';
            } else if (rawMsg.includes('email not confirmed')) {
                friendly =
                    'Admin email is not confirmed in Supabase. Run RESET_ADMIN_LOGIN.bat ' +
                    'to mark it confirmed.';
            }
            return NextResponse.json({ error: friendly }, { status: 400 });
        }

        let role = 'student';
        const rawMetaRole = authData.user.user_metadata?.role;
        const rawAppRole = (authData.user.app_metadata as any)?.role;

        if (rawMetaRole) {
            role = rawMetaRole;
            console.log(`[login] role from user_metadata: ${role}`);
        } else if (rawAppRole) {
            role = rawAppRole;
            console.log(`[login] role from app_metadata: ${role}`);
        } else {
            try {
                const adminDb = getSupabaseAdmin();
                // 1. Try public.users table first (matches authMiddleware behavior)
                let { data: userRow } = await adminDb
                    .from('users')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();

                if (userRow?.role) {
                    role = userRow.role;
                    console.log(`[login] role from public.users table: ${role}`);
                } else {
                    // 2. Fall back to profiles table
                    const { data: profileRow, error: profileErr } = await adminDb
                        .from('profiles')
                        .select('role')
                        .eq('id', authData.user.id)
                        .single();

                    if (profileRow?.role) {
                        role = profileRow.role;
                        console.log(`[login] role from profiles table: ${role}`);
                    } else {
                        console.warn(`[login] No role found in DB for user ${authData.user.email}. profileErr:`, profileErr?.message);
                    }
                }
            } catch (err) {
                console.warn('[login] Could not fetch role from users/profiles DB tables:', err);
            }
        }


        // Use the exhaustive mapRole() normaliser — falls back to 'student' for unknowns
        const frontendRole = roleMapping[role] ?? mapRole(role);
        const redirectUrl = dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;

        const cookieStore = await cookies();

        // ── Role cookie (365-day, JS-readable for client-side role checks) ──
        cookieStore.set('role', frontendRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
        });

        // ── Long-lived signed admin session cookie ────────────────────────────
        // HMAC-signed with ADMIN_SECRET so it can't be forged. Survives the 1h
        // Supabase JWT expiry: when verifyAuth's JWT paths all fail, it falls
        // back to this cookie so admins don't get bounced to 401 mid-session.
        try {
            const signed = signAdminSession({
                id: authData.user.id,
                email: authData.user.email || emailLower,
                role: frontendRole,
            });
            cookieStore.set(ADMIN_SESSION_COOKIE, signed, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax',
                maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
            });
        } catch (sigErr) {
            // Signing failure (ADMIN_SECRET missing) shouldn't block login —
            // user still gets the standard JWT cookie path.
            console.warn('[login] Could not issue signed admin session cookie:', (sigErr as any)?.message);
        }

        // ── Supabase access token cookie (httpOnly, same lifetime as JWT ~1hr) ──
        if (authData.session?.access_token) {
            const tokenCookieOpts = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax' as const,
                maxAge: authData.session.expires_in ?? 3600,
            };
            // Write both cookie naming conventions so authMiddleware can find it
            // regardless of which Supabase SDK version wrote the original token.
            cookieStore.set('sb-access-token', authData.session.access_token, tokenCookieOpts);
            cookieStore.set('sb-yrelfdwkjtaidtoulwrj-auth-token', authData.session.access_token, tokenCookieOpts);
        }

        return NextResponse.json({
            success: true,
            role: frontendRole,
            session: authData.session,
            redirectUrl
        });

    } catch (error: any) {
        console.error('Login internal error:', error);
        if (isTransientNetworkError(error)) {
            return NextResponse.json(
                { error: 'Authentication service is temporarily unavailable. Please try again in a moment.' },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
    }
}

