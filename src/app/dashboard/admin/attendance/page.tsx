"use client";

import { useState, useRef, useEffect } from 'react';
import { Users, Search, Download, CheckSquare, Square, Trash2, ArrowLeft, Settings, Calendar, Clock, BarChart } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useTimetableStore } from '@/store/timetableStore';
import TimePicker12Hour from '@/components/TimePicker12Hour';

export default function AttendanceSystem() {
    const store = useAttendanceStore();
    const { formats, schedules } = useTimetableStore();
    const [selectedFormatId, setSelectedFormatId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'mark' | 'logs' | 'edit_single' | 'reports'>('mark');
    const [activeRecordId, setActiveRecordId] = useState<string>('');

    const activeFormat = formats.find(f => f.id === selectedFormatId);

    // Derived course for the active format allowing us to use old components without setup overhead
    const activeCourse = activeFormat ? {
        id: activeFormat.id,
        courseName: activeFormat.course,
        departmentName: activeFormat.department,
        instituteName: activeFormat.instituteName,
        logoUrl: activeFormat.instituteLogoUrl || '',
        faculty: activeFormat.facultyMembers,
        students: activeFormat.studentsList?.map(s => ({
            id: s.id,
            name: s.name,
            registrationNumber: s.regNo,
            rollNumber: String(s.rn),
            email: s.email,
        })) || []
    } : null;

    const hasStudents = activeCourse?.students && activeCourse.students.length > 0;

    const renderView = () => {
        if (!activeFormat || !activeCourse) return null;
        if (!hasStudents) {
            return (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-6 print:hidden">
                    <p className="text-sm text-amber-700 font-bold flex items-center gap-1 mb-2">
                        ⚠️ No student list found in this Classroom.
                    </p>
                    <p className="text-sm text-amber-600 font-medium">
                        Go to <strong>Classroom Generator</strong> and upload a Student List to mark attendance.
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'mark': return <MarkAttendanceView store={store} course={activeCourse} formatId={activeFormat.id} schedules={schedules} onSave={() => setActiveTab('logs')} />;
            case 'logs': return <EditRecordsList store={store} course={activeCourse} onEdit={(rId: string) => { setActiveRecordId(rId); setActiveTab('edit_single'); }} />;
            case 'edit_single': return <MarkAttendanceView store={store} course={activeCourse} formatId={activeFormat.id} schedules={schedules} editMode={true} recordId={activeRecordId} onBack={() => setActiveTab('logs')} onSave={() => setActiveTab('logs')} />;
            case 'reports': return <ReportsView store={store} course={activeCourse} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 print:block print:max-w-none print:m-0 print:p-0">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl print:hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-rose-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.25),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <CheckSquare className="w-6 h-6 text-amber-200" />
                            </div>
                            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-[0.2em]">Department Admin</p>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">Attendance MS</h2>
                        <p className="text-amber-200/80 mt-1.5 font-medium">Select a classroom, mark attendance for each class, and generate reports.</p>
                    </div>
                </div>
            </div>

            {/* Select Classroom */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 print:hidden">
                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Select Classroom (from Classroom Generator)</label>
                <select 
                    value={selectedFormatId} 
                    onChange={e => {
                        setSelectedFormatId(e.target.value);
                        setActiveTab('mark');
                    }}
                    className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 text-lg"
                >
                    <option value="">-- Select Classroom --</option>
                    {formats.map(f => (
                        <option key={f.id} value={f.id}>{f.instituteName} — {f.course} ({f.department}) [{f.studentsList?.length || 0} students]</option>
                    ))}
                </select>
            </div>

            {/* Navigation Tabs */}
            {activeFormat && hasStudents && (
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit print:hidden">
                    {(['mark', 'logs', 'reports'] as const).map(tabKey => (
                        <button 
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all capitalize ${
                                activeTab === tabKey || (activeTab === 'edit_single' && tabKey === 'logs') 
                                    ? 'bg-white shadow-sm text-indigo-700' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                        >
                            {tabKey === 'mark' ? 'Mark Attendance' : tabKey === 'logs' ? 'Attendance Logs' : 'Reports'}
                        </button>
                    ))}
                </div>
            )}

            {renderView()}

            <style jsx global>{`
                @media print {
                    @page { size: auto; margin: 15mm; }
                    html, body { height: auto !important; overflow: visible !important; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
                }
            `}</style>
        </div>
    );
}

// ----------------------------------------------------------------------
// 3. Mark / Edit Attendance View
// ----------------------------------------------------------------------
function MarkAttendanceView({ store, course, formatId, schedules, editMode = false, recordId, onBack, onSave }: any) {
    // Derived state for the form
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        timeFrom: '09:00',
        timeTo: '10:00',
        topic: '',
        faculty: course?.faculty?.[0] || ''
    });

    // Default all present
    const defaultAttendance = course?.students.reduce((acc: any, s: any) => ({ ...acc, [s.id]: true }), {});
    const [attendance, setAttendance] = useState(defaultAttendance);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (editMode && recordId) {
            const record = store.attendanceRecords.find((r: any) => r.id === recordId);
            if (record) {
                setForm({ date: record.date, timeFrom: record.timeFrom, timeTo: record.timeTo, topic: record.topic, faculty: record.faculty });
                setAttendance(record.studentAttendance);
            }
        }
    }, [editMode, recordId, store.attendanceRecords]);

    if (!course) return null;

    const filteredStudents = course.students.filter((s: any) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(search.toLowerCase())
    );

    const toggleStatus = (id: string) => setAttendance((prev: any) => ({ ...prev, [id]: !prev[id] }));

    const handleSave = () => {
        if (!form.topic) return alert('Topic is required');
        const recordData = {
            id: editMode ? recordId : Date.now().toString(),
            courseId: course.id,
            ...form,
            studentAttendance: attendance
        };
        if (editMode) store.updateAttendanceRecord(recordData);
        else store.addAttendanceRecord(recordData);
        onSave();
    };

    const presentCount = Object.values(attendance).filter(Boolean).length;
    const absentCount = course.students.length - presentCount;

    // Time Table Integration
    const todaysClasses = schedules.filter((s: any) => s.date === form.date && s.formatId === formatId);

    const handleClassSelect = (scheduleId: string) => {
        const sc = todaysClasses.find((s: any) => s.id === scheduleId);
        if (sc) {
            setForm({
                ...form,
                topic: `${sc.topicName} (${sc.activity} - ${sc.batch})`,
                faculty: sc.staffName
            });
        }
    };

    return (
        <div className="space-y-6 print:hidden">
            {editMode && onBack && (
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"><ArrowLeft className="w-4 h-4" /> Back to Logs</button>
            )}

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 text-slate-800">{editMode ? 'Edit Attendance' : 'Start marking Attendance'} - {course.courseName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="lg:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none font-medium" /></div>
                    
                    {/* Time Table Classes Hook */}
                    <div className="lg:col-span-5 flex flex-col justify-end pb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Calendar className="w-3 h-3 text-indigo-500" /> Time Table: Classes Scheduled Today</label>
                        {todaysClasses.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {todaysClasses.map((sc: any) => (
                                    <button 
                                        key={sc.id} 
                                        onClick={() => handleClassSelect(sc.id)}
                                        className="whitespace-nowrap bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition shadow-sm"
                                    >
                                        {sc.activity}: {sc.topicName} (Prof. {sc.staffName})
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-slate-400 italic py-1.5">No classes scheduled in Time Table MS for this date and classroom.</p>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Time</label>
                        <div className="flex gap-2">
                            <TimePicker12Hour value={form.timeFrom} onChange={val => setForm({ ...form, timeFrom: val })} className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 focus-within:border-indigo-500" />
                            <TimePicker12Hour value={form.timeTo} onChange={val => setForm({ ...form, timeTo: val })} className="flex-1 min-w-0 px-3 py-2.5 bg-slate-50 focus-within:border-indigo-500" />
                        </div>
                    </div>
                    <div className="lg:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic Covered *</label><input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Intro to Anatomy" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none font-bold" /></div>
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Teacher</label>
                        <input value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} placeholder="Enter Teacher Name" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none font-medium" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative max-w-sm w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div className="flex items-center gap-4 font-bold text-sm">
                        <span className="text-green-700 bg-green-100 px-4 py-2 rounded-xl border border-green-200 shadow-sm">Present: {presentCount}</span>
                        <span className="text-red-700 bg-red-100 px-4 py-2 rounded-xl border border-red-200 shadow-sm">Absent: {absentCount}</span>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-8 py-2.5 text-base rounded-xl hover:bg-blue-700 transition shadow-md">Save Attendance</button>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10"><tr className="border-b border-slate-200"><th className="p-4 pl-8 w-20">Mark</th><th className="p-4 text-xs font-bold text-slate-500 uppercase">Roll No</th><th className="p-4 text-xs font-bold text-slate-500 uppercase">Student Name</th><th className="p-4 pr-8 text-right text-xs font-bold text-slate-500 uppercase">Status</th></tr></thead>
                        <tbody>
                            {filteredStudents.map((s: any) => {
                                const isPresent = attendance[s.id];
                                return (
                                    <tr key={s.id} onClick={() => toggleStatus(s.id)} className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 select-none ${!isPresent ? 'bg-red-50/40' : ''}`}>
                                        <td className="p-4 pl-8"><div className={`${isPresent ? 'text-green-500' : 'text-slate-300'}`}>{isPresent ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}</div></td>
                                        <td className="p-4 font-mono text-sm text-slate-500">{s.rollNumber}</td>
                                        <td className="p-4 font-bold text-slate-800">{s.name}</td>
                                        <td className="p-4 pr-8 text-right"><span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isPresent ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{isPresent ? 'Present' : 'Absent'}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// 4. Edit Records List View
// ----------------------------------------------------------------------
function EditRecordsList({ store, course, onEdit }: any) {
    const records = store.attendanceRecords.filter((r: any) => r.courseId === course.id).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 print:hidden">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Attendance Logs: {course.courseName}</h2>
            {records.length > 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-xs font-bold text-slate-500 uppercase tracking-wider"><th className="p-4">Date & Time</th><th className="p-4">Topic Covered</th><th className="p-4 text-center">Stats</th><th className="p-4 text-right">Actions</th></tr></thead>
                        <tbody>
                            {records.map((r: any) => {
                                const total = Object.keys(r.studentAttendance).length;
                                const pres = Object.values(r.studentAttendance).filter(Boolean).length;
                                return (
                                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-700"><div className="flex items-center gap-2 font-bold"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(r.date).toLocaleDateString()}</div><div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {r.timeFrom} - {r.timeTo}</div></td>
                                        <td className="p-4 text-slate-600 font-medium">{r.topic}</td>
                                        <td className="p-4 text-center"><span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full border border-green-200">{pres} / {total} Present</span></td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => onEdit(r.id)} className="text-blue-600 font-bold hover:underline text-sm mr-4">Edit/View</button>
                                            <button onClick={() => confirm('Delete this attendance record?') && store.deleteAttendanceRecord(r.id)} className="text-red-500 font-bold hover:bg-red-50 p-1.5 rounded-lg text-sm"><Trash2 className="w-4 h-4 inline" /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-500 font-medium text-lg">
                    No attendance logs found for this classroom yet.
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// 5. Reports View (Daily & Consolidated)
// ----------------------------------------------------------------------
function ReportsView({ store, course }: any) {
    const records = store.attendanceRecords.filter((r: any) => r.courseId === course.id).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const [reportType, setReportType] = useState<'daily' | 'consolidated' | 'bulk_edit'>('daily');
    const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || '');

    // Bulk edit state
    const [bulkStudent, setBulkStudent] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const printRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({ contentRef: printRef, documentTitle: `${course?.courseName} Report` });

    const handleBulkMark = (status: boolean) => {
        if (!bulkStudent || !fromDate || !toDate) {
            return alert("Please select a student and both dates.");
        }

        let updatedCount = 0;
        records.forEach((r: any) => {
            const dStr = r.date.split('T')[0];
            const dObj = new Date(dStr);
            dObj.setHours(0, 0, 0, 0);
            const d = dObj.getTime();

            const startObj = new Date(fromDate);
            startObj.setHours(0, 0, 0, 0);
            const userStart = startObj.getTime();

            const endObj = new Date(toDate);
            endObj.setHours(0, 0, 0, 0);
            const userEnd = endObj.getTime();

            if (d >= userStart && d <= userEnd) {
                // Update record
                const newRecord = { ...r, studentAttendance: { ...r.studentAttendance, [bulkStudent]: status } };
                store.updateAttendanceRecord(newRecord);
                updatedCount++;
            }
        });
        alert(`Successfully updated attendance for ${updatedCount} records.`);
    };

    if (!course) return null;

    const ActiveReport = () => {
        if (reportType === 'daily') {
            const record = records.find((r: any) => r.id === selectedRecordId);
            if (!record) return <div className="p-8 text-center text-slate-500 font-bold text-lg">No records found. Mark attendance first.</div>;

            const present = Object.values(record.studentAttendance).filter(Boolean).length;
            const absent = Object.keys(record.studentAttendance).length - present;

            return (
                <div ref={printRef} className="bg-white p-10 print:p-0 print:border-none rounded-2xl border border-slate-200 shadow-xl print:shadow-none mx-auto max-w-[21cm]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-4 border-slate-800 pb-6 mb-8">
                        {course.logoUrl && <img src={course.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />}
                        <div className="text-right flex-1">
                            <h1 className="text-2xl font-black uppercase text-slate-900">{course.instituteName}</h1>
                            <p className="text-slate-600 font-bold tracking-widest uppercase text-sm">{course.departmentName}</p>
                            <h2 className="text-xl font-bold text-blue-700 mt-2">{course.courseName} - Daily Attendance</h2>
                        </div>
                    </div>
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-4 mb-8 text-sm border p-4 rounded-xl bg-slate-50 print:border-slate-300 print:bg-white">
                        <div><strong className="text-slate-500 uppercase mr-2">Date:</strong> <span className="font-bold whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</span></div>
                        <div><strong className="text-slate-500 uppercase mr-2">Time:</strong> <span className="font-bold whitespace-nowrap">{record.timeFrom} - {record.timeTo}</span></div>
                        <div><strong className="text-slate-500 uppercase mr-2">Topic:</strong> <span className="font-bold text-indigo-700">{record.topic}</span></div>
                        <div><strong className="text-slate-500 uppercase mr-2">Teacher:</strong> <span className="font-bold">{record.faculty || 'Unspecified'}</span></div>
                    </div>
                    {/* Stats */}
                    <div className="flex gap-4 mb-6 font-bold text-sm">
                        <div className="bg-green-50 text-green-700 px-6 py-3 border border-green-200 rounded-xl print:border-slate-300 print:text-black">Present: <span className="text-xl">{present}</span></div>
                        <div className="bg-red-50 text-red-700 px-6 py-3 border border-red-200 rounded-xl print:border-slate-300 print:text-black">Absent: <span className="text-xl">{absent}</span></div>
                    </div>
                    {/* Table */}
                    <table className="w-full text-left text-sm border-collapse border border-slate-300">
                        <thead><tr className="bg-slate-100 print:bg-gray-100"><th className="border border-slate-300 p-3">S.No</th><th className="border border-slate-300 p-3">Roll No</th><th className="border border-slate-300 p-3">Student Name</th><th className="border border-slate-300 p-3 text-center">Status</th></tr></thead>
                        <tbody>
                            {course.students.map((s: any, i: number) => {
                                const isPre = record.studentAttendance[s.id];
                                return (
                                    <tr key={s.id}>
                                        <td className="border border-slate-300 p-3 w-12 text-center text-slate-500 font-mono">{i + 1}</td>
                                        <td className="border border-slate-300 p-3 font-mono">{s.rollNumber}</td>
                                        <td className="border border-slate-300 p-3 font-bold text-slate-800">{s.name}</td>
                                        <td className={`border border-slate-300 p-3 text-center font-bold ${isPre ? 'text-green-600 print:text-black' : 'text-red-600 print:text-gray-500'}`}>{isPre ? 'P' : 'A'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        } else {
            // Consolidated
            if (records.length === 0) return <div className="p-8 text-center text-slate-500 font-bold text-lg">No records found. Mark attendance first.</div>;

            // Calculate totals
            const totalClasses = records.length;
            const stats = course.students.map((s: any) => {
                const attended = records.reduce((acc: number, r: any) => acc + (r.studentAttendance[s.id] ? 1 : 0), 0);
                const perc = totalClasses === 0 ? 0 : Math.round((attended / totalClasses) * 100);
                return { ...s, attended, perc };
            });

            return (
                <div ref={printRef} className="bg-white p-10 print:p-0 print:border-none rounded-2xl border border-slate-200 shadow-xl print:shadow-none mx-auto max-w-[21cm]">
                    <div className="text-center border-b-4 border-slate-800 pb-6 mb-8">
                        <h1 className="text-2xl font-black uppercase text-slate-900">{course.instituteName} - {course.departmentName}</h1>
                        <h2 className="text-xl font-bold text-indigo-700 mt-2">Consolidated Attendance Report</h2>
                        <h3 className="text-lg font-bold text-slate-600 uppercase tracking-widest mt-1">{course.courseName}</h3>
                        <p className="font-bold text-slate-500 mt-2">Total Classes Conducted: {totalClasses}</p>
                    </div>
                    <table className="w-full text-left text-sm border-collapse border border-slate-300">
                        <thead><tr className="bg-slate-100 print:bg-gray-100"><th className="border border-slate-300 p-3">Roll No</th><th className="border border-slate-300 p-3">Student Name</th><th className="border border-slate-300 p-3 text-center">Classes Attended</th><th className="border border-slate-300 p-3 text-center">Percentage</th></tr></thead>
                        <tbody>
                            {stats.map((s: any) => (
                                <tr key={s.id} className={s.perc < 75 ? 'bg-red-50/50 print:bg-transparent' : 'hover:bg-slate-50'}>
                                    <td className="border border-slate-300 p-3 font-mono text-slate-500">{s.rollNumber}</td>
                                    <td className="border border-slate-300 p-3 font-bold text-slate-800">{s.name}</td>
                                    <td className="border border-slate-300 p-3 text-center font-medium">{s.attended} / {totalClasses}</td>
                                    <td className="border border-slate-300 p-3 text-center font-bold">
                                        <span className={s.perc < 75 ? 'text-red-600 print:text-black' : 'text-green-600 print:text-black'}>{s.perc}%</span>
                                        {s.perc < 75 && <span className="print:hidden text-[10px] ml-2 bg-red-100 text-red-800 px-1.5 py-0.5 inline-block rounded uppercase tracking-wider">Warning</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
        }
    };

    return (
        <div className="space-y-6 print:hidden">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-4">
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
                    <button onClick={() => setReportType('daily')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${reportType === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>Daily Sheet</button>
                    <button onClick={() => setReportType('consolidated')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${reportType === 'consolidated' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>Consolidated</button>
                    <button onClick={() => setReportType('bulk_edit')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${reportType === 'bulk_edit' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}>Bulk Adjustment</button>
                </div>
                {reportType !== 'bulk_edit' && <button onClick={() => reactToPrintFn()} className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-md transition-colors"><Download className="w-4 h-4" /> Export PDF</button>}
            </div>

            {reportType === 'daily' && records.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4 max-w-xl mx-auto">
                    <label className="font-bold text-indigo-700 whitespace-nowrap"><Calendar className="w-5 h-5 inline mr-1 -mt-1"/> Select Record:</label>
                    <select value={selectedRecordId} onChange={e => setSelectedRecordId(e.target.value)} className="flex-1 border-2 border-slate-200 font-bold text-slate-700 bg-slate-50 rounded-xl p-2.5 outline-none focus:border-indigo-500">
                        {records.map((r: any) => <option key={r.id} value={r.id}>{new Date(r.date).toLocaleDateString()} - {r.topic}</option>)}
                    </select>
                </div>
            )}

            {reportType === 'bulk_edit' ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-800">Bulk Attendance Adjustment</h3>
                        <p className="text-sm text-slate-500">Mark present or absent for a student over a specific date range.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Student *</label>
                        <select value={bulkStudent} onChange={e => setBulkStudent(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-indigo-500 font-bold text-slate-800">
                            <option value="">Select a student...</option>
                            {course?.students?.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From Date *</label>
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-indigo-500 font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To Date *</label>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-indigo-500 font-medium" />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button onClick={() => handleBulkMark(true)} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"><CheckSquare className="w-5 h-5" /> Mark Present</button>
                        <button onClick={() => handleBulkMark(false)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"><Square className="w-5 h-5" /> Mark Absent</button>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-200/50 p-4 md:p-8 rounded-3xl overflow-auto shadow-inner min-h-[500px]">
                    <ActiveReport />
                </div>
            )}
        </div>
    );
}

