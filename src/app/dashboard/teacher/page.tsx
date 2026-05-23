import { Overview } from '@/components/Overview';
import WhatsHappeningToday from '@/components/WhatsHappeningToday';
import DailyKeyPoints from '@/components/DailyKeyPoints';

export default function TeacherDashboard() {
    return (
        <div>
            <WhatsHappeningToday />
            <DailyKeyPoints role="teacher" />
            <h2 className="text-2xl font-bold mb-6">Teacher Overview</h2>
            <Overview role="teacher" />
        </div>
    );
}
