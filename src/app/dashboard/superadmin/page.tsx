import { Overview } from '@/components/Overview';

export default function SuperAdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Super Admin Overview</h2>
            <Overview role="superadmin" />
        </div>
    );
}
