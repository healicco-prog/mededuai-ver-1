"use client";
import { useMemo } from 'react';
import { ListChecks, CheckCircle2, Clock } from 'lucide-react';
import type { ElectiveStudent, Elective, StudentPreference } from '@/store/electiveStore';

export default function Step_StudentPreferences({ store, instId }: { store: any; instId: string }) {
    const students: ElectiveStudent[] = store.students.filter((s: ElectiveStudent) => s.institutionId === instId);
    const electives: Elective[] = store.electives.filter((e: Elective) => e.institutionId === instId);
    const preferences: StudentPreference[] = store.preferences.filter((p: StudentPreference) => p.institutionId === instId);
    const method = store.allotmentMethod;

    // Optional: Refresh from server to get latest
    const handleRefresh = async () => {
        try {
            const res = await fetch('/api/elective-sync');
            if (res.ok) {
                const serverData = await res.json();
                const serverPrefs = serverData.preferences || [];
                if (serverPrefs.length > 0) {
                    store.setPreferences(serverPrefs);
                }
            }
        } catch (err) {
            console.error('Failed to sync preferences:', err);
        }
    };

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                        <ListChecks className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Students Preferences</h3>
                        <p className="text-sm text-slate-500">View preferences submitted by students for Block 1 and Block 2.</p>
                    </div>
                </div>
                <button onClick={handleRefresh} className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl transition-colors">
                    <ListChecks className="w-4 h-4" /> Refresh Data
                </button>
            </div>

            {/* Summary Stats */}
            {(() => {
                const submittedStudents = students.filter(s => preferences.some(p => p.studentId === s.id));
                const pendingStudents = students.filter(s => !preferences.some(p => p.studentId === s.id));
                return (
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">{submittedStudents.length} Submitted</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-700">{pendingStudents.length} Pending</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                            <span className="text-sm font-bold text-slate-600">Total: {students.length} students</span>
                        </div>
                    </div>
                );
            })()}

            {students.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-bold">
                    No students registered yet.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-4">Student</th>
                                {method === 'merit' && <th className="p-4 text-center">Merit Rank</th>}
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4">Block 1 Preferences</th>
                                <th className="p-4">Block 2 Preferences</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(student => {
                                const studentPrefs = preferences.filter(p => p.studentId === student.id);
                                const hasSubmitted = studentPrefs.length > 0;
                                const submittedAt = (studentPrefs[0] as any)?.submittedAt;

                                const block1Prefs = studentPrefs.filter(p => p.block === 1);
                                const block2Prefs = studentPrefs.filter(p => p.block === 2);

                                // Sort prefs
                                if (method === 'merit') {
                                    block1Prefs.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
                                    block2Prefs.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
                                } else {
                                    block1Prefs.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
                                    block2Prefs.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
                                }

                                const renderPrefs = (prefs: StudentPreference[]) => {
                                    if (prefs.length === 0) return <span className="text-slate-400 italic">None</span>;
                                    return (
                                        <ul className="space-y-1">
                                            {prefs.map(p => {
                                                const el = electives.find(e => e.id === p.electiveId);
                                                if (!el) return null;
                                                return (
                                                    <li key={p.id} className="flex justify-between items-center text-xs bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
                                                        <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={el.electiveName}>{el.electiveName}</span>
                                                        {method === 'merit' ? (
                                                            <span className="text-teal-600 font-bold ml-2">Rank {p.rank}</span>
                                                        ) : (
                                                            <span className="text-amber-600 font-bold ml-2">{p.points} pts</span>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    );
                                };

                                return (
                                    <tr key={student.id} className={`hover:bg-slate-50 transition-colors ${!hasSubmitted ? 'opacity-60' : ''}`}>
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-900">{student.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{student.regNo}</div>
                                        </td>
                                        {method === 'merit' && (
                                            <td className="p-4 align-top text-center">
                                                <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-slate-100 text-slate-700 font-black rounded-lg border border-slate-200">
                                                    {student.meritRank || '—'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="p-4 align-top text-center">
                                            {hasSubmitted ? (
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                                                    </span>
                                                    {submittedAt && <span className="text-[10px] text-slate-400">{new Date(submittedAt).toLocaleDateString()}</span>}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200">
                                                    <Clock className="w-3.5 h-3.5" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 align-top">{hasSubmitted ? renderPrefs(block1Prefs) : <span className="text-slate-300 text-xs italic">—</span>}</td>
                                        <td className="p-4 align-top">{hasSubmitted ? renderPrefs(block2Prefs) : <span className="text-slate-300 text-xs italic">—</span>}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
