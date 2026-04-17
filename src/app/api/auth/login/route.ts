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
    'admin': 'superadmin',          // 'admin' role → full superadmin access
    'administrator': 'superadmin',   // 'administrator' role → full superadmin access
    'teacher': 'teacher',
    'student': 'student'
};

const dashboardMap: Record<string, string> = {
    superadmin: '/dashboard/admin',
    masteradmin: '/dashboard/admin',
    instadmin: '/dashboard/admin',
    deptadmin: '/dashboard/admin',
    teacher: '/dashboard/teacher',
    student: '/dashboard/student',
};

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        // Use a backend-only server client to bypass browser ISP blocks
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false }
        });

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError || !authData.user) {
            return NextResponse.json({ error: authError?.message || 'Login failed' }, { status: 400 });
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
            // Fetch from profiles
            try {
                const { data: profile, error: profileErr } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();
                if (profile?.role) {
                    role = profile.role;
                    console.log(`[login] role from profiles table: ${role}`);
                } else {
                    console.warn(`[login] No role found for user ${authData.user.email}. profileErr:`, profileErr?.message);
                }
            } catch (err) {
                console.warn('[login] Could not fetch role from profiles:', err);
            }
        }

        const frontendRole = roleMapping[role] || role || 'student';
        const redirectUrl = dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;

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
            role: frontendRole,
            session: authData.session, 
            redirectUrl,
            adminSecret: ['superadmin', 'masteradmin'].includes(frontendRole) ? process.env.ADMIN_SECRET : null
        });

    } catch (error: any) {
        console.error('Login internal error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
