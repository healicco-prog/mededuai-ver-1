"use client";

import { useState } from 'react';
import { ClipboardCheck, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';

export default function SelfEvaluationPage() {
    const [question, setQuestion] = useState('');
    const [marks, setMarks] = useState<number>(5);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = () => {
        setLoading(true);
        setTimeout(() => {
            setResult(`Definition:\\n\\nKey Points:\\n\\nManagement Structure... (Mocked for ${marks} marks)`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Self-Evaluation Module</h2>
        <p className="text-slate-500">Test yourself by typing an answer and assessing it against university guidelines.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Your Question</label>
          <textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your medical question here..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
            <SlidersHorizontal className="w-4 h-4" />
            Select Mark Weightage
          </label>
          <div className="flex gap-4">
            {[2, 3, 5, 10].map(m => (
              <button
                key={m}
                onClick={() => setMarks(m)}
                className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                  marks === m 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {m} Marks
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            {marks === 2 && '3-4 lines | Definition + 2 points | No Diagram'}
            {marks === 3 && 'Half page | Definition + 3 points | Rare Diagram'}
            {marks === 5 && '1 page | Headings + explanation | Diagram Recommended'}
            {marks === 10 && '2-3 pages | Full structured essay | Diagram Strongly Recommended'}
          </p>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!question || loading}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Generate Ideal Answer Structure
        </button>
      </div>

      {result && (
        <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 mt-8 relative">
          <h3 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            AI Ideal Response ({marks} Marks)
          </h3>
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
            <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
