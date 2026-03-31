"use client";

import React, { useState } from 'react';
import { useAssessmentStore, AssessmentMode, AssessmentModeDetail, Assessment } from '@/store/assessmentStore';
import { User, useUserStore } from '@/store/userStore';
import { Plus, Stethoscope, CheckCircle2, Share2, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Props {
    students: User[];
}

export default function ClinicalAssessments({ students }: Props) {
    const { assessments, studentRecords, addAssessment, updateAssessment, upsertStudentRecord } = useAssessmentStore();
    const { users } = useUserStore();
    
    const clinicalAssessments = assessments.filter(a => a.type === 'clinical');
    
    // View state
    const [view, setView] = useState<'list' | 'create' | 'enter_data'>('list');
    const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Form state for creating assessment
    const [name, setName] = useState('');
    const [date, setDate] = useState('');

    const activeAssessment = activeAssessmentId ? assessments.find(a => a.id === activeAssessmentId) : null;

    const handleCreate = () => {
        if (!name || !date) return;
        
        addAssessment({
            name,
            type: 'clinical',
            date,
            isApproved: false
        });
        
        setName('');
        setDate('');
        setView('list');
    };

    const handleStartEntering = (id: string) => {
        setActiveAssessmentId(id);
        setView('enter_data');
    };

    const handleApprove = () => {
        if (!activeAssessment) return;
        updateAssessment(activeAssessment.id, { isApproved: true });
    };

    const generatePDF = async (): Promise<jsPDF | null> => {
        if (!activeAssessment) return null;
        try {
            setIsGeneratingPDF(true);
            const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for clinical table
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let y = 20;

            const checkPageBreak = (neededHeight: number) => {
                if (y + neededHeight > pageHeight - 20) {
                    pdf.addPage();
                    y = 20;
                }
            };

            // 1. Institute Logo
            const admin = users.find(u => u.role === 'instadmin');
            const instituteName = admin?.institutionName || 'Institute Name';
            const logoUrl = admin?.institutionLogo;

            if (logoUrl) {
                try {
                    pdf.addImage(logoUrl, 'PNG', pageWidth / 2 - 10, y, 20, 20);
                    y += 25;
                } catch {
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "italic");
                    pdf.text('[ Institute Logo ]', pageWidth / 2, y, { align: 'center' });
                    y += 8;
                }
            } else {
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "italic");
                pdf.text('[ Institute Logo ]', pageWidth / 2, y, { align: 'center' });
                y += 8;
            }

            // 2. Institute Name
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(18);
            pdf.text(instituteName, pageWidth / 2, y, { align: 'center' });
            y += 8;

            // 3. Mentorship Program
            pdf.setFontSize(14);
            pdf.text(`${activeAssessment.name} (${activeAssessment.date})`, pageWidth / 2, y, { align: 'center' });
            y += 8;

            // 4. Assessment Title
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            pdf.text('Clinical Posting Phase', pageWidth / 2, y, { align: 'center' });
            y += 15;

            // Approval Status
            if (activeAssessment.isApproved) {
                pdf.setTextColor(16, 185, 129); // Emerald-500
                pdf.text("STATUS: APPROVED & SIGNED BY HOD", pageWidth / 2, y, { align: 'center' });
                pdf.setTextColor(0, 0, 0);
            } else {
                pdf.setTextColor(239, 68, 68); // Red-500
                pdf.text("STATUS: DRAFT (Pending Approval)", pageWidth / 2, y, { align: 'center' });
                pdf.setTextColor(0, 0, 0);
            }
            y += 12;

            // Table Header
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            let xOffset = 14;
            pdf.text('Student', xOffset, y);
            xOffset += 60;
            pdf.text('Attendance %', xOffset, y);
            xOffset += 40;
            pdf.text('Overall Assessment', xOffset, y);
            xOffset += 60;
            pdf.text('Remarks', xOffset, y);
            y += 6;

            // Table Rows
            pdf.setFont("helvetica", "normal");
            for (let i = 0; i < students.length; i++) {
                checkPageBreak(15);
                const s = students[i];
                const record = studentRecords.find(r => r.assessmentId === activeAssessment.id && r.studentId === s.id);
                
                let curX = 14;
                const mockRegNo = s.email.split('@')[0].toUpperCase();
                pdf.text(`${s.name} (${mockRegNo})`, curX, y);
                curX += 60;

                const att = record?.marks?.['Attendance%'] ?? '-';
                pdf.text(`${att}%`, curX, y);
                curX += 40;

                const overall = record?.attendanceClassesAttended?.['Overall'] ?? '-';
                pdf.text(String(overall), curX, y);
                curX += 60;

                const remarks = record?.clinicalRemarks ?? '-';
                // Split remarks to fit cell
                const splitRemarks = pdf.splitTextToSize(remarks, 100);
                pdf.text(splitRemarks, curX, y);
                
                y += Math.max(6, splitRemarks.length * 5);
            }

            return pdf;
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Error: ' + (error?.message || String(error)));
            return null;
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleSharePDF = async () => {
        const pdf = await generatePDF();
        if (!pdf) return;
        
        try {
            const blob = pdf.output('blob');
            const file = new File([blob], `${activeAssessment?.name.replace(/\s+/g, '_')}_Clinical.pdf`, { type: 'application/pdf' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Clinical Assessment Records',
                    text: `Here are the uploaded records for ${activeAssessment?.name}.`
                });
            } else {
                pdf.save(`${activeAssessment?.name.replace(/\s+/g, '_')}_Clinical.pdf`);
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
        }
    };

    const handleDownloadPDF = async () => {
        const pdf = await generatePDF();
        if (!pdf) return;
        pdf.save(`${activeAssessment?.name.replace(/\s+/g, '_')}_Clinical.pdf`);
    };

    // Render Data Entry Screen
    if (view === 'enter_data' && activeAssessment) {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-slate-800">{activeAssessment.name}</h3>
                            {activeAssessment.isApproved && (
                                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500">Record attendance, overall grade, and remarks for {students.length} students.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isGeneratingPDF || students.length === 0}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-colors border ${
                                isGeneratingPDF || students.length === 0
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                            }`}
                            title="Download PDF to your computer"
                        >
                            {isGeneratingPDF ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button 
                            onClick={handleSharePDF}
                            disabled={isGeneratingPDF || students.length === 0}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg transition-colors border ${
                                isGeneratingPDF || students.length === 0
                                    ? 'bg-indigo-100 text-indigo-400 border-indigo-200 cursor-not-allowed'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-sm'
                            }`}
                            title="Share to Social Media"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        {!activeAssessment.isApproved && (
                            <button 
                                onClick={handleApprove}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Approve and Sign
                            </button>
                        )}
                        <button 
                            onClick={() => setView('list')}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                        >
                            Back to List
                        </button>
                    </div>
                </div>
                
                <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 font-semibold min-w-[200px] border-r border-slate-200">Student Mentee</th>
                                <th className="px-4 py-3 font-semibold border-r border-slate-200 w-32 text-center">Attendance %</th>
                                <th className="px-4 py-3 font-semibold border-r border-slate-200">Overall Assessment</th>
                                <th className="px-4 py-3 font-semibold">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(student => {
                                // @ts-ignore (we use a wrapper to access zustand cleanly)
                                const store = useAssessmentStore.getState();
                                const record = store.studentRecords.find(r => r.assessmentId === activeAssessment.id && r.studentId === student.id);
                                
                                const updateField = (field: string, val: string | number) => {
                                    if (activeAssessment.isApproved) return;
                                    
                                    if (field === 'attendance') {
                                        if (val === '') {
                                            store.upsertStudentRecord({
                                                assessmentId: activeAssessment.id,
                                                studentId: student.id,
                                                marks: { ...record?.marks, 'Attendance%': undefined as any },
                                                clinicalRemarks: record?.clinicalRemarks,
                                                attendanceClassesAttended: record?.attendanceClassesAttended
                                            });
                                            return;
                                        }
                                        let numVal = typeof val === 'string' ? parseInt(val) : val;
                                        if (isNaN(numVal)) return;
                                        if (numVal < 0) numVal = 0;
                                        if (numVal > 100) numVal = 100;
                                        val = numVal;
                                    }

                                    store.upsertStudentRecord({
                                        assessmentId: activeAssessment.id,
                                        studentId: student.id,
                                        marks: field === 'attendance' ? { ...record?.marks, 'Attendance%': val as number } : record?.marks,
                                        clinicalRemarks: field === 'remarks' ? val as string : record?.clinicalRemarks,
                                        attendanceClassesAttended: field === 'overall' ? { ...record?.attendanceClassesAttended, 'Overall': val as number } : record?.attendanceClassesAttended
                                    });
                                };

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100 bg-white">
                                            {student.name} <div className="text-xs text-slate-400 font-normal">{student.email.split('@')[0].toUpperCase()}</div>
                                        </td>
                                        <td className="px-2 py-2 border-r border-slate-100 align-top">
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={record?.marks?.['Attendance%'] ?? ''}
                                                    onChange={(e) => updateField('attendance', e.target.value)}
                                                    disabled={activeAssessment.isApproved}
                                                    min="0"
                                                    max="100"
                                                    className="w-full text-center py-2 px-2 pr-6 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 disabled:bg-transparent disabled:border-none"
                                                    placeholder="0-100"
                                                />
                                                <span className="absolute right-2 top-2.5 text-slate-400 text-xs font-bold">%</span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-2 border-r border-slate-100 align-top">
                                            <select 
                                                value={record?.attendanceClassesAttended?.['Overall'] ?? ''}
                                                onChange={(e) => updateField('overall', parseInt(e.target.value))}
                                                disabled={activeAssessment.isApproved}
                                                className="w-full py-2 px-2 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 disabled:bg-transparent disabled:border-none"
                                            >
                                                <option value="">Select grading...</option>
                                                <option value="1">Excellent (A)</option>
                                                <option value="2">Good (B)</option>
                                                <option value="3">Satisfactory (C)</option>
                                                <option value="4">Needs Improvement (D)</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2 align-top">
                                            <textarea 
                                                value={record?.clinicalRemarks ?? ''}
                                                onChange={(e) => updateField('remarks', e.target.value)}
                                                disabled={activeAssessment.isApproved}
                                                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-emerald-500 resize-none h-[42px] disabled:bg-transparent disabled:border-none"
                                                placeholder="Add faculty remarks..."
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Render Create Screen
    if (view === 'create') {
        return (
            <div className="p-6 max-w-2xl mx-auto h-full overflow-y-auto">
                <div className="mb-8">
                    <button onClick={() => setView('list')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 block">
                        &larr; Back to Clinical Postings
                    </button>
                    <h3 className="text-2xl font-bold text-slate-900">End of Posting Assessment</h3>
                    <p className="text-slate-500 mt-1">Create a clinical evaluation record for a completed posting.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Name of the Assessment</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. MBBS Second Year Clinical Posting"
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date of Completion</label>
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={handleCreate}
                            disabled={!name || !date}
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Create Assessment
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default View: List
    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-emerald-600" />
                        Clinical Postings
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Evaluate students at the end of their clinical rotations.</p>
                </div>
                <button 
                    onClick={() => setView('create')}
                    className="bg-emerald-600 text-white px-4 py-2 font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Create New
                </button>
            </div>

            {clinicalAssessments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 p-8">
                    <Stethoscope className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-semibold text-lg text-slate-600 mb-1">No Clinical Assessments found.</p>
                    <p className="text-sm">Click 'Create New' to define the first posting evaluation.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {clinicalAssessments.map(assessment => (
                        <div key={assessment.id} className="bg-white border text-left border-slate-200 p-5 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{assessment.date}</div>
                                <h4 className="font-bold text-lg text-slate-900 leading-tight mb-1">{assessment.name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold inline-flex items-center gap-1 ${assessment.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {assessment.isApproved ? <><CheckCircle2 className="w-3 h-3" /> Approved</> : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => handleStartEntering(assessment.id)}
                                className="px-6 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                {assessment.isApproved ? 'View Matrix' : 'Start Entering'} &rarr;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
