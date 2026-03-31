"use client";
import { useState, useEffect } from 'react';
import { KeyRound, Copy, RefreshCw } from 'lucide-react';
import type { ElectiveCode } from '@/store/electiveStore';

// Sync all elective data to server
async function syncToServer() {
    try {
        const raw = localStorage.getItem('elective-storage');
        if (raw) {
            const parsed = JSON.parse(raw);
            const state = parsed?.state || {};
            await fetch('/api/elective-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codes: state.codes || [],
                    students: state.students || [],
                    electives: state.electives || [],
                    allotments: state.allotments || [],
                    sessions: state.sessions || [],
                    preferences: state.preferences || [],
                    allotmentMethod: state.allotmentMethod || 'merit',
                }),
            });
            console.log('[ElectiveMS] Auto-synced to server');
        }
    } catch (err) {
        console.error('[ElectiveMS] Auto-sync failed:', err);
    }
}

export default function Step6Code({ store, instId }: { store: any; instId: string }) {
    const [copied, setCopied] = useState(false);
    const codes: ElectiveCode[] = store.codes.filter((c: ElectiveCode) => c.institutionId === instId);
    const latestCode = codes.length > 0 ? codes[codes.length - 1].code : null;

    // Auto-sync on mount and whenever codes change
    useEffect(() => {
        syncToServer();
    }, [store.codes.length]);

    const handleGenerate = async () => {
        store.generateCode(instId);
        // Sync to server so students/teachers in other browser profiles can access the data
        setTimeout(async () => {
            try {
                const raw = localStorage.getItem('elective-storage');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const state = parsed?.state || {};
                    await fetch('/api/elective-sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            codes: state.codes || [],
                            students: state.students || [],
                            electives: state.electives || [],
                            allotments: state.allotments || [],
                            sessions: state.sessions || [],
                            preferences: state.preferences || [],
                            allotmentMethod: state.allotmentMethod || 'merit',
                        }),
                    });
                    console.log('[ElectiveMS] Data synced to server');
                }
            } catch (err) {
                console.error('[ElectiveMS] Sync failed:', err);
            }
        }, 500); // small delay to let Zustand persist finish
    };

    const handleCopy = () => {
        if (latestCode) {
            navigator.clipboard.writeText(latestCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Step 1 first.</div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div><h3 className="text-xl font-bold text-slate-900">Generate Electives Code</h3><p className="text-sm text-slate-500">Generate a unique code and share it with Students and Teachers to unlock the Elective MS.</p></div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-center space-y-6">
                {latestCode ? (
                    <>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Your Electives Code</p>
                        <div className="text-5xl font-black text-white tracking-[0.3em] font-mono">{latestCode}</div>
                        <div className="flex justify-center gap-3">
                            <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm">
                                <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                            <button onClick={handleGenerate} className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm">
                                <RefreshCw className="w-4 h-4" /> Regenerate
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No code generated yet</p>
                        <button onClick={handleGenerate} className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30 text-lg">
                            <KeyRound className="w-5 h-5 inline mr-2 -mt-0.5" /> Generate Electives Code
                        </button>
                    </>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800 space-y-2">
                <p className="font-bold">How it works:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Share this code with your <strong>Students</strong> and <strong>Teachers/Faculty</strong>.</li>
                    <li>Students enter the code in their <strong>Learning Dashboard → Elective MS</strong>.</li>
                    <li>Teachers enter the code in their <strong>Teaching Dashboard → Elective MS</strong>.</li>
                    <li>If their email matches the uploaded lists, the Elective module unlocks for them.</li>
                </ul>
            </div>

            {/* All Codes History */}
            {codes.length > 1 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Code History</h4>
                    <div className="flex flex-wrap gap-2">
                        {codes.map(c => (
                            <span key={c.id} className={`px-4 py-2 rounded-xl font-mono font-bold text-sm border ${c.code === latestCode ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-200 line-through'}`}>{c.code}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
