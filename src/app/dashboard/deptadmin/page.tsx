import { Overview } from '@/components/Overview';
import WhatsHappeningToday from '@/components/WhatsHappeningToday';
import DailyKeyPoints from '@/components/DailyKeyPoints';

export default function DeptAdminDashboard() {
    return (
        <div>
            <WhatsHappeningToday />
            <DailyKeyPoints role="deptadmin" />
            <h2 className="text-2xl font-bold mb-6">Department Admin Overview</h2>
            <Overview role="deptadmin" />
        </div>
    );
}
