"use client";

import React, { useState } from 'react';
import { Plus, Save, UploadCloud, Users, CheckSquare } from 'lucide-react';

export default function FormativeAssessments() {
    const [assessmentSetup, setAssessmentSetup] = useState({
        name: '',
        mode: 'theory',
        maxMarks: 100,
        date: '',
        totalClasses: 0
    });

    const [isSetupComplete, setIsSetupComplete] = useState(false);

    // Dummy student roster
    const [students, setStudents] = useState([
        { id: 1, regNo: 'MED-001', name: 'Alice Walker', marks: '', attendance: '' },
        { id: 2, regNo: 'MED-002', name: 'Bob Johnson', marks: '', attendance: '' },
        { id: 3, regNo: 'MED-045', name: 'Charlie Davis', marks: '', attendance: '' },
    ]);

    const handleMarksChange = (id: number, value: string) => {
        setStudents(students.map(s => s.id === id ? { ...s, marks: value } : s));
    };

    const handleAttendanceChange = (id: number, value: string) => {
        setStudents(students.map(s => s.id === id ? { ...s, attendance: value } : s));
    };

    return (
        <div className="w-full text-left">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Formative Assessments</h2>
                <p className="text-slate-500">Create new assessments and record student performance.</p>
            </div>

            {!isSetupComplete ? (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-600" /> New Assessment Setup
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Assessment Name</label>
                            <input 
                                type="text"
                                value={assessmentSetup.name}
                                onChange={e => setAssessmentSetup({...assessmentSetup, name: e.target.value})}
                                placeholder="e.g. Mid-Term Theory Exam"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Assessment Mode</label>
                            <select 
                                value={assessmentSetup.mode}
                                onChange={e => setAssessmentSetup({...assessmentSetup, mode: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="theory">Theory</option>
                                <option value="practical">Practical</option>
                                <option value="viva">Viva</option>
                                <option value="clinical">Clinical</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Maximum Marks</label>
                            <input 
                                type="number"
                                value={assessmentSetup.maxMarks}
                                onChange={e => setAssessmentSetup({...assessmentSetup, maxMarks: parseInt(e.target.value)})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Total Classes Conducted</label>
                            <input 
                                type="number"
                                value={assessmentSetup.totalClasses}
                                onChange={e => setAssessmentSetup({...assessmentSetup, totalClasses: parseInt(e.target.value)})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            disabled={!assessmentSetup.name}
                            onClick={() => setIsSetupComplete(true)}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            Generate Entry Grid
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-6 bg-indigo-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{assessmentSetup.name}</h3>
                            <div className="flex gap-4 text-sm font-medium text-slate-600 mt-1">
                                <span className="capitalize px-2 py-0.5 bg-white border border-slate-200 rounded-md">Mode: {assessmentSetup.mode}</span>
                                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">Max Marks: {assessmentSetup.maxMarks}</span>
                                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">Classes: {assessmentSetup.totalClasses}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm">
                                <UploadCloud className="w-4 h-4" /> Bulk Upload (CSV)
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm text-sm">
                                <Save className="w-4 h-4" /> Save Records
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Student</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs w-48">Marks Obtained</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs w-48">Classes Attended</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs w-24 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map((student) => {
                                    const percent = student.marks ? (parseFloat(student.marks) / assessmentSetup.maxMarks) * 100 : null;
                                    const isPass = percent !== null && percent >= 50;

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                                        <Users className="w-3 h-3" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{student.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{student.regNo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="number"
                                                    value={student.marks}
                                                    onChange={e => handleMarksChange(student.id, e.target.value)}
                                                    placeholder={`0 - ${assessmentSetup.maxMarks}`}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-900"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input 
                                                    type="number"
                                                    value={student.attendance}
                                                    onChange={e => handleAttendanceChange(student.id, e.target.value)}
                                                    placeholder={`0 - ${assessmentSetup.totalClasses}`}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-900"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {percent !== null ? (
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                        {isPass ? <CheckSquare className="w-3 h-3" /> : null}
                                                        {isPass ? 'PASS' : 'FAIL'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
