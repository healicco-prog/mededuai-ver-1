"use client";

import React, { useState } from 'react';
import {
    ClipboardList, BookOpen, FileText, CheckCircle2,
    Layers, PenTool, Hash, Download, Copy, RefreshCw, Loader2
} from 'lucide-react';

const SESSION_TYPES = [
    'Long Essay Questions (LEQ)',
    'Short Essay Questions (SEQ)',
    'Short Answer Questions (SAQ)',
    'Modified Essay Questions (MEQ)',
    'OSCE – Objective Structured Clinical Examination',
    'OSPE – Objective Structured Practical Examination',
    'Communications',
    'Viva',
    'Microteaching',
    'Lecture',
    'Group Discussion',
    'Tutorials',
    'Case presentations',
    'Seminars',
    'Workplace-Based Assessments',
    'Type any other'
];

interface RubricRow {
    criteria: string;
    excellent: string;
    good: string;
    average: string;
    poor: string;
    marks: number | string;
}

export default function RubricsGeneratorPage() {
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
    const [customSessionType, setCustomSessionType] = useState('');
    const [totalMarks, setTotalMarks] = useState<number | ''>('');

    const [loading, setLoading] = useState(false);
    const [rubric, setRubric] = useState<RubricRow[] | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!subject || !topic || !totalMarks) {
            setError('Please fill in all details (Subject, Topic, and Total Marks).');
            return;
        }

        const finalSessionType = sessionType === 'Type any other' ? customSessionType : sessionType;
        if (!finalSessionType) {
            setError('Please specify the session type.');
            return;
        }

        setError('');
        setLoading(true);
        setRubric(null);

        try {
            const res = await fetch('/api/rubrics-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    topic,
                    sessionType: finalSessionType,
                    totalMarks
                })
            });

            const data = await res.json();
            if (data.success && data.rubric) {
                setRubric(data.rubric);
            } else {
                setError('Failed to generate rubric. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred during generation.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!rubric) return;
        let text = `Evaluation Rubric\nSubject: ${subject} | Topic: ${topic} | Marks: ${totalMarks}\n\n`;
        text += "Criteria\tExcellent\tGood\tAverage\tPoor\tMarks\n";
        rubric.forEach(r => {
            text += `${r.criteria}\t${r.excellent}\t${r.good}\t${r.average}\t${r.poor}\t${r.marks}\n`;
        });
        navigator.clipboard.writeText(text);
        alert('Rubric copied to clipboard!');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl print:hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.25),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <ClipboardList className="w-6 h-6 text-emerald-200" />
                            </div>
                            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-[0.2em]">Department Admin</p>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Rubrics Generator</h1>
                        <p className="text-emerald-200/80 mt-1.5 font-medium">
                            Automatically generate structured evaluation rubrics for any academic assessment.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-200 font-medium print:hidden">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-6 print:hidden">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                            <PenTool className="w-5 h-5 text-emerald-600" /> Assessment Details
                        </h2>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" /> Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="E.g. Anatomy"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Topic
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="E.g. Upper Limb Bones"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> Session Type
                            </label>
                            <select
                                value={sessionType}
                                onChange={(e) => setSessionType(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                            >
                                {SESSION_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {sessionType === 'Type any other' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Custom Session Type
                                </label>
                                <input
                                    type="text"
                                    value={customSessionType}
                                    onChange={(e) => setCustomSessionType(e.target.value)}
                                    placeholder="Enter custom type..."
                                    className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Hash className="w-3.5 h-3.5" /> Total Marks
                            </label>
                            <input
                                type="number"
                                value={totalMarks}
                                onChange={(e) => setTotalMarks(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="E.g. 10"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Generating AI Rubric...</>
                            ) : (
                                <><CheckCircle2 className="w-5 h-5" /> Generate Rubric</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Rubric Display Section */}
                <div className="lg:col-span-2 space-y-6">
                    {!rubric && !loading && (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white print:hidden">
                            <ClipboardList className="w-16 h-16 mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No Rubric Generated</h3>
                            <p className="max-w-md">Enter your assessment details in the form and click "Generate Rubric" to let AI craft a structured evaluation table.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 print:hidden shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 shadow-inner animate-pulse">
                                <ClipboardList className="text-emerald-600 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Assessment Matrix</h3>
                            <p className="text-slate-500 text-center max-w-sm">
                                Consulting educational frameworks and calibrating grading descriptors for {subject}...
                            </p>

                            <div className="w-48 h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full w-1/2 animate-[progress_1s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }}></div>
                            </div>
                        </div>
                    )}

                    {rubric && !loading && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm print:m-0 print:border-none print:shadow-none print:p-0" id="rubric-print-area">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Evaluation Rubric</h2>
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{subject}</span>
                                        • {topic}
                                    </p>
                                </div>
                                <div className="flex gap-3 print:hidden shrink-0">
                                    <button
                                        onClick={handleCopy}
                                        className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all border border-slate-200 shadow-sm group"
                                        title="Copy Rubric"
                                    >
                                        <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all border border-slate-200 shadow-sm group"
                                        title="Download PDF / Print"
                                    >
                                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 rounded-xl transition-all border border-amber-200 shadow-sm font-bold"
                                    >
                                        <RefreshCw className="w-4 h-4" /> Regenerate
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-6 print:mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                <div><span className="font-bold text-slate-400 uppercase tracking-wider text-xs block mb-1">Session Type</span><span className="font-semibold text-slate-800">{sessionType === 'Type any other' ? customSessionType : sessionType}</span></div>
                                <div className="w-px bg-slate-200 mx-2"></div>
                                <div><span className="font-bold text-slate-400 uppercase tracking-wider text-xs block mb-1">Total Marks</span><span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">{totalMarks}</span></div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                            <th className="p-4 font-bold border-r border-slate-200 w-1/5">Assessment Criteria</th>
                                            <th className="p-4 font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-200 w-[17%]">Excellent</th>
                                            <th className="p-4 font-bold text-blue-700 bg-blue-50/50 border-r border-slate-200 w-[17%]">Good</th>
                                            <th className="p-4 font-bold text-amber-700 bg-amber-50/50 border-r border-slate-200 w-[17%]">Average</th>
                                            <th className="p-4 font-bold text-red-700 bg-red-50/50 border-r border-slate-200 w-[17%]">Poor</th>
                                            <th className="p-4 font-bold w-20 text-center">Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-slate-800">
                                        {rubric.map((row, i) => (
                                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 border-r border-slate-200 font-bold text-slate-700 align-top bg-white">{row.criteria}</td>
                                                <td className="p-4 border-r border-slate-200 align-top leading-relaxed text-slate-600">{row.excellent}</td>
                                                <td className="p-4 border-r border-slate-200 align-top leading-relaxed text-slate-600">{row.good}</td>
                                                <td className="p-4 border-r border-slate-200 align-top leading-relaxed text-slate-600">{row.average}</td>
                                                <td className="p-4 border-r border-slate-200 align-top leading-relaxed text-slate-600">{row.poor}</td>
                                                <td className="p-4 align-top text-center font-black text-emerald-600 bg-emerald-50/30 text-base">{row.marks}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Print Styles to handle isolation of the rubric table */}
            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: landscape; }
                    body * {
                        visibility: hidden;
                    }
                    #rubric-print-area, #rubric-print-area * {
                        visibility: visible;
                    }
                    #rubric-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
