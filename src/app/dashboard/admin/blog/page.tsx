import { cookies } from 'next/headers';
import BlogManagerClient from './BlogManagerClient';

export default async function AdminBlogPage() {
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value as 'superadmin';

    // Ensure only authorized admins can access
    if (role !== 'superadmin') {
        return <div className="p-8 text-slate-500">Access Denied</div>;
    }

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Blog Publications Engine</h2>
            <p className="text-slate-500 mb-8">Author, edit, and publish content directly to the MedEduAI knowledge base.</p>
            <BlogManagerClient currentUserRole={role} />
        </div>
    );
}
