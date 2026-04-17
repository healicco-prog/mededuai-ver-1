import { getSupabaseAdmin } from './supabaseAdmin';

export async function verifyAuth(req: Request) {
    // ── 1. Check for Admin Secret (Internal/Bulk Ops) ──
    const adminSecret = req.headers.get('x-admin-secret');
    const expectedSecret = process.env.ADMIN_SECRET;
    
    if (adminSecret && expectedSecret && adminSecret === expectedSecret) {
        // Return a mock superadmin user representing the system/admin
        return {
            id: 'system-admin',
            email: 'admin@mededuai.com',
            role: 'authenticated',
            user_metadata: { role: 'superadmin' },
            app_metadata: { provider: 'email' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        } as any;
    }

    // ── 2. Standard JWT Authentication ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.auth.getUser(token);
        
        if (error || !data.user) {
            console.error('[AuthMiddleware] Verify failed:', error?.message);
            return null;
        }

        return data.user;
    } catch (err: any) {
        console.error('[AuthMiddleware] Exception getting user:', err.message);
        return null;
    }
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
