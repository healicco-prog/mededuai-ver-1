"use client";

import { useState } from 'react';
import { Stethoscope, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CaseTrainerPage() {
    const [summary, setSummary] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleAnalyze = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setResult("Chief Complaint: Abdominal pain x 2 days.\\n\\nHistory of Presenting Illness: 45yo male presents with RLQ pain...\\n\\nPast Medical History: None.\\n\\nReview of Systems: Positive for fever and nausea.\\n\\nClinical Flow Correction: Ensure you clearly differentiate between subjective symptoms and objective signs during rounds.");
            setAnalyzing(false);
        }, 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Case Presentation Trainer</h2>
                <p className="text-slate-500">Upload your raw patient history and get feedback on clinical flow and missing elements.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Raw Case Summary</h3>
                </div>
                <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="e.g. Pt is a 45yo man who came in cause his stomach was hurting yesterday. He also threw up once. Hasn't had surgery before. Heart rate 100..."
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-48 leading-relaxed text-sm"
                />

                <button
                    onClick={handleAnalyze}
                    disabled={!summary.trim() || analyzing}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {analyzing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileSearch className="w-5 h-5" />}
                    Analyze Clinical Flow
                </button>
            </div>

            {result && (
                <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex flex-col relative overflow-hidden">
                    <Sparkles className="absolute right-4 top-4 w-32 h-32 text-indigo-200/40 rotate-12" />
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Ideal Presentation Script
                        </h3>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200">
                            <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed font-medium">
                                {result}
                            </pre>
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 font-semibold flex items-start gap-2">
                            <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                            Tip: Avoid colloquial terms like "stomach was hurting" during grand rounds. Use "abdominal pain" and specify quadrants clearly.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
