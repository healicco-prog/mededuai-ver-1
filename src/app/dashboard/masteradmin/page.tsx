import { Overview } from '@/components/Overview';

export default function MasterAdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Master Admin Overview</h2>
            <Overview role="masteradmin" />
        </div>
    );
}
