"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LogBookClient from '@/components/LogBookClient';
import { Loader2 } from 'lucide-react';

// Mounted under /dashboard/admin, which is reachable by superadmin /
// masteradmin / instadmin / deptadmin (see middleware). We resolve the actual
// role from public.users so the same page does the right thing for HoI vs HoD
// vs platform admins.
export default function AdminLogbookPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [role, setRole] = useState<'instadmin' | 'deptadmin' | 'superadmin' | 'masteradmin'>('instadmin');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            setUserId(user.id);
            const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
            const raw = (data?.role || '').toLowerCase().replace(/[_\s]+/g, '');
            const r =
                raw === 'instadmin' || raw === 'institutionadmin' ? 'instadmin' :
                raw === 'deptadmin' || raw === 'departmentadmin' ? 'deptadmin' :
                raw === 'masteradmin' || raw === 'masteradministrator' ? 'masteradmin' :
                'superadmin';
            setRole(r);
            setLoading(false);
        })();
    }, []);

    if (loading || !userId) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading session…
            </div>
        );
    }

    return <LogBookClient role={role} userId={userId} />;
}
