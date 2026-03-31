"use client";

import { useState } from 'react';
import { Target, Download, FileQuestion, BookOpen } from 'lucide-react';

export default function ImportantQuestionsPage() {
    const [form, setForm] = useState({ uni: '', course: '', subject: '' });
    const [generating, setGenerating] = useState(false);
    const [paper, setPaper] = useState<any>(null);

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setPaper({
                q10: ["1. Describe the anatomy of the Brachial Plexus with clinical correlates.", "2. Detail the structure and functions of the Kidney."],
                q5: ["1. Internal capsule blood supply.", "2. Types of Cartilage.", "3. Differences between small and large intestine."],
                mockPaperTitle: `${form.uni} - ${form.subject} Model Exam`
      });
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Important Questions Generator</h2>
        <p className="text-slate-500">Generate high-probability model question papers based on specific university standard formats.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">University</label>
          <select 
            value={form.uni} onChange={(e) => setForm({...form, uni: e.target.value})}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="">Select University</option>
            <option value="RGUHS">RGUHS</option>
            <option value="MUHS">MUHS</option>
            <option value="KUHS">KUHS</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
          <select 
            value={form.course} onChange={(e) => setForm({...form, course: e.target.value})}
             className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="">Select Course</option>
            <option value="MBBS">MBBS</option>
            <option value="BDS">BDS</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
           <select 
            value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})}
             className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            <option value="">Select Subject</option>
            <option value="Anatomy">Anatomy</option>
            <option value="Biochemistry">Biochemistry</option>
          </select>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={!form.uni || !form.course || !form.subject || generating}
          className="bg-red-600 text-white font-bold h-12 px-8 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Target className="w-5 h-5" />}
          Generate Sets
        </button>
      </div>

      {paper && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative">
           <div className="absolute top-4 right-4 flex gap-2">
              <button className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200">
                <Download className="w-4 h-4"/> Export PDF
              </button>
           </div>
           
           <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4 pr-32">{paper.mockPaperTitle} - Set 1</h3>
           
           <div className="space-y-8 max-w-3xl">
              <div>
                 <h4 className="font-bold text-slate-800 mb-4 bg-slate-100 px-3 py-1 rounded w-fit">Long Essays (2 x 10 = 20 Marks)</h4>
                 <ul className="space-y-4 pl-4 text-slate-700">
                    {paper.q10.map((q: string, i: number) => <li key={i}>{q}</li>)}
                 </ul>
              </div>
              
              <div>
                 <h4 className="font-bold text-slate-800 mb-4 bg-slate-100 px-3 py-1 rounded w-fit">Short Essays (5 x 5 = 25 Marks)</h4>
                 <ul className="space-y-4 pl-4 text-slate-700">
                    {paper.q5.map((q: string, i: number) => <li key={i}>{q}</li>)}
                 </ul>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
