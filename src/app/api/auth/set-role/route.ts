import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthAndRole } from '@/lib/authMiddleware';

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
        // Require a valid JWT — role is derived from the DB, never trusted from body.
        const { user, role } = await verifyAuthAndRole(req);
        if (!user || !role) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const frontendRole = role;
        const redirectUrl = dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;

        const cookieStore = await cookies();
        cookieStore.set('role', frontendRole, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });

        return NextResponse.json({ redirectUrl, role: frontendRole });
    } catch (error: any) {
        console.error('set-role error:', error);
        return NextResponse.json({ redirectUrl: '/dashboard/student', role: 'student' });
    }
}
