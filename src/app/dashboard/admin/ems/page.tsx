"use client";

import { useState, useRef } from 'react';
import { ClipboardCheck, Sparkles, UploadCloud, Users, CheckCircle2, FileSearch, HelpCircle, Camera, Settings, Trash2, ChevronLeft, ChevronRight, X, Crop as CropIcon, FolderOpen, Save, FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useQPaperStore } from '@/store/qPaperStore';
import { useEmsStore } from '@/store/emsStore';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GenerateView } from '../q-paper/page';

export default function EvaluationManagementSystem() {
    const store = useQPaperStore();
    const emsStore = useEmsStore();

    const [step, setStep] = useState(0);

    // Form State
    const [instituteName, setInstituteName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [course, setCourse] = useState('');
    const [department, setDepartment] = useState('');
    const [examName, setExamName] = useState('');
    const [paperSource, setPaperSource] = useState<'qpaper' | 'generator' | 'upload'>('qpaper');
    const [selectedPaperId, setSelectedPaperId] = useState('');
    const [questionPaperText, setQuestionPaperText] = useState('');
    const [isPaperLocked, setIsPaperLocked] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Upload Word Paper State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isParsingWord, setIsParsingWord] = useState(false);
    const [parseError, setParseError] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<{ text: string; marks: number }[]>([]);
    const [parsedTotalMarks, setParsedTotalMarks] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const wordFileRef = useRef<HTMLInputElement>(null);

    // Upload Script State
    const [studentRoll, setStudentRoll] = useState('');
    const [studentReg, setStudentReg] = useState('');
    const [studentName, setStudentName] = useState('');
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [uploads, setUploads] = useState<{ [qIndex: number]: string[] }>({});

    // Crop State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState('');
    const [cropTargetIdx, setCropTargetIdx] = useState<number | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const imgRef = useRef<HTMLImageElement>(null);

    const [scriptsUploaded, setScriptsUploaded] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    const [reviewingStudentId, setReviewingStudentId] = useState<number | null>(null);
    const [editingMarks, setEditingMarks] = useState<{ [qIdx: number]: number }>({});

    // Mock Students
    const [students] = useState([
        { id: 1, name: 'Student 1', roll: 'MBBS01', marks: null, status: 'pending' },
        { id: 2, name: 'Student 2', roll: 'MBBS02', marks: null, status: 'pending' },
    ]);

    const [evaluatedStudents, setEvaluatedStudents] = useState<any[]>([]);

    const handleWordUpload = async (file: File) => {
        setUploadedFile(file);
        setIsParsingWord(true);
        setParseError('');
        setParsedQuestions([]);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload-qpaper', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setParseError(data.error || 'Failed to parse the document.');
                setIsParsingWord(false);
                return;
            }

            // Populate form fields from parsed data
            if (data.institution) setInstituteName(data.institution);
            if (data.course) setCourse(data.course);
            if (data.department) setDepartment(data.department);
            if (data.paperTitle) setExamName(data.paperTitle);

            setParsedQuestions(data.questions);
            setParsedTotalMarks(data.totalMarks || 0);

            // Build the question paper text (questions separated by ---)
            const paperText = data.questions
                .map((q: { text: string; marks: number }, i: number) =>
                    `**Q${i + 1}. [${q.marks} Marks]**\n\n${q.text}`
                )
                .join('\n\n---\n\n');
            setQuestionPaperText(paperText);
        } catch (err: any) {
            setParseError('Network error: ' + err.message);
        } finally {
            setIsParsingWord(false);
        }
    };

    const handleEvaluateAll = () => {
        setEvaluating(true);
        setTimeout(() => {
            const initialBreakdown1: any = {};
            const initialBreakdown2: any = {};
            mockQuestions.forEach((_, i) => {
                initialBreakdown1[i] = Math.max(0, 10 - Math.floor(Math.random() * 4));
                initialBreakdown2[i] = Math.max(0, 10 - Math.floor(Math.random() * 6));
            });

            setEvaluatedStudents([
                { id: 1, name: studentName || 'Student 1', roll: studentRoll || 'MBBS01', marks: Object.values(initialBreakdown1).reduce((a: any, b: any) => a + b, 0), breakdown: initialBreakdown1, status: 'evaluated' },
                { id: 2, name: 'Student 2', roll: 'MBBS02', marks: Object.values(initialBreakdown2).reduce((a: any, b: any) => a + b, 0), breakdown: initialBreakdown2, status: 'evaluated' },
            ]);
            setEvaluating(false);
            setStep(4);
        }, 3000);
    };

    const handleImageUpload = (e: any) => {
        // mock image upload for a question
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setUploads(prev => ({
                ...prev,
                [currentQIndex]: [...(prev[currentQIndex] || []), URL.createObjectURL(files[0] as Blob)]
            }));
        }
    };

    const handleCropComplete = () => {
        if (imgRef.current && crop && cropTargetIdx !== null && crop.width > 0 && crop.height > 0) {
            const canvas = document.createElement('canvas');
            const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
            const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
            canvas.width = crop.width * scaleX;
            canvas.height = crop.height * scaleY;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(
                    imgRef.current,
                    crop.x * scaleX,
                    crop.y * scaleY,
                    crop.width * scaleX,
                    crop.height * scaleY,
                    0,
                    0,
                    crop.width * scaleX,
                    crop.height * scaleY
                );
                const croppedImageUrl = canvas.toDataURL('image/jpeg');
                setUploads(prev => {
                    const newUploads = [...(prev[currentQIndex] || [])];
                    newUploads[cropTargetIdx] = croppedImageUrl;
                    return { ...prev, [currentQIndex]: newUploads };
                });
            }
        }
        setCropModalOpen(false);
    };

    const mockQuestions = questionPaperText.split('---').filter(q => q.trim().length > 0).map(q => q.trim()) || ["Question 1"];
    if (mockQuestions.length === 0) mockQuestions.push("Question 1");

    const handleExportResults = () => {
        if (!evaluatedStudents || evaluatedStudents.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";

        const qHeaders = mockQuestions.map((_, i) => `Q${i + 1}`).join(",");
        csvContent += `Roll No,Student Name,Total Marks,Status,${qHeaders}\n`;

        evaluatedStudents.forEach(student => {
            const qMarks = mockQuestions.map((_, i) => student.breakdown && student.breakdown[i] !== undefined ? student.breakdown[i] : 0).join(",");
            const row = `"${student.roll}","${student.name}",${student.marks},${student.status},${qMarks}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${examName || 'results'}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 h-[calc(100vh-8rem)] flex flex-col">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900 via-pink-800 to-fuchsia-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.25),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-rose-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <ClipboardCheck className="w-6 h-6 text-rose-200" />
                            </div>
                            <p className="text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em]">Department Admin</p>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">EMS — Essay Evaluation</h2>
                        <p className="text-rose-200/80 mt-1.5 font-medium">Gemini-Powered automatic exam grading based on approved rubrics.</p>
                    </div>
                </div>
            </div>

            {/* Stepper only shows if we are in an active evaluation (step > 0) */}
            {step > 0 && (
                <div className="flex items-center justify-center gap-4 mb-4 flex-shrink-0">
                    {[
                        { num: 1, title: 'Create Exam' },
                        { num: 2, title: 'Approve Rubric' },
                        { num: 3, title: 'Upload Scripts' },
                        { num: 4, title: 'AI Evaluation' },
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === s.num ? 'bg-indigo-600 text-white' :
                                step > s.num ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                            </div>
                            <span className={`text-sm font-bold hidden md:block ${step >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>
                                {s.title}
                            </span>
                            {s.num < 4 && <div className="w-12 h-0.5 bg-slate-200"></div>}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col overflow-y-auto relative">

                {/* Step 0: Dashboard / Saved Evaluations */}
                {step === 0 && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Evaluation Folders</h3>
                                <p className="text-slate-500 font-medium mt-1">Access past results or start a new grading session.</p>
                            </div>
                            <button onClick={() => setStep(1)} className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-transform"><Sparkles className="w-5 h-5" /> New Evaluation Session</button>
                        </div>

                        {emsStore.evaluations.length === 0 ? (
                            <div className="text-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-slate-700">No Saved Evaluations Yet</h4>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Start a new evaluation session to grade student scripts and save the results here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {emsStore.evaluations.map(evalu => (
                                    <div key={evalu.id} className="bg-white border text-slate-800 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 group cursor-pointer relative overflow-hidden flex flex-col items-start gap-4">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                            <FolderOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{evalu.examName}</h4>
                                            <p className="text-sm font-medium text-slate-500">{evalu.course} • {evalu.department}</p>
                                        </div>
                                        <div className="flex gap-4 mt-auto pt-4 border-t border-slate-100 w-full text-sm font-bold text-slate-500">
                                            <span>{evalu.students.length} Students</span>
                                            <span>•</span>
                                            <span>{new Date(evalu.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <button onClick={() => {
                                                setExamName(evalu.examName);
                                                setCourse(evalu.course);
                                                setDepartment(evalu.department);
                                                setInstituteName(evalu.instituteName);
                                                setQuestionPaperText(evalu.questions.join('\n\n---\n\n'));
                                                setEvaluatedStudents(evalu.students);
                                                setStep(4); // Go straight to results
                                            }} className="bg-white text-indigo-600 font-bold px-6 py-2 rounded-xl shadow-lg border border-indigo-100 scale-95 group-hover:scale-100 transition-all">View Results</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 1: Create Exam */}
                {step === 1 && (
                    <div className="mx-auto w-full space-y-8 mt-6">
                        {isPaperLocked ? (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300 max-w-4xl mx-auto pb-12">
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                    <button onClick={() => setIsPaperLocked(false)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /> Edit Exam Details</button>
                                    <h3 className="font-bold text-slate-800">Preview & Confirm Question Paper</h3>
                                    <button className="opacity-0 cursor-default px-4">Spacer</button>
                                </div>
                                
                                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl max-w-[21cm] mx-auto relative border-t-8 border-t-slate-800">
                                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8 mt-4 uppercase font-serif">
                                        {logoUrl && <img src={logoUrl} alt="Logo" className="h-20 w-auto object-contain mx-auto mb-4" />}
                                        <h2 className="text-xl font-black text-slate-800 tracking-widest mb-1">{instituteName || 'Institute'}</h2>
                                        <h3 className="text-lg font-bold text-slate-600 mb-2 tracking-wider">{department || 'Department'}</h3>
                                        <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">{course || 'Course'} Examination</h1>
                                        <p className="text-sm font-bold text-slate-500 lowercase tracking-widest mt-2">{examName || 'Assessment Name'}</p>
                                    </div>
                                    
                                    <div className="font-serif prose max-w-none text-slate-800">
                                        {mockQuestions.map((q, i) => (
                                            <div key={i} className="mb-6 relative border border-transparent p-4 -px-4 rounded-2xl transition-all hover:bg-slate-50">
                                                <div className="flex justify-between items-end border-b border-slate-200 pb-1 mb-3">
                                                    <h4 className="font-bold text-lg m-0">Question {i + 1}</h4>
                                                </div>
                                                <div className="mt-1 text-[15px] leading-relaxed break-words relative">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 pt-4 max-w-[21cm] mx-auto pb-12">
                                    <button
                                        onClick={() => {
                                            setIsSaving(true);
                                            setTimeout(() => {
                                                setIsSaving(false);
                                                setStep(2);
                                            }, 1000);
                                        }}
                                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-sm"
                                    >
                                        {isSaving ? <span className="animate-pulse">Generating Rubrics...</span> : <><Sparkles className="w-5 h-5" /> Lock Paper & Generate Rubrics for All Questions</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in zoom-in duration-300">
                                <div className="text-center mb-8">
                                    <ClipboardCheck className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-800">Initialize New Examination</h3>
                                    <p className="text-slate-500 mt-2">Set up exam details and provide the question paper to generate rubrics.</p>
                                </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Name of the Institution</label>
                                <input value={instituteName} onChange={e => setInstituteName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. ABC Medical College" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Course</label>
                                <input value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. MBBS First Year" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Department</label>
                                <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Anatomy" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Logo URL (Optional)</label>
                                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Examination Name *</label>
                                <input value={examName} onChange={e => setExamName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. Internal Assessment 1" />
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-indigo-500" /> Add Question Paper</label>
                                <div className="flex flex-wrap gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl w-max">
                                    <button onClick={() => setPaperSource('qpaper')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${paperSource === 'qpaper' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>Select from Q-Paper Dev</button>
                                    <button onClick={() => setPaperSource('generator')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${paperSource === 'generator' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}><Sparkles className="inline w-4 h-4 mr-1"/> Blueprint Generator</button>
                                    <button onClick={() => { setPaperSource('upload'); setUploadedFile(null); setParsedQuestions([]); setParseError(''); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${paperSource === 'upload' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}><Upload className="w-3.5 h-3.5"/> Upload Question Paper</button>
                                </div>

                                {paperSource === 'generator' && (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute right-0 top-0 opacity-10 pt-4 pr-4">
                                                <Sparkles className="w-24 h-24" />
                                            </div>
                                            <h3 className="text-xl font-bold text-indigo-900 mb-2">Create New Question Paper</h3>
                                            <p className="text-indigo-700 font-medium mb-6 max-w-2xl text-sm">Design structured question papers with AI, mapping directly to your institution's formats. Once saved, they will automatically appear in your Q-Paper selector.</p>
                                            
                                            <div className="bg-white rounded-3xl p-4 shadow-sm border border-indigo-100/50">
                                                <GenerateView 
                                                    formats={store.formats} 
                                                    onBack={() => setPaperSource('qpaper')} 
                                                    onSaveComplete={(id) => {
                                                        const paper = store.papers.find(p => p.id === id);
                                                        if (paper) {
                                                            setInstituteName(paper.instituteName);
                                                            setLogoUrl(paper.logoUrl);
                                                            setCourse(paper.course);
                                                            setDepartment(paper.department);
                                                            setExamName(paper.examName);
                                                            const text = paper.questions.map(q => `${q.generatedContent}`).join('\n\n---\n\n');
                                                            setQuestionPaperText(text);
                                                            setSelectedPaperId(id);
                                                            setPaperSource('qpaper');
                                                        }
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Upload Word Paper Panel ── */}
                                {paperSource === 'upload' && (
                                    <div className="animate-in fade-in duration-300 space-y-5">
                                        {/* Drop Zone */}
                                        {!uploadedFile && (
                                            <div
                                                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                                onDragLeave={() => setIsDragOver(false)}
                                                onDrop={e => {
                                                    e.preventDefault();
                                                    setIsDragOver(false);
                                                    const f = e.dataTransfer.files[0];
                                                    if (f) handleWordUpload(f);
                                                }}
                                                onClick={() => wordFileRef.current?.click()}
                                                className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all select-none ${
                                                    isDragOver
                                                        ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
                                                        : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/40'
                                                }`}
                                            >
                                                <input
                                                    ref={wordFileRef}
                                                    type="file"
                                                    accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                                                    className="hidden"
                                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleWordUpload(f); }}
                                                />
                                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                                                    isDragOver ? 'bg-emerald-100' : 'bg-slate-100'
                                                }`}>
                                                    <FileText className={`w-10 h-10 transition-colors ${
                                                        isDragOver ? 'text-emerald-600' : 'text-slate-400'
                                                    }`} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate-800 text-lg">Drop your Word file here</p>
                                                    <p className="text-slate-500 text-sm mt-1">or <span className="text-emerald-600 font-bold underline underline-offset-2">browse files</span></p>
                                                    <p className="text-xs text-slate-400 mt-3 bg-slate-100 px-3 py-1.5 rounded-full inline-block">Supports .docx and .doc formats</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Parsing Spinner */}
                                        {isParsingWord && (
                                            <div className="flex flex-col items-center gap-5 py-10 bg-slate-50 rounded-3xl border border-slate-200">
                                                <div className="relative w-16 h-16">
                                                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                                                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                    <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate-800">AI is Reading Your Question Paper...</p>
                                                    <p className="text-sm text-slate-500 mt-1">Extracting questions and mark allocations</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Error State */}
                                        {parseError && !isParsingWord && (
                                            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
                                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-bold text-red-800">Parsing Failed</p>
                                                    <p className="text-sm text-red-600 mt-1">{parseError}</p>
                                                    <button onClick={() => { setUploadedFile(null); setParseError(''); }} className="mt-3 text-sm font-bold text-red-700 underline">Try a different file</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Parsed Results */}
                                        {parsedQuestions.length > 0 && !isParsingWord && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                                                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-emerald-900 text-sm">Successfully Parsed!</p>
                                                            <p className="text-xs text-emerald-700">{parsedQuestions.length} questions · {parsedTotalMarks} total marks · {uploadedFile?.name}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { setUploadedFile(null); setParsedQuestions([]); setParseError(''); setQuestionPaperText(''); }}
                                                        className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                    >Remove</button>
                                                </div>

                                                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extracted Questions</span>
                                                        <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{parsedTotalMarks} Total Marks</span>
                                                    </div>
                                                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                                        {parsedQuestions.map((q, idx) => (
                                                            <div key={idx} className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                                                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0 mt-0.5">Q{idx + 1}</div>
                                                                <p className="flex-1 text-sm text-slate-700 font-medium line-clamp-2">{q.text}</p>
                                                                <span className="shrink-0 text-xs font-bold text-white bg-indigo-500 px-2.5 py-1 rounded-full">{q.marks}M</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                                    <span className="text-amber-600">✦</span> Institution, course, department and exam name fields have been auto-filled from the document where detected. You can edit them above.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {paperSource === 'qpaper' && (
                                    <div className="mb-4">
                                        <select
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                                            value={selectedPaperId}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedPaperId(id);
                                                const paper = store.papers.find(p => p.id === id);
                                                if (paper) {
                                                    setInstituteName(paper.instituteName);
                                                    setLogoUrl(paper.logoUrl);
                                                    setCourse(paper.course);
                                                    setDepartment(paper.department);
                                                    setExamName(paper.examName);
                                                    const text = paper.questions.map(q => `${q.generatedContent}`).join('\n\n---\n\n');
                                                    setQuestionPaperText(text);
                                                }
                                            }}
                                        >
                                            <option value="" disabled>Select a saved question paper...</option>
                                            {store.papers.filter(p => {
                                                const format = store.formats.find(f => f.id === p.formatId);
                                                return format?.paperType !== 'MCQ';
                                            }).length === 0 && <option value="" disabled>No compatible essay papers saved in Q-Paper Dev yet.</option>}
                                            {store.papers.filter(p => {
                                                const format = store.formats.find(f => f.id === p.formatId);
                                                return format?.paperType !== 'MCQ';
                                            }).map(p => (
                                                <option key={p.id} value={p.id}>{p.examName} ({p.course} - {p.department})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {paperSource === 'qpaper' && (
                                    <>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-6">Edit/Verify Question Paper Text *</label>
                                        <textarea
                                            value={questionPaperText}
                                            onChange={e => setQuestionPaperText(e.target.value)}
                                            className="w-full px-4 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 min-h-[200px] resize-y leading-relaxed"
                                            placeholder="Type questions or copy/paste from your Word Document here..."
                                        ></textarea>
                                    </>
                                )}
                            </div>
                        </div>

                        {(paperSource === 'qpaper' || (paperSource === 'upload' && parsedQuestions.length > 0)) && (
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        if (!examName || !questionPaperText) return alert("Exam Name and Question Paper text are required.");
                                        setIsPaperLocked(true);
                                    }}
                                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex justify-center items-center gap-2 shadow-sm"
                                >
                                    Continue & Format Paper <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Approve Rubric */}
                {step === 2 && (
                    <div className="w-full space-y-6 animate-in slide-in-from-right duration-300 max-w-5xl mx-auto flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <h3 className="text-xl font-bold text-slate-800">Generated AI Rubrics</h3>
                            <span className="bg-indigo-50 text-indigo-700 text-sm font-bold px-3 py-1 rounded-lg">Pending Approval</span>
                        </div>

                        <div className="space-y-6 overflow-y-auto px-1 pb-4 flex-1">
                            {mockQuestions.map((q, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative overflow-hidden transition-all hover:bg-white hover:shadow-sm">
                                    <Sparkles className="absolute right-0 top-0 w-32 h-32 text-indigo-500/5 pointer-events-none -mt-6 -mr-6" />
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 text-sm">Q{idx + 1}</div>
                                    </div>
                                    <div className="font-bold text-slate-900 mb-6 prose prose-slate tracking-tight"><ReactMarkdown remarkPlugins={[remarkGfm]}>{q}</ReactMarkdown></div>
                                    
                                    <div className="space-y-3 text-sm text-slate-600 font-medium">
                                        <div className="flex justify-between border-b border-slate-200 pb-3 items-center">
                                            <span>Key concept identification / Definitions</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">30%</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-3 items-center">
                                            <span>Detailed explanation / Supporting evidence</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">50%</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span>Structure and formatting</span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">20%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto flex gap-4 pt-4 border-t border-slate-100 flex-shrink-0">
                            <button className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold justify-center rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Edit All Rubrics</button>
                            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-indigo-600 text-white font-bold justify-center rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                                <CheckCircle2 className="w-5 h-5" /> Approve & Lock All Rubrics
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Upload Scripts */}
                {step === 3 && (
                    <div className="w-full max-w-4xl mx-auto space-y-6 mt-6 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Upload Student Answer Scripts</h3>
                                <p className="text-slate-500 text-sm mt-1">Provide student details and upload answer sheets question by question.</p>
                            </div>
                        </div>

                        {/* Student Details */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Roll Number</label>
                                <input value={studentRoll} onChange={e => setStudentRoll(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. 21M012" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Registration Number</label>
                                <input value={studentReg} onChange={e => setStudentReg(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. RG-98822" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Name of Student</label>
                                <input value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="e.g. John Doe" />
                            </div>
                        </div>

                        {/* Question-by-Question Uploads */}
                        <div className="bg-white border text-slate-800 border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[400px]">

                            {/* Left Side: Question List */}
                            <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                                <div className="p-4 border-b border-slate-200 font-bold text-slate-700 bg-slate-100 flex justify-between items-center">
                                    <span>Questions Map</span>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">{mockQuestions.length} Items</span>
                                </div>
                                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                    {mockQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentQIndex(idx)}
                                            className={`w-full text-left p-3 rounded-xl transition-colors flex justify-between items-center ${currentQIndex === idx ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-600'}`}
                                        >
                                            <span className="font-bold text-sm truncate pr-2">Q{idx + 1}. {q.substring(0, 25).replace(/\*\*/g, '')}...</span>
                                            {uploads[idx]?.length > 0 && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Side: Upload Interface */}
                            <div className="w-full md:w-2/3 p-8 flex flex-col">
                                <div className="mb-6">
                                    <h4 className="font-bold text-slate-900 text-lg mb-2 flex justify-between items-start">
                                        <span>Question {currentQIndex + 1}</span>
                                        <span className="text-sm bg-slate-100 text-slate-500 px-3 py-1 rounded-lg border border-slate-200">{uploads[currentQIndex]?.length || 0} Images</span>
                                    </h4>
                                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 line-clamp-3">{mockQuestions[currentQIndex].replace(/\*\*/g, '')}</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 relative z-10">
                                    {uploads[currentQIndex]?.map((imgUrl, i) => (
                                        <div key={i} className="aspect-[3/4] rounded-2xl border-2 border-indigo-100 bg-slate-100 relative group overflow-hidden">
                                            <img src={imgUrl} alt={`Q${currentQIndex + 1} Upload ${i + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => { setCropImageSrc(imgUrl); setCropTargetIdx(i); setCrop(undefined); setCropModalOpen(true); }} className="bg-white p-2 rounded-lg hover:text-indigo-600"><Settings className="w-4 h-4" /></button>
                                                <button onClick={() => setUploads(prev => ({ ...prev, [currentQIndex]: prev[currentQIndex].filter((_, index) => index !== i) }))} className="bg-white text-red-500 p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer group">
                                        <div className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                            <input type="file" multiple accept="image/*" className="w-full h-full cursor-pointer" onChange={handleImageUpload} />
                                        </div>
                                        <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600 text-center px-4">Take Photo or Upload Image</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-4 pt-4 border-t border-slate-100">
                                    <button
                                        disabled={currentQIndex === 0}
                                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                                        className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Prev Q
                                    </button>

                                    {currentQIndex < mockQuestions.length - 1 ? (
                                        <button
                                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                                            className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold justify-center rounded-xl hover:bg-indigo-100 flex items-center gap-2"
                                        >
                                            Next Question <ChevronRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (!studentRoll || !studentName) return alert("Please enter Student Roll and Name.");
                                                setScriptsUploaded(true);
                                                handleEvaluateAll();
                                            }}
                                            className="flex-1 py-3 bg-indigo-600 text-white font-bold justify-center rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                                        >
                                            Submit Script for Evaluation <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Final Dashboard */}
                {step === 4 && (
                    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
                        {evaluating ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                    <FileSearch className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-slate-900">Gemini is Evaluating Scripts...</h3>
                                    <p className="text-slate-500 text-sm mt-2">Checking handwriting, mapping to rubric, and allocating marks.</p>
                                </div>
                            </div>
                        ) : reviewingStudentId ? (
                            <div className="space-y-6 flex flex-col h-full relative">
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                    <button onClick={() => setReviewingStudentId(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /> Back to Dashboard</button>
                                    <div className="text-center">
                                        <span className="text-xl font-bold text-slate-900 block">{evaluatedStudents.find(s => s.id === reviewingStudentId)?.name}</span>
                                        <span className="text-sm font-medium text-slate-500">{evaluatedStudents.find(s => s.id === reviewingStudentId)?.roll}</span>
                                    </div>
                                    <button onClick={() => {
                                        setEvaluatedStudents(prev => prev.map(s => s.id === reviewingStudentId ? { ...s, breakdown: editingMarks, marks: Object.values(editingMarks).reduce((a, b) => a + b, 0) } : s));
                                        setReviewingStudentId(null);
                                    }} className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-md transform hover:-translate-y-0.5 transition-all"><CheckCircle2 className="w-5 h-5" /> Save Final Marks</button>
                                </div>

                                <div className="space-y-8 overflow-y-auto px-2 pb-8">
                                    {mockQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white border text-slate-800 border-slate-200 shadow-md rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-stretch transform transition-all hover:border-indigo-200 relative overflow-hidden">
                                            <div className="md:w-1/2 flex flex-col">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-black text-slate-900 text-xl flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm">Q{idx + 1}</div></h4>
                                                    <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-xs tracking-widest uppercase">Max 10 Marks</span>
                                                </div>
                                                <p className="text-sm text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed font-medium flex-1">{q.replace(/\*\*/g, '')}</p>

                                                <div className="mt-8 bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-100 group focus-within:border-indigo-500 transition-colors">
                                                    <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Suggested Marks</label>
                                                    <div className="flex items-center gap-4">
                                                        <input type="number" min="0" max="10" value={editingMarks[idx] !== undefined ? editingMarks[idx] : 0} onChange={e => setEditingMarks(prev => ({ ...prev, [idx]: parseFloat(e.target.value) || 0 }))} className="w-24 text-3xl font-black text-slate-900 px-4 py-3 rounded-xl bg-white border border-indigo-200 outline-none focus:ring-4 focus:ring-indigo-100 text-center transition-shadow shadow-sm" />
                                                        <span className="text-slate-400 font-bold text-xl">/ 10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:w-1/2 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative min-h-[300px]">
                                                {uploads[idx] && uploads[idx].length > 0 ? (
                                                    <img src={uploads[idx][0]} alt={`Answer script for Q${idx + 1}`} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                                                ) : (
                                                    <div className="text-center px-8 space-y-4">
                                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto">
                                                            <FileSearch className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-500">No Script Image</p>
                                                            <p className="text-xs font-medium text-slate-400 mt-1">Image not uploaded during Step 3</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">{examName}</h3>
                                        <p className="text-slate-500 font-medium">Evaluation Complete</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => {
                                            emsStore.saveEvaluation({
                                                id: Date.now().toString(),
                                                examName,
                                                course,
                                                department,
                                                instituteName,
                                                date: Date.now(),
                                                questions: mockQuestions,
                                                students: evaluatedStudents
                                            });
                                            alert("Evaluation results successfully saved to folder!");
                                            setStep(0);
                                        }} className="bg-white border-2 border-indigo-600 text-indigo-600 font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-50 flex items-center gap-2"><Save className="w-4 h-4" /> Save to Folder</button>
                                        <button onClick={handleExportResults} className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700">Export Final Results</button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200">
                                                <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Roll No</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">AI Marks</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                                <th className="p-4 pr-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {evaluatedStudents.map((s) => (
                                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-100/50">
                                                    <td className="p-4 pl-6 font-mono text-slate-500">{s.roll}</td>
                                                    <td className="p-4 font-bold text-slate-800">{s.name}</td>
                                                    <td className="p-4 text-right font-bold text-lg text-indigo-700">{s.marks}/100</td>
                                                    <td className="p-4 text-center">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2.5 py-1 rounded-md">Evaluated</span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                        <button onClick={() => { setReviewingStudentId(s.id); setEditingMarks(s.breakdown); }} className="text-sm font-bold text-indigo-600 hover:underline">Review Details</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            <CropModal
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={cropImageSrc}
                crop={crop}
                setCrop={setCrop}
                onCropComplete={handleCropComplete}
                imgRef={imgRef}
            />
        </div >
    );
}

// Ensure the Crop Modal is rendered over everything
function CropModal({ isOpen, onClose, imageSrc, crop, setCrop, onCropComplete, imgRef }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><CropIcon className="w-5 h-5 text-indigo-500" /> Crop Answer Script</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center relative min-h-[300px]">
                    <ReactCrop
                        crop={crop}
                        onChange={c => setCrop(c)}
                        className="max-h-full"
                    >
                        <img ref={imgRef} src={imageSrc} alt="Crop preview" className="max-h-[60vh] object-contain" />
                    </ReactCrop>
                </div>

                <div className="flex gap-4 mt-6 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={onCropComplete} className="flex-1 py-3 font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">Apply Crop</button>
                </div>
            </div>
        </div>
    );
}
