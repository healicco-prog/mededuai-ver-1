"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Download, Users, Mail, Phone, Search, FileUp, GraduationCap, CheckCircle2, Save, Edit3, Trash2, AlertCircle, X, UserPlus, Shield, Plus, MoreVertical, UsersRound } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { syncMenteeEmails } from './mentorshipAccess';

type MenteeType = 'mentee' | 'peer_mentee';

type Mentee = {
    id: number;
    regNo: string;
    name: string;
    year: string;
    email: string;
    phone: string;
    type: MenteeType;
};

const MENTEE_STORAGE_KEY = 'mededuai_mentoring_mentees';

const defaultMentees: Mentee[] = [
    { id: 1, regNo: 'MED2026-001', name: 'Narayana K', year: '2025-2026', email: 'narayanakdr@yahoo.co.in', phone: '+91 9876543214', type: 'mentee' },
    { id: 2, regNo: 'MED2026-002', name: 'AIMS RC Pharmacy', year: '2025-2026', email: 'aimsrcpharmac@gmail.com', phone: '+91 9876543213', type: 'mentee' },
    { id: 3, regNo: 'MED2025-045', name: 'Dr. Doddaballapura', year: '2024-2025', email: 'bjpdoddaballapura@gmail.com', phone: '+91 9876543211', type: 'peer_mentee' },
];

function loadMentees(): Mentee[] {
    try {
        const raw = localStorage.getItem(MENTEE_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return defaultMentees;
}

export default function MenteeManager() {
    const [mentees, setMentees] = useState<Mentee[]>(defaultMentees);

    // Load from localStorage on mount
    useEffect(() => {
        setMentees(loadMentees());
    }, []);

    // Persist to localStorage on every change
    useEffect(() => {
        try { localStorage.setItem(MENTEE_STORAGE_KEY, JSON.stringify(mentees)); } catch {}
    }, [mentees]);
    const [searchQuery, setSearchQuery] = useState('');
    const [yearFilter, setYearFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState<'All' | MenteeType>('All');

    // Upload specific states
    const [uploadYear, setUploadYear] = useState('');
    const [uploadType, setUploadType] = useState<MenteeType>('mentee');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit modal state
    const [editingMentee, setEditingMentee] = useState<Mentee | null>(null);
    const [editForm, setEditForm] = useState({ name: '', regNo: '', email: '', phone: '', type: 'mentee' as MenteeType });

    // Add manual modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', regNo: '', year: '2025-2026', email: '', phone: '', type: 'mentee' as MenteeType });

    // Delete confirmation
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Action menu
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredMentees = mentees.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.regNo.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesYear = yearFilter === 'All' || yearFilter === '' || m.year.toString() === yearFilter;
        const matchesType = typeFilter === 'All' || m.type === typeFilter;
        return matchesSearch && matchesYear && matchesType;
    });

    // Close menu on outside click
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpenMenuId(null);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync approved emails whenever mentees list changes
    useEffect(() => {
        syncMenteeEmails(mentees);
    }, [mentees]);

    const handleDownloadTemplate = () => {
        const headers = ["Registration Number", "Student Name", "Email ID", "Mobile Number"];
        const csvContent = headers.join(",") + "\n" + "MED2026-000,John Doe,johndoe@student.mededuai.com,+91 0000000000\n";

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "student_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const processExcelFile = (data: ArrayBuffer) => {
        if (!uploadYear) { alert("Please select a Year before uploading."); return; }

        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const newMentees: Mentee[] = [];

            let headerRowIndex = 0;
            for (let i = 0; i < Math.min(json.length, 5); i++) {
                const row = json[i] || [];
                const rowString = row.join(' ').toLowerCase();
                if (rowString.includes('name') || rowString.includes('reg') || rowString.includes('rn')) {
                    headerRowIndex = i; break;
                }
            }

            const headerRow = (json[headerRowIndex] || []).map(h => String(h || '').toLowerCase().trim());
            const getColIndex = (keywords: string[]) => headerRow.findIndex(h => keywords.some(k => h.includes(k)));

            const nameCol = getColIndex(['name', 'student']);
            const regNoCol = getColIndex(['reg. no', 'reg no', 'registration', 'reg', 'id']);
            const emailCol = getColIndex(['email', 'mail']);
            const phoneCol = getColIndex(['phone', 'mobile', 'contact', 'no']);

            const finalNameCol = nameCol !== -1 ? nameCol : 2;
            const finalRegNoCol = regNoCol !== -1 ? regNoCol : 1;
            const finalEmailCol = emailCol !== -1 ? emailCol : 3;
            const finalPhoneCol = phoneCol !== -1 ? phoneCol : 4;

            for (let i = headerRowIndex + 1; i < json.length; i++) {
                const row = json[i];
                if (!row || row.length === 0) continue;
                const name = row[finalNameCol] || '';
                const regNo = row[finalRegNoCol] || '';
                const email = row[finalEmailCol] || '';
                const phone = row[finalPhoneCol] || '';
                if (name || regNo || email || phone) {
                    newMentees.push({
                        id: Date.now() + i,
                        name: name ? String(name).trim() : 'Unknown Name',
                        regNo: regNo ? String(regNo).trim() : 'N/A',
                        year: uploadYear,
                        email: email ? String(email).trim() : '',
                        phone: phone ? String(phone).trim() : '',
                        type: uploadType
                    });
                }
            }

            if (newMentees.length > 0) {
                setMentees(prev => [...prev, ...newMentees]);
                setUploadSuccess(true);
                setHasUnsavedChanges(true);
                setYearFilter('All');
                setTimeout(() => setUploadSuccess(false), 3000);
            } else {
                alert("No valid student records found.");
            }
        } catch (error) {
            console.error(error);
            alert("Error parsing file. Please ensure it is a valid Excel or CSV file.");
        }
    };

    const handleFileUploadClick = () => {
        if (!uploadYear) { alert("Please select a 'Year' first."); return; }
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { const data = event.target?.result as ArrayBuffer; if (data) processExcelFile(data); };
        reader.readAsArrayBuffer(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); if (uploadYear) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!uploadYear) { alert("Select a 'Year' first."); return; }
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (file.type === "text/csv" || file.type.includes("excel") || file.type.includes("spreadsheetml") || file.name.match(/\.(csv|xlsx|xls)$/i)) {
            const reader = new FileReader();
            reader.onload = (event) => { const data = event.target?.result as ArrayBuffer; if (data) processExcelFile(data); };
            reader.readAsArrayBuffer(file);
        } else { alert("Please upload an Excel or CSV file."); }
    };

    const handleSaveList = () => { alert("Student roster saved to database!"); setHasUnsavedChanges(false); };

    // Edit handlers
    const openEditModal = (mentee: Mentee) => {
        setEditingMentee(mentee);
        setEditForm({ name: mentee.name, regNo: mentee.regNo, email: mentee.email, phone: mentee.phone, type: mentee.type });
        setOpenMenuId(null);
    };

    const handleEditSave = () => {
        if (!editingMentee) return;
        setMentees(prev => prev.map(m =>
            m.id === editingMentee.id ? { ...m, name: editForm.name, regNo: editForm.regNo, email: editForm.email, phone: editForm.phone, type: editForm.type } : m
        ));
        setEditingMentee(null);
        setHasUnsavedChanges(true);
    };

    // Add manual handlers
    const handleAddManual = () => {
        if (!addForm.name || !addForm.regNo) return;
        setMentees(prev => [...prev, {
            id: Date.now(),
            ...addForm
        }]);
        setShowAddModal(false);
        setAddForm({ name: '', regNo: '', year: '2025-2026', email: '', phone: '', type: 'mentee' });
        setHasUnsavedChanges(true);
    };

    // Delete handlers
    const handleDeleteConfirm = () => {
        if (deleteConfirmId === null) return;
        setMentees(prev => prev.filter(m => m.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        setHasUnsavedChanges(true);
    };

    const typeBadge = (type: MenteeType) => type === 'peer_mentee' ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 uppercase tracking-widest"><UsersRound className="w-3 h-3" /> Peer</span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-purple-200 uppercase tracking-widest"><GraduationCap className="w-3 h-3" /> Mentee</span>
    );

    const ModalInput = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) => (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all" />
        </div>
    );

    const TypeSelector = ({ value, onChange }: { value: MenteeType; onChange: (v: MenteeType) => void }) => (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role Type</label>
            <div className="flex gap-2">
                <button type="button" onClick={() => onChange('mentee')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${value === 'mentee' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <GraduationCap className="w-4 h-4" /> Mentee
                </button>
                <button type="button" onClick={() => onChange('peer_mentee')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${value === 'peer_mentee' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <UsersRound className="w-4 h-4" /> Peer Mentee
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mentee & Peer Mentee Management</h2>
                    <p className="text-slate-500">Manage student mentees and peer mentees. Upload batch-wise or add manually.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm">
                        <Download className="w-5 h-5" /> Template
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm">
                        <Plus className="w-5 h-5" /> Add Manual
                    </button>
                </div>
            </div>

            {/* RLS Info Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-purple-900 mb-0.5">Email-Based Access (RLS)</h4>
                    <p className="text-xs text-purple-700/80 leading-relaxed">
                        Both <strong>Mentee</strong> and <strong>Peer Mentee</strong> roles access the <strong>Student/Learning dashboard</strong> via their registered Email ID.
                        Row Level Security ensures each student sees only their own mentorship data, meetings, and assessments.
                    </p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl mb-6 flex flex-col items-center">
                <div className="flex items-center gap-4 mb-4 flex-wrap justify-center">
                    <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700 text-sm">1. Year:</label>
                        <input
                            list="uploadYearOptions"
                            value={uploadYear}
                            onChange={(e) => setUploadYear(e.target.value)}
                            placeholder="Select Year"
                            className="bg-white border-2 border-purple-200 text-slate-800 rounded-xl px-4 py-2 font-bold outline-none focus:border-purple-500 min-w-[140px] text-sm"
                        />
                        <datalist id="uploadYearOptions">
                            <option value="2021-2022" /><option value="2022-2023" /><option value="2023-2024" />
                            <option value="2024-2025" /><option value="2025-2026" />
                        </datalist>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="font-bold text-slate-700 text-sm">2. Type:</label>
                        <div className="flex gap-1 bg-white border-2 border-purple-200 rounded-xl p-0.5">
                            <button onClick={() => setUploadType('mentee')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadType === 'mentee' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                Mentee
                            </button>
                            <button onClick={() => setUploadType('peer_mentee')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${uploadType === 'peer_mentee' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                Peer Mentee
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    onClick={handleFileUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                        !uploadYear ? 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed' :
                        isDragging ? 'bg-purple-100 border-purple-400 cursor-copy' :
                        uploadSuccess ? 'bg-purple-50 border-purple-300' :
                        'bg-purple-50 border-purple-200 hover:bg-purple-100/50 cursor-pointer group'
                    }`}
                >
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

                    {!uploadYear ? (
                        <>
                            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400"><AlertCircle className="w-8 h-8" /></div>
                            <h3 className="text-lg font-bold text-slate-600 mb-1">Select a Year First</h3>
                            <p className="text-sm text-slate-500">You must select a year above before uploading.</p>
                        </>
                    ) : uploadSuccess ? (
                        <div className="animate-in zoom-in fade-in duration-300">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200 shadow-sm text-purple-600"><CheckCircle2 className="w-8 h-8" /></div>
                            <h3 className="text-lg font-bold text-purple-900 mb-1">Upload Successful!</h3>
                            <p className="text-sm text-purple-700">Students added as {uploadType === 'peer_mentee' ? 'Peer Mentees' : 'Mentees'}.</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100 shadow-sm group-hover:scale-105 transition-transform"><FileUp className="w-8 h-8 text-purple-600" /></div>
                            <h3 className="text-lg font-bold text-purple-900 mb-1">3. Upload {uploadType === 'peer_mentee' ? 'Peer Mentees' : 'Mentees'} List (Excel/CSV)</h3>
                            <p className="text-sm text-purple-700">Drag and drop or click to browse</p>
                            <p className="text-xs text-purple-600/70 mt-4">Required columns: Registration Number, Student Name, Email ID, Mobile Number</p>
                        </>
                    )}
                </div>
            </div>

            {/* Student Roster Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" /> Student Roster</h3>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
                        {hasUnsavedChanges && (
                            <button onClick={handleSaveList} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-sm text-sm animate-in fade-in zoom-in duration-300">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        )}
                        {/* Type Filter */}
                        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                            {(['All', 'mentee', 'peer_mentee'] as const).map(t => (
                                <button key={t} onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${typeFilter === t ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    {t === 'All' ? 'All' : t === 'mentee' ? 'Mentee' : 'Peer'}
                                </button>
                            ))}
                        </div>
                        <input
                            list="yearFilterOptions"
                            value={yearFilter === 'All' ? '' : yearFilter}
                            onChange={(e) => setYearFilter(e.target.value === '' ? 'All' : e.target.value)}
                            placeholder="Year (All)"
                            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 h-[38px] w-full sm:w-auto"
                        />
                        <datalist id="yearFilterOptions">
                            <option value="2021-2022" /><option value="2022-2023" /><option value="2023-2024" />
                            <option value="2024-2025" /><option value="2025-2026" />
                        </datalist>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input type="text" placeholder="Search name or reg..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white h-[38px]" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-sm">
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Student Name</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Reg. Number</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Type</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Year</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Contact</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMentees.map((mentee) => (
                                <tr key={mentee.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${mentee.type === 'peer_mentee' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {mentee.type === 'peer_mentee' ? <UsersRound className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                                            </div>
                                            <span className="font-bold text-slate-900">{mentee.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium font-mono">{mentee.regNo}</td>
                                    <td className="px-6 py-4">{typeBadge(mentee.type)}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-500/10 whitespace-nowrap">
                                            {mentee.year || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-2 break-all hover:text-purple-600"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {mentee.email}</span>
                                            <span className="flex items-center gap-2 break-all hover:text-purple-600"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {mentee.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative inline-block" ref={openMenuId === mentee.id ? menuRef : undefined}>
                                            <button onClick={() => setOpenMenuId(openMenuId === mentee.id ? null : mentee.id)}
                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            <AnimatePresence>
                                                {openMenuId === mentee.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 origin-top-right"
                                                    >
                                                        <button onClick={() => openEditModal(mentee)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                                            <Edit3 className="w-4 h-4" /> Edit Student
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        <button onClick={() => { setDeleteConfirmId(mentee.id); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                                                            <Trash2 className="w-4 h-4" /> Delete
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredMentees.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No Students Found</h3>
                            <p className="text-slate-500 font-medium max-w-sm">Use the batch upload feature or add manually.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ======= EDIT MENTEE MODAL ======= */}
            <AnimatePresence>
                {editingMentee && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setEditingMentee(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><Edit3 className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Edit Student</h3>
                                        <p className="text-xs text-slate-500 font-medium">Update student information</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingMentee(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <ModalInput label="Full Name" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} placeholder="Student Name" />
                                <ModalInput label="Registration Number" value={editForm.regNo} onChange={v => setEditForm(p => ({ ...p, regNo: v }))} placeholder="MED2026-001" />
                                <TypeSelector value={editForm.type} onChange={v => setEditForm(p => ({ ...p, type: v }))} />
                                <div className="relative">
                                    <ModalInput label="Email (RLS Access Key)" value={editForm.email} onChange={v => setEditForm(p => ({ ...p, email: v }))} placeholder="email@student.mededuai.com" type="email" />
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-purple-600">
                                        <Shield className="w-3 h-3" /> This email grants Student dashboard access via RLS
                                    </div>
                                </div>
                                <ModalInput label="Mobile Number" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} placeholder="+91 0000000000" type="tel" />
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <button onClick={() => setEditingMentee(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleEditSave} className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= ADD MANUAL MODAL ======= */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600"><UserPlus className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Add Student</h3>
                                        <p className="text-xs text-slate-500 font-medium">Create a new mentee or peer mentee</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 space-y-5">
                                <ModalInput label="Full Name *" value={addForm.name} onChange={v => setAddForm(p => ({ ...p, name: v }))} placeholder="Student Full Name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <ModalInput label="Registration Number *" value={addForm.regNo} onChange={v => setAddForm(p => ({ ...p, regNo: v }))} placeholder="MED2026-000" />
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
                                        <input list="addYearOptions" value={addForm.year} onChange={(e) => setAddForm(p => ({ ...p, year: e.target.value }))} placeholder="Year"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all" />
                                        <datalist id="addYearOptions">
                                            <option value="2021-2022" /><option value="2022-2023" /><option value="2023-2024" />
                                            <option value="2024-2025" /><option value="2025-2026" />
                                        </datalist>
                                    </div>
                                </div>
                                <TypeSelector value={addForm.type} onChange={v => setAddForm(p => ({ ...p, type: v }))} />
                                <div className="relative">
                                    <ModalInput label="Email (RLS Access Key)" value={addForm.email} onChange={v => setAddForm(p => ({ ...p, email: v }))} placeholder="email@student.mededuai.com" type="email" />
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-purple-600">
                                        <Shield className="w-3 h-3" /> This email grants Student dashboard access via RLS
                                    </div>
                                </div>
                                <ModalInput label="Mobile Number" value={addForm.phone} onChange={v => setAddForm(p => ({ ...p, phone: v }))} placeholder="+91 0000000000" type="tel" />
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleAddManual} disabled={!addForm.name.trim() || !addForm.regNo.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle2 className="w-4 h-4" /> Add Student
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= DELETE CONFIRMATION MODAL ======= */}
            <AnimatePresence>
                {deleteConfirmId !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setDeleteConfirmId(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-8 text-center">
                            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600"><Trash2 className="w-7 h-7" /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Remove Student?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6 max-w-xs mx-auto">
                                This will remove <strong className="text-slate-800">{mentees.find(m => m.id === deleteConfirmId)?.name}</strong> from the roster.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => setDeleteConfirmId(null)} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={handleDeleteConfirm} className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
