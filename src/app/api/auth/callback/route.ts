import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const roleMapping: Record<string, string> = {
    'super_admin': 'superadmin',
    'master_admin': 'masteradmin',
    'institution_admin': 'instadmin',
    'department_admin': 'deptadmin',
    'instadmin': 'instadmin',
    'deptadmin': 'deptadmin',
    'superadmin': 'superadmin',
    'masteradmin': 'masteradmin',
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

/**
 * POST /api/auth/callback
 * Validates an access_token + refresh_token pair (from magic link / OAuth callback)
 * server-side and returns a session + redirectUrl.
 */
export async function POST(req: Request) {
    try {
        const { access_token, refresh_token } = await req.json();

        if (!access_token || !refresh_token) {
            return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            { auth: { persistSession: false } }
        );

        // Use setSession to validate the tokens server-side
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

        if (error || !data.session) {
            return NextResponse.json({ error: error?.message || 'Invalid session' }, { status: 401 });
        }

        // Resolve role from user metadata → fallback to profiles table
        let role = 'student';
        if (data.session.user?.user_metadata?.role) {
            role = data.session.user.user_metadata.role;
        } else {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .single();
                if (profile?.role) role = profile.role;
            } catch { /* fallback to student */ }
        }

        const frontendRole = roleMapping[role] || role || 'student';
        const redirectUrl = dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;

        // Set role cookie
        const cookieStore = await cookies();
        cookieStore.set('role', frontendRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });

        return NextResponse.json({
            success: true,
            session: data.session,
            redirectUrl,
        });

    } catch (error: any) {
        console.error('[Auth Callback API] Error:', error?.message);
        return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
    }
}
