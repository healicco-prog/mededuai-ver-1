import { Overview } from '@/components/Overview';
import DailyKeyPoints from '@/components/DailyKeyPoints';

export default function StudentDashboard() {
    return (
        <div>
            <DailyKeyPoints />
            <h2 className="text-2xl font-bold mb-6">Student Overview</h2>
            <Overview role="student" />
        </div>
    );
}
