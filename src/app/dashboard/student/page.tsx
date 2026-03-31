import { Overview } from '@/components/Overview';

export default function StudentDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Student Overview</h2>
            <Overview role="student" />
        </div>
    );
}
