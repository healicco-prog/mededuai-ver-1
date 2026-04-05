"use client";

import { useState, useRef, useEffect } from 'react';
import {
    ClipboardCheck, Loader2, Sparkles, Upload, CheckCircle, X, Crop,
    RotateCcw, ChevronRight, Award, FileText, Save, Copy, Download,
    AlertCircle, Camera
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

type Phase = 'setup' | 'generating-rubrics' | 'upload-answers' | 'evaluating' | 'results';

interface CropState { top: number; right: number; bottom: number; left: number; }

export default function SelfEvalSystemPage() {
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); }); }, []);

    const [phase, setPhase] = useState<Phase>('setup');
    const [course, setCourse] = useState('');
    const [subject, setSubject] = useState('');
    const [question, setQuestion] = useState('');
    const [marks, setMarks] = useState(10);

    // Rubrics (internal — never shown to user)
    const [rubrics, setRubrics] = useState('');
    const [rubricId, setRubricId] = useState<string | null>(null);

    // Answer images
    const [answerImages, setAnswerImages] = useState<{ src: string; crop: CropState; name: string }[]>([]);
    const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Evaluation
    const [evaluation, setEvaluation] = useState('');
    const [marksObtained, setMarksObtained] = useState(0);
    const [percentage, setPercentage] = useState(0);

    // UI
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const activeCourse = COURSES.find(c => c.id === course);
    const subjects = activeCourse?.subjects || [];

    // ── Step 1: Generate Rubrics (auto-save, skip display, go to upload) ──
    const handleGenerateRubrics = async () => {
        if (!course || !subject || !question.trim() || marks < 1) {
            setError('Please fill all fields before proceeding.');
            return;
        }
        setError('');
        setPhase('generating-rubrics');

        try {
            const res = await fetch('/api/self-eval-system/generate-rubrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course, subject, question, marksAllotted: marks, userId }),
            });
            const data = await res.json();

            if (data.success) {
                setRubrics(data.rubrics);
                setRubricId(data.rubricId || null);
                // Skip rubrics display — go directly to upload
                setPhase('upload-answers');
            } else {
                setError(data.error || 'Failed to generate rubrics');
                setPhase('setup');
            }
        } catch {
            setError('Network error. Please try again.');
            setPhase('setup');
        }
    };

    // ── Image Upload ──
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
    const applyCropToImage = (src: string, crop: CropState): Promise<string> => {
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
    };

    // ── Step 2: Evaluate Answer ──
    const handleEvaluate = async () => {
        if (answerImages.length === 0) {
            setError('Please upload at least one answer script image.');
            return;
        }
        setError('');
        setPhase('evaluating');

        try {
            const processedImages = await Promise.all(
                answerImages.map(img => applyCropToImage(img.src, img.crop))
            );

            const res = await fetch('/api/self-eval-system/evaluate-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rubricId, rubrics, question, marksAllotted: marks,
                    course, subject, answerImages: processedImages, userId,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setEvaluation(data.evaluation);
                setMarksObtained(data.marksObtained || 0);
                setPercentage(data.percentage || 0);
                setPhase('results');
            } else {
                setError(data.error || 'Evaluation failed');
                setPhase('upload-answers');
            }
        } catch {
            setError('Network error during evaluation. Please try again.');
            setPhase('upload-answers');
        }
    };

    const handleReset = () => {
        setPhase('setup'); setCourse(''); setSubject(''); setQuestion(''); setMarks(10);
        setRubrics(''); setRubricId(null); setAnswerImages([]); setActiveImageIdx(null);
        setEvaluation(''); setMarksObtained(0); setPercentage(0);
        setError(''); setSaved(false);
    };

    const handleExportPDF = async (content: string, title: string) => {
        try {
            const m = await import('jspdf');
            const jsPDF = m.jsPDF || (m as any).default?.jsPDF || m.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            pdf.setFontSize(10);
            const lines = pdf.splitTextToSize(content.replace(/[#*`]/g, ''), 180);
            let y = 15;
            for (let i = 0; i < lines.length; i++) { if (y > 280) { pdf.addPage(); y = 15; } pdf.text(lines[i], 15, y); y += 5; }
            pdf.save(`${title}.pdf`);
        } catch (err) { console.error(err); }
    };

    const steps = [
        { label: 'Configure', active: phase === 'setup', done: phase !== 'setup' },
        { label: 'Preparing', active: phase === 'generating-rubrics', done: ['upload-answers', 'evaluating', 'results'].includes(phase) },
        { label: 'Upload', active: phase === 'upload-answers', done: ['evaluating', 'results'].includes(phase) },
        { label: 'Results', active: phase === 'results', done: phase === 'results' },
    ];

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-blue-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <ClipboardCheck className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Self-Evaluation System</h2>
                            <p className="text-violet-300/80 text-sm font-medium">AI-powered answer script evaluation with rubric generation</p>
                        </div>
                    </div>
                    {/* Progress Steps */}
                    <div className="relative mt-5 flex items-center gap-2">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2 flex-1">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${step.done ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : step.active ? 'bg-violet-500/30 text-violet-200 border border-violet-400/40 animate-pulse' : 'bg-white/5 text-white/40 border border-white/10'}`}>
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
                <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-2xl text-sm font-medium">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">

                {/* ═══════ SETUP ═══════ */}
                {phase === 'setup' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in">
                        <div className="bg-gradient-to-b from-violet-50/50 to-white p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-violet-600" /> Question Configuration
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Set up the question. AI will prepare internal marking criteria and take you directly to upload.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                    <select value={course} onChange={e => { setCourse(e.target.value); setSubject(''); }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 text-sm font-medium transition-all">
                                        <option value="">Select Course</option>
                                        {COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <select value={subject} onChange={e => setSubject(e.target.value)} disabled={!course}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 text-sm font-medium transition-all disabled:opacity-50">
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Question</label>
                                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                                    placeholder="Type or paste the exam question here... e.g., 'Describe the pathogenesis and management of Rheumatic Heart Disease'"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 text-sm font-medium min-h-[120px] transition-all resize-y" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Marks Allotted</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[2, 3, 5, 10, 15, 20].map(m => (
                                        <button key={m} onClick={() => setMarks(m)}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${marks === m ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-violet-200'}`}>
                                            {m} Marks
                                        </button>
                                    ))}
                                    <input type="number" value={marks} onChange={e => setMarks(parseInt(e.target.value) || 1)} min={1} max={100}
                                        className="w-24 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm font-bold text-center" />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button onClick={handleGenerateRubrics}
                                    disabled={!course || !subject || !question.trim()}
                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                    <Sparkles className="w-5 h-5" /> Prepare & Continue
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ GENERATING RUBRICS (loading) ═══════ */}
                {phase === 'generating-rubrics' && (
                    <div className="flex items-center justify-center py-16 animate-in fade-in">
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-lg text-center max-w-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet-500/20">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Preparing evaluation criteria...</h3>
                            <p className="text-slate-500 text-sm">AI is building a detailed marking rubric for <span className="font-bold text-violet-600">{subject}</span>. You'll be taken to upload shortly.</p>
                        </div>
                    </div>
                )}

                {/* ═══════ UPLOAD ANSWERS ═══════ */}
                {phase === 'upload-answers' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Success Banner */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800">Rubrics ready — saved automatically</p>
                                <p className="text-xs text-emerald-600">{course} • {subject} • {marks} Marks • Now upload your handwritten answer script below</p>
                            </div>
                        </div>

                        {/* Question Reference */}
                        <div className="bg-violet-50 rounded-2xl border border-violet-100 px-5 py-3">
                            <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">Question</p>
                            <p className="text-sm font-medium text-slate-800">{question}</p>
                        </div>

                        {/* Upload Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-5 border-b border-violet-100">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-violet-600" /> Upload Answer Script
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Upload photos of your handwritten answer sheets. Crop each image if needed.</p>
                            </div>
                            <div className="p-6 space-y-5">
                                {/* Upload Area */}
                                <div onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-violet-200 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50/50 transition-all group">
                                    <Upload className="w-10 h-10 text-violet-300 mx-auto mb-3 group-hover:text-violet-500 transition-colors" />
                                    <p className="text-sm font-bold text-slate-600 mb-1">Click to upload answer script images</p>
                                    <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP • Multiple images allowed</p>
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                </div>

                                {/* Uploaded Images */}
                                {answerImages.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{answerImages.length} Image{answerImages.length > 1 ? 's' : ''} Uploaded</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {answerImages.map((img, idx) => (
                                                <div key={idx}
                                                    className={`relative group rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${activeImageIdx === idx ? 'border-violet-500 shadow-lg shadow-violet-500/20' : 'border-slate-200 hover:border-violet-300'}`}
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
                                        </div>

                                        {/* Crop Controls */}
                                        {activeImageIdx !== null && answerImages[activeImageIdx] && (
                                            <div className="bg-gradient-to-r from-slate-50 to-violet-50 rounded-2xl p-5 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <Crop className="w-4 h-4 text-violet-600" /> Crop Page {activeImageIdx + 1}
                                                    </h4>
                                                    <button onClick={() => handleResetCrop(activeImageIdx)}
                                                        className="text-xs font-bold text-slate-400 hover:text-violet-600 flex items-center gap-1 transition-colors">
                                                        <RotateCcw className="w-3 h-3" /> Reset
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                                                        <div key={side}>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 capitalize">{side}</label>
                                                            <input type="range" min={0} max={40} value={answerImages[activeImageIdx].crop[side]}
                                                                onChange={e => handleCropChange(activeImageIdx, side, parseInt(e.target.value))}
                                                                className="w-full accent-violet-600" />
                                                            <span className="text-[10px] text-slate-500 font-bold">{answerImages[activeImageIdx].crop[side]}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button onClick={handleEvaluate} disabled={answerImages.length === 0}
                                        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                        <Sparkles className="w-5 h-5" /> Evaluate Answer Script <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ EVALUATING ═══════ */}
                {phase === 'evaluating' && (
                    <div className="flex items-center justify-center py-16 animate-in fade-in">
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-lg text-center max-w-sm">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Evaluating Answer Script...</h3>
                            <p className="text-slate-500 text-sm">AI is reading your handwriting and comparing against the rubric.</p>
                            <div className="mt-3 text-xs text-indigo-600 font-bold flex items-center justify-center gap-1.5">
                                <Loader2 className="w-3 h-3 animate-spin" /> Processing {answerImages.length} image{answerImages.length > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ RESULTS ═══════ */}
                {phase === 'results' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Score Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="p-8 text-center">
                                <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl ${percentage >= 80 ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/25' : percentage >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/25' : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-rose-500/25'}`}>
                                    <Award className="w-14 h-14 text-white" />
                                </div>
                                <h3 className="text-4xl font-bold text-slate-900 mb-1">{marksObtained} / {marks}</h3>
                                <p className={`text-xl font-bold mb-1 ${percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{percentage}%</p>
                                <p className={`text-sm font-bold ${percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {percentage >= 90 ? '🎉 Outstanding!' : percentage >= 80 ? '✨ Excellent!' : percentage >= 70 ? '👍 Good' : percentage >= 50 ? '💪 Fair' : '📚 Needs Practice'}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-3 py-1 rounded-lg font-bold">{course}</span>
                                    <span className="bg-slate-100 px-3 py-1 rounded-lg font-bold">{subject}</span>
                                    <span className="bg-slate-100 px-3 py-1 rounded-lg font-bold">{marks} Marks</span>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Evaluation */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-5 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-3">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" /> Detailed Evaluation
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(`Self-Evaluation Report\nCourse: ${course} | Subject: ${subject}\nQuestion: ${question}\nMarks: ${marksObtained}/${marks} (${percentage}%)\n\n${evaluation}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                                        className="bg-white text-slate-600 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button onClick={() => handleExportPDF(evaluation, `Evaluation_${subject}_${marks}marks`)}
                                        className="bg-indigo-100 text-indigo-700 font-bold h-9 px-4 rounded-xl hover:bg-indigo-200 transition-all flex items-center gap-2 text-sm">
                                        <Download className="w-4 h-4" /> PDF
                                    </button>
                                    <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
                                        className={`font-bold h-9 px-4 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'}`}>
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 prose prose-slate max-w-none prose-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{evaluation}</ReactMarkdown>
                            </div>
                        </div>

                        {/* New Evaluation */}
                        <div className="text-center pt-2">
                            <button onClick={handleReset}
                                className="text-sm font-bold text-slate-400 hover:text-violet-600 transition-colors flex items-center gap-2 mx-auto">
                                <RotateCcw className="w-4 h-4" /> Start New Evaluation
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
