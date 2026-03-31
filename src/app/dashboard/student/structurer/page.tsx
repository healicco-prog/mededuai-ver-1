"use client";

import { useState } from 'react';
import { FileText, ArrowRight, Wand2, Copy } from 'lucide-react';

export default function AnswerStructurerPage() {
    const [draft, setDraft] = useState('');
    const [structured, setStructured] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStructure = () => {
        setLoading(true);
        setTimeout(() => {
            setStructured("Definition: An underlying condition...\\n\\nEtiology: Factor A, Factor B...\\n\\nPathogenesis: The continuous breakdown limits...\\n\\nClinical Features: Pain, Swelling...\\n\\nManagement: Supportive care...");
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Answer Structuring Assistant</h2>
                <p className="text-slate-500">Paste your rough draft or bullet points. The AI will restructure it into standard medical format.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
                {/* Left Side: Input */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <h3 className="font-bold text-slate-700">Rough Draft / Notes</h3>
                    </div>
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Paste your rough notes here. Don't worry about grammar or structure..."
                        className="flex-1 p-6 resize-none outline-none text-slate-700 w-full bg-transparent leading-relaxed"
                    ></textarea>
                </div>

                {/* Action Button & Right Side: Output */}
                <div className="relative">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col items-center gap-2">
                        <button
                            onClick={handleStructure}
                            disabled={!draft.trim() || loading}
                            className="w-14 h-14 bg-emerald-600 rounded-full text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 group hover:scale-110"
                        >
                            {loading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full shadow-sm">Transform</span>
                    </div>

                    <button className="lg:hidden w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl mb-4" onClick={handleStructure}>Format Now</button>

                    <div className="bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm flex flex-col h-full overflow-hidden relative">
                        <div className="p-4 border-b border-emerald-100 bg-emerald-100/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-emerald-900">Structured Output</h3>
                            </div>
                            {structured && (
                                <button className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:text-emerald-900 bg-emerald-200/50 px-3 py-1.5 rounded-lg transition-colors">
                                    <Copy className="w-4 h-4" /> Copy
                                </button>
                            )}
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            {structured ? (
                                <pre className="whitespace-pre-wrap font-sans text-emerald-900 leading-relaxed font-medium">
                                    {structured}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <Wand2 className="w-16 h-16 text-emerald-600 mb-4" />
                                    <p className="text-emerald-900 font-bold max-w-xs">Your perfectly structured medical essay will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
}
