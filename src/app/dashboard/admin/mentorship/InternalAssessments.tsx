"use client";

import React, { useState } from 'react';
import { useAssessmentStore, AssessmentMode, AssessmentModeDetail, Assessment } from '@/store/assessmentStore';
import { User, useUserStore } from '@/store/userStore';
import { Plus, BookOpen, Share2, Download, Target, Users, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Props {
    students: User[];
}

export default function InternalAssessments({ students }: Props) {
    const { assessments, studentRecords, addAssessment, upsertStudentRecord } = useAssessmentStore();
    const { users } = useUserStore();
    
    const internalAssessments = assessments.filter(a => a.type === 'internal');
    
    // View state
    const [view, setView] = useState<'list' | 'create' | 'enter_data'>('list');
    const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // Form state for creating assessment
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [modes, setModes] = useState<AssessmentModeDetail[]>([
        { mode: 'Theory', maxMarks: 100, totalClasses: 30 }
    ]);

    const activeAssessment = activeAssessmentId ? assessments.find(a => a.id === activeAssessmentId) : null;

    const handleCreate = () => {
        if (!name || modes.length === 0 || !date) return;
        
        addAssessment({
            name,
            type: 'internal',
            date,
            modes
        });
        
        // Reset and go back
        setName('');
        setDate('');
        setModes([{ mode: 'Theory', maxMarks: 100, totalClasses: 30 }]);
        setView('list');
    };

    const handleAddMode = () => {
        setModes([...modes, { mode: 'Practical', maxMarks: 50, totalClasses: 20 }]);
    };
    
    const handleUpdateMode = (index: number, field: keyof AssessmentModeDetail, value: any) => {
        const newModes = [...modes];
        newModes[index] = { ...newModes[index], [field]: value };
        setModes(newModes);
    };

    const handleStartEntering = (id: string) => {
        setActiveAssessmentId(id);
        setView('enter_data');
    };

    const generatePDF = async (): Promise<jsPDF | null> => {
        if (!activeAssessment) return null;
        try {
            setIsGeneratingPDF(true);
            const pdf = new jsPDF('p', 'mm', 'a4');
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
            pdf.text(activeAssessment.name, pageWidth / 2, y, { align: 'center' });
            y += 8;

            // 4. Assessment Title
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            pdf.text('Internal Assessment', pageWidth / 2, y, { align: 'center' });
            y += 15;

            // Table Header
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            let xOffset = 14;
            pdf.text('Student', xOffset, y);
            xOffset += 40;
            
            activeAssessment.modes?.forEach(m => {
                pdf.text(`${m.mode} (M:${m.maxMarks}${m.totalClasses ? `, C:${m.totalClasses}` : ''})`, xOffset, y);
                xOffset += 40;
            });
            y += 6;

            // Table Rows
            pdf.setFont("helvetica", "normal");
            for (let i = 0; i < students.length; i++) {
                checkPageBreak(10);
                const s = students[i];
                const record = studentRecords.find(r => r.assessmentId === activeAssessment.id && r.studentId === s.id);
                
                let curX = 14;
                // Student Name & Reg No
                const mockRegNo = s.email.split('@')[0].toUpperCase();
                pdf.text(`${s.name} (${mockRegNo})`, curX, y);
                curX += 40;

                // Marks Loop
                activeAssessment.modes?.forEach(m => {
                    const marks = record?.marks?.[m.mode] ?? '-';
                    const att = record?.attendanceClassesAttended?.[m.mode] ?? '-';
                    const text = m.totalClasses ? `M: ${marks}  A: ${att}` : `M: ${marks}`;
                    pdf.text(String(text), curX, y);
                    curX += 40;
                });
                
                y += 6;
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
            const file = new File([blob], `${activeAssessment?.name.replace(/\s+/g, '_')}_Internal.pdf`, { type: 'application/pdf' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Internal Assessment Records',
                    text: `Here are the uploaded records for ${activeAssessment?.name}.`
                });
            } else {
                pdf.save(`${activeAssessment?.name.replace(/\s+/g, '_')}_Internal.pdf`);
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
        }
    };

    const handleDownloadPDF = async () => {
        const pdf = await generatePDF();
        if (!pdf) return;
        pdf.save(`${activeAssessment?.name.replace(/\s+/g, '_')}_Internal.pdf`);
    };

    // Render Data Entry Screen (Same structure as Formative)
    if (view === 'enter_data' && activeAssessment) {
        return (
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">{activeAssessment.name}</h3>
                        <p className="text-sm text-slate-500">Record marks and attendance for {students.length} students.</p>
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
                                <th className="px-4 py-3 font-semibold min-w-[200px] border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Student</th>
                                {activeAssessment.modes?.map((m, idx) => (
                                    <th key={idx} colSpan={m.totalClasses ? 2 : 1} className="px-4 py-3 font-semibold border-r border-slate-200 text-center">
                                        <div className="font-bold text-slate-800">{m.mode}</div>
                                        <div className="text-xs font-normal mt-1 flex justify-center gap-4">
                                            <span>Max: {m.maxMarks}</span>
                                            {m.totalClasses && <span className="text-indigo-600">Classes: {m.totalClasses}</span>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-slate-100">
                                <th className="px-4 py-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-10">Name & Reg No</th>
                                {activeAssessment.modes?.map((m, idx) => (
                                    <React.Fragment key={idx}>
                                        <th className="px-2 py-2 text-center text-xs border-r border-slate-200 font-medium">Marks Obtained</th>
                                        {m.totalClasses && <th className="px-2 py-2 text-center text-xs border-r border-slate-200 text-indigo-700 font-medium">Classes Attended</th>}
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(student => {
                                const record = studentRecords.find(r => r.assessmentId === activeAssessment.id && r.studentId === student.id);
                                
                                const handleUpdateMarks = (mode: string, val: string, max: number) => {
                                    if (val === '') {
                                        upsertStudentRecord({
                                            assessmentId: activeAssessment.id,
                                            studentId: student.id,
                                            marks: { ...record?.marks, [mode]: undefined as any },
                                            attendanceClassesAttended: record?.attendanceClassesAttended || {}
                                        });
                                        return;
                                    }
                                    let numVal = parseInt(val);
                                    if (isNaN(numVal)) return;
                                    if (numVal < 0) numVal = 0;
                                    if (numVal > max) numVal = max;

                                    upsertStudentRecord({
                                        assessmentId: activeAssessment.id,
                                        studentId: student.id,
                                        marks: { ...record?.marks, [mode]: numVal },
                                        attendanceClassesAttended: record?.attendanceClassesAttended || {}
                                    });
                                };
                                
                                const handleUpdateAttendance = (mode: string, val: string, max: number) => {
                                    if (val === '') {
                                        upsertStudentRecord({
                                            assessmentId: activeAssessment.id,
                                            studentId: student.id,
                                            marks: record?.marks || {},
                                            attendanceClassesAttended: { ...record?.attendanceClassesAttended, [mode]: undefined as any }
                                        });
                                        return;
                                    }
                                    let numVal = parseInt(val);
                                    if (isNaN(numVal)) return;
                                    if (numVal < 0) numVal = 0;
                                    if (numVal > max) numVal = max;

                                    upsertStudentRecord({
                                        assessmentId: activeAssessment.id,
                                        studentId: student.id,
                                        marks: record?.marks || {},
                                        attendanceClassesAttended: { ...record?.attendanceClassesAttended, [mode]: numVal }
                                    });
                                };

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-900 border-r border-slate-100 sticky left-0 bg-white">
                                            {student.name} <div className="text-xs text-slate-400 font-normal">{student.email.split('@')[0].toUpperCase()}</div>
                                        </td>
                                        {activeAssessment.modes?.map((m, idx) => {
                                            const marks = record?.marks?.[m.mode] ?? '';
                                            const attendance = record?.attendanceClassesAttended?.[m.mode] ?? '';
                                            
                                            return (
                                                <React.Fragment key={idx}>
                                                    <td className="px-2 py-2 border-r border-slate-100 align-top">
                                                        <input 
                                                            type="number"
                                                            value={marks}
                                                            onChange={(e) => handleUpdateMarks(m.mode, e.target.value, m.maxMarks)}
                                                            min="0"
                                                            max={m.maxMarks}
                                                            className="w-full text-center py-1.5 px-2 bg-slate-100 border-none rounded focus:ring-2 focus:ring-emerald-500"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                    {m.totalClasses && (
                                                        <td className="px-2 py-2 border-r border-slate-100 align-top">
                                                            <input 
                                                                type="number"
                                                                value={attendance}
                                                                onChange={(e) => handleUpdateAttendance(m.mode, e.target.value, m.totalClasses!)}
                                                                min="0"
                                                                max={m.totalClasses}
                                                                className="w-full text-center py-1.5 px-2 bg-indigo-50 text-indigo-900 border-none rounded focus:ring-2 focus:ring-indigo-500"
                                                                placeholder="-"
                                                            />
                                                            {attendance !== '' && (
                                                                <div className="text-center text-[10px] mt-1 font-bold text-indigo-400">
                                                                    {Math.round((Number(attendance) / m.totalClasses) * 100)}%
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
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
                        &larr; Back to Internal Assessments
                    </button>
                    <h3 className="text-2xl font-bold text-slate-900">Create Internal Assessment</h3>
                    <p className="text-slate-500 mt-1">Define the modes, max marks, and attendance requirements.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Name of the Assessment</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Mid-Term Internal"
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Date Planned</label>
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-800">Modes & Attendance</h4>
                            <button 
                                onClick={handleAddMode}
                                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> Add Mode
                            </button>
                        </div>
                        
                        {modes.map((mode, idx) => (
                            <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mode</label>
                                    <select 
                                        value={mode.mode}
                                        onChange={(e) => handleUpdateMode(idx, 'mode', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
                                    >
                                        <option value="Theory">Theory</option>
                                        <option value="Practical">Practical</option>
                                        <option value="Viva">Viva</option>
                                        <option value="Clinical">Clinical</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Max Marks</label>
                                    <input 
                                        type="number"
                                        value={mode.maxMarks}
                                        onChange={(e) => handleUpdateMode(idx, 'maxMarks', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Classes</label>
                                    <input 
                                        type="number"
                                        value={mode.totalClasses || ''}
                                        onChange={(e) => handleUpdateMode(idx, 'totalClasses', e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="Optional"
                                        className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg"
                                    />
                                </div>
                            </div>
                        ))}
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
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                        Internal Assessments
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Manage and track regular internal student assessments.</p>
                </div>
                <button 
                    onClick={() => setView('create')}
                    className="bg-emerald-600 text-white px-4 py-2 font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Create New
                </button>
            </div>

            {internalAssessments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 p-8">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-semibold text-lg text-slate-600 mb-1">No Internal Assessments found.</p>
                    <p className="text-sm">Click 'Create New' to define the first assessment framework.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {internalAssessments.map(assessment => (
                        <div key={assessment.id} className="bg-white border text-left border-slate-200 p-5 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{assessment.date}</div>
                                    <h4 className="font-bold text-lg text-slate-900 leading-tight">{assessment.name}</h4>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                {assessment.modes?.map((m, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-semibold">
                                        {m.mode} <span className="text-slate-400 font-normal">({m.maxMarks})</span>
                                    </span>
                                ))}
                            </div>

                            <button 
                                onClick={() => handleStartEntering(assessment.id)}
                                className="w-full py-2 bg-slate-50 text-emerald-700 font-bold text-sm rounded-lg group-hover:bg-emerald-50 transition-colors border border-transparent group-hover:border-emerald-100"
                            >
                                Start Entering &rarr;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
