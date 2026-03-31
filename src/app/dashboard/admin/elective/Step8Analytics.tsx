"use client";
import { BarChart3, Users, BookOpen, CheckSquare, FileText } from 'lucide-react';
import type { Elective, ElectiveStudent, ElectiveSession, StudentReflection, Allotment } from '@/store/electiveStore';

export default function Step8Analytics({ store, instId }: { store: any; instId: string }) {
    const electives: Elective[] = store.electives.filter((e: Elective) => e.institutionId === instId);
    const students: ElectiveStudent[] = store.students.filter((s: ElectiveStudent) => s.institutionId === instId);
    const sessions: ElectiveSession[] = store.sessions.filter((s: ElectiveSession) => s.institutionId === instId);
    const reflections: StudentReflection[] = store.reflections.filter((r: StudentReflection) => r.institutionId === instId);
    const allotments: Allotment[] = store.allotments.filter((a: Allotment) => a.institutionId === instId);

    // Compute analytics
    const totalElectives = electives.length;
    const totalStudents = students.length;

    // Overall attendance
    let totalMarked = 0;
    let totalPresent = 0;
    sessions.forEach(s => {
        const entries = Object.entries(s.attendanceMap);
        totalMarked += entries.length;
        totalPresent += entries.filter(([, v]) => v).length;
    });
    const overallAttendance = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
    const totalTeachingSessions = sessions.length;
    const totalReflections = reflections.length;

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;

    const cards = [
        { label: 'Total Electives', value: totalElectives, icon: BookOpen, color: 'emerald' },
        { label: 'Total Students', value: totalStudents, icon: Users, color: 'blue' },
        { label: 'Overall Attendance', value: `${overallAttendance}%`, icon: CheckSquare, color: 'amber' },
        { label: 'Teaching Sessions', value: totalTeachingSessions, icon: BarChart3, color: 'purple' },
        { label: 'Total Reflections', value: totalReflections, icon: FileText, color: 'rose' },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' },
        rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-100' },
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
                <div><h3 className="text-xl font-bold text-slate-900">Electives Analytics</h3><p className="text-sm text-slate-500">Overview of the elective module's progress and metrics.</p></div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {cards.map(card => {
                    const c = colorMap[card.color];
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={`${c.bg} border ${c.border} rounded-2xl p-5 space-y-3`}>
                            <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${c.text}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">{card.value}</p>
                                <p className={`text-xs font-bold ${c.text} uppercase tracking-wider`}>{card.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Per-Elective Breakdown */}
            {electives.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-800">Per-Elective Breakdown</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr><th className="p-3">Elective</th><th className="p-3">Block</th><th className="p-3">Faculty</th><th className="p-3 text-center">Seats</th><th className="p-3 text-center">Allotted</th><th className="p-3 text-center">Sessions</th></tr>
                            </thead>
                            <tbody>
                                {electives.map(el => {
                                    const allotted = allotments.filter(a => a.electiveId === el.id).length;
                                    const sessCount = sessions.filter(s => s.electiveId === el.id).length;
                                    return (
                                        <tr key={el.id} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-800">{el.electiveName}</td>
                                            <td className="p-3"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">Block {el.block}</span></td>
                                            <td className="p-3 text-slate-600">{el.facultyName}</td>
                                            <td className="p-3 text-center font-bold">{el.totalUptake}</td>
                                            <td className="p-3 text-center"><span className={`font-bold ${allotted >= el.totalUptake ? 'text-red-600' : 'text-emerald-600'}`}>{allotted}</span></td>
                                            <td className="p-3 text-center font-bold text-slate-700">{sessCount}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
