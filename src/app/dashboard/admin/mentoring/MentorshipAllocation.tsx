"use client";

import React, { useState, useEffect } from 'react';
import { Network, Users, UserCheck, Search, ArrowRightLeft, Share2, Download, GraduationCap, ChevronDown, ChevronRight, CalendarDays } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { jsPDF } from 'jspdf';

type Mentee = {
    id: number;
    regNo: string;
    name: string;
    year: string;
    email: string;
    phone: string;
    type: 'mentee' | 'peer_mentee';
};

const MENTEE_STORAGE_KEY = 'mededuai_mentoring_mentees';

export default function MentorshipAllocation() {
    const [allocationMode, setAllocationMode] = useState<'manual'|'auto'>('manual');
    const [distributionMethod, setDistributionMethod] = useState<'serial'|'random'>('serial');

    // Search and Selection States
    const [mentorSearchQuery, setMentorSearchQuery] = useState('');
    const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

    // Auto Distribution State
    const [generatedPreview, setGeneratedPreview] = useState<any[]>([]);
    const [isAutoCommitted, setIsAutoCommitted] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Manual Allocation State
    const [manualAllocations, setManualAllocations] = useState<Record<string, string | null>>({});
    const [manualSaveSuccess, setManualSaveSuccess] = useState(false);

    // Student list from localStorage
    const [menteeList, setMenteeList] = useState<Mentee[]>([]);
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
    const [selectedAutoYear, setSelectedAutoYear] = useState<string>('');

    // Fetch users from store (for mentors)
    const { users, updateUser } = useUserStore();
    const mentors = users.filter(u => u.role === 'teacher');
    const mentees = users.filter(u => u.role === 'student');

    const filteredMentors = mentors.filter(m => m.name.toLowerCase().includes(mentorSearchQuery.toLowerCase()) || m.email.toLowerCase().includes(mentorSearchQuery.toLowerCase()));

    // Load mentee list from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(MENTEE_STORAGE_KEY);
            if (raw) {
                const parsed: Mentee[] = JSON.parse(raw);
                setMenteeList(parsed);
                // Auto-expand all years
                const years = [...new Set(parsed.map(m => m.year))].sort().reverse();
                const expanded: Record<string, boolean> = {};
                years.forEach(y => expanded[y] = true);
                setExpandedYears(expanded);
                if (years.length > 0 && !selectedAutoYear) setSelectedAutoYear(years[0]);
            }
        } catch {}
    }, []);

    // Group by year
    const years = [...new Set(menteeList.map(m => m.year))].sort().reverse();

    const toggleYear = (year: string) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const handleGenerateAllocation = () => {
        if (mentors.length === 0 || menteeList.length === 0) {
            alert("Need both mentors and mentees to run distribution engine.");
            return;
        }

        const yearStudents = selectedAutoYear ? menteeList.filter(m => m.year === selectedAutoYear) : menteeList;
        let studentsToDistribute = [...yearStudents];
        
        if (distributionMethod === 'random') {
            studentsToDistribute.sort(() => Math.random() - 0.5);
        } else {
            studentsToDistribute.sort((a, b) => a.name.localeCompare(b.name));
        }

        const previewMap = [];
        for (let i = 0; i < studentsToDistribute.length; i++) {
            const student = studentsToDistribute[i];
            const mentor = mentors[i % mentors.length];
            previewMap.push({ student, mentor });
        }
        
        setGeneratedPreview(previewMap);
        setIsAutoCommitted(false);
    };

    const handleCommitAutoAllocation = () => {
        if (generatedPreview.length === 0) return;
        generatedPreview.forEach(mapping => {
            updateUser(String(mapping.student.id), { mentorId: mapping.mentor.id });
        });
        setIsAutoCommitted(true);
    };

    const handleSaveManualAllocation = () => {
        const changesCount = Object.keys(manualAllocations).length;
        if (changesCount === 0) return;
        Object.entries(manualAllocations).forEach(([studentId, mentorId]) => {
            if (mentorId === null) {
                updateUser(studentId, { mentorId: undefined });
            } else {
                updateUser(studentId, { mentorId });
            }
        });
        setManualAllocations({});
        setManualSaveSuccess(true);
        setTimeout(() => setManualSaveSuccess(false), 3000);
    };

    const generatePDF = async (): Promise<jsPDF | null> => {
        try {
            setIsGeneratingPDF(true);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let y = 20;
            const checkPageBreak = (neededHeight: number) => { if (y + neededHeight > pageHeight - 20) { pdf.addPage(); y = 20; } };

            pdf.setFontSize(12); pdf.setFont("helvetica", "italic"); pdf.text('[ Institute Logo ]', pageWidth / 2, y, { align: 'center' }); y += 8;
            pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.text('Institute Name', pageWidth / 2, y, { align: 'center' }); y += 10;
            pdf.setFontSize(16); pdf.text('Mentorship Program', pageWidth / 2, y, { align: 'center' }); y += 8;
            pdf.setFontSize(14); pdf.setFont("helvetica", "normal"); pdf.text('Mentor- Mentee Allocation List', pageWidth / 2, y, { align: 'center' }); y += 15;

            const mentorGroups = mentors.map(mentor => ({
                mentor,
                students: mentees.filter(m => m.mentorId === mentor.id)
            })).filter(g => g.students.length > 0);

            if (mentorGroups.length === 0) { pdf.setFontSize(12); pdf.text("No mappings available to export.", 14, y); }

            for (const group of mentorGroups) {
                checkPageBreak(20);
                pdf.setFont("helvetica", "bold"); pdf.setFontSize(12);
                pdf.text(group.mentor.name + ', Faculty, Department of Medicine', 14, y); y += 6;
                pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.setTextColor(60, 60, 60);
                for (let i = 0; i < group.students.length; i++) {
                    checkPageBreak(10);
                    const s = group.students[i];
                    const mockRegNo = s.email.split('@')[0].toUpperCase();
                    pdf.text('  •   ' + s.name + ', Reg No: ' + mockRegNo, 14, y); y += 6;
                }
                pdf.setTextColor(0, 0, 0); y += 6;
            }
            return pdf;
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Error: ' + (error?.message || String(error)));
            return null;
        } finally { setIsGeneratingPDF(false); }
    };

    const handleSharePDF = async () => {
        const pdf = await generatePDF();
        if (!pdf) return;
        try {
            const blob = pdf.output('blob');
            const file = new File([blob], 'Mentorship_Allocations.pdf', { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Mentorship Allocations', text: 'Here are the latest mentorship allocations from MedEduAI.' });
            } else { pdf.save('Mentorship_Allocations.pdf'); }
        } catch (error) {
            if ((error as Error).name !== 'AbortError') alert('Sharing failed or was cancelled. Try downloading instead.');
        }
    };

    const handleDownloadPDF = async () => { const pdf = await generatePDF(); if (pdf) pdf.save('Mentorship_Allocations.pdf'); };

    return (
        <div className="w-full text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mentorship Allocation</h2>
                    <p className="text-slate-500">View students year-wise and allocate mentors manually or through auto-distribution.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setAllocationMode('manual')}
                        className={`px-4 py-2 font-bold rounded-lg transition-colors ${allocationMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Manual Allocation
                    </button>
                    <button 
                        onClick={() => setAllocationMode('auto')}
                        className={`px-4 py-2 font-bold rounded-lg transition-colors ${allocationMode === 'auto' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Auto Distribute
                    </button>
                </div>
            </div>

            {/* ── Year-wise Student List ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-violet-600" />
                        <h3 className="font-bold text-slate-800">Uploaded Students (Year-wise)</h3>
                        <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{menteeList.length}</span>
                    </div>
                </div>
                
                {menteeList.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-slate-300" /></div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Students Uploaded</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">Go to Step 3 (Mentee Management) to upload students by year first.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {years.map(year => {
                            const yearMentees = menteeList.filter(m => m.year === year);
                            const isExpanded = expandedYears[year] ?? false;
                            return (
                                <div key={year}>
                                    <button 
                                        onClick={() => toggleYear(year)}
                                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
                                                {year.split('-')[0].slice(2)}
                                            </div>
                                            <div className="text-left">
                                                <h4 className="font-bold text-slate-900">{year}</h4>
                                                <p className="text-xs text-slate-500">{yearMentees.length} student{yearMentees.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">{yearMentees.filter(m => m.type === 'mentee').length} Mentees</span>
                                            {yearMentees.filter(m => m.type === 'peer_mentee').length > 0 && (
                                                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">{yearMentees.filter(m => m.type === 'peer_mentee').length} Peers</span>
                                            )}
                                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </button>
                                    {isExpanded && (
                                        <div className="bg-slate-50/50 border-t border-slate-100">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="bg-white border-b border-slate-100 text-[10px]">
                                                        <th className="px-6 py-2.5 font-bold text-slate-500 uppercase tracking-wider">#</th>
                                                        <th className="px-6 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                                                        <th className="px-6 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Reg. No</th>
                                                        <th className="px-6 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                                        <th className="px-6 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                                        <th className="px-6 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {yearMentees.map((mentee, idx) => (
                                                        <tr key={mentee.id} className="hover:bg-white transition-colors">
                                                            <td className="px-6 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${mentee.type === 'peer_mentee' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                                                                        {mentee.name.substring(0,2).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-bold text-slate-900">{mentee.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-600 font-mono text-xs">{mentee.regNo}</td>
                                                            <td className="px-6 py-3">
                                                                {mentee.type === 'peer_mentee' ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">Peer</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200">Mentee</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-500 text-xs">{mentee.email}</td>
                                                            <td className="px-6 py-3 text-slate-500 text-xs">{mentee.phone}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {allocationMode === 'auto' ? (
                <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-8 mb-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <Network className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Automatic Distribution Engine</h3>
                            <p className="text-sm text-slate-600">Select batch year and distribution logic to auto-map mentees.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Step 1: Select Student Batch Year</label>
                            <select 
                                value={selectedAutoYear}
                                onChange={(e) => setSelectedAutoYear(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">All Years</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Step 2: Distribution Logic</label>
                            <select 
                                value={distributionMethod}
                                onChange={(e) => setDistributionMethod(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="serial">Serial (by Registration #)</option>
                                <option value="random">Randomized</option>
                            </select>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-end">
                            <button 
                                onClick={handleGenerateAllocation}
                                className="w-full py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors shadow-sm"
                            >
                                Generate Allocation
                            </button>
                        </div>
                    </div>
                    
                    {generatedPreview.length === 0 ? (
                        <div className="bg-white bg-opacity-60 rounded-xl p-4 text-center border-2 border-dashed border-amber-200">
                            <p className="text-slate-500 font-medium">Configure settings above and click Generate to preview the distribution graph before committing to the database.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Preview: {generatedPreview.length} Mappings Generated</h3>
                                <button 
                                    onClick={handleCommitAutoAllocation}
                                    disabled={isAutoCommitted}
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${
                                        isAutoCommitted 
                                            ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                >
                                    {isAutoCommitted ? 'Saved to Database ✓' : 'Commit to Database'}
                                </button>
                            </div>
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 font-bold text-slate-700">Student Mentee</th>
                                            <th className="px-4 py-3 font-bold text-slate-700">Year</th>
                                            <th className="px-4 py-3 font-bold text-slate-700">Assigned Faculty Mentor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {generatedPreview.map((mapping, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{mapping.student.name} <span className="text-xs text-slate-400 ml-1">{mapping.student.regNo}</span></td>
                                                <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">{mapping.student.year}</span></td>
                                                <td className="px-4 py-3 text-emerald-700 font-medium flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4" />
                                                    {mapping.mentor.name}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Current Database Allocations */}
                    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800">Current Database Allocations</h3>
                                <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">{mentees.filter(m => m.mentorId).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleDownloadPDF}
                                    disabled={isGeneratingPDF || mentees.filter(m => m.mentorId).length === 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg transition-colors border ${
                                        isGeneratingPDF || mentees.filter(m => m.mentorId).length === 0
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                                    }`}
                                    title="Download PDF to your computer"
                                >
                                    {isGeneratingPDF ? <span className="animate-pulse">Saving...</span> : <><Download className="w-4 h-4" /> Download</>}
                                </button>
                                <button 
                                    onClick={handleSharePDF}
                                    disabled={isGeneratingPDF || mentees.filter(m => m.mentorId).length === 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-lg transition-colors border ${
                                        isGeneratingPDF || mentees.filter(m => m.mentorId).length === 0
                                            ? 'bg-indigo-100 text-indigo-400 border-indigo-200 cursor-not-allowed'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-sm'
                                    }`}
                                    title="Share to Social Media"
                                >
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto bg-white p-2">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-slate-700">Student Mentee</th>
                                        <th className="px-4 py-3 font-bold text-slate-700">Assigned Faculty Mentor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mentees.filter(m => m.mentorId).length === 0 ? (
                                        <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500 italic">No students are currently allocated.</td></tr>
                                    ) : (
                                        mentees.filter(m => m.mentorId).map((mentee, idx) => {
                                            const assignedMentor = mentors.find(m => m.id === mentee.mentorId);
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{mentee.name} <span className="text-xs text-slate-400 font-normal ml-1">({mentee.email})</span></td>
                                                    <td className="px-4 py-3 text-emerald-700 font-medium flex items-center gap-2"><UserCheck className="w-4 h-4" /> {assignedMentor ? assignedMentor.name : 'Unknown Mentor'}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Select Mentor List */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 mb-3">1. Select Mentor</h3>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input 
                                    type="text"
                                    value={mentorSearchQuery}
                                    onChange={(e) => setMentorSearchQuery(e.target.value)}
                                    placeholder="Search specific mentor..."
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredMentors.length > 0 ? filteredMentors.map((mentor, i) => {
                                const isSelected = selectedMentorId === mentor.id || (selectedMentorId === null && i === 0);
                                const assignedCount = mentees.filter(m => {
                                    const effectiveId = manualAllocations[m.id] !== undefined ? manualAllocations[m.id] : m.mentorId;
                                    return effectiveId === mentor.id;
                                }).length;
                                return (
                                <button key={mentor.id} onClick={() => setSelectedMentorId(mentor.id)} className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 hover:border-emerald-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                            {mentor.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{mentor.name}</p>
                                            <p className="text-xs text-slate-500">Institution Faculty • {mentor.email}</p>
                                            <p className="text-xs text-emerald-600 font-medium mt-1">Currently mapped: {assignedCount} students</p>
                                        </div>
                                    </div>
                                    {isSelected && <UserCheck className="w-5 h-5 text-emerald-600" />}
                                </button>
                                );
                            }) : <p className="text-sm text-slate-500 p-2 text-center border border-dashed border-slate-200 rounded-lg">No mentors found</p>}
                        </div>
                    </div>

                    {/* Mentees Assign */}
                    <div className="bg-white border text-left border-slate-200 rounded-2xl shadow-sm flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 mb-3">2. Assign Students to {selectedMentorId ? mentors.find(m => m.id === selectedMentorId)?.name : mentors[0]?.name || 'Selected Mentor'}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {mentees.length > 0 ? mentees.map((mentee) => {
                                const activeMentorId = selectedMentorId || mentors[0]?.id;
                                const effectiveMentorId = manualAllocations[mentee.id] !== undefined ? manualAllocations[mentee.id] : mentee.mentorId;
                                const isAssignedToCurrent = effectiveMentorId === activeMentorId;
                                const isAssignedToOther = effectiveMentorId && effectiveMentorId !== activeMentorId;
                                return (
                                <div key={mentee.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                    <div className="flex flex-col mb-2 sm:mb-0">
                                        <p className="font-bold text-sm text-slate-800">{mentee.name}</p>
                                        <p className="text-xs text-slate-500">{mentee.email}</p>
                                        {isAssignedToOther && <p className="text-xs text-amber-500 font-medium mt-1">Assigned to another mentor</p>}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!activeMentorId) return;
                                            setManualAllocations(prev => {
                                                if (isAssignedToCurrent) return { ...prev, [mentee.id]: null };
                                                else return { ...prev, [mentee.id]: activeMentorId };
                                            });
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                                            isAssignedToCurrent 
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                                                : isAssignedToOther
                                                    ? 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        }`}
                                    >
                                        {isAssignedToCurrent ? 'Assigned ✓' : isAssignedToOther ? 'Re-assign' : '+ Assign'}
                                    </button>
                                </div>
                                );
                            }) : <p className="text-sm text-slate-500 p-2 text-center border border-dashed border-slate-200 rounded-lg">No students found</p>}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button 
                                onClick={handleSaveManualAllocation}
                                disabled={Object.keys(manualAllocations).length === 0 && !manualSaveSuccess}
                                className={`w-full py-2 font-bold rounded-lg transition-colors shadow-sm ${
                                    manualSaveSuccess
                                        ? 'bg-emerald-500 text-white'
                                        : Object.keys(manualAllocations).length > 0 
                                            ? 'bg-slate-900 text-white hover:bg-slate-800' 
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {manualSaveSuccess ? 'Saved to Database ✓' : 'Save Manual Allocations'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
