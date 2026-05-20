import { Overview } from '@/components/Overview';
import WhatsHappeningToday from '@/components/WhatsHappeningToday';
import TeacherKeyPoints from '@/components/TeacherKeyPoints';

export default function TeacherDashboard() {
    return (
        <div>
            <WhatsHappeningToday />
            <TeacherKeyPoints />
            <h2 className="text-2xl font-bold mb-6">Teacher Overview</h2>
            <Overview role="teacher" />
        </div>
    );
}
