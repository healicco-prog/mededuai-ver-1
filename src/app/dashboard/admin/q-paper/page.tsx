"use client";

import { useState, useRef, useEffect } from 'react';
import { Target, Download, Plus, PenTool, CheckCircle2, ChevronRight, Settings, Image as ImageIcon, Trash2, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { useQPaperStore, QPaperFormat } from '@/store/qPaperStore';
import { useReactToPrint } from 'react-to-print';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GenerateView } from './GenerateView';

const ESSAY_TYPES = [
  "Simple Essay",
  "Structured Essay",
  "Problem Based",
  "Case based",
  "Reasoning",
  "Short Essay"
];

const DEFAULT_TOOLTIPS: Record<string, string> = {
  "Simple Essay": "Broad question on a single topic; student writes a detailed answer in their own structure; tests knowledge and understanding of the subject.",
  "Structured Essay": "Question is divided into sub-parts (a, b, c, etc.); answer must follow the given structure; helps assess specific components of knowledge. Each subsection will have marks distributed.",
  "Problem Based": "Based on a scientific or clinical problem; student must apply concepts to solve or explain the problem; tests analytical thinking.",
  "Case based": "A clinical scenario or patient case is provided; students answer questions related to diagnosis, mechanism, investigation, or treatment.",
  "Reasoning": "Requires explaining why or how something happens; focuses on logical reasoning and understanding of mechanisms rather than memorization.",
  "Short Essay": "Moderate-length answer on a focused topic; less detailed than a simple essay; expects key points only.",
  "1 Mark MCQ": "One question (stem) with 4 options, Only one correct answer",
  "1 Mark MCQ (Clinical Scenario / Case-Based)": "A clinical case is given and will Tests diagnosis, investigation, or treatment, with 4 options",
  "1 Mark MCQ (Assertion–Reason)": "Two statements are given: Assertion (A), Reason (R). You must determine if they are correct and if R explains A. Options: a. Both A and R true; R explains A, b. Both true but R not explanation, c. A true, R false, d. A false, R true",
  "2 Marks MCQ (Case scenario based, with 2 sub questions)": "It will be a case based scenario. Based on the scenario, there will be two sub questions, each carrying 1 marks (total 2 Marks). Each sub question with 4 options"
};

const MCQ_TYPES = [
  "1 Mark MCQ",
  "1 Mark MCQ (Clinical Scenario / Case-Based)",
  "1 Mark MCQ (Assertion–Reason)",
  "2 Marks MCQ (Case scenario based, with 2 sub questions)"
];

const QUESTION_TYPES = [...ESSAY_TYPES, ...MCQ_TYPES];

interface QuestionFrame {
  id: string;
  questionNo: number;
  mainOrSub: 'Main' | 'Sub';
  type: string;
  marks: number;
  subdivided: boolean;
  generatedContent?: string;
}

export default function QuestionPaperDeveloper() {
  const store = useQPaperStore();

  useEffect(() => {
    store.fetchData();
  }, []);

  const [view, setView] = useState<'dashboard' | 'setup' | 'generate' | 'view_paper'>('dashboard');
  const [editFormatId, setEditFormatId] = useState<string | null>(null);
  const [generateFormatId, setGenerateFormatId] = useState<string | null>(null);
  const [viewPaperId, setViewPaperId] = useState<string | null>(null);

  if (!store.isLoading && store.formats.length === 0 && view === 'dashboard') {
    setView('setup');
  }

  const renderView = () => {
    switch (view) {
      case 'setup': return <SetupView onBack={() => { setView('dashboard'); setEditFormatId(null); }} editId={editFormatId} />;
      case 'generate': return <GenerateView onBack={() => { setView('dashboard'); setGenerateFormatId(null); }} formats={store.formats} initialFormatId={generateFormatId} />;
      case 'view_paper': return <ViewPaper onBack={() => { setView('dashboard'); setViewPaperId(null); }} paperId={viewPaperId} />;
      case 'dashboard':
      default: return <DashboardView onNavigate={(v, id) => {
        setView(v);
        if (v === 'generate' && id) setGenerateFormatId(id);
        if (v === 'view_paper' && id) setViewPaperId(id);
      }} formats={store.formats} onEdit={(id: string) => { setEditFormatId(id); setView('setup'); }} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 print:max-w-none print:m-0 print:p-0">
      {renderView()}
      <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    html, body { height: auto !important; overflow: visible !important; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
                }
            `}</style>
    </div>
  );
}

// ============== Dashboard View =================
function DashboardView({ onNavigate, formats, onEdit }: { onNavigate: (v: any, id?: string) => void, formats: QPaperFormat[], onEdit: (id: string) => void }) {
  const store = useQPaperStore();
  return (
    <div className="space-y-6 print:hidden">
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.25),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-600/15 to-transparent rounded-full blur-2xl" />

        <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <Target className="w-6 h-6 text-blue-200" />
              </div>
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-[0.2em]">Department Admin</p>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Question Paper Developer</h2>
            <p className="text-blue-200/80 mt-1.5 font-medium">Create standard university question papers with AI-assisted question picking and PDF export.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate('setup')} className="bg-white/10 backdrop-blur-sm text-white font-bold h-12 px-6 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/20 whitespace-nowrap">
              <Settings className="w-5 h-5" /> Setup Format
            </button>
            <button onClick={() => onNavigate('generate')} className="bg-white text-blue-900 font-bold h-12 px-6 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg whitespace-nowrap">
              <PenTool className="w-5 h-5" /> Generate Paper
            </button>
            <button 
              onClick={() => {
                if (confirm("This will upload all your locally saved question papers to the cloud database. Continue?")) {
                  store.migrateLocalToSupabase();
                }
              }} 
              className="bg-indigo-500 text-white font-bold h-12 px-6 rounded-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
              disabled={store.isLoading}
            >
              <RefreshCw className={`w-5 h-5 ${store.isLoading ? 'animate-spin' : ''}`} /> 
              {store.isLoading ? 'Syncing...' : 'Sync Local Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formats.map(f => (
          <div key={f.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(f.id)} className="text-slate-400 hover:text-blue-500 transition-colors bg-blue-50 p-1.5 rounded-lg" title="Edit Format"><Settings className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm('Delete format?')) store.deleteFormat(f.id) }} className="text-slate-400 hover:text-red-500 transition-colors bg-red-50 p-1.5 rounded-lg" title="Delete Format"><Trash2 className="w-4 h-4" /></button>
            </div>
            {f.logoUrl && <img src={f.logoUrl} alt="Logo" className="w-12 h-12 object-contain mb-4 rounded-lg bg-slate-50 border border-slate-100" />}
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{f.course}</h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 mt-1">{f.department}</p>
            <p className="text-sm text-slate-600 font-medium mb-6">{f.instituteName}</p>

            <div className="mb-6 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Allowed Question Formats:</span>
              <div className="flex flex-wrap gap-1.5">
                {f.allowedTypes.slice(0, 5).map(t => (
                  <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                    {t}
                  </span>
                ))}
                {f.allowedTypes.length > 5 && (
                  <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-1 rounded-md border border-slate-100">
                    +{f.allowedTypes.length - 5} more
                  </span>
                )}
              </div>
            </div>

            <button onClick={() => onNavigate('generate', f.id)} className="mt-auto bg-blue-50 text-blue-700 font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors w-full text-sm">
              Generate using this Format
            </button>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6"><Layers className="text-indigo-600" /> Developed Question Papers</h3>
        {store.papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
            <Target className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-400">Yet to save anything</p>
            <p className="text-xs text-slate-300">Generate a question paper to archive it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.papers.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col relative group">
                <button onClick={() => { if (confirm('Delete saved paper?')) store.deletePaper(p.id) }} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 p-1.5 rounded-lg" title="Delete Paper"><Trash2 className="w-4 h-4" /></button>
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md">Saved Paper</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{p.examName}</h3>
                <p className="text-sm font-bold text-slate-500 tracking-wider mb-2">{p.course} • {p.department}</p>
                <p className="text-sm text-slate-600 font-medium flex-1 mb-6">Total Marks: <span className="text-slate-900 font-bold">{p.totalMarks}</span></p>

                <button onClick={() => onNavigate('view_paper', p.id)} className="mt-auto bg-indigo-50 text-indigo-700 font-bold py-2.5 rounded-xl hover:bg-indigo-100 transition-colors w-full text-sm">
                  View/Export Paper
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============== Setup View =================
function SetupView({ onBack, editId }: { onBack: () => void, editId?: string | null }) {
  const store = useQPaperStore();
  const existingFormat = store.formats.find(f => f.id === editId);

  const initialTooltips: Record<string, string> = { ...DEFAULT_TOOLTIPS };
  if (existingFormat?.typeTooltips) {
    Object.keys(existingFormat.typeTooltips).forEach(key => {
      if (existingFormat.typeTooltips![key] && existingFormat.typeTooltips![key].trim() !== '') {
        initialTooltips[key] = existingFormat.typeTooltips![key];
      }
    });
  }

  const [form, setForm] = useState({
    course: existingFormat?.course || '',
    department: existingFormat?.department || '',
    instituteName: existingFormat?.instituteName || '',
    logoUrl: existingFormat?.logoUrl || '',
    paperType: existingFormat?.paperType || 'Essay',
    selectedTypes: existingFormat?.allowedTypes || (existingFormat?.paperType === 'MCQ' ? [...MCQ_TYPES] : [...ESSAY_TYPES]),
    typeTooltips: initialTooltips
  });
  const [customType, setCustomType] = useState('');

  const handleAddCustomType = () => {
    if (customType.trim() && !form.selectedTypes.includes(customType.trim())) {
      setForm({ ...form, selectedTypes: [...form.selectedTypes, customType.trim()] });
      setCustomType('');
    }
  };

  const toggleType = (t: string) => {
    if (form.selectedTypes.includes(t)) {
      setForm({ ...form, selectedTypes: form.selectedTypes.filter(x => x !== t) });
    } else {
      setForm({ ...form, selectedTypes: [...form.selectedTypes, t] });
    }
  };

  const handleSave = () => {
    if (!form.course || !form.department || !form.instituteName) return alert("Course, Department, and Institute Name are required.");
    if (form.selectedTypes.length === 0) return alert("Please select at least one question type.");

    if (existingFormat) {
      store.updateFormat({
        ...existingFormat,
        course: form.course,
        department: form.department,
        instituteName: form.instituteName,
        logoUrl: form.logoUrl,
        paperType: form.paperType as 'Essay' | 'MCQ',
        allowedTypes: form.selectedTypes,
        typeTooltips: form.typeTooltips
      });
      alert("Course Format Updated!");
    } else {
      store.addFormat({
        id: Date.now().toString(),
        course: form.course,
        department: form.department,
        instituteName: form.instituteName,
        logoUrl: form.logoUrl,
        paperType: form.paperType as 'Essay' | 'MCQ',
        allowedTypes: form.selectedTypes,
        typeTooltips: form.typeTooltips
      });
      alert("Course Format Saved!");
    }
    onBack();
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm print:hidden">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2"><Settings className="text-blue-600" /> {existingFormat ? 'Edit Question Paper Format' : 'Create Question Paper Format'}</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Course *</label><input value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="e.g. MBBS First Year" className="w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Department *</label><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Physiology" className="w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Name of the Institute *</label><input value={form.instituteName} onChange={e => setForm({ ...form, instituteName: e.target.value })} placeholder="e.g. ABC Medical College" className="w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800" /></div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
              <span>Upload/Link Logo</span>
              {form.logoUrl && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Preview OK</span>}
            </label>
            <div className="flex gap-2">
              <input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800" />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Paper Type *</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-colors ${form.paperType === 'Essay' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <input type="radio" checked={form.paperType === 'Essay'} onChange={() => setForm({ ...form, paperType: 'Essay', selectedTypes: [...ESSAY_TYPES] })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className={`font-bold ${form.paperType === 'Essay' ? 'text-blue-900' : 'text-slate-600'}`}>Essay Exam</span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border transition-colors ${form.paperType === 'MCQ' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <input type="radio" checked={form.paperType === 'MCQ'} onChange={() => setForm({ ...form, paperType: 'MCQ', selectedTypes: [...MCQ_TYPES] })} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                <span className={`font-bold ${form.paperType === 'MCQ' ? 'text-blue-900' : 'text-slate-600'}`}>MCQ Exam</span>
              </label>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase mb-4">Question Paper Format: Types of Questions *</label>
          <div className="grid grid-cols-1 gap-3">
            {Array.from(new Set([...(form.paperType === 'Essay' ? ESSAY_TYPES : MCQ_TYPES), ...form.selectedTypes])).map(type => (
              <div key={type} className={`p-4 rounded-xl border transition-all ${form.selectedTypes.includes(type) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <label className="flex items-start gap-3 cursor-pointer mb-2">
                  <input type="checkbox" checked={form.selectedTypes.includes(type)} onChange={() => toggleType(type)} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                  <span className={`text-sm font-bold ${form.selectedTypes.includes(type) ? 'text-blue-900' : 'text-slate-600'}`}>{type}</span>
                </label>
                {form.selectedTypes.includes(type) && (
                  <div className="pl-7 pr-2 w-full">
                    <input
                      type="text"
                      value={form.typeTooltips[type] || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, typeTooltips: { ...prev.typeTooltips, [type]: e.target.value } }))}
                      placeholder="Enter description/instructions for framing this question type..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-600 shadow-inner"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 max-w-md">
            <input
              value={customType}
              onChange={e => setCustomType(e.target.value)}
              placeholder="Type any other format..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              onKeyDown={e => e.key === 'Enter' && handleAddCustomType()}
            />
            <button onClick={handleAddCustomType} className="bg-slate-100 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
              Add Format
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <button onClick={handleSave} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Save Format Configuration
          </button>
        </div>
      </div>
    </div>
  );
}


// ============== View Paper Component =================
function ViewPaper({ onBack, paperId }: { onBack: () => void, paperId: string | null }) {
  const store = useQPaperStore();
  const paper = store.papers.find(p => p.id === paperId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const printRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printRef, documentTitle: `${paper?.examName || 'Question'}_Paper` });

  if (!paper) return <div className="p-8 text-center text-slate-500">Paper not found</div>;

  const handleSaveQuestion = (fId: string) => {
    if (!paper) return;
    const updatedPaper = {
      ...paper,
      questions: paper.questions.map(q => q.id === fId ? { ...q, generatedContent: editText } : q)
    };
    store.savePaper(updatedPaper);
    setEditingId(null);
  };

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</button>
        <button onClick={() => reactToPrintFn()} className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700"><Download className="w-4 h-4" /> Export PDF</button>
      </div>

      <div ref={printRef} className="bg-white p-12 print:p-0 print:border-none rounded-3xl border border-slate-200 shadow-xl max-w-[21cm] mx-auto relative border-t-8 border-t-slate-800">
        <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 mt-4 uppercase font-serif">
          {paper.logoUrl && <img src={paper.logoUrl} alt="Logo" className="h-20 w-auto object-contain mx-auto mb-4" />}
          <h2 className="text-xl font-black text-slate-800 tracking-widest mb-1">{paper.instituteName}</h2>
          <h3 className="text-lg font-bold text-slate-600 mb-2 tracking-wider">{paper.department}</h3>
          <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">{paper.course} Examination</h1>
          <p className="text-sm font-bold text-slate-500 lowercase tracking-widest mt-2">{paper.examName}</p>

          <div className="flex justify-between items-center text-sm font-bold text-slate-700 mt-8 font-sans">
            <p>TIME: 3 HOURS</p>
            <p>MAX MARKS: {paper.totalMarks}</p>
          </div>
        </div>

        <div className="font-serif prose max-w-none text-slate-800">
          {paper.questions.map((f, i) => (
            <div key={f.id} className={`mb-6 ${f.mainOrSub === 'Sub' ? 'ml-8' : ''} group relative border border-transparent hover:border-slate-100 p-4 -px-4 rounded-2xl transition-all hover:bg-slate-50/50 print:p-0 print:bg-transparent print:border-none print:-mx-0`}>
              {f.mainOrSub === 'Main' && (
                <div className="flex justify-between items-end border-b border-slate-200 pb-1 mb-3">
                  <h4 className="font-bold text-lg m-0">Question {f.questionNo}</h4>
                  <span className="text-sm font-bold opacity-60">[{f.type}]</span>
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex-1 mt-1 text-[15px] leading-relaxed break-words break-keep relative">
                  {editingId === f.id ? (
                    <div className="print:hidden font-sans">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full p-4 border border-blue-200 focus:border-blue-500 bg-white shadow-inner rounded-xl min-h-[140px] font-medium text-slate-800 outline-none resize-y" autoFocus />
                      <div className="flex gap-3 mt-3">
                        <button onClick={() => handleSaveQuestion(f.id)} className="bg-blue-600 shadow-sm text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">Save Changes</button>
                        <button onClick={() => setEditingId(null)} className="bg-slate-100 text-slate-600 border border-slate-200 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{f.generatedContent || ''}</ReactMarkdown>
                      <button onClick={() => { setEditingId(f.id); setEditText(f.generatedContent || ''); }} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm print:hidden" title="Edit text">
                        <PenTool className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
