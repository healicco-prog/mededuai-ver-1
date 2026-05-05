"use client";

import { useState, useRef } from 'react';
import { Target, Download, PenTool, CheckCircle2, ArrowLeft, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { useQPaperStore } from '@/store/qPaperStore';
import { useReactToPrint } from 'react-to-print';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// These were defined in page.tsx, need them here too or pass them in
const ESSAY_TYPES = [
  "Simple Essay",
  "Structured Essay",
  "Problem Based",
  "Case based",
  "Reasoning",
  "Short Essay"
];

const MCQ_TYPES = [
  "1 Mark MCQ",
  "1 Mark MCQ (Clinical Scenario / Case-Based)",
  "1 Mark MCQ (Assertion–Reason)",
  "2 Marks MCQ (Case scenario based, with 2 sub questions)"
];

const QUESTION_TYPES = [...ESSAY_TYPES, ...MCQ_TYPES];

interface QuestionFrame {
  id: string;
  questionNo: string | number;
  mainOrSub: 'Main' | 'Sub';
  type: string;
  marks: number;
  subdivided: boolean;
  generatedContent?: string;
}

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
  const [editQNo, setEditQNo] = useState<string | number>('');
  const [editMarks, setEditMarks] = useState<number>(0);

  // Print Distribution State
  const [targetPages, setTargetPages] = useState<number>(1);
  const [generationMode, setGenerationMode] = useState<'auto' | 'manual'>('auto');
  const [addQuantity, setAddQuantity] = useState<number>(1);

  // Header Override States
  const [headerInstitute, setHeaderInstitute] = useState<string | null>(null);
  const [headerDepartment, setHeaderDepartment] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState<string | null>(null);
  const [headerTopics, setHeaderTopics] = useState<string | null>(null);
  const [headerTime, setHeaderTime] = useState<string | null>(null);
  const [headerMarks, setHeaderMarks] = useState<string | null>(null);

  const format = formats.find(f => f.id === selectedFormatId);
  const allowedTypes = format?.allowedTypes || QUESTION_TYPES;

  const totalMarks = parseInt(totalMarksInput) || 0;
  const currentSum = frames.reduce((acc, f) => acc + f.marks, 0);
  const remainingMarks = totalMarks - currentSum;

  const displayInstitute = headerInstitute ?? format?.instituteName ?? '';
  const displayDepartment = headerDepartment ?? format?.department ?? '';
  const displayTitle = headerTitle ?? `${format?.course ?? ''} Examination`;
  const displayTopics = headerTopics ?? topics ?? '';
  const displayTime = headerTime ?? durationInput ?? '';
  const displayMarks = headerMarks ?? (generationMode === 'manual' ? Math.max(totalMarks, currentSum).toString() : totalMarksInput) ?? '';

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
    if (!currentFrame.type || currentFrame.marks <= 0 || addQuantity <= 0) return alert("Select type, valid marks, and quantity.");
    const totalMarksToAdd = currentFrame.marks * addQuantity;
    if (totalMarksToAdd > remainingMarks) {
      return alert(`Cannot add ${totalMarksToAdd} marks (${addQuantity}x${currentFrame.marks}). Only ${remainingMarks} marks remaining for this paper.`);
    }

    const nextQNo = frames.filter(f => f.mainOrSub === 'Main').length + (currentFrame.mainOrSub === 'Main' ? 1 : 0);

    const newFrames: QuestionFrame[] = [];
    for (let i = 0; i < addQuantity; i++) {
      newFrames.push({
        id: Date.now().toString() + '-' + i,
        questionNo: currentFrame.mainOrSub === 'Main' ? nextQNo + i : frames[frames.length - 1]?.questionNo || 1,
        ...currentFrame
      });
    }

    setFrames([...frames, ...newFrames]);
    setCurrentFrame({ ...currentFrame, marks: 0, type: '' });
    setAddQuantity(1);
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

  const handleManualPrepare = () => {
    if (!format) return alert("Format is required.");

    const updatedFrames = frames.map((f, i) => {
      let content = f.generatedContent || '';
      if (!content) {
        let prefix = `**Q${f.questionNo}.**`;
        if (f.mainOrSub === 'Sub') {
           const subIndex = frames.filter((fr, idx) => fr.mainOrSub === 'Sub' && fr.questionNo === f.questionNo && idx < i).length;
           const subLabel = String.fromCharCode(97 + subIndex); // a, b, c...
           prefix = `  **${subLabel})**`; 
        }

        const isMCQ = f.type.toLowerCase().includes('mcq');
        const hasSubQs = f.subdivided || f.type.toLowerCase().includes('sub questions');

        if (hasSubQs) {
          if (isMCQ) {
            content = `${prefix} [Type your case scenario / main question here]\n\n  **i)** [Type sub-question 1 here]\n  A) Option 1\n  B) Option 2\n  C) Option 3\n  D) Option 4\n\n  **ii)** [Type sub-question 2 here]\n  A) Option 1\n  B) Option 2\n  C) Option 3\n  D) Option 4`;
          } else {
            content = `${prefix} [Type your main question here]\n\n  **a)** [Type sub-question 1 here]\n\n  **b)** [Type sub-question 2 here]`;
          }
        } else if (isMCQ) {
          content = `${prefix} [Type your question here]\n\n  A) Option 1\n  B) Option 2\n  C) Option 3\n  D) Option 4`;
        } else {
          content = `${prefix} [Type your question here]`;
        }
      }
      return { ...f, generatedContent: content };
    });
    setFrames(updatedFrames);
    setShowPaper(true);
  };

  if (formats.length === 0) {
    return <div className="p-8 text-center"><p className="text-slate-500">Please setup a format first.</p><button onClick={onBack} className="text-blue-500 mt-4">Go Back</button></div>;
  }

  // OMR Render Helper
  const renderOMRSheet = () => {
    const rows: string[] = [];
    frames.forEach(f => {
      if (f.type.toLowerCase().includes('mcq')) {
        const content = f.generatedContent || '';
        
        // More robustly extract the question number (e.g. "**Q27.**", "Q27.", "27.", "27 i)")
        let displayQNo = String(f.questionNo);
        const qMatch = content.match(/^(?:\*\*|\s*)?Q?(\d+)[.)]?(?:\*\*|\s*)/i);
        if (qMatch) {
            displayQNo = qMatch[1];
        }

        // Count how many "A)" or "A." or "(A)" options exist. Each MCQ subquestion typically has one "A)" option.
        const optionAMatches = content.match(/(?:^|[\s\n])(?:\*\*)?(?:[Aa][.)]|\([Aa]\))(?:\*\*)?\s*/g);
        const mcqCount = optionAMatches ? optionAMatches.length : 0;

        if (mcqCount > 1) {
            // It's a subdivided MCQ
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            for (let i = 0; i < mcqCount; i++) {
                rows.push(`${displayQNo}(${romanNumerals[i] || i + 1}).`);
            }
        } else if (f.subdivided || f.type.toLowerCase().includes('sub questions')) {
            // Fallback if we didn't find multiple "A)" options but it's marked as subdivided
            rows.push(`${displayQNo}(I).`);
            rows.push(`${displayQNo}(II).`);
        } else {
            // Single question
            rows.push(`${displayQNo}.`);
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
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 mt-4 uppercase font-serif group/header relative">
            <div className="absolute -top-4 right-0 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded print:hidden opacity-0 group-hover/header:opacity-100 transition-opacity">Click any text below to edit</div>
            {format?.logoUrl && <img src={format.logoUrl} alt="Logo" className="h-20 w-auto object-contain mx-auto mb-4" />}
            
            <input 
              value={displayInstitute} 
              onChange={e => setHeaderInstitute(e.target.value)} 
              className="text-xl font-black text-slate-800 tracking-widest mb-1 text-center w-full bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors print:hover:bg-transparent rounded"
              placeholder="Institute Name"
            />
            
            <input 
              value={displayDepartment} 
              onChange={e => setHeaderDepartment(e.target.value)} 
              className="text-lg font-bold text-slate-600 mb-2 tracking-wider text-center w-full bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors print:hover:bg-transparent rounded"
              placeholder="Department"
            />
            
            <input 
              value={displayTitle} 
              onChange={e => setHeaderTitle(e.target.value)} 
              className="text-2xl font-bold text-slate-900 mt-4 mb-2 text-center w-full bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors print:hover:bg-transparent rounded"
              placeholder="Examination Title"
            />
            
            <input 
              value={displayTopics} 
              onChange={e => setHeaderTopics(e.target.value)} 
              className="text-sm font-bold text-slate-500 lowercase tracking-widest mt-2 text-center w-full bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors print:hover:bg-transparent rounded"
              placeholder="Topics"
            />

            <div className="flex justify-between items-center text-sm font-bold text-slate-700 mt-8 font-sans">
              <div className="flex items-center gap-2">
                <span className="uppercase whitespace-nowrap">TIME:</span>
                <input 
                  value={displayTime} 
                  onChange={e => setHeaderTime(e.target.value)} 
                  className="uppercase bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors print:hover:bg-transparent rounded w-full min-w-[120px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="uppercase whitespace-nowrap">MAX MARKS:</span>
                <input 
                  value={displayMarks} 
                  onChange={e => setHeaderMarks(e.target.value)} 
                  className="uppercase bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors print:hover:bg-transparent rounded w-16 text-left"
                />
              </div>
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
                      <div className="print:hidden font-sans bg-slate-50 p-4 rounded-xl border border-blue-100">
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question No</label>
                            <input type="text" value={editQNo} onChange={e => setEditQNo(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-800" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marks</label>
                            <input type="number" min="0" value={editMarks} onChange={e => setEditMarks(parseFloat(e.target.value) || 0)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-bold text-slate-800" />
                          </div>
                        </div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Content</label>
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full p-4 border border-slate-300 focus:border-blue-500 bg-white shadow-inner rounded-xl min-h-[140px] font-medium text-slate-800 outline-none resize-y" autoFocus />
                        <div className="flex gap-3 mt-3">
                          <button onClick={() => {
                            let newContent = editText;
                            if (String(editQNo) !== String(f.questionNo)) {
                               newContent = newContent.replace(`**Q${f.questionNo}.**`, `**Q${editQNo}.**`);
                            }
                            setFrames(frames.map(fr => fr.id === f.id ? { ...fr, generatedContent: newContent, questionNo: editQNo, marks: editMarks } : fr));
                            setEditingId(null);
                          }} className="bg-blue-600 shadow-sm text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">Save Details</button>
                          <button onClick={() => setEditingId(null)} className="bg-slate-100 text-slate-600 border border-slate-200 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{f.generatedContent || ''}</ReactMarkdown>
                           </div>
                           {generationMode === 'manual' && (
                             <div className="shrink-0 ml-4 font-bold text-slate-600">[{f.marks} Marks]</div>
                           )}
                        </div>
                        <button onClick={() => { setEditingId(f.id); setEditText(f.generatedContent || ''); setEditQNo(f.questionNo); setEditMarks(f.marks); }} className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm print:hidden" title="Edit text">
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
              <div className="flex-1 min-w-[70px]">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Marks</label>
                <input type="number" min="1" max={remainingMarks} value={currentFrame.marks || ''} onChange={e => setCurrentFrame({ ...currentFrame, marks: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" />
              </div>
              <div className="flex-1 min-w-[70px]">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantity</label>
                <input type="number" min="1" value={addQuantity} onChange={e => setAddQuantity(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" />
              </div>
              <label className="flex items-center justify-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer h-[44px] flex-1 min-w-[110px]">
                <input type="checkbox" checked={currentFrame.subdivided} onChange={e => setCurrentFrame({ ...currentFrame, subdivided: e.target.checked })} className="w-4 h-4 text-blue-600 rounded shrink-0" />
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Subdiv?</span>
              </label>
            </div>

            <button onClick={addFrame} disabled={!selectedFormatId} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
              + Add Question{addQuantity > 1 ? 's' : ''} to Flow
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

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col gap-6">
            <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100">
              <button onClick={() => setGenerationMode('auto')} className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all ${generationMode === 'auto' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                ✨ Auto-Generate with AI
              </button>
              <button onClick={() => setGenerationMode('manual')} className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all ${generationMode === 'manual' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                ✍️ Prepare Manually
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex-1 min-w-[200px]">
                <h4 className="font-black text-blue-900 text-lg mb-1">{onSaveComplete ? 'Save & Proceed' : 'Ready to build?'}</h4>
                <p className="text-sm font-medium text-blue-700">
                  {onSaveComplete 
                    ? 'Add the framed questions, save the Question Paper, and move to generate rubrics.' 
                    : generationMode === 'manual' 
                      ? 'Proceed to manually write your questions and mark allocation.'
                      : 'Ensure allocated marks match the expected total before generating.'}
                </p>
              </div>
              <button
                onClick={generationMode === 'auto' ? handleAutoGenerate : handleManualPrepare}
                disabled={(generationMode === 'auto' && (currentSum !== totalMarks || currentSum === 0)) || (generationMode === 'manual' && frames.length === 0) || isGenerating}
                className={`font-bold h-14 px-8 rounded-xl transition flex items-center justify-center w-full sm:w-auto whitespace-nowrap gap-3 shadow-lg shrink-0 
                  ${generationMode === 'auto' 
                    ? (currentSum === totalMarks && currentSum > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-0.5' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none')
                    : (frames.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none')}`}
              >
                {isGenerating ? (
                  <><RefreshCw className="w-5 h-5 animate-spin shrink-0" /> Generating Paper...</>
                ) : onSaveComplete ? (
                  <><CheckCircle2 className="w-5 h-5 shrink-0" /> Save Question Paper</>
                ) : generationMode === 'manual' ? (
                  <><PenTool className="w-5 h-5 shrink-0" /> Start Preparing Manually</>
                ) : (
                  <><PenTool className="w-5 h-5 shrink-0" /> Auto-Generate Paper</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
