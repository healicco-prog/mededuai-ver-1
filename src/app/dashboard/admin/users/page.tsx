import { cookies } from 'next/headers';
import UsersManager from './UsersManager';
import { UserRole } from '../../../../store/userStore';

export default async function AdminUsersPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value as UserRole;

    if (role !== 'superadmin' && role !== 'masteradmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <UsersManager currentUserRole={role as 'masteradmin' | 'superadmin'} />
        </div>
    );
}
