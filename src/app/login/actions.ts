'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function setRoleCookieAndGetRedirectUrl(role: string) {
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

    const frontendRole = roleMapping[role] || role || 'student';

    const cookieStore = await cookies();
    cookieStore.set('role', frontendRole, { 
        secure: process.env.NODE_ENV === 'production', 
        path: '/' 
    });
    
    // All users go to their dashboard after login
    // Admin roles go to /dashboard/admin, others go to /dashboard/{role}
    const dashboardMap: Record<string, string> = {
        superadmin: '/dashboard/admin',
        masteradmin: '/dashboard/admin',
        instadmin: '/dashboard/admin',
        deptadmin: '/dashboard/admin',
        teacher: '/dashboard/teacher',
        student: '/dashboard/student',
    };
    
    return dashboardMap[frontendRole] || `/dashboard/${frontendRole}`;
}
