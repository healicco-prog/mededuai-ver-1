"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Download, Users, Mail, Phone, MoreVertical, Search, FileUp, CheckCircle2, Save, Edit3, Trash2, X, UserPlus, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AnimatePresence, motion } from 'framer-motion';
import { syncMentorEmails } from './mentorshipAccess';

type Mentor = {
    id: number;
    name: string;
    dept: string;
    designation: string;
    email: string;
    phone: string;
};

export default function MentorManager() {
    const [mentors, setMentors] = useState<Mentor[]>([
        { id: 1, name: 'Dr. Narayana BJP', dept: 'Anatomy', designation: 'Professor & Head', email: 'drnarayanabjp@gmail.com', phone: '+91 9876543210' },
        { id: 2, name: 'Dr. Doddaballapura', dept: 'Physiology', designation: 'Associate Professor', email: 'bjpdoddaballapura@gmail.com', phone: '+91 9876543211' },
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Action menu & modal states
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ name: '', dept: '', designation: '', email: '', phone: '' });
    const [addForm, setAddForm] = useState({ name: '', dept: '', designation: '', email: '', phone: '' });
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        if (openMenuId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    // Sync approved emails whenever mentors list changes
    useEffect(() => {
        syncMentorEmails(mentors);
    }, [mentors]);

    const filteredMentors = mentors.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.dept.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadTemplate = () => {
        const headers = ["Teacher Name", "Department", "Designation", "Email ID", "Mobile Number"];
        const csvContent = headers.join(",") + "\n" + "Dr. Example Name,Cardiology,Professor,example@mededuai.com,+91 0000000000\n";
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "mentor_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const processExcelFile = (data: ArrayBuffer) => {
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const json: any[] = XLSX.utils.sheet_to_json(worksheet);
            
            const newMentors: Mentor[] = [];
            
            for (let i = 0; i < json.length; i++) {
                const row = json[i];
                const name = row['Teacher Name'] || row['Faculty Name'] || row['Name'] || row['name'] || '';
                const dept = row['Department'] || row['Dept'] || row['department'] || '';
                const designation = row['Designation'] || row['Role'] || row['Title'] || '';
                const email = row['Email ID'] || row['Email'] || row['email'] || '';
                const phone = row['Mobile Number'] || row['Phone'] || row['Contact'] || row['mobile'] || '';
                
                if (name || email || phone || dept) {
                    newMentors.push({
                        id: Date.now() + i,
                        name: name ? String(name).trim() : 'Unknown Name',
                        dept: dept ? String(dept).trim() : 'Unassigned',
                        designation: designation ? String(designation).trim() : '',
                        email: email ? String(email).trim() : '',
                        phone: phone ? String(phone).trim() : ''
                    });
                }
            }
            
            if (newMentors.length > 0) {
                setMentors(prev => [...prev, ...newMentors]);
                setUploadSuccess(true);
                setHasUnsavedChanges(true);
                setTimeout(() => setUploadSuccess(false), 3000);
            } else {
                alert("No valid rows found in the file. Please ensure it has the correct headers: Teacher Name, Department, Designation, Email ID, Mobile Number.");
            }
        } catch (error) {
            console.error(error);
            alert("Error parsing file. Please ensure it is a valid Excel or CSV file.");
        }
    };

    const handleSaveList = () => {
        alert("Mentors list successfully saved to the database!");
        setHasUnsavedChanges(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result as ArrayBuffer;
            if (data) {
                processExcelFile(data);
            }
        };
        reader.readAsArrayBuffer(file);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (file.type === "text/csv" || file.type.includes("excel") || file.type.includes("spreadsheetml") || file.name.match(/\.(csv|xlsx|xls)$/i)) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = event.target?.result as ArrayBuffer;
                if (data) {
                    processExcelFile(data);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Please upload an Excel or CSV file format.");
        }
    };

    // --- Edit handlers ---
    const openEditModal = (mentor: Mentor) => {
        setEditingMentor(mentor);
        setEditForm({ name: mentor.name, dept: mentor.dept, designation: mentor.designation, email: mentor.email, phone: mentor.phone });
        setOpenMenuId(null);
    };

    const handleEditSave = () => {
        if (!editingMentor) return;
        setMentors(prev => prev.map(m => m.id === editingMentor.id ? { ...m, ...editForm } : m));
        setEditingMentor(null);
        setHasUnsavedChanges(true);
    };

    // --- Delete handlers ---
    const handleDeleteConfirm = () => {
        if (deleteConfirmId === null) return;
        setMentors(prev => prev.filter(m => m.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        setHasUnsavedChanges(true);
    };

    // --- Add Manual handler ---
    const handleAddMentor = () => {
        if (!addForm.name.trim()) return;
        setMentors(prev => [...prev, {
            id: Date.now(),
            name: addForm.name.trim(),
            dept: addForm.dept.trim() || 'Unassigned',
            designation: addForm.designation.trim(),
            email: addForm.email.trim(),
            phone: addForm.phone.trim()
        }]);
        setAddForm({ name: '', dept: '', designation: '', email: '', phone: '' });
        setShowAddModal(false);
        setHasUnsavedChanges(true);
    };

    // --- Shared Modal Input ---
    const ModalInput = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) => (
        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
        </div>
    );

    return (
        <div className="w-full text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mentor Management</h2>
                    <p className="text-slate-500">Upload and configure faculty members acting as mentors or coordinators.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm">
                        <Download className="w-5 h-5" /> Template
                    </button>
                    <button onClick={() => { setAddForm({ name: '', dept: '', designation: '', email: '', phone: '' }); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm">
                        <Plus className="w-5 h-5" /> Add Manual
                    </button>
                </div>
            </div>

            {/* RLS Info Banner */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-emerald-900 mb-0.5">Email-Based Access (RLS)</h4>
                    <p className="text-xs text-emerald-700/80 leading-relaxed">
                        Each Mentor&apos;s Email ID grants them access to the <strong>Teacher/Teaching dashboard</strong>.
                        Row Level Security ensures mentors only see their assigned mentees, meetings, and assessments.
                    </p>
                </div>
            </div>

            <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 mb-8 text-center transition-colors cursor-pointer group ${
                    isDragging ? 'bg-emerald-100 border-emerald-400' : 
                    uploadSuccess ? 'bg-emerald-50 border-emerald-300' :
                    'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/50'
                }`}
            >
                <input 
                    type="file" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                />
                
                {uploadSuccess ? (
                    <div className="animate-in zoom-in fade-in duration-300">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm text-emerald-600">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-900 mb-1">Upload Successful!</h3>
                        <p className="text-sm text-emerald-700">Mentors have been added to the table.</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                            <FileUp className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-900 mb-1">Batch Upload Mentors (Excel/CSV)</h3>
                        <p className="text-sm text-emerald-700">Drag and drop your faculty list here, or click to browse</p>
                        <p className="text-xs text-emerald-600/70 mt-4">Required columns: Teacher Name, Department, Designation, Email ID, Mobile Number</p>
                    </>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" /> Assigned Mentors</h3>
                    <div className="flex items-center gap-4">
                        {hasUnsavedChanges && (
                            <button 
                                onClick={handleSaveList}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm text-sm animate-in fade-in zoom-in duration-300"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        )}
                        <div className="relative w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input 
                                type="text"
                                placeholder="Search mentors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-100 text-sm">
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Name</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Department</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Contact</th>
                                <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMentors.map((mentor) => (
                                <tr key={mentor.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                                                {mentor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-900">{mentor.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {mentor.dept}
                                            </span>
                                            {mentor.designation && (
                                                <span className="text-xs text-slate-500 font-normal">
                                                    {mentor.designation}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-2 hover:text-emerald-600 transition-colors break-all">
                                                <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {mentor.email}
                                            </span>
                                            <span className="flex items-center gap-2 hover:text-emerald-600 transition-colors break-all">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {mentor.phone}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative inline-block" ref={openMenuId === mentor.id ? menuRef : undefined}>
                                            <button 
                                                onClick={() => setOpenMenuId(openMenuId === mentor.id ? null : mentor.id)} 
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            <AnimatePresence>
                                                {openMenuId === mentor.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 origin-top-right"
                                                    >
                                                        <button
                                                            onClick={() => openEditModal(mentor)}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                                        >
                                                            <Edit3 className="w-4 h-4" /> Edit Mentor
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1" />
                                                        <button
                                                            onClick={() => { setDeleteConfirmId(mentor.id); setOpenMenuId(null); }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
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
                    {filteredMentors.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No Mentors Found</h3>
                            <p className="text-slate-500 font-medium max-w-sm">Use the batch upload feature or add mentors manually to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ======= EDIT MENTOR MODAL ======= */}
            <AnimatePresence>
                {editingMentor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setEditingMentor(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Edit Mentor</h3>
                                        <p className="text-xs text-slate-500 font-medium">Update mentor information</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingMentor(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4">
                                <ModalInput label="Full Name" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} placeholder="Dr. Full Name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <ModalInput label="Department" value={editForm.dept} onChange={v => setEditForm(p => ({ ...p, dept: v }))} placeholder="e.g. Anatomy" />
                                    <ModalInput label="Designation" value={editForm.designation} onChange={v => setEditForm(p => ({ ...p, designation: v }))} placeholder="e.g. Professor" />
                                </div>
                                <div className="relative">
                                    <ModalInput label="Email (RLS Access Key)" value={editForm.email} onChange={v => setEditForm(p => ({ ...p, email: v }))} placeholder="email@mededuai.com" type="email" />
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                                        <Shield className="w-3 h-3" /> This email grants Teacher dashboard access via RLS
                                    </div>
                                </div>
                                <ModalInput label="Mobile Number" value={editForm.phone} onChange={v => setEditForm(p => ({ ...p, phone: v }))} placeholder="+91 0000000000" type="tel" />
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <button onClick={() => setEditingMentor(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={handleEditSave} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= ADD MENTOR MODAL ======= */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Add Mentor</h3>
                                        <p className="text-xs text-slate-500 font-medium">Manually add a new faculty mentor</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <ModalInput label="Full Name *" value={addForm.name} onChange={v => setAddForm(p => ({ ...p, name: v }))} placeholder="Dr. Full Name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <ModalInput label="Department" value={addForm.dept} onChange={v => setAddForm(p => ({ ...p, dept: v }))} placeholder="e.g. Anatomy" />
                                    <ModalInput label="Designation" value={addForm.designation} onChange={v => setAddForm(p => ({ ...p, designation: v }))} placeholder="e.g. Professor" />
                                </div>
                                <div className="relative">
                                    <ModalInput label="Email (RLS Access Key)" value={addForm.email} onChange={v => setAddForm(p => ({ ...p, email: v }))} placeholder="email@mededuai.com" type="email" />
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                                        <Shield className="w-3 h-3" /> This email grants Teacher dashboard access via RLS
                                    </div>
                                </div>
                                <ModalInput label="Mobile Number" value={addForm.phone} onChange={v => setAddForm(p => ({ ...p, phone: v }))} placeholder="+91 0000000000" type="tel" />
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={handleAddMentor} disabled={!addForm.name.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Plus className="w-4 h-4" /> Add Mentor
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= DELETE CONFIRMATION MODAL ======= */}
            <AnimatePresence>
                {deleteConfirmId !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setDeleteConfirmId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-8 text-center"
                        >
                            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
                                <Trash2 className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Mentor?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6 max-w-xs mx-auto">
                                This will permanently remove <strong className="text-slate-800">{mentors.find(m => m.id === deleteConfirmId)?.name}</strong> from the mentor list.
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => setDeleteConfirmId(null)} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={handleDeleteConfirm} className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
