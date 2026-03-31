import { Overview } from '@/components/Overview';

export default function TeacherDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Teacher Overview</h2>
            <Overview role="teacher" />
        </div>
    );
}
