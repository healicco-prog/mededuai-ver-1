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
    const [facultyList, setFacultyList] = useState<{ email: string; name: string; electives: any[] }[]>([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [resolvedInstId, setResolvedInstId] = useState('');
    const [serverStudents, setServerStudents] = useState<ElectiveStudent[]>([]);
    const [serverAllotments, setServerAllotments] = useState<Allotment[]>([]);
    const [serverSessions, setServerSessions] = useState<ElectiveSession[]>([]);

    useEffect(() => {
        if (step === 1 && !verified) {
            verifyCode();
        }
    }, []);

    async function verifyCode() {
        try {
            const inputCode = codeInput.trim().toUpperCase();

            let codes: any[] = [];
            let electives: any[] = [];
            let sStudents: any[] = [];
            let sAllotments: any[] = [];
            let sSessions: any[] = [];

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

            if (codes.length === 0) {
                codes = store.codes;
                electives = store.electives;
            }

            let code = codes.find((c: any) => c.code === inputCode);
            if (!code && codes.length > 0) code = codes[0];
            if (!code) {
                window.alert('No institution codes available yet.');
                return;
            }

            const instElectives = electives.filter((e: any) => e.institutionId === code.institutionId);
            const facultyMap: Record<string, { email: string; name: string; electives: any[] }> = {};
            instElectives.forEach((e: any) => {
                if (!facultyMap[e.facultyEmail]) {
                    facultyMap[e.facultyEmail] = { email: e.facultyEmail, name: e.facultyName, electives: [] };
                }
                facultyMap[e.facultyEmail].electives.push(e);
            });
            const list = Object.values(facultyMap);
            if (list.length === 0) return window.alert('No electives/faculty registered for this institution yet.');

            let loggedInEmail = '';
            try {
                const { data } = await supabase.auth.getUser();
                loggedInEmail = (data?.user?.email || '').toLowerCase().trim();
            } catch {}

            if (loggedInEmail) {
                const emailMatch = list.find(f => f.email.toLowerCase().trim() === loggedInEmail);
                if (emailMatch) {
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
                    {step === 1 && (
                        <div className="text-center py-4 text-blue-600 font-bold">
                            Loading institution data...
                        </div>
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
            <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-violet-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
                <div className="relative z-10 px-8 py-8">
                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em] mb-1">Faculty / Teacher</p>
                    <h2 className="text-2xl font-extrabold text-white">Elective MS</h2>
                    <p className="text-blue-200/80 mt-1 font-medium text-sm">{userEmail} • {matchedElectives.length} elective(s) assigned</p>
                </div>
            </div>

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
        allottedStudents.forEach(s => { if (s) map[s.id] = true; });
        setAttendance(map);
    }, [selectedElective, allottedStudents]);

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

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Elective</label>
                <select value={selectedElective} onChange={e => setSelectedElective(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-500">
                    {myElectives.map((el: Elective) => <option key={el.id} value={el.id}>Block {el.block} — {el.electiveName}</option>)}
                </select>
            </div>

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
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Participation</label><select value={form.levelOfParticipation} onChange={e => setForm({ ...form, levelOfParticipation: e.target.value as 'attended' | 'presented' })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:border-blue-500"><option value="attended">Attended</option><option value="presented">Presented</option></select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reflection Mode</label><select value={form.reflectionMode} onChange={e => setForm({ ...form, reflectionMode: e.target.value as 'type' | 'upload' })} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none focus:border-blue-500"><option value="type">Type</option><option value="upload">Upload</option></select></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-slate-900">Attendance</h4>
                    <span className="text-xs text-slate-500">Mark present / absent</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allottedStudents.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white">
                            <input type="checkbox" checked={attendance[student.id] ?? false} onChange={e => setAttendance(prev => ({ ...prev, [student.id]: e.target.checked }))} className="h-4 w-4 text-blue-600 border-slate-300 rounded" />
                            <div>
                                <div className="font-bold text-slate-800">{student.name}</div>
                                <div className="text-xs text-slate-500">{student.regNo}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
                <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors">Save Session</button>
                <button onClick={() => setSelectedElective(myElectives[0]?.id || '')} className="flex-1 py-4 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors">Reset Elective</button>
            </div>
        </div>
    );
}

function GradingView({ store, instId, myElectives, serverStudents, serverAllotments }: any) {
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [selectedElectiveId, setSelectedElectiveId] = useState(myElectives[0]?.id || '');
    const [grades, setGrades] = useState<TeacherGrade[]>([]);

    const sessions = (serverAllotments && serverAllotments.length > 0) ? serverAllotments : store.sessions.filter((s: ElectiveSession) => s.institutionId === instId);
    const allStudents: ElectiveStudent[] = (serverStudents && serverStudents.length > 0) ? serverStudents : store.students.filter((s: ElectiveStudent) => s.institutionId === instId);

    const electiveSessions = sessions.filter(s => s.electiveId === selectedElectiveId);
    const selectedSession = electiveSessions.find(s => s.id === selectedSessionId);
    const students = allStudents.filter(s => s.institutionId === instId);

    useEffect(() => {
        if (electiveSessions.length > 0) {
            setSelectedSessionId(electiveSessions[0].id);
        }
    }, [selectedElectiveId, electiveSessions.length]);

    useEffect(() => {
        const currentGrades = store.grades.filter(g => g.institutionId === instId && g.sessionId === selectedSessionId);
        setGrades(currentGrades);
    }, [instId, selectedSessionId, store.grades]);

    const handleGradeSave = () => {
        if (!selectedSession) return alert('Select a valid session');
        grades.forEach(g => store.updateGrade(g.id, g));
        alert('Grades saved successfully!');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Elective</label>
                    <select value={selectedElectiveId} onChange={e => setSelectedElectiveId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-blue-500">
                        {myElectives.map(el => <option key={el.id} value={el.id}>Block {el.block} — {el.electiveName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Session</label>
                    <select value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:border-blue-500">
                        {electiveSessions.map(session => <option key={session.id} value={session.id}>{session.date} • {session.topic}</option>)}
                    </select>
                </div>
            </div>

            {selectedSession ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5">
                            <p className="text-slate-500 text-sm mb-2">Session Topic</p>
                            <p className="text-slate-900 font-bold">{selectedSession.topic || 'No topic set'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5">
                            <p className="text-slate-500 text-sm mb-2">Attendance</p>
                            <p className="text-slate-900 font-bold">{Object.values(selectedSession.attendanceMap || {}).filter(Boolean).length} present</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5">
                        <h4 className="text-base font-bold text-slate-900 mb-4">Grades</h4>
                        <div className="space-y-3">
                            {students.map(student => {
                                const existing = grades.find(g => g.studentId === student.id) || {
                                    id: `${student.id}-${selectedSession.id}`,
                                    studentId: student.id,
                                    institutionId: instId,
                                    sessionId: selectedSession.id,
                                    dateOfCompletion: new Date().toISOString().split('T')[0],
                                    attempt: 'First' as const,
                                    rating: '' as const,
                                    comments: '',
                                    signatureUrl: '',
                                };
                                return (
                                    <div key={student.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
                                        <div>
                                            <div className="font-bold text-slate-800">{student.name}</div>
                                            <div className="text-xs text-slate-500">{student.regNo}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-400">Rating</label>
                                            <select value={existing.rating} onChange={e => setGrades(prev => prev.map(g => g.studentId === student.id ? { ...g, rating: e.target.value as TeacherGrade['rating'] } : g))} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none">
                                                <option value="">Select</option>
                                                <option value="B">Below</option>
                                                <option value="M">Meets</option>
                                                <option value="E">Exceeds</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-400">Comments</label>
                                            <input value={existing.comments} onChange={e => setGrades(prev => prev.map(g => g.studentId === student.id ? { ...g, comments: e.target.value } : g))} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 outline-none" placeholder="Notes" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={handleGradeSave} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors">Save Grades</button>
                </div>
            ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-500">Select a session to begin grading.</div>
            )}
        </div>
    );
}
