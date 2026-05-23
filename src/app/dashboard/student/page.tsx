import { Overview } from '@/components/Overview';
import DailyKeyPoints from '@/components/DailyKeyPoints';
import WhatsHappeningToday from '@/components/WhatsHappeningToday';

export default function StudentDashboard() {
    return (
        <div>
            <WhatsHappeningToday />
            <DailyKeyPoints role="student" />
            <h2 className="text-2xl font-bold mb-6">Student Overview</h2>
            <Overview role="student" />
        </div>
    );
}
