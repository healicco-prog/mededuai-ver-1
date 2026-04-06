import TokensManagerClient from './TokensManagerClient';
import { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
    title: 'Token Economy | Admin | MedEduAI',
    description: 'Manage AI tokens, plan allotments, and user balances.',
};

export default async function AdminTokensPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value;

    if (role !== 'superadmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return (
        <div className="w-full">
            <TokensManagerClient />
        </div>
    );
}
