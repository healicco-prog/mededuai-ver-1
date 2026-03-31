"use client";
import { useState } from 'react';
import { Shuffle, Play, Download, Trophy, Dice5 } from 'lucide-react';
import type { Elective, ElectiveStudent, Allotment } from '@/store/electiveStore';
import { useElectiveStore } from '@/store/electiveStore';

export default function Step5Allotment({ store, instId }: { store: any; instId: string }) {
    const [showResults, setShowResults] = useState(false);
    const students: ElectiveStudent[] = store.students.filter((s: ElectiveStudent) => s.institutionId === instId);
    const electives: Elective[] = store.electives.filter((e: Elective) => e.institutionId === instId);
    const allotments: Allotment[] = store.allotments.filter((a: Allotment) => a.institutionId === instId);
    const method = store.allotmentMethod;

    const handleRun = async () => {
        if (students.length === 0) return alert('No students uploaded');
        if (electives.length === 0) return alert('No electives uploaded');

        // Fetch preferences from server (students may have submitted from different browser)
        try {
            const res = await fetch('/api/elective-sync');
            if (res.ok) {
                const serverData = await res.json();
                const serverPrefs = serverData.preferences || [];
                if (serverPrefs.length > 0) {
                    // Merge server preferences into local store
                    store.setPreferences(serverPrefs);
                }
            }
        } catch (err) {
            console.error('[Allotment] Failed to fetch server preferences:', err);
        }

        // Small delay to let store update
        await new Promise(r => setTimeout(r, 200));

        if (method === 'merit') {
            const missingRank = students.filter(s => s.meritRank === null || s.meritRank === undefined);
            if (missingRank.length > 0) return alert(`${missingRank.length} students do not have a merit rank. Please update ranks first.`);
            const prefs = store.preferences.filter((p: any) => p.institutionId === instId);
            if (prefs.length === 0) return alert('No student preferences submitted yet. Students must rank electives first.');
        } else {
            const prefs = store.preferences.filter((p: any) => p.institutionId === instId);
            if (prefs.length === 0) return alert('No student preferences submitted yet. Students must allocate points first.');
        }

        store.runAllotment(instId);
        setShowResults(true);

        // Sync allotment results + all supporting data to server for student/teacher access
        try {
            const state = useElectiveStore.getState();
            await fetch('/api/elective-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allotments: state.allotments || [],
                    dates: state.dates || [],
                    institutions: state.institutions || [],
                    electives: state.electives || [],
                    students: state.students || [],
                }),
            });
            console.log('[ElectiveMS] Allotment results synced to server');
        } catch {}
    };

    const handleUpdateRank = (studentId: string, rank: number) => {
        store.updateMeritRanks(instId, [{ studentId, rank }]);
    };

    const exportPdf = () => {
        const resultsEl = document.getElementById('allotment-results');
        if (!resultsEl) return alert('No allotment results to export.');
        const inst = store.institutions[0];
        const instName = inst?.name || 'Institution';
        const instAddress = inst?.address || '';
        const instLogo = inst?.logoUrl || '';
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return alert('Please allow popups to export PDF.');
        printWindow.document.write(`
            <html>
            <head>
                <title>Electives Allotment – ${instName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1e293b; }
                    .header { text-align: center; margin-bottom: 0; }
                    .logo { max-height: 72px; max-width: 72px; object-fit: contain; margin-bottom: 10px; }
                    .inst-name { font-size: 28px; font-weight: 900; color: #0f172a; width: 60%; margin: 0 auto 6px auto; line-height: 1.2; }
                    .inst-address { font-size: 12px; color: #64748b; width: 60%; margin: 0 auto 16px auto; line-height: 1.5; }
                    .divider { border: none; border-top: 2px solid #1e293b; margin: 0 0 24px 0; }
                    .section-title { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
                    .section-meta { font-size: 11px; color: #94a3b8; margin-bottom: 20px; }
                    .date-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #f8fafc; }
                    .date-header { font-size: 15px; font-weight: 800; margin-bottom: 14px; background: #fff; display: inline-block; padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .block-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; margin: 12px 0 6px 4px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
                    thead th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                    tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
                    tbody tr:hover { background: #f8fafc; }
                    .bold { font-weight: 700; }
                    .mono { font-family: 'Consolas', monospace; color: #64748b; }
                    .elective { font-weight: 700; color: #059669; }
                    .muted { color: #94a3b8; }
                    .footer { margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 60px; padding: 0 16px; }
                    .sig-block { text-align: center; width: 40%; }
                    .sig-line { border-top: 1.5px solid #1e293b; margin-bottom: 8px; }
                    .sig-title { font-size: 13px; font-weight: 700; color: #0f172a; }
                    .sig-inst { font-size: 11px; color: #64748b; margin-top: 2px; }
                    @media print { body { padding: 16px; } .date-card { break-inside: avoid; } .signatures { break-inside: avoid; } }
                </style>
            </head>
            <body>
                <div class="header">
                    ${instLogo ? `<img src="${instLogo}" class="logo" alt="Logo" />` : ''}
                    <div class="inst-name">${instName}</div>
                    ${instAddress ? `<div class="inst-address">${instAddress}</div>` : ''}
                </div>
                <hr class="divider" />
                <p class="section-title">Electives Allotment</p>
                <p class="section-meta">Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                ${resultsEl.innerHTML}
                <div class="signatures">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-title">Electives In-charge</div>
                        <div class="sig-inst">${instName}</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-title">Principal</div>
                        <div class="sig-inst">${instName}</div>
                    </div>
                </div>
                <div class="footer">MedEduAI – Elective Management System</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 400);
    };

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Shuffle className="w-5 h-5 text-purple-600" /></div>
                <div><h3 className="text-xl font-bold text-slate-900">Allotment System</h3><p className="text-sm text-slate-500">Select method, configure, and run the allotment engine.</p></div>
            </div>



            {/* Description */}
            <div className={`rounded-2xl p-5 border ${method === 'merit' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                {method === 'merit' ? (
                    <div className="space-y-2 text-sm text-amber-800">
                        <p className="font-bold">Merit-Weighted Preference System:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Update the merit ranking of students (1st rank = highest priority).</li>
                            <li>Students rank all electives for Block 1 and Block 2.</li>
                            <li>System allots electives starting from Rank 1, giving them their top preference first.</li>
                        </ul>
                    </div>
                ) : (
                    <div className="space-y-2 text-sm text-blue-800">
                        <p className="font-bold">Point-Based Bidding System:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Each student divides 1000 points across all electives (both blocks).</li>
                            <li>No two electives can have the same points.</li>
                            <li>System selects students with the highest allocated points for each elective.</li>
                            <li>Ties are broken by lottery. Losers automatically cascade to their next highest-pointed elective.</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Merit Rank Table (only for merit method) */}
            {method === 'merit' && students.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-800">Update Student Merit Rankings</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[400px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0">
                                <tr><th className="p-3">#</th><th className="p-3">Name</th><th className="p-3">Reg No</th><th className="p-3 text-center">Merit Rank</th></tr>
                            </thead>
                            <tbody>
                                {students.map((st, i) => (
                                    <tr key={st.id} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                        <td className="p-3 font-bold text-slate-800">{st.name}</td>
                                        <td className="p-3 text-slate-600 font-mono">{st.regNo}</td>
                                        <td className="p-3 text-center">
                                            <input type="number" min={1} value={st.meritRank ?? ''} onChange={e => handleUpdateRank(st.id, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1.5 border-2 border-slate-200 rounded-lg text-center font-bold text-sm outline-none focus:border-purple-500" placeholder="—" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Run & Result */}
            <div className="flex gap-3 pt-2">
                <button onClick={handleRun} className="flex items-center gap-2 px-8 py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
                    <Play className="w-5 h-5" /> Run Allotment Engine
                </button>
                {allotments.length > 0 && (
                    <>
                        <button onClick={() => { store.clearAllotments(instId); setShowResults(false); }} className="flex items-center gap-2 px-6 py-3 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Clear Results</button>
                        <button onClick={exportPdf} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"><Download className="w-4 h-4" /> Export PDF</button>
                    </>
                )}
            </div>

            {/* Results Table */}
            {allotments.length > 0 && (() => {
                const electiveDates = store.dates?.filter((d: any) => d.institutionId === instId) || [];

                // Group dates into unique date ranges (by fromDate–toDate)
                const dateRangeMap = new Map<string, { fromDate: string; toDate: string; entries: { block: number; group: number | null }[] }>();
                electiveDates.forEach((d: any) => {
                    const key = `${d.fromDate}__${d.toDate}`;
                    if (!dateRangeMap.has(key)) {
                        dateRangeMap.set(key, { fromDate: d.fromDate, toDate: d.toDate, entries: [] });
                    }
                    dateRangeMap.get(key)!.entries.push({ block: d.block, group: d.group });
                });
                const dateRanges = Array.from(dateRangeMap.values()).sort((a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime());

                // Helper: find which students belong to a given date range + block
                const getStudentsForDateBlock = (fromDate: string, toDate: string, block: number) => {
                    // Find which groups map to this date range + block
                    const matchingDateEntries = electiveDates.filter((d: any) =>
                        d.fromDate === fromDate && d.toDate === toDate && d.block === block
                    );
                    const matchingGroups = matchingDateEntries.map((d: any) => d.group);

                    return allotments.filter(a => {
                        if (a.block !== block) return false;
                        const student = students.find(s => s.id === a.studentId);
                        // If group is null, all students match; otherwise, match by group
                        return matchingGroups.some((g: number | null) => g === null || g === student?.group);
                    });
                };

                return (
                <div id="allotment-results" className="space-y-6 print:block">
                    <h4 className="text-lg font-bold text-slate-900">📋 Allotment Results ({allotments.length} allotments)</h4>

                    {dateRanges.length > 0 ? dateRanges.map((range, ri) => (
                        <div key={ri} className="space-y-4 bg-slate-50/50 rounded-2xl border border-slate-200 p-6">
                            {/* Date Range Header */}
                            <div className="flex items-center gap-3">
                                <span className="text-base font-extrabold text-slate-800 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                    📅 {new Date(range.fromDate).toLocaleDateString('en-GB')} – {new Date(range.toDate).toLocaleDateString('en-GB')}
                                </span>
                            </div>

                            {/* Blocks within this date range */}
                            {([1, 2] as const).map(block => {
                                const blockStudents = getStudentsForDateBlock(range.fromDate, range.toDate, block);
                                if (blockStudents.length === 0) return null;
                                return (
                                    <div key={block} className="space-y-2">
                                        <h5 className="font-bold text-emerald-700 text-sm uppercase tracking-wider ml-1">Block {block} ({blockStudents.length} students)</h5>
                                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                                    <tr><th className="p-3">#</th><th className="p-3">Student</th><th className="p-3">Reg No</th><th className="p-3">Allotted Elective</th><th className="p-3">Faculty</th></tr>
                                                </thead>
                                                <tbody>
                                                    {blockStudents.map((a, i) => {
                                                        const student = students.find(s => s.id === a.studentId);
                                                        const elective = electives.find(e => e.id === a.electiveId);
                                                        return (
                                                            <tr key={a.id} className="border-t border-slate-100 hover:bg-white transition-colors">
                                                                <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                                                <td className="p-3 font-bold text-slate-800">{student?.name || '—'}</td>
                                                                <td className="p-3 text-slate-600 font-mono">{student?.regNo || '—'}</td>
                                                                <td className="p-3 font-bold text-emerald-700">{elective?.electiveName || '—'}</td>
                                                                <td className="p-3 text-slate-600">{elective?.facultyName || '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )) : (
                        /* Fallback: if no dates are configured, show block-wise */
                        ([1, 2] as const).map(block => {
                            const blockAllotments = allotments.filter(a => a.block === block);
                            if (blockAllotments.length === 0) return null;
                            return (
                                <div key={block} className="space-y-2">
                                    <h5 className="font-bold text-emerald-700 text-sm uppercase tracking-wider">Block {block} ({blockAllotments.length} allotments)</h5>
                                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                                <tr><th className="p-3">#</th><th className="p-3">Student</th><th className="p-3">Reg No</th><th className="p-3">Allotted Elective</th><th className="p-3">Faculty</th></tr>
                                            </thead>
                                            <tbody>
                                                {blockAllotments.map((a, i) => {
                                                    const student = students.find(s => s.id === a.studentId);
                                                    const elective = electives.find(e => e.id === a.electiveId);
                                                    return (
                                                        <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                            <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                                            <td className="p-3 font-bold text-slate-800">{student?.name || '—'}</td>
                                                            <td className="p-3 text-slate-600 font-mono">{student?.regNo || '—'}</td>
                                                            <td className="p-3 font-bold text-emerald-700">{elective?.electiveName || '—'}</td>
                                                            <td className="p-3 text-slate-600">{elective?.facultyName || '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                );
            })()}
        </div>
    );
}
