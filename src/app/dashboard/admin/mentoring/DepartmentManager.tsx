"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Building2, User, MoreVertical, Trash2, Edit3, CheckCircle2, UserPlus, X, Mail, Phone, Shield, Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { syncDeptHeadEmails } from './mentorshipAccess';

// Extracted outside so React doesn't recreate the component on each render (which kills cursor focus)
const ModalInput = ({ label, value, onChange, placeholder, type = 'text', disabled = false }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; disabled?: boolean }) => (
    <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
        />
    </div>
);

type DeptHead = {
    name: string;
    designation: string;
    email: string;
    phone: string;
};

type Department = {
    id: number;
    name: string;
    head: DeptHead;
    facultyCount: number;
};

const mockFaculty = [
    { id: 'f1', name: 'Dr. Narayana BJP', email: 'drnarayanabjp@gmail.com', designation: 'Professor & Head', phone: '+91 9876543210' },
    { id: 'f2', name: 'Dr. Doddaballapura', email: 'bjpdoddaballapura@gmail.com', designation: 'Associate Professor', phone: '+91 9876543211' },
    { id: 'f3', name: 'Dr. Karnataka Doctors Cell', email: 'bjpkarnatakadoctorscell@gmail.com', designation: 'Professor', phone: '+91 9876543212' },
    { id: 'f4', name: 'Dr. AIMS RC Pharmacy', email: 'aimsrcpharmac@gmail.com', designation: 'Assistant Professor', phone: '+91 9876543213' },
    { id: 'f5', name: 'Dr. Narayana K', email: 'narayanakdr@yahoo.co.in', designation: 'Lecturer', phone: '+91 9876543214' },
];

export default function DepartmentManager() {
    const [departments, setDepartments] = useState<Department[]>([
        { id: 1, name: 'Anatomy', head: { name: 'Dr. Narayana BJP', designation: 'Professor & Head', email: 'drnarayanabjp@gmail.com', phone: '+91 9876543210' }, facultyCount: 12 },
        { id: 2, name: 'Physiology', head: { name: 'Dr. Doddaballapura', designation: 'Associate Professor', email: 'bjpdoddaballapura@gmail.com', phone: '+91 9876543211' }, facultyCount: 8 },
        { id: 3, name: 'Biochemistry', head: { name: 'Dr. Karnataka Doctors Cell', designation: 'Professor', email: 'bjpkarnatakadoctorscell@gmail.com', phone: '+91 9876543212' }, facultyCount: 6 },
    ]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [addingFacultyDeptId, setAddingFacultyDeptId] = useState<number | null>(null);

    // Form State
    const [deptForm, setDeptForm] = useState({ name: '', headName: '', headDesignation: '', headEmail: '', headPhone: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [facultySearchQuery, setFacultySearchQuery] = useState('');
    const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const facultyDropdownRef = useRef<HTMLDivElement>(null);

    const filteredFaculty = mockFaculty.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAddFaculty = mockFaculty.filter(f =>
        f.name.toLowerCase().includes(facultySearchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(facultySearchQuery.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
            if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target as Node)) {
                setIsFacultyDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync approved emails on mount and whenever departments change
    useEffect(() => {
        syncDeptHeadEmails(departments);
    }, [departments]);

    const openAddModal = () => {
        setDeptForm({ name: '', headName: '', headDesignation: '', headEmail: '', headPhone: '' });
        setSearchQuery('');
        setShowAddModal(true);
    };

    const openEditModal = (dept: Department) => {
        setEditingDept(dept);
        setDeptForm({
            name: dept.name,
            headName: dept.head.name,
            headDesignation: dept.head.designation,
            headEmail: dept.head.email,
            headPhone: dept.head.phone
        });
        setSearchQuery(dept.head.name);
        setOpenMenuId(null);
    };

    const handleSubmit = () => {
        if (!deptForm.name) return;

        const headData: DeptHead = {
            name: deptForm.headName || 'Unassigned',
            designation: deptForm.headDesignation || '',
            email: deptForm.headEmail || '',
            phone: deptForm.headPhone || ''
        };

        if (editingDept) {
            setDepartments(prev => prev.map(d =>
                d.id === editingDept.id ? { ...d, name: deptForm.name, head: headData } : d
            ));
            setEditingDept(null);
        } else {
            setDepartments(prev => [...prev, { id: Date.now(), name: deptForm.name, head: headData, facultyCount: 0 }]);
            setShowAddModal(false);
        }
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirmId === null) return;
        setDepartments(prev => prev.filter(d => d.id !== deleteConfirmId));
        setDeleteConfirmId(null);
    };

    const handleAddFaculty = (faculty: any) => {
        alert(`Added ${faculty.name} to the department! (Mock Action)`);
        setAddingFacultyDeptId(null);
        setFacultySearchQuery('');
    };

    const handleFacultySelect = (faculty: typeof mockFaculty[0]) => {
        setDeptForm(prev => ({
            ...prev,
            headName: faculty.name,
            headDesignation: faculty.designation,
            headEmail: faculty.email,
            headPhone: faculty.phone
        }));
        setSearchQuery(faculty.name);
        setIsDropdownOpen(false);
    };

    // Shared modal content for Add/Edit
    const renderModalForm = () => (
        <div className="p-6 space-y-5">
            {/* Department Name */}
            <ModalInput label="Department Name *" value={deptForm.name} onChange={v => setDeptForm(p => ({ ...p, name: v }))} placeholder="e.g. Pathology" />

            {/* Divider */}
            <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Department Head Details
                </span>
                <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Autofill Search */}
            <div ref={dropdownRef} className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search Faculty (Auto-fill)</label>
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Type name or email to auto-fill..."
                        className="w-full pl-10 pr-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                </div>
                {isDropdownOpen && searchQuery.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredFaculty.length > 0 ? (
                            <div className="py-1.5">
                                {filteredFaculty.map(faculty => (
                                    <button
                                        key={faculty.id}
                                        type="button"
                                        onClick={() => handleFacultySelect(faculty)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 text-sm">{faculty.name}</p>
                                            <p className="text-xs text-slate-500">{faculty.email}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-slate-500">No faculty found</div>
                        )}
                    </div>
                )}
            </div>

            {/* Head Detail Fields */}
            <ModalInput label="Full Name" value={deptForm.headName} onChange={v => setDeptForm(p => ({ ...p, headName: v }))} placeholder="Dr. Full Name" />
            <div className="grid grid-cols-2 gap-4">
                <ModalInput label="Designation" value={deptForm.headDesignation} onChange={v => setDeptForm(p => ({ ...p, headDesignation: v }))} placeholder="e.g. Professor & Head" />
                <ModalInput label="Mobile Number" value={deptForm.headPhone} onChange={v => setDeptForm(p => ({ ...p, headPhone: v }))} placeholder="+91 0000000000" type="tel" />
            </div>
            <div className="relative">
                <ModalInput label="Email (RLS Access Key) *" value={deptForm.headEmail} onChange={v => setDeptForm(p => ({ ...p, headEmail: v }))} placeholder="email@mededuai.com" type="email" />
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-blue-600">
                    <Shield className="w-3 h-3" /> This email grants Department Admin access via Row Level Security
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full text-left relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Department Management</h2>
                    <p className="text-slate-500">Create departments and assign faculty as department heads with full contact details.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" /> Add Department
                </button>
            </div>

            {/* RLS Info Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-0.5">Email-Based Row Level Security (RLS)</h4>
                    <p className="text-xs text-blue-700/80 leading-relaxed">
                        Each role's Email ID serves as their access key. Department Heads access the <strong>Department Admin</strong> dashboard,
                        Mentors access the <strong>Teacher</strong> dashboard, and Mentees/Peer Mentees access the <strong>Student</strong> dashboard — all secured via Supabase RLS policies.
                    </p>
                </div>
            </div>

            {/* Department Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> Departments & Heads</h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{departments.length} Departments</span>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-100 text-sm">
                            <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Department</th>
                            <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Department Head</th>
                            <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Contact</th>
                            <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {departments.map(dept => (
                            <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 block">{dept.name}</span>
                                            <span className="text-xs text-slate-400 font-medium">{dept.facultyCount} Faculty</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                                            {dept.head.name !== 'Unassigned' ? dept.head.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 block">{dept.head.name}</span>
                                            {dept.head.designation && (
                                                <span className="text-xs text-slate-500">{dept.head.designation}</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-sm text-slate-500">
                                        {dept.head.email && (
                                            <span className="flex items-center gap-2 hover:text-blue-600 transition-colors break-all">
                                                <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {dept.head.email}
                                            </span>
                                        )}
                                        {dept.head.phone && (
                                            <span className="flex items-center gap-2 hover:text-blue-600 transition-colors break-all">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {dept.head.phone}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="relative inline-block" ref={openMenuId === dept.id ? menuRef : undefined}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === dept.id ? null : dept.id)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        <AnimatePresence>
                                            {openMenuId === dept.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 origin-top-right"
                                                >
                                                    <button
                                                        onClick={() => { setAddingFacultyDeptId(dept.id); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                                    >
                                                        <UserPlus className="w-4 h-4" /> Add Faculty
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1" />
                                                    <button
                                                        onClick={() => openEditModal(dept)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4" /> Edit Department
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1" />
                                                    <button
                                                        onClick={() => { setDeleteConfirmId(dept.id); setOpenMenuId(null); }}
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
                {departments.length === 0 && (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Departments Found</h3>
                        <p className="text-slate-500 mb-6">Create your first department to get started.</p>
                        <button onClick={openAddModal} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Add Department
                        </button>
                    </div>
                )}
            </div>

            {/* ======= ADD DEPARTMENT MODAL ======= */}
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
                            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Add Department</h3>
                                        <p className="text-xs text-slate-500 font-medium">Create department & assign head</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {renderModalForm()}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={handleSubmit} disabled={!deptForm.name.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <CheckCircle2 className="w-4 h-4" /> Create Department
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======= EDIT DEPARTMENT MODAL ======= */}
            <AnimatePresence>
                {editingDept && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => setEditingDept(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <Edit3 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Edit Department</h3>
                                        <p className="text-xs text-slate-500 font-medium">Update department & head details</p>
                                    </div>
                                </div>
                                <button onClick={() => setEditingDept(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {renderModalForm()}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
                                <button onClick={() => setEditingDept(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={handleSubmit} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Save Changes
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
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Department?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6 max-w-xs mx-auto">
                                This will permanently remove <strong className="text-slate-800">{departments.find(d => d.id === deleteConfirmId)?.name}</strong> and its head assignment.
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

            {/* ======= ADD FACULTY MODAL ======= */}
            <AnimatePresence>
                {addingFacultyDeptId !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                        onClick={() => { setAddingFacultyDeptId(null); setFacultySearchQuery(''); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-slate-900">Add Faculty</h3>
                                    <p className="text-xs text-slate-500">to {departments.find(d => d.id === addingFacultyDeptId)?.name} Department</p>
                                </div>
                                <button onClick={() => { setAddingFacultyDeptId(null); setFacultySearchQuery(''); }} className="p-2 text-slate-400 hover:bg-white hover:text-slate-700 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div ref={facultyDropdownRef} className="relative">
                                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                                    <input
                                        type="text"
                                        value={facultySearchQuery}
                                        onChange={(e) => { setFacultySearchQuery(e.target.value); setIsFacultyDropdownOpen(true); }}
                                        onFocus={() => setIsFacultyDropdownOpen(true)}
                                        placeholder="Type Name or Email Id..."
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm"
                                        autoFocus
                                    />
                                    {isFacultyDropdownOpen && facultySearchQuery.length > 0 && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {filteredAddFaculty.length > 0 ? (
                                                <div className="py-2">
                                                    {filteredAddFaculty.map(faculty => (
                                                        <button
                                                            key={faculty.id}
                                                            type="button"
                                                            onClick={() => handleAddFaculty(faculty)}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                                <User className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 text-sm">{faculty.name}</p>
                                                                <p className="text-xs text-slate-500">{faculty.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-sm text-slate-500">
                                                    No faculty found matching "{facultySearchQuery}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
