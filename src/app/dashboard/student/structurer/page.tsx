"use client";

import { useState } from 'react';
import { FileText, Wand2, Copy, Loader2, Save, Download, CheckCircle, RefreshCcw, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AnswerStructurerPage() {
    const [draft, setDraft] = useState('');
    const [structured, setStructured] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleStructure = async () => {
        if (!draft.trim()) return;
        setLoading(true);
        setStructured('');

        try {
            const res = await fetch('/api/answer-structurer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draft })
            });
            const data = await res.json();
            if (data.success) {
                setStructured(data.structured || 'No structured output generated.');
            } else {
                setStructured('Failed to structure. Please try again.');
            }
        } catch (e) {
            console.error(e);
            setStructured('Error connecting to AI service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!structured) return;
        navigator.clipboard.writeText(structured);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        if (!structured) return;
        try {
            const savedStructured = JSON.parse(localStorage.getItem('mededuai_saved_structured') || '[]');
            savedStructured.push({
                id: Date.now(),
                draft: draft.substring(0, 100) + '...',
                structured,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('mededuai_saved_structured', JSON.stringify(savedStructured));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
    };

    const handleDownloadPDF = async () => {
        if (!structured) return;
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text('Structured Medical Answer', 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(structured, 180);
            let y = 32;
            for (let i = 0; i < lines.length; i++) {
                if (y > 280) { pdf.addPage(); y = 15; }
                pdf.text(lines[i], 15, y);
                y += 5.5;
            }
            pdf.save('Structured_Answer.pdf');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-emerald-900 via-green-900 to-teal-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <Wand2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Answer Structuring Assistant</h2>
                            <p className="text-emerald-300/80 text-sm font-medium">AI-powered transformation of rough notes into exam-ready answers</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
                    {/* Left Side: Input */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" />
                            <h3 className="font-bold text-slate-700">Rough Draft / Notes</h3>
                        </div>
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Paste your rough notes here. Don't worry about grammar or structure...

Example:
heart has 4 chambers, right side gets deoxy blood, left gets oxy. tricuspid and mitral valves. coronary arteries supply heart muscle. MI happens when blocked..."
                            className="flex-1 p-6 resize-none outline-none text-slate-700 w-full bg-transparent leading-relaxed text-sm font-medium min-h-[350px]"
                        />
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleStructure}
                                disabled={!draft.trim() || loading}
                                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                {loading ? 'Structuring...' : 'Transform'}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Output */}
                    <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-emerald-900">Structured Output</h3>
                            </div>
                            {structured && (
                                <div className="flex gap-2">
                                    <button onClick={handleSave}
                                        className={`font-bold h-9 px-4 rounded-xl transition-all flex items-center gap-2 text-xs shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50'}`}>
                                        {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                    <button onClick={handleDownloadPDF}
                                        className="bg-white text-slate-700 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-blue-50 transition-all flex items-center gap-2 text-xs shadow-sm">
                                        <Download className="w-3.5 h-3.5" /> PDF
                                    </button>
                                    <button onClick={handleCopy}
                                        className="bg-white text-slate-700 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs shadow-sm">
                                        {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {structured ? (
                                <div className="prose prose-slate max-w-none prose-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{structured}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 min-h-[300px]">
                                    <Wand2 className="w-16 h-16 text-emerald-600 mb-4" />
                                    <p className="text-emerald-900 font-bold max-w-xs">Your perfectly structured medical essay will appear here.</p>
                                    <p className="text-sm text-slate-400 mt-2">Paste your rough notes on the left and click Transform</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Regenerate */}
                {structured && (
                    <div className="text-center pt-4">
                        <button onClick={handleStructure}
                            className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 mx-auto">
                            <RefreshCcw className="w-4 h-4" /> Re-structure with same input
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
