"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import LogBookClient from '@/components/LogBookClient';
import { Loader2 } from 'lucide-react';

export default function TeacherLogbookPage() {
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id ?? null);
        })();
    }, []);

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading session…
            </div>
        );
    }

    return <LogBookClient role="teacher" userId={userId} />;
}
