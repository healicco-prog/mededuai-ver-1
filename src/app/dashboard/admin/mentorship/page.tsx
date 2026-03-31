import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DeptAssessmentsClient from './DeptAssessmentsClient';
import { Award, Shield } from 'lucide-react';

export default async function AdminMentorshipPage() {
    // Only allow deptadmin, instadmin, masteradmin, superadmin
    const cookieStore = await cookies();
    const role = cookieStore.get('role')?.value;

    if (!role || (role !== 'deptadmin' && role !== 'instadmin' && role !== 'masteradmin' && role !== 'superadmin')) {
        return (
            <div className="p-8 text-center mt-20">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
                <p className="text-slate-500">You do not have permission to view the Department Assessments dashboard.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl mb-8 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.3),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-fuchsia-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-violet-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <Award className="w-6 h-6 text-violet-200" />
                            </div>
                            <p className="text-[10px] font-bold text-violet-300 uppercase tracking-[0.2em]">Department Admin</p>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Mentorship Management System</h2>
                        <p className="text-violet-200/80 mt-1.5 font-medium">Manage mentor-mentee relationships, assessments, and records for department mentees.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-violet-300" />
                            <div>
                                <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest">Access Level</p>
                                <p className="text-white font-bold text-sm capitalize">{role} Panel</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 min-h-0 bg-transparent">
                <DeptAssessmentsClient />
            </div>
        </div>
    );
}
