"use client";

import React, { useState, useRef } from 'react';
import { Plus, Upload, Trash2, ChevronLeft, Save, FileSpreadsheet, Image as ImageIcon, Users, BookOpen, Clock, Building, UserCircle, GraduationCap, X, Download, Pencil, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import TimePicker12Hour from '@/components/TimePicker12Hour';
import { useTimetableStore, TimetableFormat, WeeklyClassSlot, TopicCompetency, StudentEntry } from '@/store/timetableStore';

/** Convert stored 24-hr "HH:MM" → display "H:MM AM/PM" */
function to12hr(time: string): string {
    if (!time) return '';
    const [hhStr, mmStr] = time.split(':');
    let h = parseInt(hhStr, 10);
    const m = mmStr || '00';
    if (isNaN(h)) return time;
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${m} ${period}`;
}

// ─── Local form types (mirrors TimetableFormat fields used by this UI) ────────
interface ClassSlot {
    id: string;
    day: WeeklyClassSlot['day'];
    fromTime: string;
    toTime: string;
}

interface Topic {
    id: string;
    topic: string;
    competency: string;
}

interface Student {
    id: string;
    rollNo: string;
    regNo: string;
    name: string;
    email: string;
    mobileNo: string;
}

interface FormData {
    name: string;       // → TimetableFormat.instituteName  (classroom display name)
    course: string;     // → TimetableFormat.course
    year: string;       // → TimetableFormat.department     (reused for year/phase)
    department: string; // → displayed in card; stored in course label
    faculty: string[];  // → TimetableFormat.facultyMembers
    classDays: ClassSlot[];       // → TimetableFormat.weeklySlots
    topics: Topic[];              // → TimetableFormat.topicsPool
    students: Student[];          // → TimetableFormat.studentsList
}

const WEEK_DAYS: WeeklyClassSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Convert store TimetableFormat → local FormData
function formatToForm(f: TimetableFormat): FormData {
    return {
        name: f.instituteName,
        course: f.course,
        year: f.department,
        department: f.department,
        faculty: f.facultyMembers,
        classDays: f.weeklySlots.map(s => ({ id: s.id, day: s.day, fromTime: s.fromTime, toTime: s.toTime })),
        topics: f.topicsPool.map(t => ({ id: t.id, topic: t.topic, competency: t.competencyNo })),
        students: (f.studentsList || []).map(s => ({ id: s.id, rollNo: String(s.rn), regNo: s.regNo, name: s.name, email: s.email, mobileNo: s.mobileNo })),
    };
}

// Convert local FormData → store format fields (partial for add/update)
function formToFormatData(fd: FormData) {
    return {
        instituteName: fd.name,
        course: fd.course,
        department: fd.year || fd.department,
        instituteLogoUrl: null as string | null,
        facultyMembers: fd.faculty,
        weeklySlots: fd.classDays.map(s => ({
            id: s.id,
            day: s.day,
            fromTime: s.fromTime,
            toTime: s.toTime,
        })),
        topicsPool: fd.topics.map((t, idx) => ({
            id: t.id,
            sn: idx + 1,
            section: 'General',
            topic: t.topic,
            competencyNo: t.competency || 'N/A',
            isCompleted: false,
        })),
        studentsList: fd.students.map((s, idx) => ({
            id: s.id,
            rn: parseInt(s.rollNo) || idx + 1,
            regNo: s.regNo,
            name: s.name,
            email: s.email,
            mobileNo: s.mobileNo,
        })),
    };
}

export default function ClassroomManagerClient() {
    // ── Store ──────────────────────────────────────────────────────────────────
    const { formats, addFormat, updateFormat, deleteFormat } = useTimetableStore();

    // ── UI State ───────────────────────────────────────────────────────────────
    const [newSlot, setNewSlot] = useState<{ day: WeeklyClassSlot['day']; fromTime: string; toTime: string }>({ day: 'Monday', fromTime: '', toTime: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

    const emptyForm = (): FormData => ({
        name: '', course: '', year: '', department: '',
        faculty: [], classDays: [], topics: [], students: [],
    });

    const [formData, setFormData] = useState<FormData>(emptyForm());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const studentFileRef = useRef<HTMLInputElement>(null);

    // ── CRUD handlers ──────────────────────────────────────────────────────────
    const handleCreateNew = () => {
        setFormData(emptyForm());
        setEditingFormatId(null);
        setIsCreating(true);
    };

    const handleEdit = (format: TimetableFormat) => {
        setFormData(formatToForm(format));
        setEditingFormatId(format.id);
        setIsCreating(true);
    };

    const handleDelete = (formatId: string) => {
        if (confirm('Delete this classroom and all associated schedules?')) {
            deleteFormat(formatId);
        }
    };

    const handleSave = () => {
        if (!formData.name || !formData.course) {
            alert('Classroom Name and Course are required.');
            return;
        }
        const data = formToFormatData(formData);
        if (editingFormatId) {
            updateFormat(editingFormatId, data);
        } else {
            addFormat(data);
        }
        setIsCreating(false);
        setEditingFormatId(null);
    };

    // ── Slot helpers ───────────────────────────────────────────────────────────
    const handleAddSlot = () => {
        if (!newSlot.fromTime || !newSlot.toTime) return alert('Please specify both start and end times.');
        const slot: ClassSlot = { id: `slot_${Date.now()}`, day: newSlot.day, fromTime: newSlot.fromTime, toTime: newSlot.toTime };
        setFormData(prev => ({ ...prev, classDays: [...prev.classDays, slot] }));
        setNewSlot(prev => ({ ...prev, fromTime: '', toTime: '' }));
    };

    const handleRemoveSlot = (slotId: string) =>
        setFormData(prev => ({ ...prev, classDays: prev.classDays.filter(s => s.id !== slotId) }));

    // ── Topic helpers ──────────────────────────────────────────────────────────
    const addEmptyTopicRow = () =>
        setFormData(prev => ({ ...prev, topics: [...prev.topics, { id: `t_${Date.now()}`, topic: '', competency: '' }] }));

    const updateTopic = (id: string, field: 'topic' | 'competency', value: string) =>
        setFormData(prev => ({ ...prev, topics: prev.topics.map(t => t.id === id ? { ...t, [field]: value } : t) }));

    const removeTopicRow = (id: string) =>
        setFormData(prev => ({ ...prev, topics: prev.topics.filter(t => t.id !== id) }));

    const handleUploadTopics = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target?.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
            const parsed: Topic[] = jsonData.map(row => ({
                id: `t_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                topic: String(row['Topic'] || row['topic'] || row['TOPIC'] || row['B'] || ''),
                competency: String(row['Competency No'] || row['Competency'] || row['COMPETENCY NO'] || row['C'] || ''),
            })).filter(t => t.topic.trim() !== '');
            setFormData(prev => ({ ...prev, topics: [...prev.topics, ...parsed] }));
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // ── Student helpers ────────────────────────────────────────────────────────
    const addEmptyStudentRow = () =>
        setFormData(prev => ({ ...prev, students: [...prev.students, { id: `s_${Date.now()}`, rollNo: '', regNo: '', name: '', email: '', mobileNo: '' }] }));

    const updateStudent = (id: string, field: keyof Student, value: string) =>
        setFormData(prev => ({ ...prev, students: prev.students.map(s => s.id === id ? { ...s, [field]: value } : s) }));

    const removeStudentRow = (id: string) =>
        setFormData(prev => ({ ...prev, students: prev.students.filter(s => s.id !== id) }));

    const handleUploadStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target?.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
            const parsed: Student[] = jsonData.map((row, idx) => ({
                id: `s_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                rollNo: String(row['RN'] || row['rn'] || idx + 1),
                regNo: String(row['REG. NO'] || row['Reg. No'] || row['REG NO'] || ''),
                name: String(row['NAME'] || row['Name'] || ''),
                email: String(row['Email'] || row['email'] || ''),
                mobileNo: String(row['Mobile No'] || row['Mobile'] || row['Phone'] || ''),
            })).filter(s => s.name.trim() !== '');
            setFormData(prev => ({ ...prev, students: [...prev.students, ...parsed] }));
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // ── Download templates ─────────────────────────────────────────────────────
    const handleDownloadTopicsTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { 'SN': 1, 'Topic': 'Introduction to Pharmacology', 'Competency No': 'PH1.1' },
            { 'SN': 2, 'Topic': 'Routes of Drug Administration', 'Competency No': 'PH1.2' },
        ]);
        ws['!cols'] = [{ wch: 6 }, { wch: 45 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Topics');
        XLSX.writeFile(wb, 'Topics_Template.xlsx');
    };

    const handleDownloadStudentsTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { 'RN': 1, 'REG. NO': 'REG2026001', 'NAME': 'John Doe', 'Email': 'john@example.com', 'Mobile No': '9876543210' },
            { 'RN': 2, 'REG. NO': 'REG2026002', 'NAME': 'Jane Smith', 'Email': 'jane@example.com', 'Mobile No': '9876543211' },
        ]);
        ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 16 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'Students_Template.xlsx');
    };

    // ── LIST VIEW ──────────────────────────────────────────────────────────────
    if (!isCreating) {
        return (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Classroom Generator</h2>
                        <p className="text-sm text-slate-500">Create and manage your institutional classrooms.</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Create New Classroom
                    </button>
                </div>

                {formats.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No Classrooms Found</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Start creating classrooms to enroll students and track curriculum progression efficiently.
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="bg-purple-50 text-purple-600 font-bold px-6 py-3 rounded-xl hover:bg-purple-100 transition-colors inline-block"
                        >
                            Build Your First Classroom
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formats.map((fmt) => (
                            <div key={fmt.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(fmt)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                        title="Edit Classroom"
                                    >
                                        <Clock className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(fmt.id)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                        title="Delete Classroom"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                                        <GraduationCap className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{fmt.instituteName}</h3>
                                        <p className="text-xs font-semibold text-slate-500">{fmt.course} • {fmt.department}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Building className="w-4 h-4 text-emerald-500" />
                                        <span>{fmt.department || 'No Dept Specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <UserCircle className="w-4 h-4 text-blue-500" />
                                        <span>{fmt.facultyMembers.length > 0 ? fmt.facultyMembers.join(', ') : 'No Faculty Assigned'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Users className="w-4 h-4 text-purple-500" />
                                        <span>{(fmt.studentsList || []).length} Enrolled Students</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <BookOpen className="w-4 h-4 text-amber-500" />
                                        <span>{fmt.topicsPool.length} Configured Topics</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {fmt.weeklySlots.length === 0 && <span className="text-xs text-slate-400 italic">No class days</span>}
                                    {fmt.weeklySlots.map(slot => (
                                        <span key={slot.id} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-500">
                                            {slot.day.substring(0, 3)} {to12hr(slot.fromTime)}–{to12hr(slot.toTime)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── FORM VIEW ──────────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setIsCreating(false); setEditingFormatId(null); }}
                        className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {editingFormatId ? 'Edit Classroom' : 'Create New Classroom'}
                        </h2>
                        <p className="text-sm text-slate-500">Provide details for the curriculum environment.</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <Save className="w-5 h-5" />
                    {editingFormatId ? 'Save Changes' : 'Create Classroom'}
                </button>
            </div>

            <div className="p-6 md:p-8 space-y-12 max-w-5xl mx-auto">

                {/* General Information */}
                <section>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                        <GraduationCap className="text-purple-600 w-5 h-5" />
                        <h3 className="text-lg font-bold text-slate-800">General Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Classroom / Institute Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                    placeholder="e.g. Anatomy Batch A"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
                                    <input
                                        type="text"
                                        value={formData.course}
                                        onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                        placeholder="e.g. Human Anatomy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Year / Phase</label>
                                    <input
                                        type="text"
                                        value={formData.year}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                        placeholder="e.g. MBBS 1st Year"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                    placeholder="e.g. Anatomy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Faculty</label>
                                <div className="space-y-2">
                                    {(formData.faculty || []).map((f, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={f}
                                                onChange={(e) => {
                                                    const newF = [...formData.faculty];
                                                    newF[i] = e.target.value;
                                                    setFormData(prev => ({ ...prev, faculty: newF }));
                                                }}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                                placeholder="Assigned Faculty"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newF = [...formData.faculty];
                                                    newF.splice(i, 1);
                                                    setFormData(prev => ({ ...prev, faculty: newF }));
                                                }}
                                                className="px-3 bg-slate-100 text-red-500 rounded-xl hover:bg-slate-200 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, faculty: [...prev.faculty, ''] }))}
                                        className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:text-purple-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Faculty
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Weekly Class Days */}
                <section>
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                        <Clock className="text-amber-500 w-5 h-5" />
                        <h3 className="text-lg font-bold text-slate-800">Weekly Class Days</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Define the recurring weekly slots for this course. You can always override this later when scheduling specific days.</p>

                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <select
                            value={newSlot.day}
                            onChange={e => setNewSlot(prev => ({ ...prev, day: e.target.value as WeeklyClassSlot['day'] }))}
                            className="w-full sm:flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none font-bold text-slate-700 text-sm"
                        >
                            {WEEK_DAYS.map(d => <option key={d}>{d}</option>)}
                        </select>
                        <TimePicker12Hour
                            value={newSlot.fromTime}
                            onChange={val => setNewSlot(prev => ({ ...prev, fromTime: val }))}
                            className="w-full sm:w-auto focus-within:ring-purple-500/20 focus-within:border-purple-500"
                            title="Start Time"
                        />
                        <span className="text-slate-400 font-bold hidden sm:block">–</span>
                        <div className="flex w-full sm:w-auto gap-2">
                            <TimePicker12Hour
                                value={newSlot.toTime}
                                onChange={val => setNewSlot(prev => ({ ...prev, toTime: val }))}
                                className="flex-1 focus-within:ring-purple-500/20 focus-within:border-purple-500"
                                title="End Time"
                            />
                            <button
                                onClick={handleAddSlot}
                                className="bg-purple-100 text-purple-700 p-2.5 rounded-xl hover:bg-purple-200 font-bold shrink-0 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {formData.classDays.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4">
                            {formData.classDays.map(slot => (
                                <div key={slot.id} className="bg-white border border-slate-200 font-bold text-xs text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                    <span className="text-purple-600">{slot.day}:</span> {to12hr(slot.fromTime)} – {to12hr(slot.toTime)}
                                    <button onClick={() => handleRemoveSlot(slot.id)} className="text-slate-400 hover:text-red-500 ml-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Curriculum Topics */}
                <section>
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="text-emerald-500 w-5 h-5" />
                            <h3 className="text-lg font-bold text-slate-800">Curriculum Topics</h3>
                        </div>
                        <div className="flex gap-3">
                            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleUploadTopics} />
                            <button onClick={handleDownloadTopicsTemplate} className="flex items-center gap-2 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors">
                                <Download className="w-4 h-4" /> Download Template
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                <FileSpreadsheet className="w-4 h-4" /> Upload Excel
                            </button>
                            <button onClick={addEmptyTopicRow} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 hover:bg-slate-200 transition-colors">
                                <Plus className="w-4 h-4" /> Add Row
                            </button>
                        </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left bg-white text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                <tr>
                                    <th className="p-3 w-16 text-center">No.</th>
                                    <th className="p-3">Topic Title</th>
                                    <th className="p-3 w-48">Competency Number</th>
                                    <th className="p-3 w-28 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.topics.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">No curriculum topics added. Upload an Excel list or add rows manually.</td></tr>
                                ) : formData.topics.map((t, index) => (
                                    <tr key={t.id} className="border-b border-slate-100 last:border-none group">
                                        <td className="p-3 text-center text-slate-400 font-medium">{index + 1}</td>
                                        <td className="p-3">
                                            <input type="text" value={t.topic} onChange={(e) => updateTopic(t.id, 'topic', e.target.value)}
                                                className={`w-full outline-none font-medium placeholder-slate-300 ${editingTopicId === t.id ? 'bg-amber-50 border border-amber-200 rounded px-2 py-1' : 'bg-transparent'}`}
                                                placeholder="Enter Topic Title..." readOnly={editingTopicId !== t.id} />
                                        </td>
                                        <td className="p-3">
                                            <input type="text" value={t.competency} onChange={(e) => updateTopic(t.id, 'competency', e.target.value)}
                                                className={`w-full outline-none font-medium text-xs text-slate-600 ${editingTopicId === t.id ? 'bg-amber-50 border border-amber-200 rounded px-2 py-1' : 'bg-slate-50 border border-slate-200 rounded px-2 py-1'}`}
                                                placeholder="e.g. AN1.1" readOnly={editingTopicId !== t.id} />
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {editingTopicId === t.id ? (
                                                    <button onClick={() => setEditingTopicId(null)} className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded" title="Done"><Check className="w-4 h-4" /></button>
                                                ) : (
                                                    <button onClick={() => setEditingTopicId(t.id)} className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                                                )}
                                                <button onClick={() => removeTopicRow(t.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Enrolled Students */}
                <section>
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <Users className="text-blue-500 w-5 h-5" />
                            <h3 className="text-lg font-bold text-slate-800">Enrolled Students</h3>
                        </div>
                        <div className="flex gap-3">
                            <input type="file" ref={studentFileRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleUploadStudents} />
                            <button onClick={handleDownloadStudentsTemplate} className="flex items-center gap-2 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors">
                                <Download className="w-4 h-4" /> Download Template
                            </button>
                            <button onClick={() => studentFileRef.current?.click()} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-200 hover:bg-blue-100 transition-colors">
                                <FileSpreadsheet className="w-4 h-4" /> Upload Excel List
                            </button>
                            <button onClick={addEmptyStudentRow} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200 hover:bg-slate-200 transition-colors">
                                <Plus className="w-4 h-4" /> Add Row
                            </button>
                        </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left bg-white text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                <tr>
                                    <th className="p-3 w-16 text-center">RN</th>
                                    <th className="p-3 w-36">REG. NO</th>
                                    <th className="p-3">NAME</th>
                                    <th className="p-3 w-56">Email</th>
                                    <th className="p-3 w-36">Mobile No</th>
                                    <th className="p-3 w-28 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.students.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">No students added yet. You can upload an excel file containing standard rows.</td></tr>
                                ) : formData.students.map((s, index) => (
                                    <tr key={s.id} className="border-b border-slate-100 last:border-none group">
                                        <td className="p-3 text-center text-slate-400 font-medium">{index + 1}</td>
                                        <td className="p-3">
                                            <input type="text" value={s.regNo} onChange={(e) => updateStudent(s.id, 'regNo', e.target.value)}
                                                className={`w-full outline-none font-medium text-slate-600 ${editingStudentId === s.id ? 'bg-amber-50 border border-amber-200 rounded px-2 py-1' : 'bg-transparent'}`}
                                                placeholder="REG2026001" readOnly={editingStudentId !== s.id} />
                                        </td>
                                        <td className="p-3">
                                            <input type="text" value={s.name} onChange={(e) => updateStudent(s.id, 'name', e.target.value)}
                                                className={`w-full outline-none font-medium text-slate-800 ${editingStudentId === s.id ? 'bg-amber-50 border border-amber-200 rounded px-2 py-1' : 'bg-transparent'}`}
                                                placeholder="Full Name" readOnly={editingStudentId !== s.id} />
                                        </td>
                                        <td className="p-3">
                                            <input type="email" value={s.email} onChange={(e) => updateStudent(s.id, 'email', e.target.value)}
                                                className={`w-full outline-none font-medium text-slate-600 ${editingStudentId === s.id ? 'bg-amber-50 border border-amber-200 rounded px-2 py-1' : 'bg-transparent'}`}
                                                placeholder="email@example.com" readOnly={editingStudentId !== s.id} />
                                        </td>
                                        <td className="p-3">
                                            <input type="tel" value={s.mobileNo} onChange={(e) => updateStudent(s.id, 'mobileNo', e.target.value)}
                                                className={`w-full outline-none font-medium text-slate-600 ${editingStudentId === s.id ? 'bg-amber-50 border border-amber-200 rounded px-2 py-1' : 'bg-transparent'}`}
                                                placeholder="9876543210" readOnly={editingStudentId !== s.id} />
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {editingStudentId === s.id ? (
                                                    <button onClick={() => setEditingStudentId(null)} className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded" title="Done"><Check className="w-4 h-4" /></button>
                                                ) : (
                                                    <button onClick={() => setEditingStudentId(s.id)} className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>
                                                )}
                                                <button onClick={() => removeStudentRow(s.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Bottom CTA */}
                <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                    <button
                        onClick={() => { setIsCreating(false); setEditingFormatId(null); }}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm text-lg"
                    >
                        <Save className="w-5 h-5" />
                        {editingFormatId ? 'Save Changes' : 'Generate Classroom'}
                    </button>
                </div>
            </div>
        </div>
    );
}
