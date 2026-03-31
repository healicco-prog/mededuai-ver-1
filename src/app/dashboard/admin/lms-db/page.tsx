import { cookies } from 'next/headers';
import AdminLMSDatabaseClient from './AdminLMSDatabaseClient';

export default async function AdminLMSDatabasePage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value;

    if (role !== 'masteradmin' && role !== 'superadmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return <AdminLMSDatabaseClient />;
}
