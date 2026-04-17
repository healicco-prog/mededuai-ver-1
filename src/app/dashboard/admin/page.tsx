import { Overview } from '@/components/Overview';

export default function AdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
            <Overview role="admin" />
        </div>
    );
}
