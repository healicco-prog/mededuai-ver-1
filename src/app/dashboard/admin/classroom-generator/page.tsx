import ClassroomManagerClient from './ClassroomManagerClient';
import { GraduationCap } from 'lucide-react';

export default function ClassroomGeneratorPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.3),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <GraduationCap className="w-6 h-6 text-indigo-200" />
                            </div>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Department Admin</p>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Classroom Generator</h2>
                        <p className="text-indigo-200/80 mt-1.5 font-medium">Create and manage your institutional classrooms with faculty and student assignments.</p>
                    </div>
                </div>
            </div>

            <ClassroomManagerClient />
        </div>
    );
}
