import { Overview } from '@/components/Overview';

export default function InstAdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Institution Admin Overview</h2>
            <Overview role="instadmin" />
        </div>
    );
}
