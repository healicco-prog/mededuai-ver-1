"use client";

import { useState } from 'react';
import { Stethoscope, FileSearch, Sparkles, CheckCircle2, Loader2, Save, Copy, Download, Share2, CheckCircle, RefreshCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CaseTrainerPage() {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleAnalyze = async () => {
        if (!summary.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/case-trainer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary })
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.analysis || 'No analysis generated.');
            } else {
                setResult('Failed to analyze. Please try again.');
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
            const savedCases = JSON.parse(localStorage.getItem('mededuai_saved_cases') || '[]');
            savedCases.push({
                id: Date.now(),
                summary: summary.substring(0, 100) + '...',
                analysis: result,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('mededuai_saved_cases', JSON.stringify(savedCases));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadPDF = async () => {
        if (!result) return;
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text('Case Presentation Analysis', 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(result, 180);
            let y = 32;
            for (let i = 0; i < lines.length; i++) {
                if (y > 280) { pdf.addPage(); y = 15; }
                pdf.text(lines[i], 15, y);
                y += 5.5;
            }
            pdf.save('Case_Presentation_Analysis.pdf');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <Stethoscope className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Case Presentation Trainer</h2>
                            <p className="text-indigo-300/80 text-sm font-medium">AI-powered feedback on clinical case presentation skills</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Input Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-indigo-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileSearch className="w-5 h-5 text-indigo-600" /> Raw Case Summary
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Paste your informal patient history and the AI will restructure it into proper clinical format</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="e.g. Pt is a 45yo man who came in cause his stomach was hurting yesterday. He also threw up once. Hasn't had surgery before. Heart rate 100..."
                            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 h-48 leading-relaxed text-sm font-medium transition-all"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleAnalyze}
                                disabled={!summary.trim() || loading}
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Analyzing...' : 'Analyze Clinical Flow'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="bg-white rounded-3xl border border-indigo-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 border-b border-indigo-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Structured Analysis
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-indigo-100">
                                    <button onClick={handleSave}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-indigo-600 text-white border border-indigo-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'}`}>
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
                            <button onClick={handleAnalyze}
                                className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 mx-auto">
                                <RefreshCcw className="w-4 h-4" /> Re-analyze
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
