import { cookies } from 'next/headers';
import CreatorManagerClient from './CreatorManagerClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'LMS Auto-Gen | Admin',
    description: 'Mass trigger Gemini background jobs and build your curriculum.',
};

export default async function AdminCreatorPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value;

    if (role !== 'superadmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return (
        <div className="w-full">
            <CreatorManagerClient />
        </div>
    );
}
