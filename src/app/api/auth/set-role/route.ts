import { NextResponse } from 'next/server';
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
        const { role } = await req.json();
        const frontendRole = roleMapping[role] || role || 'student';
        const redirectUrl = dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;

        const cookieStore = await cookies();
        cookieStore.set('role', frontendRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return NextResponse.json({ redirectUrl, role: frontendRole });
    } catch (error: any) {
        console.error('set-role error:', error);
        return NextResponse.json({ redirectUrl: '/dashboard/student', role: 'student' });
    }
}
