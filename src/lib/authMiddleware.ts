import { getSupabaseAdmin } from './supabaseAdmin';

export async function verifyAuth(req: Request) {
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

        // Return user info, including their custom role mapped in users table if needed
        return data.user;
    } catch (err: any) {
        console.error('[AuthMiddleware] Exception getting user:', err.message);
        return null;
    }
}

/**
 * Validates the user and returns their custom app role from public.users
 */
export async function verifyAuthAndRole(req: Request) {
    const user = await verifyAuth(req);
    if (!user) return { user: null, role: null };

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !data) {
            return { user, role: null };
        }

        return { user, role: data.role };
    } catch (e) {
        return { user, role: null };
    }
}
