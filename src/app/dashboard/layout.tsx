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
        cookieStore.delete('role');
        cookieStore.delete('sb-access-token');
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
        if (projectRef) {
            cookieStore.delete(`sb-${projectRef}-auth-token`);
        }
        
        redirect('/login');
    }

    return (
        <DashboardLayoutClient role={role} handleLogout={handleLogout}>
            {children}
        </DashboardLayoutClient>
    );
}
