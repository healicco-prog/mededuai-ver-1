"use client";

import { useState } from 'react';
import { ClipboardCheck, Sparkles, SlidersHorizontal, Loader2, Save, Copy, Download, CheckCircle, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SelfEvaluationPage() {
    const [question, setQuestion] = useState('');
    const [marks, setMarks] = useState<number>(5);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleGenerate = async () => {
        if (!question.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/self-eval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, marks })
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.answer || 'No answer generated.');
            } else {
                setResult('Failed to generate. Please try again.');
            }
        } catch (e) {
            console.error(e);
            setResult('Error connecting to AI service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (!result) return;
        try {
            const savedEvals = JSON.parse(localStorage.getItem('mededuai_saved_evals') || '[]');
            savedEvals.push({
                id: Date.now(),
                question: question.substring(0, 100),
                marks,
                answer: result,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('mededuai_saved_evals', JSON.stringify(savedEvals));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
    };

    const handleDownloadPDF = async () => {
        if (!result) return;
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text(`Self-Evaluation: ${marks} Marks`, 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`Question: ${question.substring(0, 80)}`, 15, 28);
            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(result, 180);
            let y = 38;
            for (let i = 0; i < lines.length; i++) {
                if (y > 280) { pdf.addPage(); y = 15; }
                pdf.text(lines[i], 15, y);
                y += 5.5;
            }
            pdf.save(`SelfEval_${marks}marks.pdf`);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <ClipboardCheck className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Self-Evaluation Module</h2>
                            <p className="text-emerald-300/80 text-sm font-medium">AI-generated ideal answer structures based on mark weightage</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Input Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-emerald-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-600" /> Configure Your Question
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Question</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Type your medical question here, e.g., 'Describe the pathogenesis of rheumatic heart disease'"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 min-h-[120px] text-sm font-medium transition-all"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                <SlidersHorizontal className="w-4 h-4" /> Select Mark Weightage
                            </label>
                            <div className="flex gap-3">
                                {[2, 3, 5, 10].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMarks(m)}
                                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all text-sm ${
                                            marks === m
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-500/10'
                                                : 'border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {m} Marks
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-3 text-center font-medium">
                                {marks === 2 && '3-4 lines | Definition + 2 points | No Diagram'}
                                {marks === 3 && 'Half page | Definition + 3 points | Rare Diagram'}
                                {marks === 5 && '1 page | Headings + explanation | Diagram Recommended'}
                                {marks === 10 && '2-3 pages | Full structured essay | Diagram Strongly Recommended'}
                            </p>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={!question.trim() || loading}
                                className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Generating...' : 'Generate Ideal Answer'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-5 border-b border-emerald-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <ClipboardCheck className="w-5 h-5 text-emerald-600" /> AI Ideal Response ({marks} Marks)
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-emerald-100">
                                    <button onClick={handleSave}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white border border-emerald-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}>
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                    <button onClick={handleDownloadPDF}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <Download className="w-4 h-4 text-blue-600" /> Download PDF
                                    </button>
                                    <button onClick={handleCopy}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 prose prose-slate max-w-none prose-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                            </div>
                        </div>
                        <div className="text-center pt-2">
                            <button onClick={handleGenerate}
                                className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 mx-auto">
                                <RefreshCcw className="w-4 h-4" /> Regenerate
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
