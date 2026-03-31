"use client";

import { useState, useEffect } from 'react';
import { BookOpen, KeyRound, Users, CalendarDays, CheckSquare, Square, CheckCircle2, MessageSquare, PenLine, Save, Send } from 'lucide-react';
import { useElectiveStore, type Elective, type ElectiveStudent, type Allotment, type ElectiveSession, type StudentReflection, type TeacherGrade } from '@/store/electiveStore';
import { supabase } from '@/lib/supabase';

export default function TeacherElectivePage() {
    const store = useElectiveStore();
    const [codeInput, setCodeInput] = useState('');
    const [verified, setVerified] = useState(false);
    const [instId, setInstId] = useState('');
    const [matchedElectives, setMatchedElectives] = useState<Elective[]>([]);
    const [activeTab, setActiveTab] = useState<'students' | 'session' | 'grading'>('students');
    const [userEmail, setUserEmail] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [facultyList, setFacultyList] = useState<{email: string; name: string; electives: any[]}[]>([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [resolvedInstId, setResolvedInstId] = useState('');
    // Server-fetched data for cross-browser-profile support
    const [serverStudents, setServerStudents] = useState<ElectiveStudent[]>([]);
    const [serverAllotments, setServerAllotments] = useState<Allotment[]>([]);
    const [serverSessions, setServerSessions] = useState<ElectiveSession[]>([]);

    async function verifyCode() {
        try {
            const inputCode = codeInput.trim().toUpperCase();
            if (!inputCode) { window.alert('Please enter an elective code.'); return; }

            let codes: any[] = [];
            let electives: any[] = [];
            let sStudents: any[] = [];
            let sAllotments: any[] = [];
            let sSessions: any[] = [];

            // Try server first (works across browser profiles)
            try {
                const res = await fetch('/api/elective-sync');
                if (res.ok) {
                    const serverData = await res.json();
                    codes = serverData.codes || [];
                    electives = serverData.electives || [];
                    sStudents = serverData.students || [];
                    sAllotments = serverData.allotments || [];
                    sSessions = serverData.sessions || [];
                }
            } catch {}

            // Fallback to localStorage
            if (codes.length === 0) {
                try {
                    const raw = localStorage.getItem('elective-storage');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        codes = parsed?.state?.codes || [];
                        electives = parsed?.state?.electives || [];
                    }
                } catch {}
            }

            // Final fallback to Zustand store
            if (codes.length === 0) {
                codes = store.codes;
                electives = store.electives;
            }

            const code = codes.find((c: any) => c.code === inputCode);
            if (!code) {
                window.alert('Invalid Electives Code.\n\nYou entered: ' + inputCode + '\nAvailable codes: ' + (codes.map((c: any) => c.code).join(', ') || '(none)'));
                return;
            }
            
            const instElectives = electives.filter((e: any) => e.institutionId === code.institutionId);
            const facultyMap: Record<string, {email: string; name: string; electives: any[]}> = {};
            instElectives.forEach((e: any) => {
                if (!facultyMap[e.facultyEmail]) {
                    facultyMap[e.facultyEmail] = { email: e.facultyEmail, name: e.facultyName, electives: [] };
                }
                facultyMap[e.facultyEmail].electives.push(e);
            });
            const list = Object.values(facultyMap);
            if (list.length === 0) return window.alert('No electives/faculty registered for this institution yet.');

            // Try auto-match: if logged-in teacher's email matches exactly one faculty, skip dropdown
            let loggedInEmail = '';
            try {
                const { data } = await supabase.auth.getUser();
                loggedInEmail = (data?.user?.email || '').toLowerCase().trim();
            } catch {}

            if (loggedInEmail) {
                const emailMatch = list.find(f => f.email.toLowerCase().trim() === loggedInEmail);
                if (emailMatch) {
                    // Exact match — go directly to module
                    useElectiveStore.persist.rehydrate();
                    setServerStudents(sStudents.filter((s: any) => s.institutionId === code.institutionId));
                    setServerAllotments(sAllotments.filter((a: any) => a.institutionId === code.institutionId));
                    setServerSessions(sSessions.filter((s: any) => s.institutionId === code.institutionId));
                    setUserEmail(emailMatch.email);
                    setInstId(code.institutionId);
                    setMatchedElectives(emailMatch.electives);
                    setVerified(true);
                    return;
                }
            }

            // No auto-match — show the dropdown selector
            // Store server data
            setServerStudents(sStudents.filter((s: any) => s.institutionId === code.institutionId));
            setServerAllotments(sAllotments.filter((a: any) => a.institutionId === code.institutionId));
            setServerSessions(sSessions.filter((s: any) => s.institutionId === code.institutionId));
            setResolvedInstId(code.institutionId);
            setFacultyList(list);
            setStep(2);
        } catch (err: any) {
            console.error('[ElectiveMS] Error:', err);
            window.alert('Error verifying code: ' + (err?.message || String(err)));
        }
    }

    function enterModule() {
        if (!selectedEmail) return alert('Please select your name from the list.');
        const faculty = facultyList.find(f => f.email === selectedEmail);
        if (!faculty) return alert('Faculty not found.');
        
        useElectiveStore.persist.rehydrate();
        setUserEmail(selectedEmail);
        setInstId(resolvedInstId);
        setMatchedElectives(faculty.electives);
        setVerified(true);
    }

    if (!verified) {
        return (
            <div className="max-w-lg mx-auto mt-12 space-y-8">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto"><BookOpen className="w-8 h-8 text-blue-600" /></div>
                    <h2 className="text-2xl font-bold text-slate-900">Elective MS — Faculty</h2>
                    <p className="text-slate-500">Enter the Electives Code shared by your institution.</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Electives Code</label>
                        <input 
                            value={codeInput} 
                            onChange={e => setCodeInput(e.target.value)} 
                            placeholder="e.g. EL-ABC123"
                            readOnly={step === 2}
                            className={`w-full px-4 py-4 rounded-xl border-2 outline-none font-mono font-bold text-xl text-center tracking-[0.2em] uppercase ${step === 2 ? 'border-blue-400 bg-blue-50 text-blue-700' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                        />
                    </div>

                    {step === 1 && (
                        <button onClick={verifyCode} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                            <KeyRound className="w-5 h-5" /> Verify Code
                        </button>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-700 text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Code verified! Select your name below.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Your Name</label>
                                <select
                                    value={selectedEmail}
                                    onChange={e => setSelectedEmail(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none font-bold text-base focus:border-blue-500"
                                >
                                    <option value="">— Choose your name —</option>
                                    {facultyList.map(f => (
                                        <option key={f.email} value={f.email}>{f.name} ({f.email})</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={enterModule} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                                <KeyRound className="w-5 h-5" /> Enter Faculty Module
                            </button>
                            <button onClick={() => { setStep(1); setFacultyList([]); setSelectedEmail(''); setCodeInput(''); }} className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">
                                ← Try a different code
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-violet-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
                <div className="relative z-10 px-8 py-8">
                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em] mb-1">Faculty / Teacher</p>
                    <h2 className="text-2xl font-extrabold text-white">Elective MS</h2>
                    <p className="text-blue-200/80 mt-1 font-medium text-sm">{userEmail} • {matchedElectives.length} elective(s) assigned</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
                {([
                    { key: 'students', label: 'Allotted Students', icon: Users },
                    { key: 'session', label: 'Record Session', icon: CalendarDays },
                    { key: 'grading', label: 'Review & Grade', icon: PenLine },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'students' && <StudentsView store={store} instId={instId} myElectives={matchedElectives} serverStudents={serverStudents} serverAllotments={serverAllotments} />}
            {activeTab === 'session' && <SessionView store={store} instId={instId} myElectives={matchedElectives} userEmail={userEmail} serverStudents={serverStudents} serverAllotments={serverAllotments} />}
            {activeTab === 'grading' && <GradingView store={store} instId={instId} myElectives={matchedElectives} serverStudents={serverStudents} serverAllotments={serverAllotments} />}
        </div>
    );
}

// ── Allotted Students ──
function StudentsView({ store, instId, myElectives, serverStudents, serverAllotments }: any) {
    const allotments: Allotment[] = (serverAllotments && serverAllotments.length > 0) ? serverAllotments : store.allotments.filter((a: Allotment) => a.institutionId === instId);
    const students: ElectiveStudent[] = (serverStudents && serverStudents.length > 0) ? serverStudents : store.students.filter((s: ElectiveStudent) => s.institutionId === instId);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Students Allotted to Your Electives</h3>
            {myElectives.map((el: Elective) => {
                const elAllotments = allotments.filter((a: Allotment) => a.electiveId === el.id);
                const allottedStudents = elAllotments.map((a: Allotment) => students.find((s: ElectiveStudent) => s.id === a.studentId)).filter(Boolean);
                return (
                    <div key={el.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-200">Block {el.block}</span>
                            <h4 className="font-bold text-slate-800">{el.electiveName}</h4>
                            <span className="text-slate-400 text-sm">({allottedStudents.length}/{el.totalUptake} seats)</span>
                        </div>
                        {allottedStudents.length > 0 ? (
                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase"><tr><th className="p-3">#</th><th className="p-3">Name</th><th className="p-3">Reg No</th><th className="p-3">Email</th><th className="p-3">Mobile</th></tr></thead>
                                    <tbody>
                                        {allottedStudents.map((st: any, i: number) => (
                                            <tr key={st.id} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                                <td className="p-3 font-bold text-slate-800">{st.name}</td>
                                                <td className="p-3 text-slate-600 font-mono">{st.regNo}</td>
                                                <td className="p-3 text-slate-500 text-xs">{st.email}</td>
                                                <td className="p-3 text-slate-500">{st.mobileNo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No students allotted yet.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Record Session ──
function SessionView({ store, instId, myElectives, userEmail, serverStudents, serverAllotments }: any) {
    const [selectedElective, setSelectedElective] = useState(myElectives[0]?.id || '');
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], timeFrom: '09:00', timeTo: '10:00', topic: '', slos: '', activityType: 'SDL', levelOfParticipation: 'attended' as 'attended' | 'presented', reflectionMode: 'type' as 'type' | 'upload' });
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});

    const elective = myElectives.find((e: Elective) => e.id === selectedElective);
    const allAllotments: Allotment[] = (serverAllotments && serverAllotments.length > 0) ? serverAllotments : store.allotments.filter((a: Allotment) => a.institutionId === instId);
    const allotments = allAllotments.filter((a: Allotment) => a.electiveId === selectedElective);
    const students: ElectiveStudent[] = (serverStudents && serverStudents.length > 0) ? serverStudents : store.students.filter((s: ElectiveStudent) => s.institutionId === instId);
    const allottedStudents = allotments.map(a => students.find(s => s.id === a.studentId)).filter(Boolean) as ElectiveStudent[];

    useEffect(() => {
        const map: Record<string, boolean> = {};
        allottedStudents.forEach(s => { map[s.id] = true; });
        setAttendance(map);
    }, [selectedElective]);

    const handleSave = () => {
        if (!form.topic.trim()) return alert('Topic is required');
        store.addSession({
            institutionId: instId, electiveId: selectedElective, facultyEmail: userEmail,
            ...form, attendanceMap: attendance,
        });
        alert('Session recorded successfully!');
        setForm({ ...form, topic: '', slos: '' });
    };

    const activityTypes = ['SDL', 'SGT', 'Seminar', 'Skill Lab', 'Bedside Clinics', 'Clinical Procedure or Activity', 'Any Other'];

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Record a Session</h3>

            {/* Select Elective */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Elective</label>
                <select value={selectedElective} onChange={e => setSelectedElective(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-500">
                    {myElectives.map((el: Elective) => <option key={el.id} value={el.id}>Block {el.block} — {el.electiveName}</option>)}
                </select>
            </div>

            {/* Session Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">From</label><input type="time" value={form.timeFrom} onChange={e => setForm({ ...form, timeFrom: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label><input type="time" value={form.timeTo} onChange={e => setForm({ ...form, timeTo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-blue-500" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic / Competency *</label><input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Enter topic addressed..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">SLOs</label><input value={form.slos} onChange={e => setForm({ ...form, slos: e.target.value })} placeholder="Specific Learning Objectives..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none focus:border-blue-500" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Activity Type</label>
                    <select value={form.activityType} onChange={e => setForm({ ...form, activityType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:border-blue-500">
                        {activityTypes.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Level of Participation</label>
                    <select value={form.levelOfParticipation} onChange={e => setForm({ ...form, levelOfParticipation: e.target.value as any })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:border-blue-500">
                        <option value="attended">Attended</option><option value="presented">Presented</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reflection Mode</label>
                    <select value={form.reflectionMode} onChange={e => setForm({ ...form, reflectionMode: e.target.value as any })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:border-blue-500">
                        <option value="type">Type Reflection</option><option value="upload">Upload Image</option>
                    </select>
                </div>
            </div>

            {/* Attendance */}
            {allottedStudents.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Mark Attendance</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[350px]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase sticky top-0"><tr><th className="p-3 w-16">Mark</th><th className="p-3">Name</th><th className="p-3">Reg No</th><th className="p-3 text-right">Status</th></tr></thead>
                            <tbody>
                                {allottedStudents.map(st => {
                                    const isPresent = attendance[st.id] ?? false;
                                    return (
                                        <tr key={st.id} onClick={() => setAttendance(prev => ({ ...prev, [st.id]: !prev[st.id] }))} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 select-none ${!isPresent ? 'bg-red-50/40' : ''}`}>
                                            <td className="p-3"><div className={isPresent ? 'text-green-500' : 'text-slate-300'}>{isPresent ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}</div></td>
                                            <td className="p-3 font-bold text-slate-800">{st.name}</td>
                                            <td className="p-3 text-slate-600 font-mono">{st.regNo}</td>
                                            <td className="p-3 text-right"><span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${isPresent ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{isPresent ? 'Present' : 'Absent'}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                <Save className="w-5 h-5" /> Save Session
            </button>
        </div>
    );
}

// ── Grading ──
function GradingView({ store, instId, myElectives, serverStudents, serverAllotments }: any) {
    const sessions: ElectiveSession[] = store.sessions.filter((s: ElectiveSession) => s.institutionId === instId && myElectives.some((e: Elective) => e.id === s.electiveId));
    const students: ElectiveStudent[] = (serverStudents && serverStudents.length > 0) ? serverStudents : store.students.filter((s: ElectiveStudent) => s.institutionId === instId);
    const reflections: StudentReflection[] = store.reflections.filter((r: StudentReflection) => r.institutionId === instId);
    const grades: TeacherGrade[] = store.grades.filter((g: TeacherGrade) => g.institutionId === instId);

    const [gradeForm, setGradeForm] = useState<Record<string, { rating: string; comments: string; attempt: string; dateOfCompletion: string }>>({});

    const handleGradeSubmit = (sessionId: string, studentId: string, activityType: string) => {
        const key = `${sessionId}_${studentId}`;
        const f = gradeForm[key];
        if (!f || !f.rating) return alert('Please select a rating');
        store.addGrade({
            institutionId: instId, sessionId, studentId,
            dateOfCompletion: f.dateOfCompletion || '', attempt: f.attempt || '',
            rating: f.rating as 'B' | 'M' | 'E', comments: f.comments || '', signatureUrl: '',
        });
        alert('Grade saved!');
    };

    if (sessions.length === 0) return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Review & Grade Reflections</h3>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-bold">No sessions recorded yet. Record a session first.</div>
        </div>
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Review & Grade Reflections</h3>
            {sessions.map(session => {
                const el = myElectives.find((e: Elective) => e.id === session.electiveId);
                const presentStudents = Object.entries(session.attendanceMap).filter(([, v]) => v).map(([id]) => students.find(s => s.id === id)).filter(Boolean) as ElectiveStudent[];
                const isSkillLab = session.activityType === 'Skill Lab';

                return (
                    <div key={session.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-xs font-bold border border-blue-100">{session.activityType}</span>
                                <span className="font-bold text-slate-800">{session.topic}</span>
                            </div>
                            <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()} • {session.timeFrom}–{session.timeTo} • {el?.electiveName}</p>
                        </div>

                        {presentStudents.map(st => {
                            const refl = reflections.find(r => r.sessionId === session.id && r.studentId === st.id);
                            const existingGrade = grades.find(g => g.sessionId === session.id && g.studentId === st.id);
                            const key = `${session.id}_${st.id}`;
                            const f = gradeForm[key] || { rating: '', comments: '', attempt: '', dateOfCompletion: '' };

                            return (
                                <div key={st.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div><span className="font-bold text-slate-800">{st.name}</span><span className="text-xs text-slate-400 ml-2">{st.regNo}</span></div>
                                        {existingGrade && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold border border-green-200">Graded: {existingGrade.rating === 'E' ? 'Exceeds' : existingGrade.rating === 'M' ? 'Meets' : 'Below'}</span>}
                                    </div>

                                    {refl ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                                            <p className="text-xs font-bold text-blue-600 uppercase">Student Reflection:</p>
                                            {refl.reflectionText && <p className="text-sm text-slate-700">{refl.reflectionText}</p>}
                                            {refl.imageUrls.length > 0 && (
                                                <div className="flex gap-2 flex-wrap">{refl.imageUrls.map((url: string, i: number) => <img key={i} src={url} alt={`Reflection ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-slate-200" />)}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Student has not submitted a reflection yet.</p>
                                    )}

                                    {!existingGrade && (
                                        <div className="space-y-3 border-t border-slate-100 pt-3">
                                            {isSkillLab && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Completion</label><input type="date" value={f.dateOfCompletion} onChange={e => setGradeForm({ ...gradeForm, [key]: { ...f, dateOfCompletion: e.target.value } })} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-medium bg-white outline-none" /></div>
                                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attempt</label>
                                                        <select value={f.attempt} onChange={e => setGradeForm({ ...gradeForm, [key]: { ...f, attempt: e.target.value } })} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-bold bg-white outline-none">
                                                            <option value="">Select</option><option value="First">First</option><option value="Repeat">Repeat</option><option value="Remedial">Remedial</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rating</label>
                                                <div className="flex gap-2">
                                                    {[{ val: 'B', label: 'Below (B)', color: 'amber' }, { val: 'M', label: 'Meets (M)', color: 'blue' }, { val: 'E', label: 'Exceeds (E)', color: 'green' }].map(opt => (
                                                        <button key={opt.val} onClick={() => setGradeForm({ ...gradeForm, [key]: { ...f, rating: opt.val } })} className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all border-2 ${f.rating === opt.val ? `bg-${opt.color}-100 border-${opt.color}-400 text-${opt.color}-700` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Comments</label><textarea value={f.comments} onChange={e => setGradeForm({ ...gradeForm, [key]: { ...f, comments: e.target.value } })} rows={2} placeholder="Comments on the reflection..." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none resize-none focus:border-blue-500" /></div>
                                            <button onClick={() => handleGradeSubmit(session.id, st.id, session.activityType)} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm"><Send className="w-4 h-4" /> Submit Grade</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
