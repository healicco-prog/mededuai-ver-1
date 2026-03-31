"use client";

import React, { useState } from 'react';
import {
    ClipboardList, BookOpen, FileText, CheckCircle2,
    Layers, PenTool, Hash, Download, Copy, RefreshCw, Loader2, Sparkles
} from 'lucide-react';

const SESSION_TYPES = [
    'Long Essay Questions (LEQ)', 'Short Essay Questions (SEQ)', 'Short Answer Questions (SAQ)',
    'Modified Essay Questions (MEQ)', 'OSCE – Objective Structured Clinical Examination',
    'OSPE – Objective Structured Practical Examination', 'Communications', 'Viva',
    'Microteaching', 'Lecture', 'Group Discussion', 'Tutorials',
    'Case presentations', 'Seminars', 'Workplace-Based Assessments', 'Type any other'
];

interface RubricRow {
    criteria: string; excellent: string; good: string; average: string; poor: string; marks: number | string;
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
        if (!subject || !topic || !totalMarks) { setError('Please fill in all details.'); return; }
        const finalSessionType = sessionType === 'Type any other' ? customSessionType : sessionType;
        if (!finalSessionType) { setError('Please specify the session type.'); return; }
        setError(''); setLoading(true); setRubric(null);
        try {
            const res = await fetch('/api/rubrics-generator', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, topic, sessionType: finalSessionType, totalMarks })
            });
            const data = await res.json();
            if (data.success && data.rubric) setRubric(data.rubric);
            else setError('Failed to generate rubric.');
        } catch { setError('An error occurred.'); } finally { setLoading(false); }
    };

    const handleCopy = () => {
        if (!rubric) return;
        let text = `Evaluation Rubric\nSubject: ${subject} | Topic: ${topic} | Marks: ${totalMarks}\n\n`;
        text += "Criteria\tExcellent\tGood\tAverage\tPoor\tMarks\n";
        rubric.forEach(r => { text += `${r.criteria}\t${r.excellent}\t${r.good}\t${r.average}\t${r.poor}\t${r.marks}\n`; });
        navigator.clipboard.writeText(text);
        alert('Rubric copied to clipboard!');
    };

    const gradeColors = {
        excellent: { header: 'text-emerald-300', cell: 'bg-emerald-50/30', dot: 'bg-emerald-500' },
        good: { header: 'text-blue-300', cell: 'bg-blue-50/30', dot: 'bg-blue-500' },
        average: { header: 'text-amber-300', cell: 'bg-amber-50/30', dot: 'bg-amber-500' },
        poor: { header: 'text-red-300', cell: 'bg-red-50/30', dot: 'bg-red-500' },
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <ClipboardList className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Rubrics Generator</h1>
                            <p className="text-emerald-300/80 text-sm font-medium">Generate structured evaluation rubrics for any academic assessment</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl border border-red-200 font-semibold text-sm mb-4 print:hidden flex-shrink-0">{error}</div>
            )}

            <div className="flex-1 overflow-y-auto pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="lg:col-span-1 print:hidden">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden sticky top-0">
                            <div className="bg-gradient-to-b from-emerald-50/50 to-white p-5 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-emerald-600" /> Assessment Details
                                </h2>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Subject</label>
                                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="E.g. Anatomy"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Topic</label>
                                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="E.g. Upper Limb Bones"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Session Type</label>
                                    <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all">
                                        {SESSION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                {sessionType === 'Type any other' && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Session Type</label>
                                        <input type="text" value={customSessionType} onChange={(e) => setCustomSessionType(e.target.value)} placeholder="Enter custom type..."
                                            className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all" />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Total Marks</label>
                                    <input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value === '' ? '' : Number(e.target.value))} placeholder="E.g. 10"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all" />
                                </div>
                                <button onClick={handleGenerate} disabled={loading}
                                    className={`mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all text-sm ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99]'}`}>
                                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate Rubric</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rubric Display */}
                    <div className="lg:col-span-2">
                        {!rubric && !loading && (
                            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white print:hidden">
                                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                                    <ClipboardList className="w-10 h-10 text-emerald-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">No Rubric Generated</h3>
                                <p className="max-w-md text-sm">Enter assessment details and click &quot;Generate Rubric&quot; to craft a structured evaluation table.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-full min-h-[400px] bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 print:hidden shadow-lg">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 animate-pulse">
                                    <ClipboardList className="text-white w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Assessment Matrix</h3>
                                <p className="text-slate-500 text-center text-sm max-w-sm">Calibrating grading descriptors for {subject}...</p>
                                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-1/2 animate-[progress_1s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }}></div>
                                </div>
                            </div>
                        )}

                        {rubric && !loading && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden print:m-0 print:border-none print:shadow-none print:p-0" id="rubric-print-area">
                                <div className="bg-gradient-to-b from-slate-50 to-white p-6 border-b border-slate-100 print:bg-white">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 mb-1">Evaluation Rubric</h2>
                                            <div className="flex items-center gap-3 flex-wrap text-xs font-bold uppercase tracking-widest">
                                                <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{subject}</span>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-700">{topic}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 print:hidden">
                                            <button onClick={handleCopy} className="p-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all" title="Copy"><Copy className="w-5 h-5" /></button>
                                            <button onClick={() => window.print()} className="p-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all" title="Print"><Download className="w-5 h-5" /></button>
                                            <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all font-bold text-sm">
                                                <RefreshCw className="w-4 h-4" /> Regenerate
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex gap-4 mb-6 print:mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                        <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Session Type</span><span className="font-semibold text-slate-800">{sessionType === 'Type any other' ? customSessionType : sessionType}</span></div>
                                        <div className="w-px bg-slate-200 mx-2"></div>
                                        <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Marks</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{totalMarks}</span></div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                                                    <th className="p-4 font-bold w-1/5 text-slate-200">Assessment Criteria</th>
                                                    <th className="p-4 font-bold w-[17%]"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Excellent</span></th>
                                                    <th className="p-4 font-bold w-[17%]"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Good</span></th>
                                                    <th className="p-4 font-bold w-[17%]"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Average</span></th>
                                                    <th className="p-4 font-bold w-[17%]"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400"></span> Poor</span></th>
                                                    <th className="p-4 font-bold w-20 text-center text-emerald-300">Marks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-slate-800">
                                                {rubric.map((row, i) => (
                                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 font-bold text-slate-700 align-top bg-white border-r border-slate-100">{row.criteria}</td>
                                                        <td className={`p-4 align-top leading-relaxed text-slate-600 border-r border-slate-100 ${gradeColors.excellent.cell}`}>{row.excellent}</td>
                                                        <td className={`p-4 align-top leading-relaxed text-slate-600 border-r border-slate-100 ${gradeColors.good.cell}`}>{row.good}</td>
                                                        <td className={`p-4 align-top leading-relaxed text-slate-600 border-r border-slate-100 ${gradeColors.average.cell}`}>{row.average}</td>
                                                        <td className={`p-4 align-top leading-relaxed text-slate-600 border-r border-slate-100 ${gradeColors.poor.cell}`}>{row.poor}</td>
                                                        <td className="p-4 align-top text-center font-black text-emerald-600 text-lg">{row.marks}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: landscape; }
                    body * { visibility: hidden; }
                    #rubric-print-area, #rubric-print-area * { visibility: visible; }
                    #rubric-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}
