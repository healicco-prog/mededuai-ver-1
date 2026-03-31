"use client";

import React, { useState, useRef } from 'react';
import { 
    CalendarPlus, 
    CalendarDays, 
    Calendar,
    Users, 
    Building2, 
    Upload, 
    Download,
    Pencil,
    Plus, 
    Trash2, 
    Save, 
    Image as ImageIcon,
    Clock,
    FileSpreadsheet,
    CheckCircle2,
    BookOpen,
    X,
    Share2,
    MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import TimePicker12Hour from '@/components/TimePicker12Hour';
import { useTimetableStore, WeeklyClassSlot, TopicCompetency, StudentEntry, TimetableFormat, SavedTimetable } from '@/store/timetableStore';

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


export default function TimetablePage() {
    const [activeTab, setActiveTab] = useState<'schedule' | 'today'>('schedule');

    return (
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 flex flex-col pb-24 lg:pb-0 min-h-screen lg:h-[calc(100vh-8rem)] pt-4 lg:pt-0">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-800 to-sky-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.3),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 pt-10 pb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                    <CalendarDays className="w-6 h-6 text-indigo-200" />
                                </div>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Department Admin</p>
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">Time Table MS</h2>
                            <p className="text-indigo-200/80 mt-1.5 font-medium">Select a classroom, schedule classes, and track daily academic activities.</p>
                        </div>
                    </div>

                    {/* Navigation Tabs inside header */}
                    <div className="flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-sm rounded-2xl w-fit border border-white/10">
                        {[
                            { id: 'schedule', label: 'Schedule Classes', icon: <CalendarPlus className="w-4 h-4" /> },
                            { id: 'today', label: "What's Today", icon: <CalendarDays className="w-4 h-4" /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-white text-indigo-700 shadow-lg' 
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-auto lg:h-0 overflow-visible lg:overflow-y-auto relative min-h-[600px] lg:min-h-0 relative">
                
                {/* 1. SCHEDULE TAB */}
                {activeTab === 'schedule' && <SchedulingTabView />}

                {/* 3. WHAT'S TODAY TAB */}
                {activeTab === 'today' && <TodayTabView />}
            </div>
        </div>
    );
}

// ==========================================
// Formats Tab Component
// ==========================================
function FormatsTabView() {
    const { formats, addFormat, updateFormat, deleteFormat } = useTimetableStore();
    
    // View States: 'list' | 'create' | 'edit'
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
    const [editingFormatId, setEditingFormatId] = useState<string | null>(null);

    // Form State
    const [instituteName, setInstituteName] = useState('');
    const [course, setCourse] = useState('');
    const [department, setDepartment] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    
    const [weeklySlots, setWeeklySlots] = useState<WeeklyClassSlot[]>([]);
    const [newSlot, setNewSlot] = useState({ day: 'Monday', fromTime: '', toTime: '' });

    const [facultyMembers, setFacultyMembers] = useState<string[]>([]);
    const [newFaculty, setNewFaculty] = useState('');

    const [topicsPool, setTopicsPool] = useState<TopicCompetency[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [studentsList, setStudentsList] = useState<StudentEntry[]>([]);
    const studentFileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setInstituteName('');
        setCourse('');
        setDepartment('');
        setLogoUrl(null);
        setWeeklySlots([]);
        setFacultyMembers([]);
        setTopicsPool([]);
        setStudentsList([]);
        setEditingFormatId(null);
    };

    const handleEditFormat = (format: TimetableFormat) => {
        setEditingFormatId(format.id);
        setInstituteName(format.instituteName);
        setCourse(format.course);
        setDepartment(format.department);
        setLogoUrl(format.instituteLogoUrl);
        setWeeklySlots([...format.weeklySlots]);
        setFacultyMembers([...format.facultyMembers]);
        setTopicsPool([...format.topicsPool]);
        setStudentsList([...(format.studentsList || [])]);
        setView('edit');
    };

    const handleUpdateFormat = () => {
        if (!editingFormatId) return;
        if (!instituteName || !course || !department) {
            return alert("Institute, Course, and Department are required!");
        }
        if (topicsPool.length === 0) {
            return alert("Please keep at least some syllabus topics.");
        }

        updateFormat(editingFormatId, {
            instituteName,
            instituteLogoUrl: logoUrl,
            course,
            department,
            weeklySlots,
            facultyMembers,
            topicsPool,
            studentsList
        });

        resetForm();
        setView('list');
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            { 'SN': 1, 'Section': 'General Pharmacology', 'Topics': 'Introduction to Pharmacology', 'Competency No': 'PH1.1' },
            { 'SN': 2, 'Section': 'General Pharmacology', 'Topics': 'Routes of Drug Administration', 'Competency No': 'PH1.2' },
            { 'SN': 3, 'Section': 'Autonomic Nervous System', 'Topics': 'Cholinergic System', 'Competency No': 'PH2.1' },
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // Set column widths for better readability
        ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 45 }, { wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Topics');
        XLSX.writeFile(wb, 'Content_Pool_Template.xlsx');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoUrl(URL.createObjectURL(file));
        }
    };

    const handleAddSlot = () => {
        if (!newSlot.fromTime || !newSlot.toTime) return alert("Please specify class flow times.");
        setWeeklySlots([...weeklySlots, { 
            id: `slot_${Date.now()}`, 
            day: newSlot.day as any, 
            fromTime: newSlot.fromTime, 
            toTime: newSlot.toTime 
        }]);
        setNewSlot({ day: 'Monday', fromTime: '', toTime: '' }); // reset but keep day Monday default
    };

    const handleAddFaculty = () => {
        if (!newFaculty.trim()) return;
        if (facultyMembers.includes(newFaculty.trim())) return alert("Faculty already exists.");
        setFacultyMembers([...facultyMembers, newFaculty.trim()]);
        setNewFaculty('');
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const parsedTopics: TopicCompetency[] = [];
            
            data.forEach((row: any, index: number) => {
                // Look for common variations of headers
                let snVal = row['SN'] || row['sn'] || row['S.N.'] || row['Sl No'] || row['Sr No'] || (index + 1);
                let sectionStr = row['Section'] || row['SECTION'] || row['Subject Section'] || '';
                let topicStr = row['Topics'] || row['Topic'] || row['TOPICS'] || row['TOPIC'] || row['Topic Name'] || '';
                let compStr = row['Competency No'] || row['Competency'] || row['COMPETENCY'] || row['Comp. No.'] || row['COMPETENCY NO'] || '';

                if (topicStr && typeof topicStr === 'string' && topicStr.trim() !== '') {
                    parsedTopics.push({
                        id: `top_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                        sn: typeof snVal === 'number' ? snVal : parseInt(snVal) || (index + 1),
                        section: sectionStr ? String(sectionStr).trim() : 'General',
                        topic: topicStr.trim(),
                        competencyNo: compStr ? String(compStr).trim() : 'N/A',
                        isCompleted: false
                    });
                }
            });

            if (parsedTopics.length > 0) {
                setTopicsPool(parsedTopics);
                alert(`Successfully loaded ${parsedTopics.length} topics from ${new Set(parsedTopics.map(t => t.section)).size} sections!`);
            } else {
                alert("Could not find required column 'Topics' in the Excel sheet. Please format the sheet with columns: SN, Section, Topics, Competency No and try again.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadStudentTemplate = () => {
        const templateData = [
            { 'RN': 1, 'REG. NO': '2024MBBS001', 'NAME': 'Student Name 1', 'Email': 'student1@example.com', 'Mobile No': '9876543210' },
            { 'RN': 2, 'REG. NO': '2024MBBS002', 'NAME': 'Student Name 2', 'Email': 'student2@example.com', 'Mobile No': '9876543211' },
            { 'RN': 3, 'REG. NO': '2024MBBS003', 'NAME': 'Student Name 3', 'Email': 'student3@example.com', 'Mobile No': '9876543212' },
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        ws['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 28 }, { wch: 16 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'Student_List_Template.xlsx');
    };

    const handleStudentExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const parsedStudents: StudentEntry[] = [];

            data.forEach((row: any, index: number) => {
                let rnVal = row['RN'] || row['rn'] || row['Rn'] || row['Roll No'] || (index + 1);
                let regNo = row['REG. NO'] || row['REG NO'] || row['Reg. No'] || row['Reg No'] || row['Registration No'] || '';
                let nameStr = row['NAME'] || row['Name'] || row['name'] || row['Student Name'] || '';
                let email = row['Email'] || row['EMAIL'] || row['email'] || row['E-mail'] || '';
                let mobile = row['Mobile No'] || row['Mobile'] || row['MOBILE NO'] || row['Phone'] || row['Contact'] || '';

                if (nameStr && typeof nameStr === 'string' && nameStr.trim() !== '') {
                    parsedStudents.push({
                        id: `stu_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
                        rn: typeof rnVal === 'number' ? rnVal : parseInt(rnVal) || (index + 1),
                        regNo: regNo ? String(regNo).trim() : '',
                        name: nameStr.trim(),
                        email: email ? String(email).trim() : '',
                        mobileNo: mobile ? String(mobile).trim() : ''
                    });
                }
            });

            if (parsedStudents.length > 0) {
                setStudentsList(parsedStudents);
                alert(`Successfully loaded ${parsedStudents.length} students!`);
            } else {
                alert("Could not find required column 'NAME' in the Excel sheet. Please format the sheet with columns: RN, REG. NO, NAME, Email, Mobile No and try again.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSaveFormat = () => {
        if (!instituteName || !course || !department) {
            return alert("Institute, Course, and Department are required!");
        }
        if (topicsPool.length === 0) {
            return alert("Please upload at least some syllabus topics via Excel first.");
        }

        addFormat({
            instituteName,
            instituteLogoUrl: logoUrl,
            course,
            department,
            weeklySlots,
            facultyMembers,
            topicsPool,
            studentsList
        });

        resetForm();
        setView('list');
    };

    if (view === 'list') {
        return (
            <div className="p-8 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Your Timetable Formats</h3>
                        <p className="text-sm text-slate-500 font-medium">Create and manage department templates.</p>
                    </div>
                    <button 
                        onClick={() => { resetForm(); setView('create'); }}
                        className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-sm hover:bg-indigo-700 flex items-center gap-2 transition"
                    >
                        <Plus className="w-4 h-4" /> Create New Format
                    </button>
                </div>
                
                {formats.length === 0 ? (
                    <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <Building2 className="w-16 h-16 opacity-50 mb-4" />
                        <h4 className="text-xl font-bold text-slate-600 text-center">No Formats Created Yet</h4>
                        <p className="mt-2 text-sm text-center max-w-sm">Set up a timetable parameter format for a department first to start scheduling.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {formats.map(format => (
                            <div key={format.id} className="bg-white border text-slate-800 border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>
                                <div className="flex justify-between items-start">
                                    {format.instituteLogoUrl ? (
                                        <img src={format.instituteLogoUrl} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-100 shadow-sm p-1" />
                                    ) : (
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl p-1 border border-indigo-200">
                                            {format.instituteName.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEditFormat(format)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition" title="Edit Format">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => { if (confirm('Delete this format and all associated schedules?')) deleteFormat(format.id); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition" title="Delete Format">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{format.course}</h4>
                                    <p className="text-sm font-bold text-indigo-600">{format.department}</p>
                                    <p className="text-xs font-medium text-slate-500 mt-1 truncate">{format.instituteName}</p>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-2 items-center text-xs font-bold text-slate-500">
                                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><BookOpen className="w-3 h-3" /> {format.topicsPool.length} Topics</span>
                                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Users className="w-3 h-3" /> {format.facultyMembers.length} Staff</span>
                                    {(format.studentsList?.length || 0) > 0 && (
                                        <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md"><Users className="w-3 h-3" /> {format.studentsList.length} Students</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full flex flex-col space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center pb-6 border-b border-slate-100">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><button onClick={() => { resetForm(); setView('list'); }} className="text-slate-400 hover:text-slate-600 mr-2 text-xl">&larr;</button> {view === 'edit' ? 'Edit Format' : 'Create Format'}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">{view === 'edit' ? 'Modify and update the format parameters.' : 'Define the base parameters for a department timetable.'}</p>
                </div>
                <button 
                    onClick={view === 'edit' ? handleUpdateFormat : handleSaveFormat}
                    className={`w-full md:w-auto font-bold px-8 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition ${view === 'edit' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                    <Save className="w-4 h-4" /> {view === 'edit' ? 'Update Format' : 'Save Format'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Basic Info & Setup */}
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Organization Details</h4>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Institute Name</label>
                                <input value={instituteName} onChange={e => setInstituteName(e.target.value)} type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-medium" placeholder="e.g., Medical College..." />
                            </div>
                            <div className="w-full md:w-32 shrink-0">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Institution Logo</label>
                                <div className="h-[50px] bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
                                    {logoUrl ? (
                                        <img src={logoUrl} className="w-full h-full object-contain p-1" alt="Logo" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition" />
                                    )}
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Target</label>
                                <input value={course} onChange={e => setCourse(e.target.value)} type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-medium" placeholder="e.g., MBBS" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department Phase</label>
                                <input value={department} onChange={e => setDepartment(e.target.value)} type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-medium" placeholder="e.g., Phase 1" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> Weekly Class Days (Optional Default)</h4>
                        <p className="text-xs font-medium text-slate-500">Define the recurring weekly slots for this course. You can always override this later when scheduling specific days.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                            <select value={newSlot.day} onChange={e => setNewSlot({...newSlot, day: e.target.value})} className="w-full sm:flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold text-slate-700 text-sm">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d}>{d}</option>)}
                            </select>
                            <TimePicker12Hour value={newSlot.fromTime} onChange={val => setNewSlot({...newSlot, fromTime: val})} className="w-full sm:w-auto focus-within:ring-indigo-600 focus-within:border-indigo-600 bg-white" title="Start Time" />
                            <span className="text-slate-400 font-bold hidden sm:block">-</span>
                            <div className="flex w-full sm:w-auto gap-2">
                                <TimePicker12Hour value={newSlot.toTime} onChange={val => setNewSlot({...newSlot, toTime: val})} className="flex-1 focus-within:ring-indigo-600 focus-within:border-indigo-600 bg-white" title="End Time" />
                                <button onClick={handleAddSlot} className="bg-indigo-100 text-indigo-700 p-2 rounded-xl hover:bg-indigo-200 font-bold shrink-0"><Plus className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {weeklySlots.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-2">
                                {weeklySlots.map(slot => (
                                    <div key={slot.id} className="bg-white border border-slate-200 font-bold text-xs text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                        <span className="text-indigo-600">{slot.day}:</span> {slot.fromTime} - {slot.toTime}
                                        <button onClick={() => setWeeklySlots(weeklySlots.filter(s => s.id !== slot.id))} className="text-slate-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Content & People */}
                <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Department Faculty</h4>
                        
                        <div className="flex gap-2">
                            <input 
                                value={newFaculty} 
                                onChange={e => setNewFaculty(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleAddFaculty()}
                                type="text" 
                                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-medium text-sm" 
                                placeholder="E.g., Dr. Smith" 
                            />
                            <button onClick={handleAddFaculty} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm">Add</button>
                        </div>

                        {facultyMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {facultyMembers.map(faculty => (
                                    <div key={faculty} className="bg-white border border-slate-200 font-bold text-sm text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                        {faculty}
                                        <button onClick={() => setFacultyMembers(facultyMembers.filter(f => f !== faculty))} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 relative">
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleExcelUpload} 
                            className="hidden" 
                        />
                        <div className="flex flex-col items-center justify-center text-center space-y-3 z-10 relative">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-100">
                                {topicsPool.length > 0 ? <CheckCircle2 className="w-7 h-7 text-green-500" /> : <FileSpreadsheet className="w-7 h-7 text-indigo-500" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg">Upload Content Pool (Excel)</h4>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm mx-auto">Upload an Excel sheet with columns for &quot;SN&quot;, &quot;Section&quot;, &quot;Topics&quot; and &quot;Competency No&quot; to build the syllabus pool.</p>
                            </div>

                            {topicsPool.length > 0 ? (
                                <div className="pt-2">
                                    <div className="bg-white px-4 py-2 rounded-xl text-indigo-700 font-bold text-sm shadow-sm inline-flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> {topicsPool.length} Topics Loaded Successfully!
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-3 underline cursor-pointer hover:text-slate-700" onClick={() => fileInputRef.current?.click()}>Need to re-upload? Click here.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:bg-indigo-700 flex items-center gap-2 transition"
                                    >
                                        <Upload className="w-4 h-4" /> Select Excel File
                                    </button>
                                    <button 
                                        onClick={handleDownloadTemplate}
                                        className="bg-white text-indigo-600 border-2 border-indigo-200 font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-indigo-50 hover:border-indigo-300 flex items-center gap-2 transition"
                                    >
                                        <Download className="w-4 h-4" /> Download Template
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Student List */}
                    <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-6 relative">
                        <input 
                            ref={studentFileInputRef}
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleStudentExcelUpload} 
                            className="hidden" 
                        />
                        <div className="flex flex-col items-center justify-center text-center space-y-3 z-10 relative">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                                {studentsList.length > 0 ? <CheckCircle2 className="w-7 h-7 text-green-500" /> : <Users className="w-7 h-7 text-emerald-500" />}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg">Upload Student List (Excel)</h4>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm mx-auto">Upload an Excel sheet with columns for &quot;RN&quot;, &quot;REG. NO&quot;, &quot;NAME&quot;, &quot;Email&quot; and &quot;Mobile No&quot;.</p>
                            </div>

                            {studentsList.length > 0 ? (
                                <div className="pt-2">
                                    <div className="bg-white px-4 py-2 rounded-xl text-emerald-700 font-bold text-sm shadow-sm inline-flex items-center gap-2">
                                        <Users className="w-4 h-4" /> {studentsList.length} Students Loaded Successfully!
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-3 underline cursor-pointer hover:text-slate-700" onClick={() => studentFileInputRef.current?.click()}>Need to re-upload? Click here.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <button 
                                        onClick={() => studentFileInputRef.current?.click()}
                                        className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:bg-emerald-700 flex items-center gap-2 transition"
                                    >
                                        <Upload className="w-4 h-4" /> Select Excel File
                                    </button>
                                    <button 
                                        onClick={handleDownloadStudentTemplate}
                                        className="bg-white text-emerald-600 border-2 border-emerald-200 font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm hover:bg-emerald-50 hover:border-emerald-300 flex items-center gap-2 transition"
                                    >
                                        <Download className="w-4 h-4" /> Download Template
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Scheduling Tab Component
// ==========================================
function SchedulingTabView() {
    const { formats, scheduleClass, schedules, holidays, addHoliday, removeHoliday, savedTimetables, saveTimetable, deleteSavedTimetable } = useTimetableStore();
    
    // User Selection
    const [selectedFormatId, setSelectedFormatId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    // Per-day draft state — each date key stores its own Topic/Activity/Batch/Staff
    type DayDraft = { topicId: string; activity: string; batch: string; staff: string };
    const DEFAULT_DRAFT: DayDraft = { topicId: '', activity: 'Lecture', batch: 'Full', staff: '' };
    const [dayDrafts, setDayDrafts] = useState<Record<string, DayDraft>>({});

    const getDraft = (dateStr: string): DayDraft => dayDrafts[dateStr] ?? DEFAULT_DRAFT;
    const setDraft = (dateStr: string, patch: Partial<DayDraft>) =>
        setDayDrafts(prev => ({ ...prev, [dateStr]: { ...getDraft(dateStr), ...patch } }));

    // Quick-Add state — independent form to add a class to any chosen date
    const [quickDate, setQuickDate] = useState<string>('');
    const [quickTopic, setQuickTopic] = useState<string>('');
    const [quickActivity, setQuickActivity] = useState<string>('');
    const [quickBatch, setQuickBatch] = useState<string>('');
    const [quickStaff, setQuickStaff] = useState<string>('');

    const handleQuickAdd = () => {
        if (!activeFormat || !quickDate || !quickTopic.trim() || !quickStaff.trim()) {
            return alert('Please fill in Date, Topic, and Staff to add a class.');
        }
        scheduleClass({
            date: quickDate,
            formatId: activeFormat.id,
            topicId: `quick-${Date.now()}`,
            topicName: quickTopic.trim(),
            competencyNo: '',
            activity: quickActivity.trim() || 'Lecture',
            batch: quickBatch.trim() || 'Full',
            staffName: quickStaff.trim(),
        });
        setQuickTopic('');
        setQuickActivity('');
        setQuickBatch('');
        setQuickStaff('');
    };

    const activeFormat = formats.find(f => f.id === selectedFormatId);
    
    // Map JS getDay() index → weekday name (avoids toLocaleDateString + locale issues)
    const WEEKDAY_NAMES: WeeklyClassSlot['day'][] = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];

    // Generate ONLY class-day dates for the selected month.
    // Rule: a date is shown if its weekday matches any slot in the Classroom Generator,
    //       OR if a class has already been manually scheduled on that date.
    const daysInMonth = (): string[] => {
        if (!selectedMonth || !activeFormat) return [];
        const yr = parseInt(selectedMonth.split('-')[0]);
        const mo = parseInt(selectedMonth.split('-')[1]); // 1-based
        const totalDays = new Date(yr, mo, 0).getDate();

        // Unique weekday names from weekly slots (e.g. Set{'Monday','Wednesday','Friday'})
        const slotWeekdays = new Set<WeeklyClassSlot['day']>(
            (activeFormat.weeklySlots || []).map(s => s.day)
        );

        // Dates in this month that already have a scheduled class for this classroom
        const scheduledDates = new Set(
            schedules
                .filter(s => s.formatId === activeFormat.id && s.date.startsWith(selectedMonth))
                .map(s => s.date)
        );

        const days: string[] = [];
        for (let i = 1; i <= totalDays; i++) {
            // Build LOCAL date — avoids any UTC-vs-local timezone offset
            const d = new Date(yr, mo - 1, i);
            const dayName = WEEKDAY_NAMES[d.getDay()]; // purely local, no locale string parsing
            // Safe ISO-format date string: pad manually to avoid toISOString() UTC shift
            const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (slotWeekdays.has(dayName) || scheduledDates.has(dateStr)) {
                days.push(dateStr);
            }
        }
        return days;
    };

    const handleHolidayToggle = (dateStr: string) => {
        const isHoliday = holidays.some(h => h.date === dateStr);
        if (isHoliday) {
            removeHoliday(dateStr);
        } else {
            const reason = prompt("Enter holiday name/details:");
            if (reason) addHoliday(dateStr, reason);
        }
    };

    const handleSaveDaySchedule = (dateStr: string) => {
        const draft = getDraft(dateStr);
        if (!draft.topicId || !draft.staff || !activeFormat) {
            return alert('Please select a Topic and Staff member to schedule a class.');
        }
        const topic = activeFormat.topicsPool.find(t => t.id === draft.topicId);
        if (!topic) return;
        scheduleClass({
            date: dateStr,
            formatId: activeFormat.id,
            topicId: topic.id,
            topicName: topic.topic,
            competencyNo: topic.competencyNo,
            activity: draft.activity,
            batch: draft.batch,
            staffName: draft.staff
        });
        // Clear only this day's draft
        setDayDrafts(prev => { const n = { ...prev }; delete n[dateStr]; return n; });
    };

    // If no formats exist, prompt user
    if (formats.length === 0) {
        return (
             <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl m-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50 min-h-[400px]">
                <CalendarPlus className="w-16 h-16 opacity-50 mb-4" />
                <h4 className="text-xl font-bold text-slate-600 text-center">No Classrooms Found</h4>
                <p className="mt-2 text-sm text-center max-w-sm">You must create at least one Classroom in the Classroom Generator before scheduling classes.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full flex flex-col space-y-8 animate-in fade-in duration-300">
            {/* Top Config */}
            <div className="flex flex-col md:flex-row gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 items-start relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-bl-full -z-10"></div>
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Classroom</label>
                    <select 
                        value={selectedFormatId} 
                        onChange={e => { setSelectedFormatId(e.target.value); setDayDrafts({}); }}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold text-slate-700"
                    >
                        <option value="" disabled>-- Select Classroom --</option>
                        {formats.map(f => (
                            <option key={f.id} value={f.id}>{f.instituteName} — {f.course} ({f.department})</option>
                        ))}
                    </select>
                    {/* Weekly slot summary — shown after a classroom is selected */}
                    {activeFormat && (
                        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                            {(activeFormat.weeklySlots || []).length > 0 ? (
                                <>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Class Days:</span>
                                    {/* Deduplicate by day name */}
                                    {[...new Map((activeFormat.weeklySlots).map(s => [s.day, s])).values()].map(slot => (
                                        <span key={slot.id} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                                            {slot.day.slice(0,3)}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                                    ⚠ No class days set — edit this classroom in Classroom Generator
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex-1 w-full shrink-0">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Schedule Month</label>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none font-bold text-slate-700" 
                    />
                </div>
            </div>

            {/* Daily Calendars View */}
            {activeFormat && selectedMonth && (
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-4 print:hidden">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Daily Schedule Planner</h3>
                            <p className="text-sm text-slate-500 font-medium">Toggle holidays or assign classes for {new Date(selectedMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => {
                                    if (!activeFormat || !selectedMonth) return;
                                    const monthClasses = schedules.filter(s => s.date.startsWith(selectedMonth) && s.formatId === activeFormat.id);
                                    saveTimetable({
                                        formatId: activeFormat.id,
                                        month: selectedMonth,
                                        instituteName: activeFormat.instituteName,
                                        course: activeFormat.course,
                                        department: activeFormat.department,
                                        classCount: monthClasses.length,
                                    });
                                    alert(`Timetable for ${new Date(selectedMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })} saved successfully!`);
                                }} 
                                className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm hover:bg-emerald-700 flex items-center gap-2 transition"
                            >
                                <Save className="w-4 h-4" /> Save Timetable
                            </button>
                            <button 
                                onClick={() => window.print()} 
                                className="bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm hover:bg-indigo-700 flex items-center gap-2 transition"
                            >
                                <Download className="w-4 h-4" /> Export PDF
                            </button>
                            <button 
                                onClick={() => {
                                    const monthLabel = new Date(selectedMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' });
                                    const shareText = `📅 ${activeFormat.instituteName} — ${activeFormat.course} (${activeFormat.department})\nTimetable for ${monthLabel}\nGenerated via MedEduAI`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `Timetable - ${monthLabel}`,
                                            text: shareText,
                                            url: window.location.href
                                        }).catch(() => {});
                                    } else {
                                        navigator.clipboard.writeText(shareText + '\n' + window.location.href);
                                        alert('Timetable link copied to clipboard! You can paste it on any social media platform.');
                                    }
                                }} 
                                className="bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-sm hover:bg-blue-600 flex items-center gap-2 transition"
                            >
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>

                    {/* Print Header (Visible only when printing) */}
                    <div className="hidden print:block mb-8 text-center border-b-2 border-slate-800 pb-4">
                        {activeFormat.instituteLogoUrl ? (
                            <img src={activeFormat.instituteLogoUrl} className="h-16 mx-auto mb-2 object-contain" alt="Logo" />
                        ) : null}
                        <h1 className="text-2xl font-black text-slate-900">{activeFormat.instituteName}</h1>
                        <h2 className="text-lg font-bold text-slate-800 mt-1">{activeFormat.course} - {activeFormat.department}</h2>
                        <h3 className="text-md font-bold text-slate-600 mt-1">Timetable for {new Date(selectedMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h3>
                    </div>

                    {/* ── Quick Add Class Panel ─────────────────────────────────── */}
                    {activeFormat && (
                        <div className="print:hidden bg-gradient-to-br from-indigo-50 to-slate-50 border-2 border-indigo-100 rounded-2xl p-5 mb-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Plus className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Quick Add Class</h4>
                                    <p className="text-xs text-slate-500">Schedule a topic on any date from the classroom</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                                {/* Select Date */}
                                <div className="lg:col-span-2">
                                    <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Select Date</label>
                                    <input
                                        type="date"
                                        value={quickDate}
                                        onChange={e => setQuickDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium text-slate-700"
                                    />
                                </div>
                                {/* Topic */}
                                <div className="lg:col-span-4">
                                    <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Add Topic</label>
                                    <input
                                        type="text"
                                        value={quickTopic}
                                        onChange={e => setQuickTopic(e.target.value)}
                                        placeholder="Type topic name..."
                                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>
                                {/* Activity */}
                                <div className="lg:col-span-2">
                                    <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Add Activity</label>
                                    <input
                                        type="text"
                                        value={quickActivity}
                                        onChange={e => setQuickActivity(e.target.value)}
                                        placeholder="e.g. Lecture"
                                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>
                                {/* Batch */}
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Add Batch</label>
                                    <input
                                        type="text"
                                        value={quickBatch}
                                        onChange={e => setQuickBatch(e.target.value)}
                                        placeholder="e.g. Full"
                                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>
                                {/* Staff */}
                                <div className="lg:col-span-2">
                                    <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Add Staff</label>
                                    <input
                                        type="text"
                                        value={quickStaff}
                                        onChange={e => setQuickStaff(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
                                        placeholder="Staff name..."
                                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                </div>
                                {/* Add Button — own column */}
                                <div className="lg:col-span-1 flex items-end">
                                    <button
                                        onClick={handleQuickAdd}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 text-sm h-[38px]"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 print:space-y-2">
                        {daysInMonth().length === 0 && (
                            <div className="flex flex-col items-center justify-center bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl p-10 text-center gap-3">
                                <CalendarDays className="w-12 h-12 text-amber-400 opacity-70" />
                                <h4 className="text-lg font-bold text-amber-800">No Class Days Configured</h4>
                                <p className="text-sm font-medium text-amber-700 max-w-sm">
                                    This classroom has no <strong>Weekly Class Days</strong> set up yet. Go to
                                    the <strong>Classroom Generator</strong>, edit this classroom, and add the
                                    days & times when classes are held — then they will appear here automatically.
                                </p>
                            </div>
                        )}
                        {daysInMonth().map((dateStr) => {
                            const yr = parseInt(dateStr.split('-')[0]);
                            const mo = parseInt(dateStr.split('-')[1]);
                            const dy = parseInt(dateStr.split('-')[2]);
                            const dateObj = new Date(yr, mo - 1, dy);
                            const dayName = WEEKDAY_NAMES[dateObj.getDay()];
                            const dayNum = dy;
                            const isWeekend = dayName === 'Sunday' || dayName === 'Saturday';
                            const holidayInfo = holidays.find(h => h.date === dateStr);
                            const daySchedules = schedules.filter(s => s.date === dateStr && s.formatId === activeFormat.id);
                            // Class timings for this weekday from the classroom's weekly slots
                            const daySlots = (activeFormat.weeklySlots || []).filter(s => s.day === dayName);
                            const draft = getDraft(dateStr);
                            return (
                                <div key={dateStr} className={`border rounded-2xl overflow-hidden transition-all ${holidayInfo ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
                                    
                                    {/* Date Header Strip */}
                                    <div className={`p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${holidayInfo ? 'bg-amber-100/50' : 'bg-slate-50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-bold ${holidayInfo ? 'bg-amber-100 border-amber-200 text-amber-700' : isWeekend ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-indigo-100 border-indigo-200 text-indigo-700'}`}>
                                                <span className="text-xs uppercase">{dayName.slice(0,3)}</span>
                                                <span className="text-xl leading-none">{dayNum}</span>
                                            </div>
                                            <div>
                                                <h5 className={`font-bold ${holidayInfo ? 'text-amber-800' : 'text-slate-800'}`}>
                                                    {holidayInfo ? `Holiday: ${holidayInfo.details}` : 'Class Day'}
                                                </h5>
                                                <p className="text-xs text-slate-500 font-medium">{dateStr}</p>
                                                {/* Class timings from weekly slots */}
                                                {!holidayInfo && daySlots.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {daySlots.map(sl => (
                                                            <span key={sl.id} className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                🕐 {to12hr(sl.fromTime)} – {to12hr(sl.toTime)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleHolidayToggle(dateStr)}
                                            className={`print:hidden px-4 py-2 text-sm font-bold rounded-xl transition ${holidayInfo ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                        >
                                            {holidayInfo ? 'Remove Holiday' : 'Mark Holiday'}
                                        </button>
                                    </div>

                                    {/* Edit / View Area inside passing days */}
                                    {!holidayInfo && (
                                        <div className="p-4 sm:p-6 bg-white space-y-4 print:p-2 print:space-y-2">
                                            
                                            {/* Existing Scheduled Classes */}
                                            {daySchedules.length > 0 && (
                                                <div className="mb-4 space-y-2">
                                                    {daySchedules.map(sc => (
                                                        <div key={sc.id} className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
                                                            <div className="flex-1">
                                                                <div className="flex gap-2 items-center">
                                                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{sc.activity}</span>
                                                                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{sc.batch} Batch</span>
                                                                </div>
                                                                <p className="font-bold text-slate-900 mt-1">{sc.topicName} <span className="text-xs text-slate-400 font-medium ml-1">({sc.competencyNo})</span></p>
                                                                <p className="text-xs font-bold text-indigo-600 mt-1 flex items-center gap-1"><Users className="w-3 h-3"/> Prof. {sc.staffName}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm("Remove this scheduled class? Topic will be returned to the pool.")) {
                                                                        useTimetableStore.getState().deleteScheduledClass(sc.id);
                                                                    }
                                                                }} 
                                                                className="print:hidden text-red-400 hover:bg-red-50 p-2 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add New Entry Form — per day */}
                                            <div className="print:hidden space-y-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">📌 Add Class Entry for {dateStr}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                                    <div className="col-span-12 md:col-span-4">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Topic</label>
                                                        <select
                                                            value={draft.topicId}
                                                            onChange={e => setDraft(dateStr, { topicId: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-sm font-medium text-slate-700"
                                                        >
                                                            <option value="" disabled>-- Select Topic --</option>
                                                            {activeFormat.topicsPool.map(t => (
                                                                <option key={t.id} value={t.id}>
                                                                    {t.isCompleted ? '✓ ' : ''}{t.topic} ({t.competencyNo})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Activity</label>
                                                        <select value={draft.activity} onChange={e => setDraft(dateStr, { activity: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 text-sm font-medium text-slate-700 focus:outline-none">
                                                            <option>Lecture</option>
                                                            <option>Tutorial</option>
                                                            <option>Practical</option>
                                                            <option>SDL</option>
                                                            <option>ECE</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-6 md:col-span-2">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Batch</label>
                                                        <select value={draft.batch} onChange={e => setDraft(dateStr, { batch: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 text-sm font-medium text-slate-700 focus:outline-none">
                                                            <option>Full</option>
                                                            <option>Batch A</option>
                                                            <option>Batch B</option>
                                                            <option>Batch C</option>
                                                            <option>Batch D</option>
                                                            <option>Batch E</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-12 md:col-span-3">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Staff / Faculty</label>
                                                        <select
                                                            value={draft.staff}
                                                            onChange={e => setDraft(dateStr, { staff: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none text-sm font-medium text-slate-700"
                                                        >
                                                            <option value="" disabled>-- Select --</option>
                                                            {activeFormat.facultyMembers.map(fm => (
                                                                <option key={fm} value={fm}>{fm}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-12 md:col-span-1 border-t pt-3 md:border-none md:pt-0 pb-0.5 flex justify-end shrink-0">
                                                        <button onClick={() => handleSaveDaySchedule(dateStr)} className="bg-slate-900 text-white p-2 w-full md:w-auto rounded-lg shadow-sm hover:bg-slate-800 transition flex justify-center items-center gap-2">
                                                            <Save className="w-4 h-4 hidden md:block" /> <span className="md:hidden font-bold text-sm">Save Entry</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Saved Timetables Section */}
            {savedTimetables.length > 0 && (
                <div className="space-y-4 print:hidden">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Saved Timetables
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">Month-wise saved timetables across all classrooms.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...savedTimetables]
                            .sort((a, b) => b.month.localeCompare(a.month))
                            .map((st) => {
                                const monthLabel = new Date(st.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' });
                                return (
                                    <div key={st.id} className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all group relative">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                                <CalendarDays className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this saved timetable?')) {
                                                        deleteSavedTimetable(st.id);
                                                    }
                                                }}
                                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-lg leading-tight">{monthLabel}</h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">{st.instituteName}</p>
                                        <p className="text-xs text-slate-400 font-medium">{st.course} &middot; {st.department}</p>
                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="text-xs font-bold text-indigo-600">{st.classCount} classes</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedFormatId(st.formatId);
                                                    setSelectedMonth(st.month);
                                                    setDayDrafts({});
                                                }}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition"
                                            >
                                                View &rarr;
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-300 font-medium mt-2">Saved {new Date(st.savedAt).toLocaleDateString()}</p>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// What's Today Tab Component
// ==========================================
function TodayTabView() {
    const { formats, schedules, holidays } = useTimetableStore();
    
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

    // Get today's classes from all formats
    const todaysClasses = schedules.filter(s => s.date === selectedDate);
    const holidayInfo = holidays.find(h => h.date === selectedDate);
    const dateObj = new Date(selectedDate);
    const dayName = dateObj.toLocaleDateString('default', { weekday: 'long' });

    return (
        <div className="p-4 md:p-8 h-full flex flex-col space-y-6 lg:space-y-8 animate-in fade-in duration-300">
            {/* Header / Date Picker */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl p-6 lg:p-10 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="z-10">
                    <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-1 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Daily Academic Summary</h3>
                    <h2 className="text-3xl lg:text-4xl font-black mb-2">{dayName}, {dateObj.toLocaleDateString('default', { month: 'long', day: 'numeric' })}</h2>
                    <p className="text-indigo-100 font-medium max-w-md">Snapshot of all lectures, practicals, and activities scheduled across the institution.</p>
                </div>
                <div className="z-10 shrink-0 w-full md:w-auto">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full md:w-auto px-6 py-4 bg-white/20 border-2 border-white/30 rounded-2xl focus:ring-4 focus:ring-white/20 focus:outline-none font-bold text-white text-lg backdrop-blur-sm [&::-webkit-calendar-picker-indicator]:invert"
                    />
                </div>
            </div>

            {holidayInfo && (
                <div className="bg-amber-100 border-2 border-amber-200 rounded-3xl p-8 text-center text-amber-800 flex flex-col items-center justify-center min-h-[300px]">
                    <Building2 className="w-16 h-16 mb-4 opacity-50" />
                    <h3 className="text-2xl font-black mb-2">Institutional Holiday</h3>
                    <p className="font-bold text-amber-700 max-w-sm">No regular academic classes are scheduled today due to {holidayInfo.details}.</p>
                </div>
            )}

            {!holidayInfo && formats.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl m-8 flex flex-col items-center justify-center text-slate-400 bg-slate-50 min-h-[300px]">
                    <Building2 className="w-16 h-16 opacity-50 mb-4" />
                    <h4 className="text-xl font-bold text-slate-600 text-center">System Initializing</h4>
                    <p className="mt-2 text-sm text-center max-w-sm">Please create department formats and schedule classes to view the daily summary.</p>
                </div>
            )}

            {!holidayInfo && formats.length > 0 && todaysClasses.length === 0 && (
                 <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 min-h-[300px]">
                    <Clock className="w-16 h-16 opacity-50 mb-4" />
                    <h4 className="text-xl font-bold text-slate-600 text-center">No Classes Scheduled</h4>
                    <p className="mt-2 text-sm text-center max-w-sm">There are no academic activities scheduled for this date across the institution.</p>
                </div>
            )}

            {!holidayInfo && todaysClasses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    
                    {/* Class List */}
                    <div className="col-span-1 lg:col-span-8 space-y-4">
                        <div className="flex justify-between items-end border-b-2 border-slate-900 pb-3 mb-6">
                            <h3 className="text-xl font-black text-slate-900">Today's Roster ({todaysClasses.length})</h3>
                        </div>

                        {todaysClasses.map(sc => {
                            const format = formats.find(f => f.id === sc.formatId);
                            if (!format) return null;

                            return (
                                <div key={sc.id} className="bg-white border text-slate-800 border-slate-200 shadow-sm rounded-2xl p-5 md:p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 md:items-center">
                                    {/* Left Accent indicator */}
                                    <div className="absolute top-0 left-0 bottom-0 w-2 bg-indigo-500"></div>

                                    {/* Department Info */}
                                    <div className="flex items-center gap-4 md:w-1/3 shrink-0">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 p-2 shrink-0">
                                            {format.instituteLogoUrl ? <img src={format.instituteLogoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="w-6 h-6 text-indigo-400" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{format.course}</p>
                                            <h4 className="font-bold text-slate-900 leading-tight">{format.department}</h4>
                                        </div>
                                    </div>

                                    {/* Topic Details */}
                                    <div className="flex-1 border-l-2 md:border-slate-100 pl-0 md:pl-6 pt-4 md:pt-0 border-t-2 md:border-t-0 border-slate-100 border-dashed">
                                        <div className="flex flex-wrap gap-2 items-center mb-3">
                                            <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">{sc.activity}</span>
                                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">{sc.batch} Batch</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight pr-4">{sc.topicName} <span className="text-xs text-slate-400 font-medium ml-1">({sc.competencyNo})</span></h3>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center"><Users className="w-3 h-3 text-slate-500"/></div>
                                            <p className="text-sm font-bold text-slate-600">Prof. {sc.staffName}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Stats sidebar */}
                    <div className="col-span-1 lg:col-span-4 space-y-4 sticky top-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-500" /> Today's Snapshot</h3>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="text-sm font-bold text-slate-500">Total Classes</div>
                                    <div className="text-2xl font-black text-indigo-600">{todaysClasses.length}</div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="text-sm font-bold text-slate-500">Active Departments</div>
                                    <div className="text-2xl font-black text-indigo-600">{new Set(todaysClasses.map(c => c.formatId)).size}</div>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="text-sm font-bold text-slate-500">Faculty Deployed</div>
                                    <div className="text-2xl font-black text-indigo-600">{new Set(todaysClasses.map(c => c.staffName)).size}</div>
                                </div>
                            </div>
                            
                            <div className="mt-8">
                                <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-md hover:bg-slate-800 transition flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" /> Share Summary Record
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
