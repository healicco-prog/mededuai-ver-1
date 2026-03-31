import { cookies } from 'next/headers';
import { UserRole } from '../../../../store/userStore';
import DeptMentoringHubClient from './DeptMentoringHubClient';

export default async function DeptMentoringPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value as UserRole;

    if (role !== 'deptadmin' && role !== 'instadmin' && role !== 'masteradmin' && role !== 'superadmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return (
        <div className="flex flex-col border-none">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Department Assessments</h2>
            <p className="text-slate-500 mb-8">Record and manage scholastic and non-scholastic data for all students in your department.</p>

            <DeptMentoringHubClient />
        </div>
    );
}
