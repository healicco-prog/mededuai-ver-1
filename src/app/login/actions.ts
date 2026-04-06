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
    
    // Super Admin and Master Admin go to Control Panel, others to Dashboard
    if (frontendRole === 'superadmin' || frontendRole === 'masteradmin') {
        return '/contrl-panl';
    } else {
        return `/dashboard/${frontendRole}`;
    }
}
