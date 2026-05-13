import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummyurl.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummykey';
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

        // Use the exhaustive mapRole() normaliser — falls back to 'student' for unknowns
        const frontendRole = roleMapping[role] ?? mapRole(role);
        const redirectUrl = dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;

        const cookieStore = await cookies();

        // ── Role cookie (7-day, JS-readable for client-side role checks) ──
        cookieStore.set('role', frontendRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });

        // ── Supabase access token cookie (httpOnly, same lifetime as JWT ~1hr) ──
        if (authData.session?.access_token) {
            cookieStore.set('sb-access-token', authData.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax',
                maxAge: authData.session.expires_in ?? 3600,
            });
        }

        return NextResponse.json({
            success: true,
            role: frontendRole,
            session: authData.session,
            redirectUrl
        });

    } catch (error: any) {
        console.error('Login internal error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
