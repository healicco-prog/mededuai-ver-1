import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
// Rebuilding root dashboard layout to wake watcher
import DashboardLayoutClient from './DashboardLayoutClient';
import React from 'react';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value || 'student';

    async function handleLogout() {
        'use server';
        const cookieStore = await cookies();
        const currentRole = cookieStore.get('role')?.value;
        cookieStore.delete('role');
        if (currentRole === 'masteradmin' || currentRole === 'superadmin') {
            redirect('/contrl-panl');
        } else {
            redirect('/login');
        }
    }

    return (
        <DashboardLayoutClient role={role} handleLogout={handleLogout}>
            {children}
        </DashboardLayoutClient>
    );
}
