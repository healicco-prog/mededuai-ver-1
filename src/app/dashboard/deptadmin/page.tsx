import { Overview } from '@/components/Overview';

export default function DeptAdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Department Admin Overview</h2>
            <Overview role="deptadmin" />
        </div>
    );
}
