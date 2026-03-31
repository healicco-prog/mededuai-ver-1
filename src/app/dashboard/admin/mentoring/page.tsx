import { cookies } from 'next/headers';
import { UserRole } from '../../../../store/userStore';
import { Users } from 'lucide-react';

import MentoringHubClient from './MentoringHubClient';

export default async function MentoringMSPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value as UserRole;

    if (role !== 'instadmin' && role !== 'masteradmin' && role !== 'superadmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return (
        <div className="flex flex-col">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Mentoring MS</h2>
            <p className="text-slate-500 mb-8">Manage student mentorship programs and mentor assignments.</p>

            <MentoringHubClient />
        </div>
    );
}
