"use client";

import { useState, useRef, useEffect } from 'react';
import { Target, Download, Plus, PenTool, CheckCircle2, ChevronRight, Settings, Image as ImageIcon, Trash2, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { useQPaperStore, QPaperFormat } from '@/store/qPaperStore';
import { useReactToPrint } from 'react-to-print';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [view, setView] = useState<'dashboard' | 'setup' | 'generate' | 'view_paper'>('dashboard');
  const [editFormatId, setEditFormatId] = useState<string | null>(null);
  const [generateFormatId, setGenerateFormatId] = useState<string | null>(null);
  const [viewPaperId, setViewPaperId] = useState<string | null>(null);

  if (store.formats.length === 0 && view === 'dashboard') {
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
          <div className="flex gap-3">
            <button onClick={() => onNavigate('setup')} className="bg-white/10 backdrop-blur-sm text-white font-bold h-12 px-6 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/20">
              <Settings className="w-5 h-5" /> Setup Format
            </button>
            <button onClick={() => onNavigate('generate')} className="bg-white text-blue-900 font-bold h-12 px-6 rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg">
              <PenTool className="w-5 h-5" /> Generate Paper
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

      {store.papers.length > 0 && (
        <div className="pt-8">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6"><Layers className="text-indigo-600" /> Developed Question Papers</h3>
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
        </div>
      )}
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

// ============== Generate View =================
export function GenerateView({ onBack, formats, initialFormatId, onSaveComplete }: { onBack: () => void, formats: any[], initialFormatId?: string | null, onSaveComplete?: (paperId: string) => void }) {
  const [selectedFormatId, setSelectedFormatId] = useState(initialFormatId || '');
  const [topics, setTopics] = useState('');
  const [totalMarksInput, setTotalMarksInput] = useState('100');
  const [durationInput, setDurationInput] = useState('3 Hours');

  // Framing State
  const [frames, setFrames] = useState<QuestionFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<{ mainOrSub: 'Main' | 'Sub', type: string, marks: number, subdivided: boolean }>({
    mainOrSub: 'Main', type: '', marks: 0, subdivided: false
  });

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaper, setShowPaper] = useState(false);

  // Edit Text State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Print Distribution State
  const [targetPages, setTargetPages] = useState<number>(1);

  const format = formats.find(f => f.id === selectedFormatId);
  const allowedTypes = format?.allowedTypes || QUESTION_TYPES;

  const totalMarks = parseInt(totalMarksInput) || 0;
  const currentSum = frames.reduce((acc, f) => acc + f.marks, 0);
  const remainingMarks = totalMarks - currentSum;

  const printRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef: printRef, documentTitle: `${format?.course || 'Question'}_Paper` });

  const omrRef = useRef<HTMLDivElement>(null);
  const printOmrFn = useReactToPrint({ contentRef: omrRef, documentTitle: `OMR_Sheet_${format?.course || 'Exam'}` });

  const store = useQPaperStore();

  const handleSaveToStore = () => {
    if (!format || frames.length === 0) return alert("Nothing to save.");
    const paperName = prompt("Enter a name to save this paper for Evaluation (e.g., First Internal - Anatomy):", topics);
    if (!paperName) return;
    const newPaperId = Date.now().toString();
    store.savePaper({
      id: newPaperId,
      formatId: format.id,
      course: format.course,
      department: format.department,
      instituteName: format.instituteName,
      logoUrl: format.logoUrl,
      examName: paperName,
      totalMarks: totalMarks,
      questions: frames.map(f => ({
        id: f.id,
        questionNo: f.questionNo,
        type: f.type,
        marks: f.marks,
        generatedContent: f.generatedContent || '',
        mainOrSub: f.mainOrSub
      })),
      createdAt: Date.now()
    });
    alert("Paper saved to Database! You can now access it in the EMS (Evaluation Management System).");
    if (onSaveComplete) {
      onSaveComplete(newPaperId);
    }
  };

  const addFrame = () => {
    if (!currentFrame.type || currentFrame.marks <= 0) return alert("Select type and valid marks.");
    if (currentFrame.marks > remainingMarks) {
      return alert(`Cannot add ${currentFrame.marks} marks. Only ${remainingMarks} marks remaining for this paper.`);
    }

    const nextQNo = frames.filter(f => f.mainOrSub === 'Main').length + (currentFrame.mainOrSub === 'Main' ? 1 : 0);

    const newFrame: QuestionFrame = {
      id: Date.now().toString(),
      questionNo: currentFrame.mainOrSub === 'Main' ? nextQNo : frames[frames.length - 1]?.questionNo || 1,
      ...currentFrame
    };

    setFrames([...frames, newFrame]);
    setCurrentFrame({ ...currentFrame, marks: 0, type: '' });
  };

  const deleteFrame = (id: string) => {
    setFrames(frames.filter(f => f.id !== id));
  };

  const handleAutoGenerate = async () => {
    if (!format || !topics) return alert("Format and Topics are required.");

    setIsGenerating(true);
    try {
      const response = await fetch('/api/creator/q-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: format.course,
          department: format.department,
          topics,
          totalMarks,
          frames
        })
      });

      const data = await response.json();

      if (data.success && data.generatedQuestions) {
        const updatedFrames = frames.map(f => {
          let content = data.generatedQuestions[f.id] || `**Q${f.questionNo}.** Question text missing from AI for ${topics} [${f.marks} Marks]`;

          // If the AI didn't format with Qxx., prepend it if it's a Main question
          if (f.mainOrSub === 'Main' && !content.toLowerCase().startsWith('q') && !content.toLowerCase().startsWith('**q')) {
            content = `**Q${f.questionNo}.** ${content}`;
          }

          return { ...f, generatedContent: content };
        });
        setFrames(updatedFrames);
        setShowPaper(true);
      } else {
        alert("Failed to generate question paper.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (formats.length === 0) {
    return <div className="p-8 text-center"><p className="text-slate-500">Please setup a format first.</p><button onClick={onBack} className="text-blue-500 mt-4">Go Back</button></div>;
  }

  // OMR Render Helper
  const renderOMRSheet = () => {
    const rows: string[] = [];
    frames.forEach(f => {
      if (f.type.toLowerCase().includes('mcq')) {
        if (f.type.includes('2 Marks MCQ')) {
          rows.push(`${f.questionNo}(i).`);
          rows.push(`${f.questionNo}(ii).`);
        } else {
          rows.push(`${f.questionNo}.`);
        }
      }
    });

    if (rows.length === 0) return null;

    return (
      <div ref={omrRef} className="print:p-8 bg-white p-8 border border-slate-200 shadow-sm max-w-[21cm] mx-auto hidden print:block">
        <style dangerouslySetInnerHTML={{
          __html: `
                    @media print {
                        .omr-container { display: block !important; }
                        body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
                    }
                `}} />

        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-widest leading-none mb-2">OMR ANSWER SHEET</h1>
          <p className="font-bold text-slate-600 text-sm">{format?.instituteName || 'Institute'}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-4 font-mono text-sm max-w-lg mx-auto mb-8">
          <div className="flex border-b border-black pb-1"><span className="font-bold w-32">Candidate Name:</span> <div className="flex-1"></div></div>
          <div className="flex border-b border-black pb-1"><span className="font-bold w-32">Roll Number:</span> <div className="flex-1"></div></div>
          <div className="flex border-b border-black pb-1 col-span-2"><span className="font-bold w-32">Course/Batch:</span> <div className="flex-1">{format?.course} - {format?.department}</div></div>
          <div className="flex border-b border-black pb-1"><span className="font-bold w-32">Date:</span> <div className="flex-1"></div></div>
          <div className="flex border-b border-black pb-1"><span className="font-bold w-32">Sign:</span> <div className="flex-1"></div></div>
        </div>

        <div className="flex flex-wrap gap-x-16 gap-y-12 justify-center pb-12 w-full max-w-4xl mx-auto">
          {(() => {
            const itemsPerCol = Math.max(10, Math.min(25, Math.ceil(rows.length / 2)));
            const numCols = Math.ceil(rows.length / itemsPerCol);
            return Array.from({ length: numCols }).map((_, colIdx) => {
              const colRows = rows.slice(colIdx * itemsPerCol, (colIdx + 1) * itemsPerCol);
              return (
                <div key={colIdx} className="space-y-4">
                  {colRows.map((num, idx) => (
                    <div key={`${num}-${idx}`} className="flex items-center gap-4">
                      <span className="font-bold text-slate-700 w-12 text-right tabular-nums">{num}</span>
                      <div className="flex gap-2">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt} className="w-8 h-8 rounded-full border border-black flex items-center justify-center relative font-medium text-xs text-slate-400">
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </div>
    );
  }


  if (showPaper) {
    return (
      <div className="space-y-6 print:hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
          <button onClick={() => setShowPaper(false)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold"><ArrowLeft className="w-4 h-4" /> Edit Frame</button>
          <div className="flex gap-3 items-center">
            <button onClick={handleSaveToStore} className="bg-indigo-50 text-indigo-700 font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-100"><CheckCircle2 className="w-4 h-4" /> Save Paper for EMS</button>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Target Pages:</span>
              <input type="number" min="1" max="50" value={targetPages} onChange={(e) => setTargetPages(parseInt(e.target.value) || 1)} className="w-16 font-bold text-center outline-none bg-white border border-slate-200 focus:border-blue-500 rounded p-1" />
            </div>
            <button onClick={() => reactToPrintFn()} className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700"><Download className="w-4 h-4" /> Export PDF</button>
          </div>
        </div>

        <div ref={printRef} className="bg-white p-12 print:p-0 print:border-none rounded-3xl border border-slate-200 shadow-xl max-w-[21cm] mx-auto relative border-t-8 border-t-slate-800">
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 mt-4 uppercase font-serif">
            {format?.logoUrl && <img src={format.logoUrl} alt="Logo" className="h-20 w-auto object-contain mx-auto mb-4" />}
            <h2 className="text-xl font-black text-slate-800 tracking-widest mb-1">{format?.instituteName}</h2>
            <h3 className="text-lg font-bold text-slate-600 mb-2 tracking-wider">{format?.department}</h3>
            <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">{format?.course} Examination</h1>
            <p className="text-sm font-bold text-slate-500 lowercase tracking-widest mt-2">{topics}</p>

            <div className="flex justify-between items-center text-sm font-bold text-slate-700 mt-8 font-sans">
              <p className="uppercase">TIME: {durationInput}</p>
              <p className="uppercase">MAX MARKS: {totalMarksInput}</p>
            </div>
          </div>

          <div className="font-serif prose max-w-none text-slate-800">
            {frames.map((f, i) => {
              const qPerPage = Math.ceil(frames.length / Math.max(1, targetPages));
              const shouldBreak = (i + 1) % qPerPage === 0 && i !== frames.length - 1;
              return (
              <div key={f.id} className={`mb-6 ${f.mainOrSub === 'Sub' ? 'ml-8' : ''} group relative border border-transparent hover:border-slate-100 p-4 -px-4 rounded-2xl transition-all hover:bg-slate-50/50 print:p-0 print:bg-transparent print:border-none print:-mx-0 ${shouldBreak ? 'print:break-after-page' : ''}`}>

                <div className="flex gap-4">
                  <div className="flex-1 mt-1 text-[15px] leading-relaxed break-words break-keep relative">
                    {editingId === f.id ? (
                      <div className="print:hidden font-sans">
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full p-4 border border-blue-200 focus:border-blue-500 bg-white shadow-inner rounded-xl min-h-[140px] font-medium text-slate-800 outline-none resize-y" autoFocus />
                        <div className="flex gap-3 mt-3">
                          <button onClick={() => {
                            setFrames(frames.map(fr => fr.id === f.id ? { ...fr, generatedContent: editText } : fr));
                            setEditingId(null);
                          }} className="bg-blue-600 shadow-sm text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">Save Question Details</button>
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
            )})}
          </div>
        </div>

        {/* OMR generator Section */}
        {frames.some(f => f.type.toLowerCase().includes('mcq')) && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500" /> OMR Sheet Generator</h3>
            <p className="text-sm text-slate-500 mb-6">Generate standardized OMR sheets for the multiple choice questions in this paper.</p>

            <div className="flex flex-wrap items-end gap-4 mb-6">
              <button onClick={() => printOmrFn()} className="bg-indigo-600 text-white font-bold h-[46px] px-6 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
                <Download className="w-4 h-4" /> Download OMR PDF
              </button>
            </div>

            {/* Hidden container for OMR printing */}
            <div className="hidden">
              {renderOMRSheet()}
            </div>
          </div>
        )}
      </div>
    )
  }


  return (
    <div className="space-y-6 print:hidden">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3"><Layers className="w-8 h-8 text-blue-600" /> Blueprint Generator</h2>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* LEFT: Config & Framing */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">1. Assessment Meta</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Course Config</label>
              <select value={selectedFormatId} onChange={e => setSelectedFormatId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm">
                <option value="">Select Format...</option>
                {formats.map(f => <option key={f.id} value={f.id}>{f.course} - {f.department}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sections / Units / Topics</label>
              <textarea value={topics} onChange={e => setTopics(e.target.value)} placeholder="e.g. Upper Limb Anatomy, Neurovascular tracts..." rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Expected Marks</label>
              <input type="number" min="1" value={totalMarksInput} onChange={e => setTotalMarksInput(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 text-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Time/Duration (e.g. 3 Hours)</label>
              <input type="text" value={durationInput} onChange={e => setDurationInput(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" placeholder="3 Hours" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">2. Frame Question</h3>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button onClick={() => setCurrentFrame({ ...currentFrame, mainOrSub: 'Main' })} className={`flex-1 text-xs font-bold py-2 rounded-md transition ${currentFrame.mainOrSub === 'Main' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Main Q</button>
              <button onClick={() => setCurrentFrame({ ...currentFrame, mainOrSub: 'Sub' })} className={`flex-1 text-xs font-bold py-2 rounded-md transition ${currentFrame.mainOrSub === 'Sub' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Sub Q</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type of Question</label>
              <select value={currentFrame.type} onChange={e => setCurrentFrame({ ...currentFrame, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium">
                <option value="">Select Type...</option>
                {allowedTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
              {currentFrame.type && format?.typeTooltips?.[currentFrame.type] && (
                <div className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 p-2.5 rounded-lg leading-relaxed">
                  <span className="font-bold opacity-70 uppercase tracking-widest block mb-1">Instruction</span>
                  {format.typeTooltips[currentFrame.type]}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[100px]">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Marks</label>
                <input type="number" min="1" max={remainingMarks} value={currentFrame.marks || ''} onChange={e => setCurrentFrame({ ...currentFrame, marks: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" />
              </div>
              <label className="flex items-center justify-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer h-[44px] flex-1 min-w-[140px]">
                <input type="checkbox" checked={currentFrame.subdivided} onChange={e => setCurrentFrame({ ...currentFrame, subdivided: e.target.checked })} className="w-4 h-4 text-blue-600 rounded shrink-0" />
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Subdivided?</span>
              </label>
            </div>

            <button onClick={addFrame} disabled={!selectedFormatId} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
              + Add Question to Flow
            </button>
          </div>
        </div>

        {/* RIGHT: Blueprint & Final Generate */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800">Blueprint Structure</h3>
              <div className="text-sm font-bold bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                Allocated: <span className={currentSum > totalMarks ? 'text-red-500' : currentSum === totalMarks ? 'text-green-600' : 'text-blue-600'}>{currentSum}</span> / {totalMarks} Marks
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {frames.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Target className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No questions added yet.<br />Start framing questions on the left.</p>
                </div>
              ) : (
                <div className="space-y-3 pr-2">
                  {frames.map((f, i) => (
                    <div key={f.id} className={`flex items-center justify-between p-4 rounded-xl border relative group transition-all hover:shadow-sm ${f.mainOrSub === 'Sub' ? 'bg-slate-50/70 ml-8 border-slate-200 border-l-4 border-l-blue-300' : 'bg-white border-slate-200 border-l-4 border-l-slate-800'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800">
                            {f.mainOrSub === 'Main' ? `Q${f.questionNo}.` : `↳ Sub`}
                          </span>
                          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{f.type}</span>
                          {f.subdivided && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold uppercase tracking-wider">Subdiv</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-black text-lg text-blue-600">{f.marks} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Marks</span></span>
                        <button onClick={() => deleteFrame(f.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 bg-white rounded-md opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
            <div className="flex-1 min-w-[200px]">
              <h4 className="font-black text-blue-900 text-lg mb-1">{onSaveComplete ? 'Save & Proceed' : 'Ready to build?'}</h4>
              <p className="text-sm font-medium text-blue-700">{onSaveComplete ? 'Add the framed questions, save the Question Paper, and move to generate rubrics.' : 'Ensure allocated marks match the expected total before generating.'}</p>
            </div>
            <button
              onClick={handleAutoGenerate}
              disabled={currentSum !== totalMarks || currentSum === 0 || isGenerating}
              className={`font-bold h-14 px-8 rounded-xl transition flex items-center justify-center w-full sm:w-auto whitespace-nowrap gap-3 shadow-lg shrink-0 ${currentSum === totalMarks && currentSum > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-0.5' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'}`}
            >
              {isGenerating ? (
                <><RefreshCw className="w-5 h-5 animate-spin shrink-0" /> Generating Paper...</>
              ) : onSaveComplete ? (
                <><CheckCircle2 className="w-5 h-5 shrink-0" /> Save Question Paper</>
              ) : (
                <><PenTool className="w-5 h-5 shrink-0" /> Auto-Generate Paper</>
              )}
            </button>
          </div>

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
