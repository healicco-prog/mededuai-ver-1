"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Loader2, Sparkles, Upload, CheckCircle, X, Crop as CropIcon,
    RotateCcw, ChevronRight, Award, FileText, Save,
    AlertCircle, Camera, UserCheck, Hash, Plus,
    ClipboardList, ScanLine, ChevronDown, ChevronUp, Trash2,
    Maximize2, GripHorizontal, ImageIcon, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAuthHeaders } from '@/lib/clientAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const COURSES = [
    { id: 'MBBS', name: 'MBBS', subjects: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine', 'Community Medicine', 'General Medicine', 'General Surgery', 'Pediatrics', 'Obstetrics & Gynecology', 'Ophthalmology', 'ENT', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Anesthesiology', 'Radiology'] },
    { id: 'BSc Nursing', name: 'BSc Nursing', subjects: ['Anatomy & Physiology', 'Nutrition & Biochemistry', 'Microbiology', 'Psychology', 'Nursing Foundations', 'Medical-Surgical Nursing', 'Community Health Nursing', 'Child Health Nursing', 'Mental Health Nursing', 'Obstetric & Midwifery Nursing', 'Nursing Research', 'Nursing Management'] },
    { id: 'BDS', name: 'BDS', subjects: ['Dental Anatomy', 'Dental Materials', 'Oral Pathology', 'Oral Medicine', 'Periodontology', 'Orthodontics', 'Prosthodontics', 'Conservative Dentistry', 'Endodontics', 'Oral Surgery', 'Pedodontics', 'Public Health Dentistry'] },
    { id: 'BPharm', name: 'B.Pharm', subjects: ['Pharmaceutical Chemistry', 'Pharmacology', 'Pharmaceutics', 'Pharmacognosy', 'Pharmaceutical Analysis', 'Hospital Pharmacy', 'Clinical Pharmacy'] },
    { id: 'BAMS', name: 'BAMS', subjects: ['Rachana Sharir', 'Kriya Sharir', 'Dravyaguna', 'Rasa Shastra', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra', 'Prasuti Tantra'] },
    { id: 'MD', name: 'MD', subjects: ['Internal Medicine', 'Pediatrics', 'Dermatology', 'Psychiatry', 'Community Medicine', 'Pathology', 'Pharmacology', 'Microbiology', 'Biochemistry', 'Physiology', 'Anatomy', 'Forensic Medicine'] },
    { id: 'MS', name: 'MS', subjects: ['General Surgery', 'Orthopedics', 'Ophthalmology', 'ENT', 'Obstetrics & Gynecology', 'Anesthesiology'] },
];

type Phase = 'setup' | 'generating-rubrics' | 'ready-for-scripts' | 'evaluating' | 'results';

interface ImageWithCrop {
    src: string;
    preview?: string; // Cropped preview
    crop: Crop | null;
    id: string;
    name?: string;
}

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
    status: 'evaluating' | 'completed' | 'failed';
}

export default function DigEvalAssistPage() {
    const [userId, setUserId] = useState<string | null>(null);
    useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) setUserId(data.user.id); }); }, []);

    const [phase, setPhase] = useState<Phase>('setup');

    // State for setup
    const [course, setCourse] = useState('');
    const [subject, setSubject] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [question, setQuestion] = useState('');
    const [questionImages, setQuestionImages] = useState<ImageWithCrop[]>([]);
    const [showRubricPreview, setShowRubricPreview] = useState(false);
    const [marks, setMarks] = useState(10);

    // Rubrics State
    const [rubrics, setRubrics] = useState('');
    const [rubricId, setRubricId] = useState<string | null>(null);

    // Evaluation State
    const [rollNumber, setRollNumber] = useState('');
    const [studentName, setStudentName] = useState('');
    const [answerImages, setAnswerImages] = useState<ImageWithCrop[]>([]);
    const [evaluatedScripts, setEvaluatedScripts] = useState<EvaluatedScript[]>([]);
    const [currentEvaluation, setCurrentEvaluation] = useState('');
    const [currentMarksObtained, setCurrentMarksObtained] = useState(0);
    const [currentPercentage, setCurrentPercentage] = useState(0);
    const [currentEvalId, setCurrentEvalId] = useState<string | null>(null);
    const [showCurrentResult, setShowCurrentResult] = useState(false);
    const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);

    // Cropping State
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropTarget, setCropTarget] = useState<{ type: 'question' | 'answer'; index: number } | null>(null);
    const [currentCrop, setCurrentCrop] = useState<Crop>();
    const [statusMessage, setStatusMessage] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);

    // UI State
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const [error, setError] = useState('');
    const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileCameraRef = useRef<HTMLInputElement>(null);
    const questionFileRef = useRef<HTMLInputElement>(null);
    const questionCameraRef = useRef<HTMLInputElement>(null);

    // DB Persistence States
    const [savedEvals, setSavedEvals] = useState<any[]>([]);
    const [isFetchingSaved, setIsFetchingSaved] = useState(true);
    const [savedSearchQuery, setSavedSearchQuery] = useState('');

    const fetchSavedEvals = async () => {
        setIsFetchingSaved(true);
        try {
            const res = await fetch('/api/dig-eval-assist/saved/all');
            const data = await res.json();
            if (data.success) {
                setSavedEvals(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch saved evaluations:", error);
        } finally {
            setIsFetchingSaved(false);
        }
    };

    const handleSaveSession = async () => {
        if (evaluatedScripts.length === 0) {
            alert("No evaluated student scripts to save.");
            return;
        }
        try {
            const res = await fetch('/api/dig-eval-assist/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question || '[Image-based Question]',
                    marks: marks,
                    evaluationData: {
                        course,
                        subject: subject === 'Other' ? customSubject : subject,
                        rubrics,
                        evaluatedScripts
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Evaluation session saved successfully!");
                fetchSavedEvals();
            } else {
                alert("Failed to save evaluation session.");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to save evaluation session.");
        }
    };

    const handleDeleteSavedEval = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this saved evaluation session?")) return;
        try {
            const res = await fetch(`/api/dig-eval-assist/save?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchSavedEvals();
            } else {
                alert("Failed to delete evaluation.");
            }
        } catch (error) {
            console.error("Failed to delete evaluation:", error);
        }
    };

    // Persistence
    useEffect(() => {
        const savedCourse = localStorage.getItem('dig_eval_course');
        const savedSubject = localStorage.getItem('dig_eval_subject');
        const savedQuestion = localStorage.getItem('dig_eval_question');
        const savedMarks = localStorage.getItem('dig_eval_marks');
        
        if (savedCourse) setCourse(savedCourse);
        if (savedSubject) setSubject(savedSubject);
        if (savedQuestion) setQuestion(savedQuestion);
        if (savedMarks) setMarks(parseInt(savedMarks));
        // Always start fresh — never restore a generating/failed phase
        setPhase('setup');
        setError('');
        fetchSavedEvals();
    }, []);

    useEffect(() => {
        localStorage.setItem('dig_eval_phase', phase);
        localStorage.setItem('dig_eval_course', course);
        localStorage.setItem('dig_eval_subject', subject);
        localStorage.setItem('dig_eval_question', question);
        localStorage.setItem('dig_eval_marks', marks.toString());
    }, [phase, course, subject, question, marks]);

    // ── Image Helpers ──

    const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setQuestionImages(prev => [...prev, {
                        src: ev.target!.result as string,
                        crop: null,
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.name
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
        if (questionFileRef.current) questionFileRef.current.value = '';
        if (questionCameraRef.current) questionCameraRef.current.value = '';
    };

    const handleAnswerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setAnswerImages(prev => [...prev, {
                        src: ev.target!.result as string,
                        crop: null,
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.name
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (fileCameraRef.current) fileCameraRef.current.value = '';
    };

    const openCropModal = (type: 'question' | 'answer', index: number) => {
        const target = type === 'question' ? questionImages[index] : answerImages[index];
        if (!target) return;
        setCropTarget({ type, index });
        setCurrentCrop(target.crop || { unit: '%', x: 10, y: 10, width: 80, height: 80 });
        setShowCropModal(true);
    };

    const handleCropSave = async () => {
        if (!cropTarget || !currentCrop) return;
        
        const targetImages = cropTarget.type === 'question' ? questionImages : answerImages;
        const img = targetImages[cropTarget.index];
        const preview = await applyCropToImage(img.src, currentCrop);

        if (cropTarget.type === 'question') {
            setQuestionImages(prev => prev.map((img, i) => i === cropTarget.index ? { ...img, crop: currentCrop, preview } : img));
        } else {
            setAnswerImages(prev => prev.map((img, i) => i === cropTarget.index ? { ...img, crop: currentCrop, preview } : img));
        }
        setShowCropModal(false);
    };

    const applyCropToImage = (src: string, crop: Crop | null): Promise<string> => {
        const MAX_DIM = 1280; // Resize to reasonable max dimension for AI
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                let pxX = 0, pxY = 0, pxW = img.width, pxH = img.height;
                
                if (crop && crop.width > 0 && crop.height > 0) {
                    if (crop.unit === '%') {
                        pxX = (crop.x / 100) * img.width;
                        pxY = (crop.y / 100) * img.height;
                        pxW = (crop.width / 100) * img.width;
                        pxH = (crop.height / 100) * img.height;
                    } else {
                        pxX = crop.x; pxY = crop.y; pxW = crop.width; pxH = crop.height;
                    }
                }

                // Calculate resize ratio if exceeds MAX_DIM
                let ratio = 1;
                if (pxW > MAX_DIM || pxH > MAX_DIM) {
                    ratio = Math.min(MAX_DIM / pxW, MAX_DIM / pxH);
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                canvas.width = pxW * ratio;
                canvas.height = pxH * ratio;
                
                ctx.drawImage(img, pxX, pxY, pxW, pxH, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8)); // 0.8 quality is plenty for OCR
            };
            img.src = src;
        });
    };

    // ── Logic ──

    const handleGenerateRubrics = async () => {
        const effectiveSub = subject === 'Other' ? customSubject : subject;
        if (!course || !effectiveSub || (!question.trim() && questionImages.length === 0) || marks < 1) {
            setError('Please provide course, subject, question (text or image), and marks.');
            return;
        }
        setError('');
        setPhase('generating-rubrics');
        setStatusMessage('Preparing images...');
        try {
            const processedQuestionImages = await Promise.all(
                questionImages.map(img => img.preview || applyCropToImage(img.src, img.crop))
            );
            
            setStatusMessage('AI analyzing question and drafting rubrics...');
            const res = await fetch('/api/dig-eval-assist/generate-rubrics', {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({
                    course, subject: effectiveSub,
                    question, questionImages: processedQuestionImages,
                    marksAllotted: marks, userId
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

    const handleEvaluate = () => {
        if (!rollNumber.trim() || !studentName.trim() || answerImages.length === 0) {
            setError('Please enter Roll Number, Name, and at least one image.');
            return;
        }
        setError('');
        
        const scriptId = `${Date.now()}-${rollNumber}`;
        const newScript: EvaluatedScript = {
            id: scriptId,
            rollNumber,
            studentName,
            marksObtained: 0,
            totalMarks: marks,
            percentage: 0,
            evaluation: 'Under AI Evaluation',
            approved: true,
            evaluationId: null,
            status: 'evaluating'
        };

        // Save immediately to the results queue
        setEvaluatedScripts(prev => [newScript, ...prev]);

        // Capture current variables for background fetch closure
        const capturedImages = [...answerImages];
        const capturedRoll = rollNumber;
        const capturedName = studentName;
        const capturedQuestion = question;
        const capturedMarks = marks;
        const capturedCourse = course;
        const capturedSubject = subject === 'Other' ? customSubject : subject;
        const capturedRubricId = rubricId;
        const capturedRubrics = rubrics;
        const capturedUserId = userId;

        // Immediately reset form so user can enter the next student script
        setRollNumber('');
        setStudentName('');
        setAnswerImages([]);

        // Perform evaluation in background asynchronously
        (async () => {
            try {
                const processedImages = await Promise.all(
                    capturedImages.map(img => img.preview || applyCropToImage(img.src, img.crop))
                );
                
                const res = await fetch('/api/dig-eval-assist/evaluate-script', {
                    method: 'POST',
                    headers: await getAuthHeaders(),
                    body: JSON.stringify({
                        rubricId: capturedRubricId, 
                        rubrics: capturedRubrics, 
                        question: capturedQuestion || '[See uploaded question images]',
                        marksAllotted: capturedMarks, 
                        course: capturedCourse, 
                        subject: capturedSubject,
                        answerImages: processedImages, 
                        rollNumber: capturedRoll, 
                        studentName: capturedName, 
                        userId: capturedUserId,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setEvaluatedScripts(prev => prev.map(item => item.id === scriptId ? {
                        ...item,
                        status: 'completed',
                        evaluation: data.evaluation,
                        marksObtained: data.marksObtained || 0,
                        percentage: data.percentage || 0,
                        evaluationId: data.evaluationId || null
                    } : item));
                } else {
                    setEvaluatedScripts(prev => prev.map(item => item.id === scriptId ? {
                        ...item,
                        status: 'failed',
                        evaluation: data.error || 'Evaluation failed'
                    } : item));
                }
            } catch (err) {
                setEvaluatedScripts(prev => prev.map(item => item.id === scriptId ? {
                    ...item,
                    status: 'failed',
                    evaluation: 'Network error during evaluation.'
                } : item));
            }
        })();
    };

    const handleApproveEvaluation = () => {
        // Unused in background workflow but kept for component backward compatibility
        setShowCurrentResult(false);
    };

    const handleFullReset = () => {
        if (phase !== 'setup' || evaluatedScripts.length > 0) {
            if (!window.confirm('Are you sure you want to create a new exam? Current evaluation session data will be cleared.')) {
                return;
            }
        }
        setPhase('setup'); setCourse(''); setSubject(''); setCustomSubject('');
        setQuestion(''); setQuestionImages([]); setMarks(10);
        setRubrics(''); setRubricId(null); setRollNumber(''); setStudentName('');
        setAnswerImages([]); setEvaluatedScripts([]); setError('');
        try {
            localStorage.removeItem('dig_eval_phase');
            localStorage.removeItem('dig_eval_course');
            localStorage.removeItem('dig_eval_subject');
            localStorage.removeItem('dig_eval_question');
            localStorage.removeItem('dig_eval_marks');
        } catch (_) {}
    };

    const steps = [
        { label: 'Configure', active: phase === 'setup', done: phase !== 'setup', onClick: () => { if (phase !== 'setup') setPhase('setup'); } },
        { label: 'Preparing Rubrics', active: phase === 'generating-rubrics', done: ['ready-for-scripts', 'evaluating', 'results'].includes(phase) },
        { label: 'Upload Scripts', active: phase === 'ready-for-scripts' || phase === 'evaluating', done: false, onClick: () => { if (['ready-for-scripts', 'results'].includes(phase)) setPhase('ready-for-scripts'); } },
        { label: 'Results', active: phase === 'results', done: false, onClick: () => { if (['ready-for-scripts', 'results'].includes(phase)) setPhase('results'); } },
    ];

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Header / Progress */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-cyan-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                                <ScanLine className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Dig Evaluation Assist</h2>
                                <p className="text-teal-300/80 text-sm font-medium">AI-powered answer script evaluation system</p>
                            </div>
                        </div>
                        {mounted && phase !== 'setup' && (
                            <button
                                onClick={handleFullReset}
                                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105 shrink-0"
                            >
                                <Plus className="w-4 h-4 shrink-0" /> Create New Exam
                            </button>
                        )}
                    </div>
                    <div className="relative mt-5 flex items-center gap-2">
                        {mounted && steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2 flex-1">
                                <div onClick={step.onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${step.onClick ? 'cursor-pointer hover:scale-105' : ''} ${step.done ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : step.active ? 'bg-teal-500/30 text-teal-200 border border-teal-400/40 animate-pulse' : 'bg-white/5 text-white/40 border border-white/10'}`}>
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

            <div className="flex-1 overflow-y-auto pb-8 space-y-6 px-1">
                {/* ── PHASE: SETUP ── */}
                {phase === 'setup' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Course</label>
                                <select value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium">
                                    <option value="">Select Course</option>
                                    {COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                <select value={subject} onChange={e => setSubject(e.target.value)} disabled={!course} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium disabled:opacity-50">
                                    <option value="">Select Subject</option>
                                    {COURSES.find(c => c.id === course)?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    <option value="Other">Other</option>
                                </select>
                                {subject === 'Other' && <input type="text" placeholder="Subject Name..." value={customSubject} onChange={e => setCustomSubject(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium" />}
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-white p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-emerald-600" /> Question Setup</h3>
                                <p className="text-sm text-slate-500 mt-1">Upload question paper images and/or type the question text.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Camera className="w-4 h-4" /> Question Paper Images</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {questionImages.map((img, idx) => (
                                                <div key={img.id} className="relative group rounded-xl border-2 border-slate-100 overflow-hidden bg-slate-50 aspect-video">
                                                    <img src={img.preview || img.src} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button onClick={() => openCropModal('question', idx)} className="p-2 bg-white rounded-lg text-emerald-600 hover:scale-110 transition-transform"><CropIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => setQuestionImages(prev => prev.filter((_, i) => i !== idx))} className="p-2 bg-white rounded-lg text-red-600 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    {img.crop && <div className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[8px] px-1 rounded font-bold">CROPPED</div>}
                                                </div>
                                            ))}
                                            <button onClick={() => questionFileRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all aspect-video group">
                                                <Plus className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Image</span>
                                            </button>
                                            <button onClick={() => questionCameraRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-all aspect-video group">
                                                <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Take Photo</span>
                                            </button>
                                        </div>
                                        <input type="file" multiple accept="image/*" ref={questionFileRef} className="hidden" onChange={handleQuestionImageUpload} />
                                        <input type="file" accept="image/*" capture="environment" ref={questionCameraRef} className="hidden" onChange={handleQuestionImageUpload} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4" /> Question Text (Optional)</label>
                                        <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type question here..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[140px] text-sm font-medium shadow-inner resize-none" />
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex items-center gap-4 flex-wrap">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Marks Allotted</label>
                                        <div className="flex gap-2">
                                            {[5, 10, 15, 20].map(m => (
                                                <button key={m} onClick={() => setMarks(m)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${marks === m ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'}`}>{m}M</button>
                                            ))}
                                            <input type="number" value={marks} onChange={e => setMarks(parseFloat(e.target.value) || 1)} className="w-16 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-center" />
                                        </div>
                                    </div>
                                    <button onClick={handleGenerateRubrics} disabled={!course || (!question.trim() && questionImages.length === 0)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50">
                                        <UserCheck className="w-5 h-5" /> Approve & Generate Rubrics
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PHASE: GENERATING RUBRICS ── */}
                {phase === 'generating-rubrics' && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Generating Answer Rubrics...</h3>
                        <p className="text-slate-500 text-sm max-w-xs text-center mb-4">AI is analyzing the question and creating detailed evaluation standards.</p>
                        {statusMessage && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold animate-pulse border border-emerald-100">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                {statusMessage}
                            </div>
                        )}
                    </div>
                )}

                {/* ── PHASE: READY / EVALUATING ── */}
                {(phase === 'ready-for-scripts' || phase === 'evaluating') && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-800">Rubrics Ready for {subject || course}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setShowRubricPreview(!showRubricPreview)} 
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm transition-all"
                                >
                                    {showRubricPreview ? 'Hide Rubrics' : 'View Rubrics'}
                                </button>
                                <button onClick={handleFullReset} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset All</button>
                            </div>
                        </div>

                        {showRubricPreview && rubrics && (
                            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 animate-in slide-in-from-top-2 duration-300">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-emerald-600" /> 
                                    Marking Standards & Criteria
                                </h4>
                                <div className="space-y-4">
                                    {(() => {
                                        try {
                                            const r = JSON.parse(rubrics);
                                            return (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {r.criteria?.map((c: any, i: number) => (
                                                            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <p className="font-bold text-slate-900 text-sm">{c.component}</p>
                                                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{c.maxMarks}M</span>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 leading-relaxed">{c.descriptors?.full || c.description}</p>
                                                                {c.keywords && (
                                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                                        {c.keywords.slice(0, 3).map((k: string, j: number) => (
                                                                            <span key={j} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">#{k}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {r.mustMentionFacts && (
                                                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                                                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">Must Mention Facts</p>
                                                            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                                                                {r.mustMentionFacts.slice(0, 3).map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        } catch {
                                            return <p className="text-xs text-slate-400">Detailed rubrics are active. Review student scripts below.</p>;
                                        }
                                    })()}
                                </div>
                            </div>
                        )}

                        {evaluatedScripts.length > 0 && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl px-5 py-3 flex items-center justify-between">
                                <span className="text-xs text-emerald-800 font-medium">
                                    Uploaded scripts are processing in the background.
                                </span>
                                <button onClick={() => setPhase('results')} className="text-xs font-bold text-teal-600 hover:text-teal-700 underline">
                                    View Results Tab &rarr;
                                </button>
                            </div>
                        )}

                        {showCurrentResult ? (
                            <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-8 animate-in zoom-in-95 duration-300">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-50 rounded-full mb-4">
                                        <div className="text-4xl font-black text-emerald-600">{currentMarksObtained}<span className="text-lg text-emerald-400 ml-1">/{marks}</span></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">{studentName}</h3>
                                    <p className="text-slate-500 font-medium">{rollNumber}</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 prose prose-sm max-w-none mb-8 shadow-inner overflow-y-auto max-h-96">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentEvaluation}</ReactMarkdown>
                                </div>
                                <button onClick={handleApproveEvaluation} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all">
                                    <Save className="w-5 h-5" /> Approve & Save to Queue
                                </button>
                            </div>
                        ) : phase === 'evaluating' ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-lg animate-in fade-in">
                                <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                    <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Answer Script...</h3>
                                <p className="text-slate-500 text-sm max-w-xs text-center mb-4">AI is reading student response and evaluating marks.</p>
                                {statusMessage && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold animate-pulse border border-teal-100">
                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                        {statusMessage}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in slide-in-from-bottom-4">
                                <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-teal-600" /> New Student Evaluation</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Roll Number</label>
                                            <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold" placeholder="e.g. 2024-MBBS-001" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Student Name</label>
                                            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold" placeholder="Full Name" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Answer Script Images</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {answerImages.map((img, idx) => (
                                                <div key={img.id} className="relative group rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 aspect-[3/4]">
                                                    <img src={img.preview || img.src} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button onClick={() => openCropModal('answer', idx)} className="p-2 bg-white rounded-lg text-emerald-600 hover:scale-110 transition-transform"><CropIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => setAnswerImages(prev => prev.filter((_, i) => i !== idx))} className="p-2 bg-white rounded-lg text-red-600 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</div>
                                                    {img.crop && <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] px-2 rounded-full font-bold">CROPPED</div>}
                                                </div>
                                            ))}
                                            <button onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 hover:border-teal-300 transition-all aspect-[3/4] group">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-teal-500 group-hover:scale-110 transition-all"><Upload className="w-6 h-6" /></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Script</span>
                                            </button>
                                            <button onClick={() => fileCameraRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 hover:border-teal-300 transition-all aspect-[3/4] group">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 group-hover:text-teal-500 group-hover:scale-110 transition-all"><Camera className="w-6 h-6" /></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Take Photo</span>
                                            </button>
                                        </div>
                                        <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAnswerImageUpload} />
                                        <input type="file" accept="image/*" capture="environment" ref={fileCameraRef} className="hidden" onChange={handleAnswerImageUpload} />
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button onClick={handleEvaluate} disabled={!rollNumber || !studentName || answerImages.length === 0} className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold h-14 px-10 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                                            <Upload className="w-5 h-5" /> Upload Script for Evaluation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PHASE: RESULTS ── */}
                {phase === 'results' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                    <ClipboardList className="w-6 h-6 text-teal-400" /> Session Evaluation Results Overview
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">Background batch tracking for uploaded student answer scripts</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveSession} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5">
                                    <Save className="w-3.5 h-3.5" /> Save Session
                                </button>
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden ml-2" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>

                                <button onClick={() => setPhase('ready-for-scripts')} className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md">
                                    &larr; Upload Next Script
                                </button>
                            </div>
                        </div>

                        {evaluatedScripts.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h4 className="text-base font-bold text-slate-800">No Student Scripts Uploaded Yet</h4>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                    Submit student answer scripts under the &ldquo;Upload Scripts&rdquo; tab. They will appear here instantly with live tracking.
                                </p>
                                <button onClick={() => setPhase('ready-for-scripts')} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100 transition-colors">
                                    Upload First Answer Script
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Uploaded</div>
                                        <div className="text-2xl font-black text-slate-800 mt-1">{evaluatedScripts.length}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Evaluations Completed</div>
                                        <div className="text-2xl font-black text-emerald-600 mt-1">
                                            {evaluatedScripts.filter(s => s.status === 'completed').length}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">In Progress Queue</div>
                                        <div className="text-2xl font-black text-amber-600 mt-1">
                                            {evaluatedScripts.filter(s => s.status === 'evaluating').length}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Student Roster & Scores</span>
                                        <span className="text-xs text-slate-400">Click a student to view granular rubrics breakdown</span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {evaluatedScripts.map(s => (
                                            <div key={s.id} className="p-5 hover:bg-slate-50/80 transition-colors">
                                                <div className="flex items-center justify-between flex-wrap gap-4 cursor-pointer" onClick={() => setExpandedScriptId(expandedScriptId === s.id ? null : s.id)}>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-base">{s.studentName}</div>
                                                        <div className="text-xs text-slate-400 font-medium">{s.rollNumber}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {s.status === 'evaluating' ? (
                                                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse shadow-sm">
                                                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> Under AI Evaluation
                                                            </span>
                                                        ) : s.status === 'failed' ? (
                                                            <div className="flex items-center gap-3">
                                                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                                                                    <AlertCircle className="w-4 h-4 text-red-600" /> Evaluation Failed
                                                                </span>
                                                                <span className="text-xs text-red-500 font-bold underline">
                                                                    {expandedScriptId === s.id ? 'Hide Error' : 'View Error'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                                                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Marks: <span className="text-emerald-600 font-black text-sm">{s.marksObtained}/{s.totalMarks}</span>
                                                                </span>
                                                                <span className="text-xs text-slate-400 font-bold underline">
                                                                    {expandedScriptId === s.id ? 'Hide Details' : 'View Breakdown'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {expandedScriptId === s.id && s.status !== 'evaluating' && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        {s.status === 'failed' ? (
                                                            <div className="bg-red-50/80 rounded-2xl p-4 border border-red-100 text-xs text-red-700 font-medium">
                                                                {s.evaluation}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60 prose prose-sm max-w-none shadow-inner">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.evaluation}</ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            {/* Saved Digital Evaluations History */}
            <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                            <ClipboardList className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Saved Evaluations History</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your previously evaluated answer scripts</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search saved evaluations..."
                            value={savedSearchQuery}
                            onChange={(e) => setSavedSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-300 transition-all font-medium"
                        />
                    </div>
                </div>

                {isFetchingSaved ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                    </div>
                ) : savedEvals.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                            <ClipboardList className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-slate-500 font-bold text-lg mb-1">Yet to save anything</h4>
                        <p className="text-slate-400 text-sm">Your saved evaluations will appear here.</p>
                    </div>
                ) : (() => {
                    const filteredSaved = savedEvals.filter(item => {
                        if (!savedSearchQuery) return true;
                        const search = savedSearchQuery.toLowerCase();
                        return (item.question || '').toLowerCase().includes(search) || (item.evaluation_data?.subject || '').toLowerCase().includes(search) || (item.evaluation_data?.course || '').toLowerCase().includes(search);
                    });

                    if (filteredSaved.length === 0) {
                        return (
                            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-500 font-medium text-sm">No saved evaluations found matching your search.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSaved.map(evalu => {
                                const evalData = evalu.evaluation_data || {};
                                return (
                                    <div key={evalu.id} className="bg-white border text-slate-800 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 group cursor-pointer relative overflow-hidden flex flex-col items-start gap-4">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                        <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <div className="w-full">
                                            <h4 className="font-bold text-lg text-slate-800 line-clamp-1">{evalData.subject || 'General'}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{evalData.course || 'MBBS'} • {evalu.marks}M</p>
                                            <p className="text-sm text-slate-500 line-clamp-2 mt-2 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">{evalu.question}</p>
                                        </div>
                                        <div className="flex gap-4 mt-auto pt-4 border-t border-slate-100 w-full text-sm font-bold text-slate-500">
                                            <span>{evalData.evaluatedScripts?.length || 0} Students</span>
                                            <span>•</span>
                                            <span>{new Date(evalu.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                                            <button onClick={() => {
                                                setCourse(evalData.course || '');
                                                setSubject(evalData.subject || '');
                                                if (evalData.subject && !COURSES.find(c => c.id === evalData.course)?.subjects.includes(evalData.subject)) {
                                                    setSubject('Other');
                                                    setCustomSubject(evalData.subject);
                                                }
                                                setQuestion(evalu.question || '');
                                                setMarks(evalu.marks || 10);
                                                setRubrics(evalData.rubrics || '');
                                                setEvaluatedScripts(evalData.evaluatedScripts || []);
                                                setPhase('results');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }} className="bg-white text-teal-600 font-bold px-4 py-2 rounded-xl shadow-lg border border-teal-100 scale-95 group-hover:scale-100 transition-all">View Results</button>
                                            <button onClick={(e) => handleDeleteSavedEval(evalu.id, e)} className="bg-white text-red-600 font-bold px-4 py-2 rounded-xl shadow-lg border border-red-100 scale-95 group-hover:scale-100 transition-all">Delete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
            </div>

            {/* ── CROP MODAL ── */}
            {showCropModal && cropTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl max-h-full rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><CropIcon className="w-5 h-5 text-emerald-600" /> Precise Image Cropper</h3>
                            <button onClick={() => setShowCropModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-200/50 p-4 sm:p-8 flex items-center justify-center min-h-[400px]">
                            <ReactCrop 
                                crop={currentCrop} 
                                onChange={c => setCurrentCrop(c)}
                                className="max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border-4 border-white"
                            >
                                <img 
                                    ref={imgRef}
                                    src={cropTarget.type === 'question' ? questionImages[cropTarget.index].src : answerImages[cropTarget.index].src} 
                                    className="max-w-full max-h-[60vh] object-contain"
                                    alt="Crop target"
                                />
                            </ReactCrop>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => {
                                        const nextIdx = cropTarget.index > 0 ? cropTarget.index - 1 : (cropTarget.type === 'question' ? questionImages.length : answerImages.length) - 1;
                                        openCropModal(cropTarget.type, nextIdx);
                                    }}
                                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400"
                                >
                                    <ChevronUp className="w-5 h-5 -rotate-90" />
                                </button>
                                <span className="text-sm font-bold text-slate-700">Image {cropTarget.index + 1} of {cropTarget.type === 'question' ? questionImages.length : answerImages.length}</span>
                                <button 
                                    onClick={() => {
                                        const nextIdx = (cropTarget.index + 1) % (cropTarget.type === 'question' ? questionImages.length : answerImages.length);
                                        openCropModal(cropTarget.type, nextIdx);
                                    }}
                                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400"
                                >
                                    <ChevronDown className="w-5 h-5 -rotate-90" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => setShowCropModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={handleCropSave} className="px-8 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20">Apply & Save Crop</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
