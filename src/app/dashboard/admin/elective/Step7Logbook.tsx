"use client";
import { ClipboardList, Download, Eye, CheckCircle2, ShieldCheck, XCircle, Users, Activity, CalendarDays, CheckSquare, XSquare } from 'lucide-react';
import type { Allotment, Elective, ElectiveStudent, ElectiveSession, StudentReflection, TeacherGrade, LogbookApproval, ElectiveDate } from '@/store/electiveStore';
import { useState } from 'react';

export default function Step7Logbook({ store, instId }: { store: any; instId: string }) {
    const students: ElectiveStudent[] = store.students.filter((s: ElectiveStudent) => s.institutionId === instId);
    const electives: Elective[] = store.electives.filter((e: Elective) => e.institutionId === instId);
    const allotments: Allotment[] = store.allotments.filter((a: Allotment) => a.institutionId === instId);
    const sessions: ElectiveSession[] = store.sessions.filter((s: ElectiveSession) => s.institutionId === instId);
    const reflections: StudentReflection[] = store.reflections.filter((r: StudentReflection) => r.institutionId === instId);
    const grades: TeacherGrade[] = store.grades.filter((g: TeacherGrade) => g.institutionId === instId);
    const dates: ElectiveDate[] = store.dates.filter((d: ElectiveDate) => d.institutionId === instId);
    const approvals: LogbookApproval[] = store.logbookApprovals?.filter((a: LogbookApproval) => a.institutionId === instId) || [];

    // Local toggles
    const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
    const toggleExpand = (id: string) => setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));

    // Analytics state
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;
    const institution = store.institutions.find((i: any) => i.id === instId);
    const instName = institution?.name || 'Institution';
    const instAddress = institution?.address || '';
    const instLogo = institution?.logoUrl || '';

    // --- Analytics Calculations ---
    const studentStats = students.map(student => {
        const sAllotments = allotments.filter(a => a.studentId === student.id);
        const sSessions = sessions.filter(s => sAllotments.some(a => a.electiveId === s.electiveId));
        
        const totalSessions = sSessions.length;
        const attendedSessions = sSessions.filter(s => s.attendanceMap[student.id]).length;
        const attendancePct = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
        
        const refs = reflections.filter(r => r.studentId === student.id).length;
        const refPct = totalSessions > 0 ? (refs / totalSessions) * 100 : 0;
        
        return { id: student.id, name: student.name, attendancePct, refPct, totalSessions };
    }).filter(s => s.totalSessions > 0);

    const attAbove80 = studentStats.filter(s => s.attendancePct >= 80);
    const attBelow80 = studentStats.filter(s => s.attendancePct >= 50 && s.attendancePct < 80);
    const attBelow50 = studentStats.filter(s => s.attendancePct < 50);

    const ref100 = studentStats.filter(s => s.refPct >= 100);
    const ref50plus = studentStats.filter(s => s.refPct >= 50 && s.refPct < 100);
    const refBelow50 = studentStats.filter(s => s.refPct < 50);

    // Teacher Date-based calculations
    const activeBlocks = dates.filter(d => selectedDate >= d.fromDate && selectedDate <= d.toDate).map(d => d.block);
    const activeElectiveIds = new Set(allotments.filter(a => activeBlocks.includes(a.block)).map(a => a.electiveId));
    const activeElectives = electives.filter(e => activeElectiveIds.has(e.id));

    // "Started" = recorded a session on this specific date
    const teachersStarted = activeElectives.filter(e => sessions.some(s => s.electiveId === e.id && s.date.startsWith(selectedDate)));
    const teachersNotStarted = activeElectives.filter(e => !sessions.some(s => s.electiveId === e.id && s.date.startsWith(selectedDate)));

    // "Approved" = teacher graded everyone who was present on this date
    const todaysSessions = sessions.filter(s => activeElectiveIds.has(s.electiveId) && s.date.startsWith(selectedDate));
    const teachersApprovedAll: Elective[] = [];
    const teachersNotCompleted: Elective[] = [];

    todaysSessions.forEach(session => {
        const el = electives.find(e => e.id === session.electiveId);
        if (!el) return;
        
        const attendees = Object.keys(session.attendanceMap).filter(stId => session.attendanceMap[stId]);
        const gradedCount = attendees.filter(stId => grades.find(g => g.sessionId === session.id && g.studentId === stId)).length;
        
        // Prevent duplicate pushes if multiple sessions exist for same elective
        const alreadyApproved = teachersApprovedAll.some(e => e.id === el.id);
        const alreadyNotCompleted = teachersNotCompleted.some(e => e.id === el.id);

        if (attendees.length > 0 && gradedCount >= attendees.length) {
            if (!alreadyApproved) teachersApprovedAll.push(el);
        } else {
            if (!alreadyNotCompleted) teachersNotCompleted.push(el);
        }
    });

    const openLogbookWindow = (student: ElectiveStudent, autoPrint: boolean) => {
        const sAllotments = allotments.filter(a => a.studentId === student.id);
        const mySessions = sessions.filter(s => sAllotments.some(a => a.electiveId === s.electiveId));
        const approval = approvals.find(a => a.studentId === student.id);

        let sessionRows = '';
        mySessions.forEach((session, idx) => {
            const el = electives.find(e => e.id === session.electiveId);
            const refl = reflections.find(r => r.sessionId === session.id && r.studentId === student.id);
            const grade = grades.find(g => g.sessionId === session.id && g.studentId === student.id);
            const wasPresent = session.attendanceMap?.[student.id] ?? false;
            const gradeLabel = grade ? (grade.rating === 'E' ? 'Exceeds' : grade.rating === 'M' ? 'Meets' : 'Below') : '—';
            sessionRows += '<tr><td>' + (idx + 1) + '</td><td>' + new Date(session.date).toLocaleDateString('en-GB') + '</td><td>' + session.topic + '</td><td>' + (el?.electiveName || '—') + '</td><td>' + session.activityType + '</td><td><span class="' + (wasPresent ? 'present' : 'absent') + '">' + (wasPresent ? 'Present' : 'Absent') + '</span></td><td>' + (refl ? 'Yes' : 'No') + '</td><td>' + gradeLabel + '</td></tr>';
        });

        let allotmentInfo = '';
        sAllotments.forEach(a => {
            const el = electives.find(e => e.id === a.electiveId);
            const dateInfo = dates.find(d => d.block === a.block && (d.group === null || d.group === student.group));
            let dateStr = '';
            if (dateInfo) {
                dateStr = ' <span class="date-tag">📅 ' + new Date(dateInfo.fromDate).toLocaleDateString('en-GB') + ' – ' + new Date(dateInfo.toDate).toLocaleDateString('en-GB') + '</span>';
            }
            allotmentInfo += '<div class="allot-card"><strong>Block ' + a.block + ':</strong> ' + (el?.electiveName || '—') + ' — Faculty: ' + (el?.facultyName || '—') + dateStr + '</div>';
        });

        const logoHtml = instLogo ? '<img src="' + instLogo + '" class="logo" alt="Logo" />' : '';
        const addressHtml = instAddress ? '<div class="inst-address">' + instAddress + '</div>' : '';
        const tableHtml = mySessions.length > 0
            ? '<table><thead><tr><th>#</th><th>Date</th><th>Topic</th><th>Elective</th><th>Activity</th><th>Attendance</th><th>Reflection</th><th>Grade</th></tr></thead><tbody>' + sessionRows + '</tbody></table>'
            : '<p style="color:#94a3b8;font-style:italic;">No sessions recorded yet.</p>';
        const approvalHtml = approval
            ? '<div class="approved-badge">✅ Log approved on ' + new Date(approval.approvedAt).toLocaleDateString('en-GB') + ' by ' + approval.approvedBy + '</div>'
            : '';

        const pw = window.open('', '_blank', 'width=900,height=700');
        if (!pw) return alert('Please allow popups to open the log.');

        const html = [
            '<html><head><title>Elective Log – ' + student.name + '</title>',
            '<style>',
            '* { margin: 0; padding: 0; box-sizing: border-box; }',
            "body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1e293b; font-size: 13px; }",
            '.header { text-align: center; margin-bottom: 0; }',
            '.logo { max-height: 64px; max-width: 64px; object-fit: contain; margin-bottom: 8px; }',
            '.inst-name { font-size: 26px; font-weight: 900; color: #0f172a; width: 60%; margin: 0 auto 4px auto; line-height: 1.2; }',
            '.inst-address { font-size: 11px; color: #64748b; width: 60%; margin: 0 auto 14px auto; line-height: 1.4; }',
            '.divider { border: none; border-top: 2px solid #1e293b; margin: 0 0 20px 0; }',
            '.title { font-size: 18px; font-weight: 800; margin-bottom: 4px; text-align: center; }',
            '.student-info { font-size: 12px; color: #475569; text-align: center; margin-bottom: 20px; }',
            '.section { font-size: 14px; font-weight: 700; margin: 20px 0 8px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }',
            '.allot-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; margin-bottom: 6px; font-size: 12px; }',
            '.date-tag { color: #4338ca; font-weight: 700; }',
            'table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }',
            'thead th { background: #f1f5f9; padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }',
            'tbody td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }',
            '.present { color: #059669; font-weight: 700; }',
            '.absent { color: #dc2626; font-weight: 700; }',
            '.signatures { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 16px; }',
            '.sig-block { text-align: center; width: 40%; }',
            '.sig-line { border-top: 1.5px solid #1e293b; margin-bottom: 6px; }',
            '.sig-title { font-size: 12px; font-weight: 700; color: #0f172a; }',
            '.sig-inst { font-size: 10px; color: #64748b; margin-top: 2px; }',
            '.footer { margin-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }',
            '.approved-badge { text-align: center; margin: 12px 0; font-size: 11px; color: #059669; font-weight: 700; }',
            '@media print { body { padding: 16px; } .allot-card { break-inside: avoid; } }',
            '</style></head><body>',
            '<div class="header">' + logoHtml + '<div class="inst-name">' + instName + '</div>' + addressHtml + '</div>',
            '<hr class="divider" />',
            '<div class="title">Elective Log</div>',
            '<div class="student-info"><strong>' + student.name + '</strong> &nbsp;|&nbsp; Reg No: ' + student.regNo + ' &nbsp;|&nbsp; Email: ' + student.email + '</div>',
            '<div class="section">Allotted Electives</div>',
            allotmentInfo,
            '<div class="section">Session Log (' + mySessions.length + ' sessions)</div>',
            tableHtml,
            approvalHtml,
            '<div class="signatures">',
            '<div class="sig-block"><div class="sig-line"></div><div class="sig-title">Student</div><div class="sig-inst">' + student.name + '</div></div>',
            '<div class="sig-block"><div class="sig-line"></div><div class="sig-title">Electives In-charge</div><div class="sig-inst">' + instName + '</div></div>',
            '</div>',
            '<div class="footer">MedEduAI – Elective Management System</div>',
            '</body></html>',
        ].join('\n');

        pw.document.write(html);
        pw.document.close();
        if (autoPrint) {
            setTimeout(() => { pw.print(); }, 400);
        }
    };

    return (
        <div className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-fuchsia-100 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5 text-fuchsia-600" /></div>
                    <div><h3 className="text-xl font-bold text-slate-900">Analytics Dashboard</h3><p className="text-sm text-slate-500">Track student compliance and teacher session grading</p></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Student Analytics */}
                    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> Student Progress</h4>
                        
                        <div className="space-y-4">
                            <div>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attendance %</h5>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-emerald-100 border border-emerald-200 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-emerald-700">{attAbove80.length}</div>
                                        <div className="text-[10px] uppercase text-emerald-600 font-bold">≥ 80%</div>
                                    </div>
                                    <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-blue-700">{attBelow80.length}</div>
                                        <div className="text-[10px] uppercase text-blue-600 font-bold">&lt; 80%</div>
                                    </div>
                                    <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-rose-700">{attBelow50.length}</div>
                                        <div className="text-[10px] uppercase text-rose-600 font-bold">&lt; 50%</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reflections Completed</h5>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-emerald-100 border border-emerald-200 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-emerald-700">{ref100.length}</div>
                                        <div className="text-[10px] uppercase text-emerald-600 font-bold">100%</div>
                                    </div>
                                    <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-blue-700">{ref50plus.length}</div>
                                        <div className="text-[10px] uppercase text-blue-600 font-bold">≥ 50%</div>
                                    </div>
                                    <div className="bg-rose-100 border border-rose-200 rounded-xl p-3 text-center">
                                        <div className="text-lg font-bold text-rose-700">{refBelow50.length}</div>
                                        <div className="text-[10px] uppercase text-rose-600 font-bold">&lt; 50%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Analytics */}
                    <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-slate-500" /> Daily Teacher Tracker</h4>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="px-3 py-1.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none" 
                            />
                        </div>
                        
                        {activeBlocks.length === 0 ? (
                            <div className="h-40 flex items-center justify-center text-center text-sm font-medium text-slate-500 italic border-2 border-dashed border-slate-200 rounded-xl">No active elective blocks running on this date.</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2 font-bold text-emerald-700 text-sm"><CheckSquare className="w-4 h-4"/> Started</div>
                                        <div className="text-2xl font-black text-slate-900 mb-1">{teachersStarted.length}</div>
                                        <div className="text-xs text-slate-500 truncate">{teachersStarted.map(e => e.facultyName).join(', ') || 'None'}</div>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2 font-bold text-rose-600 text-sm"><XSquare className="w-4 h-4"/> Not Started</div>
                                        <div className="text-2xl font-black text-slate-900 mb-1">{teachersNotStarted.length}</div>
                                        <div className="text-xs text-slate-500 truncate">{teachersNotStarted.map(e => e.facultyName).join(', ') || 'None'}</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2 font-bold text-green-700 text-sm"><ShieldCheck className="w-4 h-4"/> Approved All</div>
                                        <div className="text-2xl font-black text-slate-900 mb-1">{teachersApprovedAll.length}</div>
                                        <div className="text-xs text-slate-600 truncate">{teachersApprovedAll.map(e => e.facultyName).join(', ') || 'None'}</div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center gap-1.5 mb-2 font-bold text-amber-700 text-sm"><XCircle className="w-4 h-4"/> Not Completed</div>
                                        <div className="text-2xl font-black text-slate-900 mb-1">{teachersNotCompleted.length}</div>
                                        <div className="text-xs text-slate-600 truncate">{teachersNotCompleted.map(e => e.facultyName).join(', ') || 'None'}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Elective Log Section */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center"><ClipboardList className="w-5 h-5 text-cyan-600" /></div>
                    <div><h3 className="text-xl font-bold text-slate-900">Electives Log</h3><p className="text-sm text-slate-500">View & Approve structured logs for each student including sessions, reflections, and grades.</p></div>
                </div>

                {allotments.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400 font-bold">Allotment not complete yet. Run the Allotment Engine first.</div>
                ) : (
                    <div className="space-y-6">
                        {students.map(student => {
                            const sAllotments = allotments.filter(a => a.studentId === student.id);
                            if (sAllotments.length === 0) return null;
                            
                            const isExpanded = !!expandedBlocks[student.id];
                            const approval = approvals.find(a => a.studentId === student.id);

                            return (
                                <div key={student.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-bold text-slate-900">{student.name}</h4>
                                                {approval && <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200"><CheckCircle2 className="w-3 h-3" /> Approved</span>}
                                            </div>
                                            <p className="text-sm text-slate-500 font-mono">{student.regNo} • {student.email}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {approval ? (
                                                <button onClick={() => store.revokeLogbookApproval(instId, student.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 font-bold rounded-lg text-xs hover:bg-red-50 border border-red-200 transition-colors">
                                                    <XCircle className="w-4 h-4" /> Revoke Approval
                                                </button>
                                            ) : (
                                                <button onClick={() => store.approveLogbook(instId, student.id, 'Institute Admin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 transition-colors shadow-sm focus:ring-2 focus:ring-green-200 outline-none">
                                                    <ShieldCheck className="w-4 h-4" /> Approve Log
                                                </button>
                                            )}
                                            <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />
                                            <button onClick={() => toggleExpand(student.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors">
                                                {isExpanded ? 'Hide Details' : 'Show Details'}
                                            </button>
                                            <button onClick={() => openLogbookWindow(student, false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg text-xs border border-blue-200 hover:bg-blue-100 transition-colors">
                                                <Eye className="w-4 h-4" /> View PDF
                                            </button>
                                            <button onClick={() => openLogbookWindow(student, true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors shadow-sm">
                                                <Download className="w-4 h-4" /> Download PDF
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && sAllotments.map(allot => {
                                        const elective = electives.find(e => e.id === allot.electiveId);
                                        const eSessions = sessions.filter(s => s.electiveId === allot.electiveId);
                                        return (
                                            <div key={allot.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-200">Block {allot.block}</span>
                                                    <span className="font-bold text-slate-800">{elective?.electiveName}</span>
                                                    <span className="text-slate-400 text-sm">by {elective?.facultyName}</span>
                                                </div>

                                                {eSessions.length > 0 ? (
                                                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase"><tr><th className="p-2">Date</th><th className="p-2">Topic</th><th className="p-2">SLOs</th><th className="p-2">Activity</th><th className="p-2 text-center">Attended</th><th className="p-2 text-center">Reflection</th><th className="p-2 text-center">Grade</th></tr></thead>
                                                            <tbody>
                                                                {eSessions.map(session => {
                                                                    const attended = session.attendanceMap[student.id] ?? false;
                                                                    const reflection = reflections.find(r => r.sessionId === session.id && r.studentId === student.id);
                                                                    const grade = grades.find(g => g.sessionId === session.id && g.studentId === student.id);
                                                                    return (
                                                                        <tr key={session.id} className="border-t border-slate-50 hover:bg-slate-50">
                                                                            <td className="p-2 font-medium">{new Date(session.date).toLocaleDateString()}</td>
                                                                            <td className="p-2 font-bold text-slate-700">{session.topic}</td>
                                                                            <td className="p-2 text-slate-500">{session.slos}</td>
                                                                            <td className="p-2"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">{session.activityType}</span></td>
                                                                            <td className="p-2 text-center">{attended ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>}</td>
                                                                            <td className="p-2 text-center">{reflection ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                                                                            <td className="p-2 text-center">{grade ? <span className={`font-bold ${grade.rating === 'E' ? 'text-green-600' : grade.rating === 'M' ? 'text-blue-600' : 'text-amber-600'}`}>{grade.rating === 'E' ? 'Exceeds' : grade.rating === 'M' ? 'Meets' : 'Below'}</span> : <span className="text-slate-300">—</span>}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400 italic">No sessions recorded yet.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
