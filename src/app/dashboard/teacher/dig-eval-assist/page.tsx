"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Loader2, Sparkles, Upload, CheckCircle, X, Crop,
    RotateCcw, ChevronRight, Award, FileText, Save,
    AlertCircle, Camera, UserCheck, Hash, Plus,
    ClipboardList, ScanLine, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COURSES = [
    { id: 'MBBS', name: 'MBBS', subjects: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine', 'Community Medicine', 'General Medicine', 'General Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Anesthesiology', 'Radiology'] },
    { id: 'BSc Nursing', name: 'BSc Nursing', subjects: ['Anatomy & Physiology', 'Nutrition & Biochemistry', 'Microbiology', 'Psychology', 'Nursing Foundations', 'Medical-Surgical Nursing', 'Community Health Nursing', 'Child Health Nursing', 'Mental Health Nursing', 'Obstetric & Midwifery Nursing', 'Nursing Research', 'Nursing Management'] },
    { id: 'BDS', name: 'BDS', subjects: ['Dental Anatomy', 'Dental Materials', 'Oral Pathology', 'Oral Medicine', 'Periodontology', 'Orthodontics', 'Prosthodontics', 'Conservative Dentistry', 'Endodontics', 'Oral Surgery', 'Pedodontics', 'Public Health Dentistry'] },
    { id: 'BPharm', name: 'B.Pharm', subjects: ['Pharmaceutical Chemistry', 'Pharmacology', 'Pharmaceutics', 'Pharmacognosy', 'Pharmaceutical Analysis', 'Hospital Pharmacy', 'Clinical Pharmacy'] },
    { id: 'BAMS', name: 'BAMS', subjects: ['Rachana Sharir', 'Kriya Sharir', 'Dravyaguna', 'Rasa Shastra', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra', 'Prasuti Tantra'] },
    { id: 'MD', name: 'MD', subjects: ['Internal Medicine', 'Pediatrics', 'Dermatology', 'Psychiatry', 'Community Medicine', 'Pathology', 'Pharmacology', 'Microbiology', 'Biochemistry', 'Physiology', 'Anatomy', 'Forensic Medicine'] },
    { id: 'MS', name: 'MS', subjects: ['General Surgery', 'Orthopedics', 'Ophthalmology', 'ENT', 'Obstetrics & Gynecology', 'Anesthesiology'] },
];

type Phase = 'setup' | 'generating-rubrics' | 'ready-for-scripts' | 'evaluating';

interface CropState { top: number; right: number; bottom: number; left: number; }

interface EvaluatedScript {
    id: string;
    rollNumber: string;
    studentName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    evaluation: string;
    approved: boolean;
    evaluationId: string | null;
}

export default function DigEvalAssistPage() {
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); }); }, []);

    const [phase, setPhase] = useState<Phase>('setup');
    const [course, setCourse] = useState('');
    const [subject, setSubject] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [question, setQuestion] = useState('');
    const [questionImage, setQuestionImage] = useState<string | null>(null);
    const [marks, setMarks] = useState(10);

    // Rubrics (internal — never shown to user)
    const [rubrics, setRubrics] = useState('');
    const [rubricId, setRubricId] = useState<string | null>(null);

    // Current student being evaluated
    const [rollNumber, setRollNumber] = useState('');
    const [studentName, setStudentName] = useState('');
    const [answerImages, setAnswerImages] = useState<{ src: string; crop: CropState; name: string }[]>([]);
    const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const questionFileRef = useRef<HTMLInputElement>(null);

    // Evaluated scripts queue
    const [evaluatedScripts, setEvaluatedScripts] = useState<EvaluatedScript[]>([]);
    const [currentEvaluation, setCurrentEvaluation] = useState('');
    const [currentMarksObtained, setCurrentMarksObtained] = useState(0);
    const [currentPercentage, setCurrentPercentage] = useState(0);
    const [currentEvalId, setCurrentEvalId] = useState<string | null>(null);
    const [showCurrentResult, setShowCurrentResult] = useState(false);
    const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);

    // UI State
    const [error, setError] = useState('');

    const activeCourse = COURSES.find(c => c.id === course);
    const subjects = activeCourse?.subjects || [];
    const effectiveSubject = customSubject || subject;

    // ── Step 1: Generate Rubrics ──
    const handleGenerateRubrics = async () => {
        if (!course || !effectiveSubject || (!question.trim() && !questionImage) || marks < 1) {
            setError('Please fill all fields (Course, Subject, Question, Marks) before proceeding.');
            return;
        }
        setError('');
        setPhase('generating-rubrics');

        try {
            const res = await fetch('/api/dig-eval-assist/generate-rubrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course,
                    subject: effectiveSubject,
                    question: question || '[See uploaded question image]',
                    marksAllotted: marks,
                    userId,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setRubrics(data.rubrics);
                setRubricId(data.rubricId || null);
                setPhase('ready-for-scripts');
            } else {
                setError(data.error || 'Failed to generate rubrics');
                setPhase('setup');
            }
        } catch {
            setError('Network error. Please try again.');
            setPhase('setup');
        }
    };

    // ── Question Image Upload ──
    const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) setQuestionImage(ev.target.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // ── Answer Image Upload ──
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setAnswerImages(prev => [...prev, {
                        src: ev.target!.result as string,
                        crop: { top: 0, right: 0, bottom: 0, left: 0 },
                        name: file.name,
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleRemoveImage = (idx: number) => {
        setAnswerImages(prev => prev.filter((_, i) => i !== idx));
        if (activeImageIdx === idx) setActiveImageIdx(null);
    };

    const handleCropChange = (idx: number, side: keyof CropState, value: number) => {
        setAnswerImages(prev => prev.map((img, i) => i === idx ? { ...img, crop: { ...img.crop, [side]: Math.max(0, Math.min(40, value)) } } : img));
    };

    const handleResetCrop = (idx: number) => {
        setAnswerImages(prev => prev.map((img, i) => i === idx ? { ...img, crop: { top: 0, right: 0, bottom: 0, left: 0 } } : img));
    };

    // ── Apply crop to image using canvas ──
    const applyCropToImage = useCallback((src: string, crop: CropState): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                const cropLeft = (crop.left / 100) * img.width;
                const cropTop = (crop.top / 100) * img.height;
                const cropRight = (crop.right / 100) * img.width;
                const cropBottom = (crop.bottom / 100) * img.height;
                const w = img.width - cropLeft - cropRight;
                const h = img.height - cropTop - cropBottom;
                if (w <= 0 || h <= 0) { resolve(src); return; }
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, cropLeft, cropTop, w, h, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = src;
        });
    }, []);

    // ── Evaluate Current Script ──
    const handleEvaluateScript = async () => {
        if (!rollNumber.trim()) { setError('Please enter Roll Number / Reg No.'); return; }
        if (!studentName.trim()) { setError('Please enter Student Name.'); return; }
        if (answerImages.length === 0) { setError('Please upload at least one answer script image.'); return; }
        setError('');
        setPhase('evaluating');
        setShowCurrentResult(false);

        try {
            const processedImages = await Promise.all(
                answerImages.map(img => applyCropToImage(img.src, img.crop))
            );

            const res = await fetch('/api/dig-eval-assist/evaluate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rubricId, rubrics, question: question || '[See uploaded question image]',
                    marksAllotted: marks, course, subject: effectiveSubject,
                    answerImages: processedImages, rollNumber, studentName, userId,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setCurrentEvaluation(data.evaluation);
                setCurrentMarksObtained(data.marksObtained || 0);
                setCurrentPercentage(data.percentage || 0);
                setCurrentEvalId(data.evaluationId || null);
                setShowCurrentResult(true);
                setPhase('ready-for-scripts');
            } else {
                setError(data.error || 'Evaluation failed');
                setPhase('ready-for-scripts');
            }
        } catch {
            setError('Network error during evaluation. Please try again.');
            setPhase('ready-for-scripts');
        }
    };

    // ── Approve Current Evaluation ──
    const handleApproveEvaluation = () => {
        const newScript: EvaluatedScript = {
            id: `${Date.now()}-${rollNumber}`,
            rollNumber,
            studentName,
            marksObtained: currentMarksObtained,
            totalMarks: marks,
            percentage: currentPercentage,
            evaluation: currentEvaluation,
            approved: true,
            evaluationId: currentEvalId,
        };
        setEvaluatedScripts(prev => [newScript, ...prev]);

        // Reset current student fields for next entry
        setRollNumber('');
        setStudentName('');
        setAnswerImages([]);
        setActiveImageIdx(null);
        setShowCurrentResult(false);
        setCurrentEvaluation('');
        setCurrentMarksObtained(0);
        setCurrentPercentage(0);
        setCurrentEvalId(null);
    };

    // ── Reset Everything ──
    const handleFullReset = () => {
        setPhase('setup'); setCourse(''); setSubject(''); setCustomSubject('');
        setQuestion(''); setQuestionImage(null); setMarks(10);
        setRubrics(''); setRubricId(null);
        setRollNumber(''); setStudentName('');
        setAnswerImages([]); setActiveImageIdx(null);
        setEvaluatedScripts([]);
        setShowCurrentResult(false); setCurrentEvaluation('');
        setCurrentMarksObtained(0); setCurrentPercentage(0); setCurrentEvalId(null);
        setError('');
    };

    const steps = [
        { label: 'Configure', active: phase === 'setup', done: phase !== 'setup' },
        { label: 'Preparing Rubrics', active: phase === 'generating-rubrics', done: ['ready-for-scripts', 'evaluating'].includes(phase) },
        { label: 'Evaluate Scripts', active: phase === 'ready-for-scripts' || phase === 'evaluating', done: false },
    ];

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* ═══════ HEADER ═══════ */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-cyan-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                            <ScanLine className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Dig Evaluation Assist</h2>
                            <p className="text-teal-300/80 text-sm font-medium">Digital Evaluation & Assist System — AI-powered answer script evaluation</p>
                        </div>
                    </div>
                    {/* Progress Steps */}
                    <div className="relative mt-5 flex items-center gap-2">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2 flex-1">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${step.done ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : step.active ? 'bg-teal-500/30 text-teal-200 border border-teal-400/40 animate-pulse' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                                    {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : step.active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current inline-block" />}
                                    {step.label}
                                </div>
                                {i < steps.length - 1 && <div className={`flex-1 h-px ${step.done ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-2xl text-sm font-medium flex-shrink-0">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">

                {/* ═══════ SETUP PHASE ═══════ */}
                {phase === 'setup' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in">
                        <div className="bg-gradient-to-b from-teal-50/50 to-white p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-teal-600" /> Question & Rubric Configuration
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Set up the question details. AI will prepare answer rubrics in the background and prompt you to start uploading scripts.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Course & Subject */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Course</label>
                                    <select value={course} onChange={e => { setCourse(e.target.value); setSubject(''); setCustomSubject(''); }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 text-sm font-medium transition-all">
                                        <option value="">Select Course</option>
                                        {COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <select value={subject} onChange={e => { setSubject(e.target.value); setCustomSubject(''); }} disabled={!course}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 text-sm font-medium transition-all disabled:opacity-50">
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                        <option value="__custom">Other (Type manually)</option>
                                    </select>
                                    {subject === '__custom' && (
                                        <input type="text" placeholder="Type subject name..." value={customSubject}
                                            onChange={e => setCustomSubject(e.target.value)}
                                            className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium transition-all" />
                                    )}
                                </div>
                            </div>

                            {/* Question */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Question (Type or Upload Image)</label>
                                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                                    placeholder="Type the exam question here... e.g., 'Describe the pathogenesis and management of Rheumatic Heart Disease'"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 text-sm font-medium min-h-[100px] transition-all resize-y" />
                                <div className="mt-3 flex items-center gap-3">
                                    <button onClick={() => questionFileRef.current?.click()}
                                        className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 bg-teal-50 px-4 py-2 rounded-xl border border-teal-200 hover:bg-teal-100 transition-all">
                                        <Upload className="w-4 h-4" /> Upload Question Image
                                    </button>
                                    <input ref={questionFileRef} type="file" accept="image/*" onChange={handleQuestionImageUpload} className="hidden" />
                                    {questionImage && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Image uploaded</span>
                                            <button onClick={() => setQuestionImage(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                                {questionImage && (
                                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-w-xs">
                                        <img src={questionImage} alt="Question" className="w-full object-contain max-h-48" />
                                    </div>
                                )}
                            </div>

                            {/* Marks */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Marks Allotted</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[2, 3, 5, 10, 15, 20].map(m => (
                                        <button key={m} onClick={() => setMarks(m)}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${marks === m ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-teal-200'}`}>
                                            {m} Marks
                                        </button>
                                    ))}
                                    <input type="number" value={marks} onChange={e => setMarks(parseInt(e.target.value) || 1)} min={1} max={100}
                                        className="w-24 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold text-center" />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button onClick={handleGenerateRubrics}
                                    disabled={!course || !(effectiveSubject && effectiveSubject !== '__custom') || (!question.trim() && !questionImage)}
                                    className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                    <Sparkles className="w-5 h-5" /> Prepare Rubrics & Continue
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ GENERATING RUBRICS ═══════ */}
                {phase === 'generating-rubrics' && (
                    <div className="flex items-center justify-center py-16 animate-in fade-in">
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-lg text-center max-w-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/20">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Building Answer Rubrics...</h3>
                            <p className="text-slate-500 text-sm">AI is creating a detailed per-mark rubric for <span className="font-bold text-teal-600">{effectiveSubject}</span> ({marks} marks). You'll be directed to upload answer scripts shortly.</p>
                        </div>
                    </div>
                )}

                {/* ═══════ READY FOR SCRIPTS / EVALUATING ═══════ */}
                {(phase === 'ready-for-scripts' || phase === 'evaluating') && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Rubrics Ready Banner */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-emerald-800">Answer Rubrics Ready — Saved Automatically</p>
                                <p className="text-xs text-emerald-600">{course} • {effectiveSubject} • {marks} Marks • Start uploading answer scripts below</p>
                            </div>
                            <button onClick={handleFullReset} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                                <RotateCcw className="w-3 h-3" /> New Question
                            </button>
                        </div>

                        {/* Question Reference */}
                        <div className="bg-teal-50 rounded-2xl border border-teal-100 px-5 py-3">
                            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest mb-1">Question ({marks} Marks)</p>
                            <p className="text-sm font-medium text-slate-800">{question || '[See uploaded question image]'}</p>
                        </div>

                        {/* Evaluated Scripts Summary Table */}
                        {evaluatedScripts.length > 0 && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-emerald-50 p-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <ClipboardList className="w-5 h-5 text-emerald-600" /> Evaluated Scripts ({evaluatedScripts.length})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Avg:</span>
                                        <span className="text-sm font-bold text-emerald-600">
                                            {(evaluatedScripts.reduce((s, e) => s + e.marksObtained, 0) / evaluatedScripts.length).toFixed(1)} / {marks}
                                        </span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {evaluatedScripts.map((script) => (
                                        <div key={script.id}>
                                            <div className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => setExpandedScriptId(expandedScriptId === script.id ? null : script.id)}>
                                                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{script.studentName}</p>
                                                    <p className="text-xs text-slate-500 font-medium">Roll No: {script.rollNumber}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`text-lg font-bold ${script.percentage >= 80 ? 'text-emerald-600' : script.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {script.marksObtained} / {script.totalMarks}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-bold">{script.percentage}%</p>
                                                </div>
                                                <div className="text-slate-400 flex-shrink-0">
                                                    {expandedScriptId === script.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </div>
                                            </div>
                                            {expandedScriptId === script.id && (
                                                <div className="px-6 pb-5 pt-0 bg-slate-50 border-t border-slate-100">
                                                    <div className="prose prose-slate max-w-none prose-sm">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{script.evaluation}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Show Current Evaluation Result ── */}
                        {showCurrentResult && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6">
                                    {/* Score Card */}
                                    <div className="text-center mb-6">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${currentPercentage >= 80 ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20' : currentPercentage >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-rose-500/20'}`}>
                                            <Award className="w-10 h-10 text-white" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-slate-900 mb-0.5">{currentMarksObtained} / {marks}</h3>
                                        <p className={`text-lg font-bold ${currentPercentage >= 80 ? 'text-emerald-600' : currentPercentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{currentPercentage}%</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            <span className="font-bold text-slate-700">{studentName}</span> • Roll No: <span className="font-bold text-slate-700">{rollNumber}</span>
                                        </p>
                                    </div>

                                    {/* Detailed Evaluation */}
                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-5">
                                        <div className="prose prose-slate max-w-none prose-sm">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentEvaluation}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Approve & Continue */}
                                    <div className="flex items-center justify-between gap-4">
                                        <button onClick={() => { setShowCurrentResult(false); }}
                                            className="text-sm font-bold text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors">
                                            <X className="w-4 h-4" /> Discard & Re-evaluate
                                        </button>
                                        <button onClick={handleApproveEvaluation}
                                            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                            <CheckCircle className="w-5 h-5" /> Approve & Save
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Upload Script Card (shown when no current result visible) ── */}
                        {!showCurrentResult && phase !== 'evaluating' && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 border-b border-teal-100">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-teal-600" />
                                        {evaluatedScripts.length > 0 ? 'Upload Next Answer Script' : 'Upload Answer Script'}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">Fill in student details and upload their handwritten answer pages.</p>
                                </div>
                                <div className="p-6 space-y-5">
                                    {/* Student Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <Hash className="w-3.5 h-3.5" /> Roll Number / Reg No
                                            </label>
                                            <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                                                placeholder="e.g., 2024MBBS001"
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 text-sm font-medium transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5" /> Student Name
                                            </label>
                                            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
                                                placeholder="e.g., Priya Sharma"
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 text-sm font-medium transition-all" />
                                        </div>
                                    </div>

                                    {/* Upload Area */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Upload className="w-3.5 h-3.5" /> Answer Script Images
                                        </label>
                                        <div onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-teal-200 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all group">
                                            <Upload className="w-10 h-10 text-teal-300 mx-auto mb-3 group-hover:text-teal-500 transition-colors" />
                                            <p className="text-sm font-bold text-slate-600 mb-1">Click to upload answer script images</p>
                                            <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP • Multiple images allowed • Crop from all sides</p>
                                            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                        </div>
                                    </div>

                                    {/* Uploaded Images Grid */}
                                    {answerImages.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{answerImages.length} Page{answerImages.length > 1 ? 's' : ''} Uploaded</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {answerImages.map((img, idx) => (
                                                    <div key={idx}
                                                        className={`relative group rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${activeImageIdx === idx ? 'border-teal-500 shadow-lg shadow-teal-500/20' : 'border-slate-200 hover:border-teal-300'}`}
                                                        onClick={() => setActiveImageIdx(activeImageIdx === idx ? null : idx)}>
                                                        <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                                                            <img src={img.src} alt={`Page ${idx + 1}`} className="w-full h-full object-cover transition-all"
                                                                style={{ clipPath: `inset(${img.crop.top}% ${img.crop.right}% ${img.crop.bottom}% ${img.crop.left}%)` }} />
                                                        </div>
                                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                                            Page {idx + 1}
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {/* Add More Button */}
                                                <div onClick={() => fileInputRef.current?.click()}
                                                    className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/50 transition-all group">
                                                    <Plus className="w-8 h-8 text-slate-300 group-hover:text-teal-500 transition-colors" />
                                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Add More</p>
                                                </div>
                                            </div>

                                            {/* Crop Controls */}
                                            {activeImageIdx !== null && answerImages[activeImageIdx] && (
                                                <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-2xl p-5 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                            <Crop className="w-4 h-4 text-teal-600" /> Crop Page {activeImageIdx + 1}
                                                        </h4>
                                                        <button onClick={() => handleResetCrop(activeImageIdx)}
                                                            className="text-xs font-bold text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors">
                                                            <RotateCcw className="w-3 h-3" /> Reset
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                                                            <div key={side}>
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 capitalize">{side}</label>
                                                                <input type="range" min={0} max={40} value={answerImages[activeImageIdx].crop[side]}
                                                                    onChange={e => handleCropChange(activeImageIdx, side, parseInt(e.target.value))}
                                                                    className="w-full accent-teal-600" />
                                                                <span className="text-[10px] text-slate-500 font-bold">{answerImages[activeImageIdx].crop[side]}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Submit for Evaluation */}
                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button onClick={handleEvaluateScript}
                                            disabled={!rollNumber.trim() || !studentName.trim() || answerImages.length === 0}
                                            className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                            <Sparkles className="w-5 h-5" /> Evaluate Script
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════ EVALUATING SPINNER ═══════ */}
                        {phase === 'evaluating' && (
                            <div className="flex items-center justify-center py-12 animate-in fade-in">
                                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-lg text-center max-w-sm">
                                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/20">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Evaluating Answer Script...</h3>
                                    <p className="text-slate-500 text-sm">AI is reading the handwriting and comparing against rubrics.</p>
                                    <div className="mt-3 text-xs text-teal-600 font-bold flex items-center justify-center gap-1.5">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Processing {answerImages.length} page{answerImages.length > 1 ? 's' : ''} for {studentName}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
