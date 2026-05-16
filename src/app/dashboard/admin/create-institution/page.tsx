"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Building2, UploadCloud, BookOpen, KeyRound, Plus, Download, Trash2, Edit3, CheckCircle2,
    Save, FileUp, Users, GraduationCap, Search, MoreVertical, X, AlertCircle, Copy,
    ChevronRight, Sparkles, School, Mail, Phone, User, Briefcase
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';

/* ─── Types ─── */
type Department = { id: number; name: string };
type Faculty = { id: number; name: string; designation: string; department: string; mobile: string; email: string };
type Student = { id: number; year: string; name: string; regNo: string; mobile: string; email: string };

/* ─── Storage Keys ─── */
const INSTITUTION_KEY = 'mededuai_create_institution';
const DEPT_KEY = 'mededuai_create_institution_departments';
const FACULTY_KEY = 'mededuai_create_institution_faculty';
const STUDENTS_KEY = 'mededuai_create_institution_students';

/* ─── Helpers ─── */
function generateInstitutionCode(name: string) {
    const prefix = name
        .split(/\s+/)
        .filter(w => w.length > 2)
        .map(w => w[0].toUpperCase())
        .join('')
        .slice(0, 4);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix || 'INST'}-${random}`;
}

function loadJSON<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function saveJSON(key: string, data: unknown) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

/* ─── Shared UI ─── */
function SectionCard({ title, subtitle, icon: Icon, children, gradient = 'from-slate-800 to-slate-700' }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className={`px-6 py-5 bg-gradient-to-r ${gradient} flex items-center gap-4`}>
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <p className="text-xs text-white/70 font-medium">{subtitle}</p>
                </div>
            </div>
            <div className="p-6 md:p-8">{children}</div>
        </div>
    );
}

const ModalInput = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
        />
    </div>
);

/* ─── Excel Helpers ─── */
function readExcelFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseExcelRows(data: ArrayBuffer): any[][] {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function findHeaderRow(rows: any[][], keywords: string[]): number {
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const rowString = (rows[i] || []).join(' ').toLowerCase();
        if (keywords.some(k => rowString.includes(k))) return i;
    }
    return 0;
}

function getColIndex(headerRow: any[], keywords: string[]): number {
    return headerRow.findIndex(h => keywords.some(k => String(h || '').toLowerCase().includes(k)));
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function CreateInstitutionPage() {
    /* ── Institution Core ── */
    const [instName, setInstName] = useState('');
    const [courseName, setCourseName] = useState('');
    const [instCode, setInstCode] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    /* ── Departments ── */
    const [departments, setDepartments] = useState<Department[]>([]);
    const [deptInput, setDeptInput] = useState('');
    const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
    const [editDeptName, setEditDeptName] = useState('');

    /* ── Faculty ── */
    const [facultyList, setFacultyList] = useState<Faculty[]>([]);
    const [facultySearch, setFacultySearch] = useState('');
    const [showAddFaculty, setShowAddFaculty] = useState(false);
    const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);
    const [facultyForm, setFacultyForm] = useState({ name: '', designation: '', department: '', mobile: '', email: '' });
    const [facultyUploadSuccess, setFacultyUploadSuccess] = useState(false);
    const facultyFileRef = useRef<HTMLInputElement>(null);

    /* ── Students ── */
    const [students, setStudents] = useState<Student[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentYearFilter, setStudentYearFilter] = useState('All');
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [studentForm, setStudentForm] = useState({ year: '', name: '', regNo: '', mobile: '', email: '' });
    const [studentUploadSuccess, setStudentUploadSuccess] = useState(false);
    const studentFileRef = useRef<HTMLInputElement>(null);
    const [studentUploadYear, setStudentUploadYear] = useState('');

    /* ── General ── */
    const [activeTab, setActiveTab] = useState<'details' | 'departments' | 'faculty' | 'students'>('details');

    /* ── Load from localStorage ── */
    useEffect(() => {
        const inst = loadJSON<any>(INSTITUTION_KEY, null);
        if (inst) {
            setInstName(inst.name || '');
            setCourseName(inst.course || '');
            setInstCode(inst.code || '');
            setLogoUrl(inst.logoUrl || null);
            setSaved(true);
        }
        setDepartments(loadJSON<Department[]>(DEPT_KEY, []));
        setFacultyList(loadJSON<Faculty[]>(FACULTY_KEY, []));
        setStudents(loadJSON<Student[]>(STUDENTS_KEY, []));
    }, []);

    /* ── Save helpers ── */
    const saveInstitution = () => {
        if (!instName.trim()) return alert('Institution name is required');
        const code = instCode || generateInstitutionCode(instName);
        if (!instCode) setInstCode(code);
        saveJSON(INSTITUTION_KEY, { name: instName, course: courseName, code: instCode || code, logoUrl });
        setSaved(true);
    };

    useEffect(() => { saveJSON(DEPT_KEY, departments); }, [departments]);
    useEffect(() => { saveJSON(FACULTY_KEY, facultyList); }, [facultyList]);
    useEffect(() => { saveJSON(STUDENTS_KEY, students); }, [students]);

    /* ── Logo handler ── */
    const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setLogoUrl(event.target?.result as string);
                    setSaved(false);
                    return;
                }

                // Max dimension for logo
                const MAX_DIMENSION = 512;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setLogoUrl(compressedDataUrl);
                setSaved(false);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    /* ── Department handlers ── */
    const addDepartment = () => {
        if (!deptInput.trim()) return;
        setDepartments(prev => [...prev, { id: Date.now(), name: deptInput.trim() }]);
        setDeptInput('');
    };
    const deleteDept = (id: number) => setDepartments(prev => prev.filter(d => d.id !== id));
    const startEditDept = (dept: Department) => { setEditingDeptId(dept.id); setEditDeptName(dept.name); };
    const saveEditDept = () => {
        if (!editDeptName.trim()) return;
        setDepartments(prev => prev.map(d => d.id === editingDeptId ? { ...d, name: editDeptName.trim() } : d));
        setEditingDeptId(null);
    };
    const handleDeptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readExcelFile(file);
            const rows = parseExcelRows(data);
            const headerRowIdx = findHeaderRow(rows, ['department', 'dept', 'name']);
            const headerRow = (rows[headerRowIdx] || []).map((h: any) => String(h || '').toLowerCase().trim());
            const nameCol = getColIndex(headerRow, ['department', 'dept', 'name']);
            const newDepts: Department[] = [];
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                const name = row[nameCol !== -1 ? nameCol : 0];
                if (name) newDepts.push({ id: Date.now() + i, name: String(name).trim() });
            }
            if (newDepts.length) { setDepartments(prev => [...prev, ...newDepts]); alert(`${newDepts.length} departments added!`); }
            else alert('No valid departments found. Ensure column header says "Department" or "Name".');
        } catch { alert('Error parsing file.'); }
    };
    const downloadDeptTemplate = () => downloadCSV('department_template.csv', ['Department'], [['Anatomy'], ['Physiology'], ['Biochemistry']]);

    /* ── Faculty handlers ── */
    const filteredFaculty = facultyList.filter(f =>
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.department.toLowerCase().includes(facultySearch.toLowerCase()) ||
        f.email.toLowerCase().includes(facultySearch.toLowerCase())
    );
    const addFaculty = () => {
        if (!facultyForm.name.trim()) return;
        setFacultyList(prev => [...prev, { id: Date.now(), ...facultyForm }]);
        setFacultyForm({ name: '', designation: '', department: '', mobile: '', email: '' });
        setShowAddFaculty(false);
    };
    const deleteFaculty = (id: number) => setFacultyList(prev => prev.filter(f => f.id !== id));
    const startEditFaculty = (f: Faculty) => { setEditFaculty(f); setFacultyForm({ name: f.name, designation: f.designation, department: f.department, mobile: f.mobile, email: f.email }); };
    const saveEditFaculty = () => {
        if (!editFaculty) return;
        setFacultyList(prev => prev.map(f => f.id === editFaculty.id ? { ...f, ...facultyForm } : f));
        setEditFaculty(null);
        setFacultyForm({ name: '', designation: '', department: '', mobile: '', email: '' });
    };
    const handleFacultyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readExcelFile(file);
            const rows = parseExcelRows(data);
            const headerRowIdx = findHeaderRow(rows, ['faculty', 'teacher', 'name']);
            const headerRow = (rows[headerRowIdx] || []).map((h: any) => String(h || '').toLowerCase().trim());
            const nameCol = getColIndex(headerRow, ['faculty name', 'teacher name', 'name']);
            const desigCol = getColIndex(headerRow, ['designation', 'role', 'title']);
            const deptCol = getColIndex(headerRow, ['department', 'dept']);
            const mobileCol = getColIndex(headerRow, ['mobile', 'phone', 'contact']);
            const emailCol = getColIndex(headerRow, ['email', 'mail']);
            const newFaculty: Faculty[] = [];
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                const name = row[nameCol !== -1 ? nameCol : 0];
                if (!name) continue;
                newFaculty.push({
                    id: Date.now() + i,
                    name: String(name).trim(),
                    designation: String(row[desigCol !== -1 ? desigCol : 1] || '').trim(),
                    department: String(row[deptCol !== -1 ? deptCol : 2] || '').trim(),
                    mobile: String(row[mobileCol !== -1 ? mobileCol : 3] || '').trim(),
                    email: String(row[emailCol !== -1 ? emailCol : 4] || '').trim(),
                });
            }
            if (newFaculty.length) {
                setFacultyList(prev => [...prev, ...newFaculty]);
                setFacultyUploadSuccess(true);
                setTimeout(() => setFacultyUploadSuccess(false), 3000);
            } else alert('No valid faculty found. Ensure columns: Faculty Name, Designation, Department, Mobile No, Mail Id');
        } catch { alert('Error parsing file.'); }
    };
    const downloadFacultyTemplate = () =>
        downloadCSV('faculty_template.csv',
            ['Faculty Name', 'Designation', 'Department', 'Mobile No', 'Mail Id'],
            [['Dr. A. Kumar', 'Professor & Head', 'Anatomy', '+91 9876543210', 'a.kumar@inst.edu']]
        );

    /* ── Student handlers ── */
    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.regNo.toLowerCase().includes(studentSearch.toLowerCase());
        const matchesYear = studentYearFilter === 'All' || s.year === studentYearFilter;
        return matchesSearch && matchesYear;
    });
    const addStudent = () => {
        if (!studentForm.name.trim() || !studentForm.regNo.trim() || !studentForm.year.trim()) return;
        setStudents(prev => [...prev, { id: Date.now(), ...studentForm }]);
        setStudentForm({ year: '', name: '', regNo: '', mobile: '', email: '' });
        setShowAddStudent(false);
    };
    const deleteStudent = (id: number) => setStudents(prev => prev.filter(s => s.id !== id));
    const startEditStudent = (s: Student) => { setEditStudent(s); setStudentForm({ year: s.year, name: s.name, regNo: s.regNo, mobile: s.mobile, email: s.email }); };
    const saveEditStudent = () => {
        if (!editStudent) return;
        setStudents(prev => prev.map(s => s.id === editStudent.id ? { ...s, ...studentForm } : s));
        setEditStudent(null);
        setStudentForm({ year: '', name: '', regNo: '', mobile: '', email: '' });
    };
    const handleStudentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!studentUploadYear) { alert('Please select a year first.'); return; }
        try {
            const data = await readExcelFile(file);
            const rows = parseExcelRows(data);
            const headerRowIdx = findHeaderRow(rows, ['student', 'name', 'reg']);
            const headerRow = (rows[headerRowIdx] || []).map((h: any) => String(h || '').toLowerCase().trim());
            const yearCol = getColIndex(headerRow, ['year']);
            const nameCol = getColIndex(headerRow, ['student name', 'name']);
            const regCol = getColIndex(headerRow, ['reg. no', 'reg no', 'registration', 'reg', 'id']);
            const mobileCol = getColIndex(headerRow, ['mobile', 'phone', 'contact']);
            const emailCol = getColIndex(headerRow, ['email', 'mail']);
            const newStudents: Student[] = [];
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;
                const name = row[nameCol !== -1 ? nameCol : 1];
                if (!name) continue;
                const year = row[yearCol !== -1 ? yearCol : -1];
                newStudents.push({
                    id: Date.now() + i,
                    year: year ? String(year).trim() : studentUploadYear,
                    name: String(name).trim(),
                    regNo: String(row[regCol !== -1 ? regCol : 0] || '').trim(),
                    mobile: String(row[mobileCol !== -1 ? mobileCol : 3] || '').trim(),
                    email: String(row[emailCol !== -1 ? emailCol : 4] || '').trim(),
                });
            }
            if (newStudents.length) {
                setStudents(prev => [...prev, ...newStudents]);
                setStudentUploadSuccess(true);
                setTimeout(() => setStudentUploadSuccess(false), 3000);
            } else alert('No valid students found. Ensure columns: Year, Student Name, Reg No, Mobile No, Mail ID');
        } catch { alert('Error parsing file.'); }
    };
    const downloadStudentTemplate = () =>
        downloadCSV('student_template.csv',
            ['Year', 'Student Name', 'Reg No', 'Mobile No', 'Mail ID'],
            [['2025-2026', 'John Doe', 'MED2026-001', '+91 9876543210', 'john@student.edu']]
        );

    /* ── Tabs ── */
    const tabs = [
        { key: 'details' as const, label: 'Institution Details', icon: School, count: undefined as number | undefined },
        { key: 'departments' as const, label: 'Departments', icon: Building2, count: departments.length },
        { key: 'faculty' as const, label: 'Faculty', icon: Users, count: facultyList.length },
        { key: 'students' as const, label: 'Students', icon: GraduationCap, count: students.length },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-6">
            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.25),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.15),transparent_50%)]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl" />

                <div className="relative z-10 px-10 py-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <School className="w-7 h-7 text-indigo-300" />
                            </div>
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Super Admin</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Create Institution</h2>
                        <p className="text-slate-400 mt-3 font-medium max-w-xl text-[15px] leading-relaxed">Set up institutions centrally with departments, faculty, and student rosters — all in one place.</p>
                    </div>
                    {saved && instName && (
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 self-start md:self-end">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{instName}</p>
                                <p className="text-xs text-slate-400 font-mono">{instCode}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2 ${
                                isActive
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-lg scale-[1.02] ring-2 ring-indigo-400 ring-offset-2'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:shadow-sm'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {typeof tab.count === 'number' && tab.count > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ═══════ DETAILS TAB ═══════ */}
            {activeTab === 'details' && (
                <SectionCard title="Institution Details" subtitle="Core profile information" icon={School} gradient="from-indigo-600 to-violet-600">
                    <div className="space-y-8">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Name of the Institution <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <Building2 className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                                <input
                                    type="text"
                                    value={instName}
                                    onChange={e => { setInstName(e.target.value); setSaved(false); }}
                                    placeholder="e.g. MedEduAI Institute of Medical Sciences"
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium"
                                />
                            </div>
                        </div>

                        {/* Logo */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Institution Logo</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                                <input type="file" accept="image/*" onChange={handleLogo} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {logoUrl ? (
                                    <div className="flex flex-col items-center">
                                        <img src={logoUrl} alt="Logo" className="h-24 w-auto object-contain rounded-lg mb-4 shadow-sm border border-slate-100" />
                                        <p className="text-sm font-semibold text-indigo-600">Click to change logo</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center pointer-events-none">
                                        <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                                        <p className="text-sm font-bold text-slate-700 mb-1">Click or drag image to upload</p>
                                        <p className="text-xs text-slate-500">PNG, JPG, SVG up to 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Course */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Course Name <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <BookOpen className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                                <input
                                    type="text"
                                    value={courseName}
                                    onChange={e => { setCourseName(e.target.value); setSaved(false); }}
                                    placeholder="e.g. MBBS, BDS, BSc Nursing"
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium"
                                />
                            </div>
                        </div>

                        {/* Institution Code */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Generate Specific Code</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                                    <input
                                        type="text"
                                        value={instCode}
                                        onChange={e => { setInstCode(e.target.value); setSaved(false); }}
                                        placeholder="Auto-generated or enter custom code"
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-mono font-medium bg-slate-50"
                                    />
                                </div>
                                <button
                                    onClick={() => { setInstCode(generateInstitutionCode(instName || 'INST')); setSaved(false); }}
                                    className="px-5 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" /> Generate
                                </button>
                                {instCode && (
                                    <button onClick={() => { navigator.clipboard.writeText(instCode); }} className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors" title="Copy">
                                        <Copy className="w-5 h-5 text-slate-500" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Save */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={saveInstitution}
                                disabled={!instName.trim() || !courseName.trim()}
                                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                                <Save className="w-5 h-5" /> Save Institution
                            </button>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ═══════ DEPARTMENTS TAB ═══════ */}
            {activeTab === 'departments' && (
                <SectionCard title="Departments" subtitle="Manage institution departments" icon={Building2} gradient="from-blue-600 to-cyan-600">
                    <div className="space-y-6">
                        {/* Upload / Template */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <button onClick={downloadDeptTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm">
                                <Download className="w-4 h-4" /> Download Excel Template
                            </button>
                            <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm cursor-pointer">
                                <FileUp className="w-4 h-4" /> Upload Excel
                                <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleDeptUpload} className="hidden" />
                            </label>
                        </div>

                        {/* Manual Add */}
                        <div className="flex gap-3">
                            <input
                                value={deptInput}
                                onChange={e => setDeptInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addDepartment()}
                                placeholder="Enter department name..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium"
                            />
                            <button onClick={addDepartment} disabled={!deptInput.trim()} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Add
                            </button>
                        </div>

                        {/* List */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /> Department List</h4>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{departments.length} Departments</span>
                            </div>
                            {departments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No departments added yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {departments.map(dept => (
                                        <div key={dept.id} className="flex items-center justify-between px-6 py-4 hover:bg-white transition-colors">
                                            {editingDeptId === dept.id ? (
                                                <div className="flex items-center gap-3 flex-1">
                                                    <input value={editDeptName} onChange={e => setEditDeptName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEditDept()} className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none" autoFocus />
                                                    <button onClick={saveEditDept} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"><CheckCircle2 className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingDeptId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">{dept.name[0]?.toUpperCase()}</div>
                                                        <span className="font-bold text-slate-800">{dept.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => startEditDept(dept)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteDept(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ═══════ FACULTY TAB ═══════ */}
            {activeTab === 'faculty' && (
                <SectionCard title="Faculty" subtitle="Manage faculty members" icon={Users} gradient="from-emerald-600 to-teal-600">
                    <div className="space-y-6">
                        {/* Upload / Template / Add */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button onClick={downloadFacultyTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm">
                                <Download className="w-4 h-4" /> Download Excel Template
                            </button>
                            <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm cursor-pointer">
                                <FileUp className="w-4 h-4" /> Upload Excel
                                <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFacultyUpload} className="hidden" ref={facultyFileRef} />
                            </label>
                            <button onClick={() => { setFacultyForm({ name: '', designation: '', department: '', mobile: '', email: '' }); setShowAddFaculty(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm ml-auto">
                                <Plus className="w-4 h-4" /> Add Manual
                            </button>
                        </div>

                        {facultyUploadSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <p className="text-sm font-bold text-emerald-800">Faculty uploaded successfully!</p>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                value={facultySearch}
                                onChange={e => setFacultySearch(e.target.value)}
                                placeholder="Search by name, department, or email..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Faculty Name</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Designation</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Department</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Mobile No</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Mail Id</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredFaculty.map(f => (
                                            <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">{f.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                        <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{f.designation}</td>
                                                <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{f.department}</span></td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{f.mobile}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{f.email}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => startEditFaculty(f)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteFaculty(f.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredFaculty.length === 0 && (
                                <div className="p-12 text-center">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No faculty found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ═══════ STUDENTS TAB ═══════ */}
            {activeTab === 'students' && (
                <SectionCard title="Students" subtitle="Manage students year-wise" icon={GraduationCap} gradient="from-violet-600 to-purple-600">
                    <div className="space-y-6">
                        {/* Upload / Template / Add */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button onClick={downloadStudentTemplate} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm">
                                <Download className="w-4 h-4" /> Download Excel Template
                            </button>
                            <label className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors text-sm cursor-pointer">
                                <FileUp className="w-4 h-4" /> Upload Excel
                                <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleStudentUpload} className="hidden" ref={studentFileRef} />
                            </label>
                            <button onClick={() => { setStudentForm({ year: '', name: '', regNo: '', mobile: '', email: '' }); setShowAddStudent(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors text-sm ml-auto">
                                <Plus className="w-4 h-4" /> Add Manual
                            </button>
                        </div>

                        {/* Upload Year + Search */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                    placeholder="Search by name or reg number..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-slate-600">Upload Year:</label>
                                <input
                                    list="studentYearList"
                                    value={studentUploadYear}
                                    onChange={e => setStudentUploadYear(e.target.value)}
                                    placeholder="Select year"
                                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none font-medium min-w-[140px]"
                                />
                                <datalist id="studentYearList">
                                    <option value="2021-2022" /><option value="2022-2023" /><option value="2023-2024" />
                                    <option value="2024-2025" /><option value="2025-2026" />
                                </datalist>
                            </div>
                            <select value={studentYearFilter} onChange={e => setStudentYearFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none font-medium bg-white">
                                <option value="All">All Years</option>
                                <option value="2021-2022">2021-2022</option>
                                <option value="2022-2023">2022-2023</option>
                                <option value="2023-2024">2023-2024</option>
                                <option value="2024-2025">2024-2025</option>
                                <option value="2025-2026">2025-2026</option>
                            </select>
                        </div>

                        {studentUploadSuccess && (
                            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
                                <CheckCircle2 className="w-5 h-5 text-violet-600" />
                                <p className="text-sm font-bold text-violet-800">Students uploaded successfully!</p>
                            </div>
                        )}

                        {/* Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Year</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Student Name</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Reg No</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Mobile No</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600">Mail ID</th>
                                            <th className="px-6 py-3.5 font-bold text-slate-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStudents.map(s => (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-100 text-violet-700">{s.year}</span></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">{s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                                                        <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-mono font-medium">{s.regNo}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{s.mobile}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{s.email}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => startEditStudent(s)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteStudent(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredStudents.length === 0 && (
                                <div className="p-12 text-center">
                                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No students found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ═══════ ADD FACULTY MODAL ═══════ */}
            <AnimatePresence>
                {showAddFaculty && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddFaculty(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><User className="w-5 h-5" /></div>
                                    <div><h3 className="text-lg font-bold text-slate-900">Add Faculty</h3><p className="text-xs text-slate-500 font-medium">Manually add a faculty member</p></div>
                                </div>
                                <button onClick={() => setShowAddFaculty(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <ModalInput label="Full Name *" value={facultyForm.name} onChange={v => setFacultyForm(p => ({ ...p, name: v }))} placeholder="Dr. Full Name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <ModalInput label="Designation" value={facultyForm.designation} onChange={v => setFacultyForm(p => ({ ...p, designation: v }))} placeholder="e.g. Professor" />
                                    <ModalInput label="Department" value={facultyForm.department} onChange={v => setFacultyForm(p => ({ ...p, department: v }))} placeholder="e.g. Anatomy" />
                                </div>
                                <ModalInput label="Mobile No" value={facultyForm.mobile} onChange={v => setFacultyForm(p => ({ ...p, mobile: v }))} placeholder="+91 0000000000" type="tel" />
                                <ModalInput label="Mail Id" value={facultyForm.email} onChange={v => setFacultyForm(p => ({ ...p, email: v }))} placeholder="email@inst.edu" type="email" />
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setShowAddFaculty(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={addFaculty} disabled={!facultyForm.name.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle2 className="w-4 h-4" /> Add Faculty
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ EDIT FACULTY MODAL ═══════ */}
            <AnimatePresence>
                {editFaculty && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditFaculty(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><Edit3 className="w-5 h-5" /></div>
                                    <div><h3 className="text-lg font-bold text-slate-900">Edit Faculty</h3><p className="text-xs text-slate-500 font-medium">Update faculty information</p></div>
                                </div>
                                <button onClick={() => setEditFaculty(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <ModalInput label="Full Name" value={facultyForm.name} onChange={v => setFacultyForm(p => ({ ...p, name: v }))} placeholder="Dr. Full Name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <ModalInput label="Designation" value={facultyForm.designation} onChange={v => setFacultyForm(p => ({ ...p, designation: v }))} placeholder="e.g. Professor" />
                                    <ModalInput label="Department" value={facultyForm.department} onChange={v => setFacultyForm(p => ({ ...p, department: v }))} placeholder="e.g. Anatomy" />
                                </div>
                                <ModalInput label="Mobile No" value={facultyForm.mobile} onChange={v => setFacultyForm(p => ({ ...p, mobile: v }))} placeholder="+91 0000000000" type="tel" />
                                <ModalInput label="Mail Id" value={facultyForm.email} onChange={v => setFacultyForm(p => ({ ...p, email: v }))} placeholder="email@inst.edu" type="email" />
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setEditFaculty(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={saveEditFaculty} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ ADD STUDENT MODAL ═══════ */}
            <AnimatePresence>
                {showAddStudent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddStudent(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600"><GraduationCap className="w-5 h-5" /></div>
                                    <div><h3 className="text-lg font-bold text-slate-900">Add Student</h3><p className="text-xs text-slate-500 font-medium">Manually add a student</p></div>
                                </div>
                                <button onClick={() => setShowAddStudent(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year *</label>
                                    <input list="addStudentYears" value={studentForm.year} onChange={e => setStudentForm(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 2025-2026"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all" />
                                    <datalist id="addStudentYears">
                                        <option value="2021-2022" /><option value="2022-2023" /><option value="2023-2024" />
                                        <option value="2024-2025" /><option value="2025-2026" />
                                    </datalist>
                                </div>
                                <ModalInput label="Student Name *" value={studentForm.name} onChange={v => setStudentForm(p => ({ ...p, name: v }))} placeholder="Student Full Name" />
                                <ModalInput label="Registration Number *" value={studentForm.regNo} onChange={v => setStudentForm(p => ({ ...p, regNo: v }))} placeholder="MED2026-001" />
                                <ModalInput label="Mobile No" value={studentForm.mobile} onChange={v => setStudentForm(p => ({ ...p, mobile: v }))} placeholder="+91 0000000000" type="tel" />
                                <ModalInput label="Mail ID" value={studentForm.email} onChange={v => setStudentForm(p => ({ ...p, email: v }))} placeholder="student@inst.edu" type="email" />
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setShowAddStudent(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={addStudent} disabled={!studentForm.name.trim() || !studentForm.regNo.trim() || !studentForm.year.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle2 className="w-4 h-4" /> Add Student
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════ EDIT STUDENT MODAL ═══════ */}
            <AnimatePresence>
                {editStudent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setEditStudent(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600"><Edit3 className="w-5 h-5" /></div>
                                    <div><h3 className="text-lg font-bold text-slate-900">Edit Student</h3><p className="text-xs text-slate-500 font-medium">Update student information</p></div>
                                </div>
                                <button onClick={() => setEditStudent(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
                                    <input list="editStudentYears" value={studentForm.year} onChange={e => setStudentForm(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 2025-2026"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all" />
                                    <datalist id="editStudentYears">
                                        <option value="2021-2022" /><option value="2022-2023" /><option value="2023-2024" />
                                        <option value="2024-2025" /><option value="2025-2026" />
                                    </datalist>
                                </div>
                                <ModalInput label="Student Name" value={studentForm.name} onChange={v => setStudentForm(p => ({ ...p, name: v }))} placeholder="Student Full Name" />
                                <ModalInput label="Registration Number" value={studentForm.regNo} onChange={v => setStudentForm(p => ({ ...p, regNo: v }))} placeholder="MED2026-001" />
                                <ModalInput label="Mobile No" value={studentForm.mobile} onChange={v => setStudentForm(p => ({ ...p, mobile: v }))} placeholder="+91 0000000000" type="tel" />
                                <ModalInput label="Mail ID" value={studentForm.email} onChange={v => setStudentForm(p => ({ ...p, email: v }))} placeholder="student@inst.edu" type="email" />
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setEditStudent(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={saveEditStudent} className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
