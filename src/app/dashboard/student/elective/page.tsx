"use client";

import { useState, useEffect } from 'react';
import { BookOpen, KeyRound, Star, CheckCircle2, FileText, Send, Upload, MessageSquare, Download, Lock } from 'lucide-react';
import { useElectiveStore, type Elective, type ElectiveStudent, type Allotment, type ElectiveSession, type StudentReflection, type LogbookApproval } from '@/store/electiveStore';
import { supabase } from '@/lib/supabase';

export default function StudentElectivePage() {
    const store = useElectiveStore();
    const [codeInput, setCodeInput] = useState('');
    const [verified, setVerified] = useState(false);
    const [matchedStudent, setMatchedStudent] = useState<ElectiveStudent | null>(null);
    const [instId, setInstId] = useState('');
    const [activeTab, setActiveTab] = useState<'preferences' | 'allotted' | 'logbook' | 'feedback' | 'download'>('preferences');
    const [step, setStep] = useState<1 | 2>(1);
    const [studentList, setStudentList] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [resolvedInstId, setResolvedInstId] = useState('');
    // Server-fetched data (electives, allotments, sessions, method) from Supabase
    const [serverElectives, setServerElectives] = useState<Elective[]>([]);
    const [serverAllotments, setServerAllotments] = useState<Allotment[]>([]);
    const [serverSessions, setServerSessions] = useState<ElectiveSession[]>([]);
    const [serverMethod, setServerMethod] = useState<string>('merit');
    const [serverDates, setServerDates] = useState<any[]>([]);

    async function verifyCode() {
        try {
            const inputCode = codeInput.trim().toUpperCase();
            if (!inputCode) { window.alert('Please enter an elective code.'); return; }

            let codes: any[] = [];
            let students: any[] = [];

            // Try server first (works across browser profiles)
            let sElectives: any[] = [];
            let sAllotments: any[] = [];
            let sSessions: any[] = [];
            let sMethod = 'merit';
            let sDates: any[] = [];
            try {
                const res = await fetch('/api/elective-sync');
                if (res.ok) {
                    const serverData = await res.json();
                    codes = serverData.codes || [];
                    students = serverData.students || [];
                    sElectives = serverData.electives || [];
                    sAllotments = serverData.allotments || [];
                    sSessions = serverData.sessions || [];
                    sMethod = serverData.allotmentMethod || 'merit';
                    sDates = serverData.dates || [];
                }
            } catch {}

            // Fallback to localStorage if server returned nothing
            if (codes.length === 0) {
                try {
                    const raw = localStorage.getItem('elective-storage');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        codes = parsed?.state?.codes || [];
                        students = parsed?.state?.students || [];
                    }
                } catch {}
            }

            // Final fallback to Zustand store
            if (codes.length === 0) {
                codes = store.codes;
                students = store.students;
            }

            const code = codes.find((c: any) => c.code === inputCode);
            if (!code) {
                window.alert('Invalid Electives Code.\n\nYou entered: ' + inputCode + '\nAvailable codes: ' + (codes.map((c: any) => c.code).join(', ') || '(none)'));
                return;
            }

            const instStudents = students.filter((s: any) => s.institutionId === code.institutionId);
            if (instStudents.length === 0) {
                window.alert('No students registered for this institution yet.');
                return;
            }

            // Try auto-match: if logged-in user's email matches exactly one student, skip dropdown
            let userEmail = '';
            try {
                const { data } = await supabase.auth.getUser();
                userEmail = (data?.user?.email || '').toLowerCase().trim();
            } catch {}

            if (userEmail) {
                const emailMatches = instStudents.filter((s: any) => 
                    (s.email || '').toLowerCase().trim() === userEmail
                );
                if (emailMatches.length === 1) {
                    // Exact single match — go directly to module
                    useElectiveStore.persist.rehydrate();
                    setServerElectives(sElectives.filter((e: any) => e.institutionId === code.institutionId));
                    setServerAllotments(sAllotments.filter((a: any) => a.institutionId === code.institutionId));
                    setServerSessions(sSessions.filter((s: any) => s.institutionId === code.institutionId));
                    setServerMethod(sMethod);
                    setServerDates(sDates.filter((d: any) => d.institutionId === code.institutionId));
                    setMatchedStudent(emailMatches[0]);
                    setInstId(code.institutionId);
                    setVerified(true);
                    return;
                }
            }

            // No auto-match — show the dropdown selector
            // Store server data for use in the module
            setServerElectives(sElectives.filter((e: any) => e.institutionId === code.institutionId));
            setServerAllotments(sAllotments.filter((a: any) => a.institutionId === code.institutionId));
            setServerSessions(sSessions.filter((s: any) => s.institutionId === code.institutionId));
            setServerMethod(sMethod);
            setServerDates(sDates.filter((d: any) => d.institutionId === code.institutionId));
            setResolvedInstId(code.institutionId);
            setStudentList(instStudents);
            setStep(2);
        } catch (err: any) {
            console.error('[ElectiveMS] Error in verifyCode:', err);
            window.alert('Error verifying code: ' + (err?.message || String(err)));
        }
    }

    function enterModule() {
        if (!selectedId) return alert('Please select your name from the list.');
        const student = studentList.find((s: any) => s.id === selectedId);
        if (!student) return alert('Student not found.');
        
        useElectiveStore.persist.rehydrate();
        setMatchedStudent(student);
        setInstId(resolvedInstId);
        setVerified(true);
    }

    if (!verified) {
        return (
            <div className="max-w-lg mx-auto mt-12 space-y-8">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto"><BookOpen className="w-8 h-8 text-emerald-600" /></div>
                    <h2 className="text-2xl font-bold text-slate-900">Elective MS</h2>
                    <p className="text-slate-500">Enter the Electives Code shared by your institution to access your elective module.</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Electives Code</label>
                        <input 
                            value={codeInput} 
                            onChange={e => setCodeInput(e.target.value)} 
                            placeholder="e.g. EL-ABC123" 
                            readOnly={step === 2}
                            className={`w-full px-4 py-4 rounded-xl border-2 outline-none font-mono font-bold text-xl text-center tracking-[0.2em] uppercase ${step === 2 ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`}
                        />
                    </div>

                    {step === 1 && (
                        <button onClick={verifyCode} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                            <KeyRound className="w-5 h-5" /> Verify Code
                        </button>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Code verified! Now select your name below.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Your Name</label>
                                <select
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none font-bold text-base focus:border-emerald-500"
                                >
                                    <option value="">— Choose your name —</option>
                                    {studentList.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.regNo || s.email})</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={enterModule} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                                <KeyRound className="w-5 h-5" /> Enter Elective Module
                            </button>
                            <button onClick={() => { setStep(1); setStudentList([]); setSelectedId(''); setCodeInput(''); }} className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">
                                ← Try a different code
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Verified — show elective interface
    // Use server-fetched data (works across browser profiles) with store as fallback
    const electives: Elective[] = serverElectives.length > 0 
        ? serverElectives 
        : store.electives.filter(e => e.institutionId === instId);
    const allotments: Allotment[] = (serverAllotments.length > 0 
        ? serverAllotments 
        : store.allotments.filter(a => a.institutionId === instId)
    ).filter(a => a.studentId === matchedStudent?.id);
    const sessions: ElectiveSession[] = serverSessions.length > 0 
        ? serverSessions 
        : store.sessions.filter(s => s.institutionId === instId);
    const method = serverMethod || store.allotmentMethod;
    const hasAllotment = allotments.length > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-emerald-800 to-green-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.25),transparent_60%)]" />
                <div className="relative z-10 px-8 py-8">
                    <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-[0.2em] mb-1">Student</p>
                    <h2 className="text-2xl font-extrabold text-white">Elective MS — {matchedStudent?.name}</h2>
                    <p className="text-emerald-200/80 mt-1 font-medium text-sm">{matchedStudent?.regNo} • {matchedStudent?.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
                {([
                    { key: 'preferences', label: hasAllotment ? 'Preferences' : 'Submit Preferences', icon: Star },
                    { key: 'allotted', label: 'Allotted Electives', icon: CheckCircle2 },
                    { key: 'logbook', label: 'Logbook & Reflections', icon: FileText },
                    { key: 'feedback', label: 'Feedback', icon: MessageSquare },
                    { key: 'download', label: 'Download Logbook', icon: Download },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'preferences' && <PreferencesView store={store} instId={instId} student={matchedStudent!} electives={electives} method={method} hasAllotment={hasAllotment} />}
            {activeTab === 'allotted' && <AllottedView allotments={allotments} electives={electives} dates={serverDates} student={matchedStudent} />}
            {activeTab === 'logbook' && <LogbookView store={store} instId={instId} student={matchedStudent!} allotments={allotments} electives={electives} sessions={sessions} />}
            {activeTab === 'feedback' && <FeedbackView store={store} instId={instId} student={matchedStudent!} />}
            {activeTab === 'download' && <DownloadLogbookView store={store} instId={instId} student={matchedStudent!} allotments={allotments} electives={electives} sessions={sessions} dates={serverDates} />}
        </div>
    );
}

// ── Preferences ──
function PreferencesView({ store, instId, student, electives, method, hasAllotment }: any) {
    const block1 = electives.filter((e: Elective) => e.block === 1);
    const block2 = electives.filter((e: Elective) => e.block === 2);
    const [prefs, setPrefs] = useState<Record<string, number>>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<string | null>(null);

    // Load existing preferences and check if already submitted
    useEffect(() => {
        const existing = store.preferences.filter((p: any) => p.studentId === student.id && p.institutionId === instId);
        const map: Record<string, number> = {};
        existing.forEach((p: any) => { map[p.electiveId] = method === 'merit' ? p.rank : p.points; });
        setPrefs(map);
        if (existing.length > 0) {
            setHasSubmitted(true);
            setSubmittedAt(existing[0]?.submittedAt || null);
        }
    }, [store.preferences, student.id, instId, method]);

    const handleSubmit = async () => {
        const allEls = [...block1, ...block2];
        const missing = allEls.filter((e: Elective) => !prefs[e.id] && prefs[e.id] !== 0);
        if (missing.length > 0) return alert(`Please assign a ${method === 'merit' ? 'rank' : 'points value'} to all ${allEls.length} electives.`);

        if (method === 'points') {
            const vals = Object.values(prefs);
            const uniqueVals = new Set(vals);
            if (uniqueVals.size !== vals.length) return alert('Each elective must have different points. No two electives can have the same points.');
            const total = vals.reduce((a, b) => a + b, 0);
            if (total !== 1000) return alert(`Total points must equal 1000. Current total: ${total}`);
        }

        const now = new Date().toISOString();
        const prefData = allEls.map((e: Elective) => ({
            institutionId: instId,
            studentId: student.id,
            electiveId: e.id,
            block: e.block,
            rank: method === 'merit' ? (prefs[e.id] || null) : null,
            points: method === 'points' ? (prefs[e.id] || null) : null,
            submittedAt: now,
        }));
        store.setPreferences(prefData);

        // Sync preferences to Supabase so admin can see them across browser profiles
        try {
            // First fetch existing preferences from server (other students may have submitted)
            let existingPrefs: any[] = [];
            try {
                const res = await fetch('/api/elective-sync');
                if (res.ok) {
                    const data = await res.json();
                    existingPrefs = data.preferences || [];
                }
            } catch {}

            // Remove current student's old prefs then add new ones
            const otherStudentPrefs = existingPrefs.filter((p: any) => p.studentId !== student.id);
            const mergedPrefs = [...otherStudentPrefs, ...prefData];

            await fetch('/api/elective-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: mergedPrefs }),
            });
        } catch (err) {
            console.error('[ElectiveMS] Failed to sync preferences:', err);
        }

        setHasSubmitted(true);
        setSubmittedAt(now);
    };

    if (hasAllotment) {
        return <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-700 font-bold">✅ Allotment is complete. Check the "Allotted Electives" tab.</div>;
    }

    const totalPoints = Object.values(prefs).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">{method === 'merit' ? 'Rank your Elective Preferences' : 'Allocate 1000 Points'}</h3>
            <p className="text-sm text-slate-500">{method === 'merit' ? 'Rank all electives (1 = most preferred) for each block.' : 'Distribute 1000 points across all electives. Each must have a unique point value.'}</p>
            {method === 'points' && (
                <div className={`text-sm font-bold px-4 py-2 rounded-xl ${totalPoints === 1000 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                    Points used: {totalPoints} / 1000 {totalPoints === 1000 ? '✓' : `(${1000 - totalPoints} remaining)`}
                </div>
            )}

            {([1, 2] as const).map(block => {
                const blockEls = block === 1 ? block1 : block2;
                return (
                    <div key={block} className="space-y-3">
                        <h4 className="font-bold text-emerald-700 text-sm uppercase tracking-wider">Block {block} ({blockEls.length} electives)</h4>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="p-3">#</th><th className="p-3">Elective</th><th className="p-3">Faculty</th><th className="p-3">Topic</th><th className="p-3 text-center">{method === 'merit' ? 'Rank' : 'Points'}</th></tr></thead>
                                <tbody>
                                    {blockEls.map((el: Elective, i: number) => (
                                        <tr key={el.id} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                            <td className="p-3 font-bold text-slate-800">{el.electiveName}</td>
                                            <td className="p-3 text-slate-600">{el.facultyName}</td>
                                            <td className="p-3 text-slate-500 text-xs max-w-[200px] truncate">{el.topicDetails}</td>
                                            <td className="p-3 text-center">
                                                <input type="number" min={method === 'merit' ? 1 : 0} max={method === 'points' ? 999 : undefined} value={prefs[el.id] ?? ''} onChange={e => {
                                                    let val = parseInt(e.target.value) || 0;
                                                    if (method === 'points') {
                                                        if (val < 0) val = 0;
                                                        // Calculate max allowed: 1000 minus all OTHER electives' points
                                                        const othersTotal = Object.entries(prefs)
                                                            .filter(([id]) => id !== el.id)
                                                            .reduce((sum, [, v]) => sum + (v || 0), 0);
                                                        const maxAllowed = 1000 - othersTotal;
                                                        if (val > maxAllowed) val = maxAllowed;
                                                    }
                                                    setPrefs({ ...prefs, [el.id]: val });
                                                }} className="w-20 px-2 py-1.5 border-2 border-slate-200 rounded-lg text-center font-bold text-sm outline-none focus:border-emerald-500" placeholder="—" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {hasSubmitted && (
                <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-6 py-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-emerald-700 text-base">Preferences Submitted ✓</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Your preferences have been recorded successfully.{submittedAt ? ` Submitted on ${new Date(submittedAt).toLocaleString()}.` : ''} You may update and re-submit if needed.</p>
                    </div>
                </div>
            )}

            <button onClick={handleSubmit} className={`flex items-center gap-2 px-8 py-3.5 font-bold rounded-xl transition-colors shadow-lg ${hasSubmitted ? 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}>
                <Send className="w-5 h-5" /> {hasSubmitted ? 'Update Preferences' : 'Submit Preferences'}
            </button>
        </div>
    );
}

// ── Allotted Electives ──
function AllottedView({ allotments, electives, dates, student }: { allotments: Allotment[]; electives: Elective[]; dates?: any[]; student?: ElectiveStudent | null }) {
    if (allotments.length === 0) return <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-bold">Allotment not done yet. Please wait.</div>;

    // Helper: find the date range for a given block + student group
    const getDateForBlock = (block: number) => {
        if (!dates || dates.length === 0) return null;
        const match = dates.find((d: any) =>
            d.block === block && (d.group === null || d.group === student?.group)
        );
        return match || null;
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Your Allotted Electives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allotments.map(a => {
                    const el = electives.find((e: Elective) => e.id === a.electiveId);
                    const dateInfo = getDateForBlock(a.block);
                    return (
                        <div key={a.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-2">
                            <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold">Block {a.block}</span>
                            <h4 className="text-lg font-bold text-slate-900">{el?.electiveName || '—'}</h4>
                            <p className="text-sm text-slate-600">Faculty: <strong>{el?.facultyName}</strong></p>
                            {dateInfo && (
                                <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5">
                                    <span className="text-base">📅</span>
                                    {new Date(dateInfo.fromDate).toLocaleDateString('en-GB')} – {new Date(dateInfo.toDate).toLocaleDateString('en-GB')}
                                </p>
                            )}
                            {el?.topicDetails && <p className="text-sm text-slate-500">{el.topicDetails}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Logbook ──
function LogbookView({ store, instId, student, allotments, electives, sessions }: any) {
    const [reflText, setReflText] = useState('');
    const [reflImages, setReflImages] = useState<string[]>([]);
    const [activeSessionId, setActiveSessionId] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setReflImages(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmitReflection = () => {
        if (!activeSessionId) return alert('Select a session first');
        if (!reflText.trim() && reflImages.length === 0) return alert('Enter a reflection or upload images');
        store.addReflection({ institutionId: instId, sessionId: activeSessionId, studentId: student.id, reflectionText: reflText, imageUrls: reflImages, submittedAt: new Date().toISOString() });
        setReflText(''); setReflImages([]); setActiveSessionId('');
        alert('Reflection submitted!');
    };

    const mySessions = sessions.filter((s: ElectiveSession) => allotments.some((a: Allotment) => a.electiveId === s.electiveId) && s.attendanceMap[student.id]);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Logbook & Reflections</h3>
            {mySessions.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-bold">No sessions yet. Your teacher will record sessions and mark your attendance.</div>
            ) : (
                <div className="space-y-4">
                    {mySessions.map((session: ElectiveSession) => {
                        const el = electives.find((e: Elective) => e.id === session.electiveId);
                        const existingRefl = store.reflections.find((r: any) => r.sessionId === session.id && r.studentId === student.id);
                        return (
                            <div key={session.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800">{session.topic}</p>
                                        <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()} • {session.timeFrom}–{session.timeTo} • {session.activityType}</p>
                                        <p className="text-xs text-slate-400">Elective: {el?.electiveName} • SLOs: {session.slos}</p>
                                    </div>
                                    {existingRefl ? (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold border border-green-200">Reflection Submitted</span>
                                    ) : (
                                        <button onClick={() => setActiveSessionId(session.id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">Write Reflection</button>
                                    )}
                                </div>
                                {activeSessionId === session.id && !existingRefl && (
                                    <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
                                        <textarea value={reflText} onChange={e => setReflText(e.target.value)} rows={4} placeholder="Type your reflection..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium text-sm resize-none" />
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200">
                                                <Upload className="w-4 h-4" /> Upload Images
                                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                            </label>
                                            {reflImages.length > 0 && <span className="text-xs text-slate-500">{reflImages.length} image(s)</span>}
                                        </div>
                                        <button onClick={handleSubmitReflection} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm"><Send className="w-4 h-4" /> Submit Reflection</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Feedback ──
function FeedbackView({ store, instId, student }: any) {
    const [block, setBlock] = useState<1 | 2>(1);
    const [text, setText] = useState('');
    const existing = store.feedbacks.filter((f: any) => f.studentId === student.id && f.institutionId === instId);

    const handleSubmit = () => {
        if (!text.trim()) return alert('Please write your feedback.');
        store.addFeedback({ institutionId: instId, studentId: student.id, block, feedbackText: text, submittedAt: new Date().toISOString() });
        setText('');
        alert('Feedback submitted!');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Course Feedback</h3>
            {existing.length > 0 && (
                <div className="space-y-2">{existing.map((f: any) => (
                    <div key={f.id} className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">Block {f.block} Feedback — Submitted</p>
                        <p className="text-sm text-slate-700">{f.feedbackText}</p>
                    </div>
                ))}</div>
            )}
            <div className="space-y-4">
                <select value={block} onChange={e => setBlock(parseInt(e.target.value) as 1 | 2)} className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-sm outline-none focus:border-emerald-500">
                    <option value={1}>Block 1</option><option value={2}>Block 2</option>
                </select>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Share your feedback on the elective experience..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-emerald-500 font-medium text-sm resize-none" />
                <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"><Send className="w-5 h-5" /> Submit Feedback</button>
            </div>
        </div>
    );
}

// ── Download Logbook ──
function DownloadLogbookView({ store, instId, student, allotments, electives, sessions, dates }: any) {
    const [serverApprovals, setServerApprovals] = useState<LogbookApproval[]>([]);

    // Check approval from server
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/elective-sync');
                if (res.ok) {
                    const data = await res.json();
                    const approvals: LogbookApproval[] = data.logbookApprovals || [];
                    setServerApprovals(approvals);
                }
            } catch {}
        })();
    }, []);

    // Check local store + server
    const localApprovals: LogbookApproval[] = store.logbookApprovals || [];
    const allApprovals = [...localApprovals, ...serverApprovals];
    const approval = allApprovals.find((a: LogbookApproval) => a.institutionId === instId && a.studentId === student.id);
    const isApproved = !!approval;

    const myAllotments: Allotment[] = allotments;
    const mySessions: ElectiveSession[] = sessions.filter((s: ElectiveSession) =>
        myAllotments.some(a => a.electiveId === s.electiveId)
    );
    const myReflections: StudentReflection[] = store.reflections.filter((r: StudentReflection) => r.studentId === student.id && r.institutionId === instId);
    const myGrades = store.grades.filter((g: any) => g.studentId === student.id && g.institutionId === instId);

    const handleDownload = () => {
        const instData = store.institutions[0];
        const instName = instData?.name || 'Institution';
        const instAddress = instData?.address || '';
        const instLogo = instData?.logoUrl || '';

        // Build session rows
        let sessionRows = '';
        mySessions.forEach((session: ElectiveSession, idx: number) => {
            const el = electives.find((e: Elective) => e.id === session.electiveId);
            const refl = myReflections.find((r: StudentReflection) => r.sessionId === session.id);
            const grade = myGrades.find((g: any) => g.sessionId === session.id);
            const wasPresent = session.attendanceMap?.[student.id] ?? false;

            sessionRows += `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${new Date(session.date).toLocaleDateString('en-GB')}</td>
                    <td>${session.topic}</td>
                    <td>${el?.electiveName || '—'}</td>
                    <td>${session.activityType}</td>
                    <td><span class="${wasPresent ? 'present' : 'absent'}">${wasPresent ? 'Present' : 'Absent'}</span></td>
                    <td>${refl ? 'Yes' : 'No'}</td>
                    <td>${grade ? (grade.rating === 'E' ? 'Exceeds' : grade.rating === 'M' ? 'Meets' : 'Below') : '—'}</td>
                </tr>
            `;
        });

        // Allotment info
        let allotmentInfo = '';
        myAllotments.forEach((a: Allotment) => {
            const el = electives.find((e: Elective) => e.id === a.electiveId);
            const dateInfo = dates?.find((d: any) => d.block === a.block && (d.group === null || d.group === student?.group));
            allotmentInfo += `
                <div class="allot-card">
                    <strong>Block ${a.block}:</strong> ${el?.electiveName || '—'} — Faculty: ${el?.facultyName || '—'}
                    ${dateInfo ? ` <span class="date-tag">📅 ${new Date(dateInfo.fromDate).toLocaleDateString('en-GB')} – ${new Date(dateInfo.toDate).toLocaleDateString('en-GB')}</span>` : ''}
                </div>
            `;
        });

        const pw = window.open('', '_blank', 'width=900,height=700');
        if (!pw) return alert('Please allow popups to download.');
        pw.document.write(`
            <html>
            <head>
                <title>Elective Logbook – ${student.name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1e293b; font-size: 13px; }
                    .header { text-align: center; margin-bottom: 0; }
                    .logo { max-height: 64px; max-width: 64px; object-fit: contain; margin-bottom: 8px; }
                    .inst-name { font-size: 26px; font-weight: 900; color: #0f172a; width: 60%; margin: 0 auto 4px auto; line-height: 1.2; }
                    .inst-address { font-size: 11px; color: #64748b; width: 60%; margin: 0 auto 14px auto; line-height: 1.4; }
                    .divider { border: none; border-top: 2px solid #1e293b; margin: 0 0 20px 0; }
                    .title { font-size: 18px; font-weight: 800; margin-bottom: 4px; text-align: center; }
                    .student-info { font-size: 12px; color: #475569; text-align: center; margin-bottom: 20px; }
                    .section { font-size: 14px; font-weight: 700; margin: 20px 0 8px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                    .allot-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; font-size: 12px; }
                    .date-tag { color: #4338ca; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    thead th { background: #f1f5f9; padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
                    tbody td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
                    .present { color: #059669; font-weight: 700; }
                    .absent { color: #dc2626; font-weight: 700; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 16px; }
                    .sig-block { text-align: center; width: 40%; }
                    .sig-line { border-top: 1.5px solid #1e293b; margin-bottom: 6px; }
                    .sig-title { font-size: 12px; font-weight: 700; color: #0f172a; }
                    .sig-inst { font-size: 10px; color: #64748b; margin-top: 2px; }
                    .footer { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
                    .approved-badge { text-align: center; margin: 12px 0; font-size: 11px; color: #059669; font-weight: 700; }
                    @media print { body { padding: 16px; } .allot-card { break-inside: avoid; } }
                </style>
            </head>
            <body>
                <div class="header">
                    ${instLogo ? `<img src="${instLogo}" class="logo" alt="Logo" />` : ''}
                    <div class="inst-name">${instName}</div>
                    ${instAddress ? `<div class="inst-address">${instAddress}</div>` : ''}
                </div>
                <hr class="divider" />
                <div class="title">Elective Logbook</div>
                <div class="student-info">
                    <strong>${student.name}</strong> &nbsp;|&nbsp; Reg No: ${student.regNo} &nbsp;|&nbsp; Email: ${student.email}
                </div>

                <div class="section">Allotted Electives</div>
                ${allotmentInfo}

                <div class="section">Session Log (${mySessions.length} sessions)</div>
                ${mySessions.length > 0 ? `
                <table>
                    <thead><tr><th>#</th><th>Date</th><th>Topic</th><th>Elective</th><th>Activity</th><th>Attendance</th><th>Reflection</th><th>Grade</th></tr></thead>
                    <tbody>${sessionRows}</tbody>
                </table>
                ` : '<p style="color:#94a3b8;font-style:italic;">No sessions recorded yet.</p>'}

                ${approval ? `<div class="approved-badge">✅ Logbook approved on ${new Date(approval.approvedAt).toLocaleDateString('en-GB')} by ${approval.approvedBy}</div>` : ''}

                <div class="signatures">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-title">Student</div>
                        <div class="sig-inst">${student.name}</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div class="sig-title">Electives In-charge</div>
                        <div class="sig-inst">${instName}</div>
                    </div>
                </div>
                <div class="footer">MedEduAI – Elective Management System</div>
            </body>
            </html>
        `);
        pw.document.close();
        setTimeout(() => { pw.print(); }, 400);
    };

    if (!isApproved) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                    <Lock className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Logbook Not Yet Approved</h3>
                <p className="text-slate-500 max-w-md mx-auto">Your logbook download will be available once the Institute Admin has reviewed and approved it. Please check back later.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-amber-700">⏳ Awaiting Approval</p>
                    <p className="text-xs text-amber-600 mt-1">Contact your Electives In-charge if you believe this is an error.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Download Your Logbook</h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                    <p className="font-bold text-green-800">Logbook Approved</p>
                    <p className="text-xs text-green-600 mt-0.5">
                        Approved on {new Date(approval.approvedAt).toLocaleDateString('en-GB')} by {approval.approvedBy}
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
                <p className="text-sm text-slate-600">Your logbook contains:</p>
                <ul className="text-sm text-slate-700 space-y-1.5">
                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span> <strong>{myAllotments.length}</strong> elective allotments</li>
                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span> <strong>{mySessions.length}</strong> recorded sessions</li>
                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span> <strong>{myReflections.length}</strong> reflections submitted</li>
                    <li className="flex items-center gap-2"><span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span> <strong>{myGrades.length}</strong> grades received</li>
                </ul>
            </div>

            <button onClick={handleDownload} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 text-base">
                <Download className="w-5 h-5" /> Download Logbook as PDF
            </button>
        </div>
    );
}
