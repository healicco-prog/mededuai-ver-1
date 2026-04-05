"use client";

import { useState } from 'react';
import { Target, Download, Loader2, Sparkles, Save, Copy, CheckCircle, RefreshCcw, FileText } from 'lucide-react';

export default function ImportantQuestionsPage() {

    const [form, setForm] = useState({ uni: '', course: '', subject: '' });
    const [generating, setGenerating] = useState(false);
    const [paper, setPaper] = useState<any>(null);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!form.uni || !form.course || !form.subject) return;
        setGenerating(true);
        setPaper(null);

        try {
            const res = await fetch('/api/imp-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success && data.paper) {
                setPaper(data.paper);
            } else {
                alert('Failed to generate. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('Error connecting to AI service. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = () => {
        if (!paper) return;
        try {
            const savedPapers = JSON.parse(localStorage.getItem('mededuai_saved_imp_questions') || '[]');
            savedPapers.push({
                id: Date.now(),
                ...form,
                paper,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('mededuai_saved_imp_questions', JSON.stringify(savedPapers));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
    };

    const handleCopy = () => {
        if (!paper) return;
        const text = `${paper.mockPaperTitle}\n\nLong Essays (10 Marks Each):\n${paper.q10.join('\n')}\n\nShort Essays (5 Marks Each):\n${paper.q5.join('\n')}${paper.q2 ? `\n\nShort Answers (2 Marks Each):\n${paper.q2.join('\n')}` : ''}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        if (!paper) return;
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text(paper.mockPaperTitle, 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            let y = 35;

            pdf.setFont('helvetica', 'bold');
            pdf.text('Long Essays (10 Marks Each)', 15, y); y += 8;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            paper.q10.forEach((q: string) => {
                const lines = pdf.splitTextToSize(q, 175);
                lines.forEach((line: string) => {
                    if (y > 275) { pdf.addPage(); y = 15; }
                    pdf.text(line, 18, y); y += 6;
                });
                y += 3;
            });

            y += 5;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('Short Essays (5 Marks Each)', 15, y); y += 8;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            paper.q5.forEach((q: string) => {
                const lines = pdf.splitTextToSize(q, 175);
                lines.forEach((line: string) => {
                    if (y > 275) { pdf.addPage(); y = 15; }
                    pdf.text(line, 18, y); y += 6;
                });
                y += 3;
            });

            if (paper.q2?.length) {
                y += 5;
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.text('Short Answers (2 Marks Each)', 15, y); y += 8;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(11);
                paper.q2.forEach((q: string) => {
                    const lines = pdf.splitTextToSize(q, 175);
                    lines.forEach((line: string) => {
                        if (y > 275) { pdf.addPage(); y = 15; }
                        pdf.text(line, 18, y); y += 6;
                    });
                    y += 3;
                });
            }

            pdf.save(`${paper.mockPaperTitle.replace(/\s+/g, '_')}.pdf`);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-red-900 via-rose-900 to-pink-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
                            <Target className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Important Questions Generator</h2>
                            <p className="text-red-300/80 text-sm font-medium">AI-generated model question papers based on university exam patterns</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Configuration Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-red-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-red-600" /> Paper Configuration
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">University</label>
                                <select
                                    value={form.uni} onChange={(e) => setForm({...form, uni: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-300 text-sm font-medium transition-all"
                                >
                                    <option value="">Select University</option>
                                    <option value="RGUHS">RGUHS</option>
                                    <option value="MUHS">MUHS</option>
                                    <option value="KUHS">KUHS</option>
                                    <option value="NTR UHS">NTR UHS</option>
                                    <option value="KNRUHS">KNRUHS</option>
                                    <option value="AIIMS">AIIMS</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                <select
                                    value={form.course} onChange={(e) => setForm({...form, course: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-300 text-sm font-medium transition-all"
                                >
                                    <option value="">Select Course</option>
                                    <option value="MBBS">MBBS</option>
                                    <option value="BDS">BDS</option>
                                    <option value="BAMS">BAMS</option>
                                    <option value="BHMS">BHMS</option>
                                    <option value="BSc Nursing">BSc Nursing</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                <select
                                    value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-300 text-sm font-medium transition-all"
                                >
                                    <option value="">Select Subject</option>
                                    <option value="Anatomy">Anatomy</option>
                                    <option value="Physiology">Physiology</option>
                                    <option value="Biochemistry">Biochemistry</option>
                                    <option value="Pathology">Pathology</option>
                                    <option value="Pharmacology">Pharmacology</option>
                                    <option value="Microbiology">Microbiology</option>
                                    <option value="Forensic Medicine">Forensic Medicine</option>
                                    <option value="Community Medicine">Community Medicine</option>
                                    <option value="General Medicine">General Medicine</option>
                                    <option value="General Surgery">General Surgery</option>
                                    <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                                    <option value="Paediatrics">Paediatrics</option>
                                    <option value="Ophthalmology">Ophthalmology</option>
                                    <option value="ENT">ENT</option>
                                    <option value="Orthopaedics">Orthopaedics</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={!form.uni || !form.course || !form.subject || generating}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
                                {generating ? 'Generating...' : 'Generate Question Paper'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generated Paper */}
                {paper && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="bg-white rounded-3xl border border-red-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 border-b border-red-100">
                                <h3 className="text-xl font-bold text-slate-900">{paper.mockPaperTitle} - Set 1</h3>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-red-100">
                                    <button onClick={handleSave}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-red-600 text-white border border-red-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-red-50 hover:border-red-300'}`}>
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                    <button onClick={handleDownloadPDF}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <Download className="w-4 h-4 text-blue-600" /> Export PDF
                                    </button>
                                    <button onClick={handleCopy}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-8 max-w-3xl">
                                <div>
                                    <h4 className="font-bold text-slate-800 mb-4 bg-red-100 text-red-800 px-4 py-2 rounded-xl w-fit text-sm">Long Essays (2 × 10 = 20 Marks)</h4>
                                    <ul className="space-y-4 pl-4 text-slate-700">
                                        {paper.q10.map((q: string, i: number) => <li key={i} className="text-sm leading-relaxed font-medium">{q}</li>)}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-800 mb-4 bg-amber-100 text-amber-800 px-4 py-2 rounded-xl w-fit text-sm">Short Essays (5 × 5 = 25 Marks)</h4>
                                    <ul className="space-y-4 pl-4 text-slate-700">
                                        {paper.q5.map((q: string, i: number) => <li key={i} className="text-sm leading-relaxed font-medium">{q}</li>)}
                                    </ul>
                                </div>

                                {paper.q2?.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-slate-800 mb-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-xl w-fit text-sm">Short Answers (5 × 2 = 10 Marks)</h4>
                                        <ul className="space-y-4 pl-4 text-slate-700">
                                            {paper.q2.map((q: string, i: number) => <li key={i} className="text-sm leading-relaxed font-medium">{q}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-center pt-2">
                            <button onClick={handleGenerate}
                                className="text-sm font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-2 mx-auto">
                                <RefreshCcw className="w-4 h-4" /> Generate Another Set
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
