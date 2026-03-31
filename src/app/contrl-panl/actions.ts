'use server';

import { cookies } from 'next/headers';

export async function setControlPanelRole(role: string) {
    const cookieStore = await cookies();
    cookieStore.set('role', role, { 
        secure: process.env.NODE_ENV === 'production', 
        path: '/' 
    });
    return { success: true };
}

export async function clearControlPanelRole() {
    const cookieStore = await cookies();
    cookieStore.delete('role');
    return { success: true };
}
