import { cookies } from 'next/headers';
import UsersManager from './UsersManager';
import { UserRole } from '../../../../store/userStore';

export default async function AdminUsersPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value as UserRole;

    if (role !== 'superadmin' && role !== 'masteradmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    // We no longer query the database server-side here because this page is deployed to
    // Netlify frontend which does not have the SUPABASE_SERVICE_ROLE_KEY.
    // The UsersManager component will fetch the data on mount from the Cloud Run API.
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <UsersManager
                currentUserRole={role as 'masteradmin' | 'superadmin'}
                initialUsers={[]}
            />
        </div>
    );
}
