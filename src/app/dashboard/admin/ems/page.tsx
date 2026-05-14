"use client";

import { useState, useRef, useEffect } from 'react';
import { ClipboardCheck, Sparkles, UploadCloud, Users, CheckCircle2, FileSearch, HelpCircle, Camera, Settings, Trash2, ChevronLeft, ChevronRight, X, Crop as CropIcon, FolderOpen, Save, FileText, Upload, AlertCircle, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { useQPaperStore } from '@/store/qPaperStore';
import { useEmsStore } from '@/store/emsStore';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    const [paperSource, setPaperSource] = useState<'qpaper' | 'upload'>('qpaper');
    const [selectedPaperId, setSelectedPaperId] = useState('');
    const [questionPaperText, setQuestionPaperText] = useState('');
    const [isPaperLocked, setIsPaperLocked] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Upload Word Paper State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isParsingWord, setIsParsingWord] = useState(false);
    const [parseError, setParseError] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<{ text: string; marks: number; qNum?: string }[]>([]);
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
    const [backgroundQueue, setBackgroundQueue] = useState<any[]>([]);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);

    // Persistence for mobile refreshes
    useEffect(() => {
        const savedStudents = localStorage.getItem('ems_evaluated_students');
        const savedQueue = localStorage.getItem('ems_background_queue');
        const savedStep = localStorage.getItem('ems_current_step');
        
        if (savedStudents) setEvaluatedStudents(JSON.parse(savedStudents));
        if (savedQueue) setBackgroundQueue(JSON.parse(savedQueue));
        if (savedStep) setStep(parseInt(savedStep));
    }, []);

    useEffect(() => {
        try {
            // Strip large image data from evaluatedStudents to avoid quota issues
            const studentsToSave = evaluatedStudents.map(s => {
                const { uploads, ...rest } = s;
                return rest;
            });
            
            // Strip large image data from backgroundQueue metadata, 
            // but note that processing will fail after refresh if images are gone.
            // We accept this trade-off to prevent the crash, as localStorage cannot hold many photos.
            const queueToSave = backgroundQueue.map(s => {
                const { uploads, ...rest } = s;
                return rest;
            });

            localStorage.setItem('ems_evaluated_students', JSON.stringify(studentsToSave));
            localStorage.setItem('ems_background_queue', JSON.stringify(queueToSave));
            localStorage.setItem('ems_current_step', step.toString());
        } catch (e) {
            console.error("Failed to save to localStorage:", e);
            // If quota still exceeded, try clearing old data or just ignore
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                localStorage.removeItem('ems_evaluated_students');
                localStorage.removeItem('ems_background_queue');
            }
        }
    }, [evaluatedStudents, backgroundQueue, step]);

    const handleCreateNewExam = () => {
        if (evaluatedStudents.length > 0 || backgroundQueue.length > 0 || step > 1) {
            if (!window.confirm('Are you sure you want to create a new exam? Ongoing evaluations and unsaved session data will be cleared.')) {
                return;
            }
        }
        // Clear form state
        setInstituteName('');
        setLogoUrl('');
        setCourse('');
        setDepartment('');
        setExamName('');
        setSelectedPaperId('');
        setQuestionPaperText('');
        setIsPaperLocked(false);
        setUploadedFile(null);
        setParsedQuestions([]);
        setParsedTotalMarks(0);
        setStudentRoll('');
        setStudentReg('');
        setStudentName('');
        setUploads({});
        setCurrentQIndex(0);
        setEvaluatedStudents([]);
        setBackgroundQueue([]);
        setReviewingStudentId(null);
        setEditingMarks({});
        
        // Clear localStorage keys
        localStorage.removeItem('ems_evaluated_students');
        localStorage.removeItem('ems_background_queue');
        localStorage.removeItem('ems_current_step');
        
        // Return to Step 1 (Create Exam form) as requested by the Create New Exam flow
        setStep(1);
    };

    const handleWordUpload = async (file: File) => {
        setUploadedFile(file);
        setIsParsingWord(true);
        setParseError('');
        setParsedQuestions([]);

        try {
            // Read file to Base64 first to guarantee mobile devices fully download virtual Google Drive files into memory
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to read file from storage"));
                reader.readAsDataURL(file);
            });

            const res = await fetch('/api/upload-qpaper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base64: base64String,
                    fileName: file.name || 'document.pdf',
                    mimeType: file.type || 'application/pdf'
                })
            });
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

            const newQuestions = data.questions.map((q: any, i: number) => ({ ...q, qNum: `Q${i + 1}` }));
            setParsedQuestions(newQuestions);
            setParsedTotalMarks(data.totalMarks || 0);

            // Build the question paper text (questions separated by ---)
            const paperText = newQuestions
                .map((q: { text: string; marks: number; qNum?: string }) =>
                    `**${q.qNum}. [${q.marks} Marks]**\n\n${q.text}`
                )
                .join('\n\n---\n\n');
            setQuestionPaperText(paperText);
        } catch (err: any) {
            setParseError('Network error: ' + err.message);
        } finally {
            setIsParsingWord(false);
        }
    };

    const handleEvaluateStudent = async (studentData: any) => {
        // Add to background queue
        const newStudent = {
            ...studentData,
            id: Date.now(),
            status: 'evaluating',
            progress: 0,
            marks: null,
            breakdown: {}
        };
        
        setEvaluatedStudents(prev => [newStudent, ...prev]);
        setBackgroundQueue(prev => [...prev, newStudent]);
        
        // Reset form for next student
        setStudentRoll('');
        setStudentReg('');
        setStudentName('');
        setUploads({});
        setCurrentQIndex(0);
        setStep(4); // Move to dashboard to see progress
    };

    // Queue Processor
    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingQueue || backgroundQueue.length === 0) return;
            
            setIsProcessingQueue(true);
            const student = backgroundQueue[0];
            
            try {
                const results: any = {};
                let totalMarks = 0;
                
                // Process each question one by one to avoid huge payloads
                const qIndices = Object.keys(student.uploads).map(Number);
                
                for (let i = 0; i < qIndices.length; i++) {
                    const qIdx = qIndices[i];
                    const images = student.uploads[qIdx];
                    
                    if (!images || images.length === 0) continue;

                    // Real API call
                    const res = await fetch('/api/dig-eval-assist/evaluate-script', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            rubrics: 'Standard evaluation based on accuracy, structure and depth.', // Default or from store
                            question: mockQuestions[qIdx],
                            marksAllotted: 10, // Default or parsed
                            answerImages: images,
                            rollNumber: student.roll,
                            studentName: student.name,
                            course: course || 'Medical',
                            subject: department || 'General'
                        })
                    });
                    
                    const data = await res.json();
                    if (data.success) {
                        results[qIdx] = data.marksObtained;
                        totalMarks += data.marksObtained;
                    }
                    
                    // Update progress in UI
                    setEvaluatedStudents(prev => prev.map(s => s.id === student.id ? { 
                        ...s, 
                        progress: Math.round(((i + 1) / qIndices.length) * 100) 
                    } : s));
                }
                
                setEvaluatedStudents(prev => prev.map(s => s.id === student.id ? { 
                    ...s, 
                    status: 'evaluated', 
                    marks: totalMarks, 
                    breakdown: results,
                    progress: 100
                } : s));
                
            } catch (err) {
                console.error("Evaluation error:", err);
                setEvaluatedStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'error' } : s));
            } finally {
                setBackgroundQueue(prev => prev.slice(1));
                setIsProcessingQueue(false);
            }
        };

        processQueue();
    }, [backgroundQueue, isProcessingQueue]);

    const handleImageUpload = async (e: any) => {
        const files = Array.from(e.target.files as FileList);
        if (files.length === 0) return;

        const base64Files = await Promise.all(
            files.map(file => new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            }))
        );

        setUploads(prev => ({
            ...prev,
            [currentQIndex]: [...(prev[currentQIndex] || []), ...base64Files]
        }));
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
        <div className="max-w-6xl mx-auto space-y-8 flex flex-col min-h-[calc(100vh-8rem)] pb-12">
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
                    {step > 1 && (
                        <button
                            onClick={handleCreateNewExam}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-5 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105 shrink-0"
                        >
                            <Plus className="w-4 h-4 shrink-0" /> Create New Exam
                        </button>
                    )}
                </div>
            </div>

            {/* Stepper only shows if we are in an active evaluation (step > 0) */}
            {step > 0 && (
                <div className="flex items-center justify-start md:justify-center gap-2 md:gap-4 mb-4 flex-shrink-0 overflow-x-auto max-w-full px-2 py-1 scrollbar-none">
                    {[
                        { num: 1, title: 'Create Exam' },
                        { num: 2, title: 'Approve Rubric' },
                        { num: 3, title: 'Upload Scripts' },
                        { num: 4, title: 'AI Evaluation' },
                        { num: 5, title: 'Results' },
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-2 md:gap-4 shrink-0">
                            <button 
                                onClick={() => { if (step > 1 && s.num <= step) setStep(s.num); }}
                                disabled={step <= 1 || s.num > step}
                                className="flex items-center gap-2 md:gap-4 text-left group focus:outline-none disabled:cursor-default"
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 transition-transform ${
                                    step === s.num ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-indigo-100' :
                                    step > s.num ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 group-hover:scale-105' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {step > s.num ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : s.num}
                                </div>
                                <span className={`text-sm font-bold hidden md:block transition-colors ${
                                    step === s.num ? 'text-indigo-600' :
                                    step > s.num ? 'text-slate-800 group-hover:text-indigo-600' : 'text-slate-400'
                                }`}>
                                    {s.title}
                                </span>
                            </button>
                            {s.num < 5 && <div className="w-4 md:w-12 h-0.5 bg-slate-200 shrink-0"></div>}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8 flex flex-col relative">

                {/* Step 0: Dashboard / Saved Evaluations */}
                {step === 0 && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Evaluation Folders</h3>
                                <p className="text-slate-500 font-medium mt-1">Access past results or start a new grading session.</p>
                            </div>
                            <button onClick={() => setStep(1)} className="w-full sm:w-auto justify-center bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-transform"><Sparkles className="w-5 h-5 shrink-0" /> New Evaluation Session</button>
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
                                                setStep(5); // Go straight to results
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
                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 text-center">
                                    <button onClick={() => setIsPaperLocked(false)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /> Edit Exam Details</button>
                                    <h3 className="font-bold text-slate-800">Preview & Confirm Question Paper</h3>
                                    <div className="hidden sm:block opacity-0 px-4">Spacer</div>
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
                                    <p className="text-slate-500 mt-2">Upload the question paper to generate rubrics</p>
                                </div>



                        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-indigo-500" /> Add Question Paper</label>
                                <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl w-full md:w-max">
                                    <button onClick={() => setPaperSource('qpaper')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all text-center ${paperSource === 'qpaper' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}>Select from Q-Paper Dev</button>
                                    <button onClick={() => { setPaperSource('upload'); setUploadedFile(null); setParsedQuestions([]); setParseError(''); }} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all text-center justify-center flex items-center gap-1.5 ${paperSource === 'upload' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}><Upload className="w-3.5 h-3.5 shrink-0"/> Upload Question Paper</button>
                                </div>

                                {/* ── Upload Word Paper Panel ── */}
                                {paperSource === 'upload' && (
                                    <div className="animate-in fade-in duration-300 space-y-5">
                                        {/* Drop Zone */}
                                        {!uploadedFile && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* File / Drive Upload Option */}
                                                <div
                                                    onClick={() => wordFileRef.current?.click()}
                                                    className="relative border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all text-center group bg-white shadow-sm"
                                                >
                                                    <input
                                                        ref={wordFileRef}
                                                        type="file"
                                                        accept=".pdf,application/pdf,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/*"
                                                        className="hidden"
                                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleWordUpload(f); }}
                                                    />
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                                                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">Files & Google Drive</p>
                                                        <p className="text-xs text-slate-500 mt-1">Upload PDF or Word documents directly from device storage or cloud</p>
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md mt-3 inline-block border border-emerald-100/50">PDF / Word</span>
                                                    </div>
                                                </div>

                                                {/* Camera Photo Option */}
                                                <div className="relative border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all text-center group bg-white shadow-sm overflow-hidden">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleWordUpload(f); }}
                                                    />
                                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                                        <Camera className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">Open Camera</p>
                                                        <p className="text-xs text-slate-500 mt-1">Take a clear photo of your printed question paper pages</p>
                                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mt-3 inline-block border border-indigo-100/50">Instant Capture</span>
                                                    </div>
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
                                                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                                        {parsedQuestions.map((q, idx) => (
                                                            <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-4 px-3 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none">
                                                                <div className="flex items-center justify-between sm:justify-start gap-2">
                                                                    <input 
                                                                        value={q.qNum || `Q${idx + 1}`} 
                                                                        onChange={(e) => {
                                                                            const newQ = [...parsedQuestions];
                                                                            newQ[idx].qNum = e.target.value;
                                                                            setParsedQuestions(newQ);
                                                                            const paperText = newQ.map((qItem) => `**${qItem.qNum || 'Q'}. [${qItem.marks} Marks]**\n\n${qItem.text}`).join('\n\n---\n\n');
                                                                            setQuestionPaperText(paperText);
                                                                        }}
                                                                        className="w-12 h-8 bg-indigo-100 rounded-lg text-center font-bold text-indigo-700 text-xs shrink-0 outline-none focus:ring-2 focus:ring-indigo-400" 
                                                                    />
                                                                    <div className="flex items-center gap-1 shrink-0 bg-indigo-500 rounded-full px-3 py-1 sm:hidden">
                                                                        <input 
                                                                            type="text" 
                                                                            value={q.marks} 
                                                                            onChange={(e) => {
                                                                                const newQ = [...parsedQuestions];
                                                                                newQ[idx].marks = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                                                                setParsedQuestions(newQ);
                                                                                setParsedTotalMarks(newQ.reduce((sum, item) => sum + (Number(item.marks) || 0), 0));
                                                                                const paperText = newQ.map((qItem) => `**${qItem.qNum || 'Q'}. [${qItem.marks} Marks]**\n\n${qItem.text}`).join('\n\n---\n\n');
                                                                                setQuestionPaperText(paperText);
                                                                            }}
                                                                            className="w-8 text-sm font-bold !text-white bg-transparent outline-none text-right placeholder-indigo-200"
                                                                        />
                                                                        <span className="text-sm font-bold text-white">M</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newQ = parsedQuestions.filter((_, i) => i !== idx);
                                                                            setParsedQuestions(newQ);
                                                                            setParsedTotalMarks(newQ.reduce((sum, item) => sum + (Number(item.marks) || 0), 0));
                                                                            const paperText = newQ.map((qItem) => `**${qItem.qNum || 'Q'}. [${qItem.marks} Marks]**\n\n${qItem.text}`).join('\n\n---\n\n');
                                                                            setQuestionPaperText(paperText);
                                                                        }}
                                                                        className="shrink-0 text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors sm:hidden"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                                <textarea 
                                                                    value={q.text} 
                                                                    onChange={(e) => {
                                                                        const newQ = [...parsedQuestions];
                                                                        newQ[idx].text = e.target.value;
                                                                        setParsedQuestions(newQ);
                                                                        const paperText = newQ.map((qItem) => `**${qItem.qNum || 'Q'}. [${qItem.marks} Marks]**\n\n${qItem.text}`).join('\n\n---\n\n');
                                                                        setQuestionPaperText(paperText);
                                                                    }}
                                                                    className="flex-1 text-sm text-slate-700 font-medium bg-transparent outline-none focus:ring-2 focus:ring-indigo-400 rounded p-1 resize-y min-h-[3rem] w-full"
                                                                />
                                                                <div className="hidden sm:flex items-center gap-1 shrink-0 bg-indigo-500 rounded-full px-3 py-1 mt-0.5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={q.marks} 
                                                                        onChange={(e) => {
                                                                            const newQ = [...parsedQuestions];
                                                                            newQ[idx].marks = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                                                            setParsedQuestions(newQ);
                                                                            setParsedTotalMarks(newQ.reduce((sum, item) => sum + (Number(item.marks) || 0), 0));
                                                                            const paperText = newQ.map((qItem) => `**${qItem.qNum || 'Q'}. [${qItem.marks} Marks]**\n\n${qItem.text}`).join('\n\n---\n\n');
                                                                            setQuestionPaperText(paperText);
                                                                        }}
                                                                        className="w-10 text-sm font-bold !text-white bg-transparent outline-none text-right placeholder-indigo-200"
                                                                    />
                                                                    <span className="text-sm font-bold text-white">M</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const newQ = parsedQuestions.filter((_, i) => i !== idx);
                                                                        setParsedQuestions(newQ);
                                                                        setParsedTotalMarks(newQ.reduce((sum, item) => sum + (Number(item.marks) || 0), 0));
                                                                        const paperText = newQ.map((qItem) => `**${qItem.qNum || 'Q'}. [${qItem.marks} Marks]**\n\n${qItem.text}`).join('\n\n---\n\n');
                                                                        setQuestionPaperText(paperText);
                                                                    }}
                                                                    className="shrink-0 text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors mt-0.5 hidden sm:block"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
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
                                        if (!questionPaperText) return alert("Question Paper text is required.");
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
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 mb-4">
                            <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 shrink-0" /> Back to Create Exam
                            </button>
                            <h3 className="text-xl font-bold text-slate-800 text-center sm:text-left">Generated AI Rubrics</h3>
                            <span className="bg-indigo-50 text-indigo-700 text-sm font-bold px-3 py-1 rounded-lg text-center">Pending Approval</span>
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

                        <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                            <button className="flex-1 py-3 sm:py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold justify-center rounded-xl hover:bg-slate-50 transition-colors shadow-sm w-full">Edit All Rubrics</button>
                            <button onClick={() => setStep(3)} className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white font-bold justify-center rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm w-full">
                                <CheckCircle2 className="w-5 h-5 shrink-0" /> Approve & Lock All Rubrics
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Upload Scripts */}
                {step === 3 && (
                    <div className="w-full max-w-4xl mx-auto space-y-6 mt-6 animate-in slide-in-from-bottom duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 mb-2">
                            <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 shrink-0" /> Back to Create Exam
                            </button>
                            <div className="text-center sm:text-left">
                                <h3 className="text-xl font-bold text-slate-800">Upload Student Answer Scripts</h3>
                                <p className="text-slate-500 text-sm mt-0.5">Provide student details and upload answer sheets question by question.</p>
                            </div>
                            <div className="hidden sm:block opacity-0 px-4">Spacer</div>
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

                                    <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-indigo-300 bg-slate-50 transition-all flex flex-col items-center justify-center gap-4 relative group">
                                        <div className="flex flex-col gap-3 w-full px-6">
                                            <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-indigo-700 transition-all relative overflow-hidden">
                                                <Camera className="w-5 h-5" />
                                                Open Camera
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    capture="environment" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    onChange={handleImageUpload} 
                                                />
                                            </button>
                                            
                                            <button className="flex items-center justify-center gap-2 bg-white border-2 border-indigo-100 text-indigo-600 font-bold py-3 px-4 rounded-xl hover:bg-indigo-50 transition-all relative overflow-hidden">
                                                <Upload className="w-5 h-5" />
                                                Upload from Gallery
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    accept="image/*" 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    onChange={handleImageUpload} 
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 items-stretch">
                                    <button
                                        disabled={currentQIndex === 0}
                                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                                        className="px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                                    >
                                        <ChevronLeft className="w-4 h-4 shrink-0" /> Prev Q
                                    </button>

                                    {currentQIndex < mockQuestions.length - 1 ? (
                                        <button
                                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                                            className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold justify-center rounded-xl hover:bg-indigo-100 flex items-center gap-2 w-full"
                                        >
                                            Next Question <ChevronRight className="w-4 h-4 shrink-0" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (!studentRoll || !studentName) return alert("Please enter Student Roll and Name.");
                                                handleEvaluateStudent({
                                                    roll: studentRoll,
                                                    reg: studentReg,
                                                    name: studentName,
                                                    uploads: uploads
                                                });
                                            }}
                                            className="flex-1 py-3 bg-indigo-600 text-white font-bold justify-center rounded-xl hover:bg-indigo-700 flex items-center gap-2 shadow-sm w-full"
                                        >
                                            Submit for Background Valuation <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Final Dashboard */}
                {step === 4 && (
                    <div className="w-full flex flex-col animate-in fade-in duration-500">
                        {reviewingStudentId ? (
                            <div className="space-y-6 flex flex-col relative">
                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                    <button onClick={() => setReviewingStudentId(null)} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-900 font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 shrink-0" /> Back to Dashboard</button>
                                    <div className="text-center">
                                        <span className="text-xl font-bold text-slate-900 block truncate max-w-xs mx-auto">{evaluatedStudents.find(s => s.id === reviewingStudentId)?.name}</span>
                                        <span className="text-sm font-medium text-slate-500">{evaluatedStudents.find(s => s.id === reviewingStudentId)?.roll}</span>
                                    </div>
                                    <button onClick={() => {
                                        setEvaluatedStudents(prev => prev.map(s => s.id === reviewingStudentId ? { ...s, breakdown: editingMarks, marks: Object.values(editingMarks).reduce((a, b) => a + b, 0) } : s));
                                        setReviewingStudentId(null);
                                    }} className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md transform hover:-translate-y-0.5 transition-all w-full sm:w-auto"><CheckCircle2 className="w-5 h-5 shrink-0" /> Save Final Marks</button>
                                </div>

                                <div className="space-y-8 px-2 pb-8">
                                    {mockQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white border text-slate-800 border-slate-200 shadow-md rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-stretch transform transition-all hover:border-indigo-200 relative overflow-hidden">
                                            <div className="md:w-1/2 flex flex-col">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-black text-slate-900 text-xl flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm">Q{idx + 1}</div></h4>
                                                    <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-xs tracking-widest uppercase">Max 10 Marks</span>
                                                </div>
                                                <div className="text-sm text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed font-medium flex-1"><ReactMarkdown remarkPlugins={[remarkGfm]}>{q}</ReactMarkdown></div>

                                                <div className="mt-8 bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-100 group focus-within:border-indigo-500 transition-colors">
                                                    <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Suggested Marks</label>
                                                    <div className="flex items-center gap-4">
                                                        <input type="number" min="0" max="10" value={editingMarks[idx] !== undefined ? editingMarks[idx] : 0} onChange={e => setEditingMarks(prev => ({ ...prev, [idx]: parseFloat(e.target.value) || 0 }))} className="w-24 text-3xl font-black text-slate-900 px-4 py-3 rounded-xl bg-white border border-indigo-200 outline-none focus:ring-4 focus:ring-indigo-100 text-center transition-shadow shadow-sm" />
                                                        <span className="text-slate-400 font-bold text-xl">/ 10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:w-1/2 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 flex flex-col items-center justify-center relative min-h-[300px]">
                                                {evaluatedStudents.find(s => s.id === reviewingStudentId)?.uploads?.[idx] && evaluatedStudents.find(s => s.id === reviewingStudentId)?.uploads?.[idx].length > 0 ? (
                                                    <div className="w-full h-full flex flex-col gap-2 p-2 overflow-y-auto max-h-[500px]">
                                                        {evaluatedStudents.find(s => s.id === reviewingStudentId)?.uploads?.[idx].map((imgUrl: string, imgI: number) => (
                                                            <img key={imgI} src={imgUrl} alt={`Answer script ${imgI + 1} for Q${idx + 1}`} className="w-full rounded-xl object-contain border border-slate-200 bg-white shadow-sm" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center px-8 space-y-4 py-12">
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
                            <div className="flex-1 flex flex-col space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0 gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                            Evaluation Dashboard
                                            {isProcessingQueue && <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs animate-pulse border border-indigo-100"><Loader2 className="w-3 h-3 animate-spin" /> Processing Queue</div>}
                                        </h3>
                                        <p className="text-slate-500 text-sm">Real-time status of scripts being processed by AI.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                        <button onClick={() => setStep(1)} className="w-full sm:w-auto bg-slate-100 text-slate-700 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200/60">
                                            <ChevronLeft className="w-5 h-5 shrink-0" /> Back to Create Exam
                                        </button>
                                        <button onClick={() => setStep(3)} className="w-full sm:w-auto bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                                            <Plus className="w-5 h-5 shrink-0" /> Evaluate Next Student
                                        </button>
                                        <button 
                                            onClick={() => setStep(5)}
                                            disabled={evaluatedStudents.length === 0}
                                            className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            View Final Results <ChevronRight className="w-5 h-5 shrink-0" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                                    {evaluatedStudents.length === 0 ? (
                                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold">No students evaluated yet.</p>
                                        </div>
                                    ) : (
                                        evaluatedStudents.map(student => (
                                            <div key={student.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 truncate max-w-[150px]">{student.name}</h4>
                                                        <p className="text-xs font-bold text-slate-400">{student.roll}</p>
                                                    </div>
                                                    {student.status === 'evaluated' ? (
                                                        <div className="text-right">
                                                            <span className="text-2xl font-black text-indigo-600">{student.marks}</span>
                                                            <span className="text-xs text-slate-400 font-bold block">Total Marks</span>
                                                        </div>
                                                    ) : student.status === 'evaluating' ? (
                                                        <div className="flex flex-col items-end">
                                                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mb-1" />
                                                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{student.progress}%</span>
                                                        </div>
                                                    ) : (
                                                        <AlertCircle className="w-5 h-5 text-red-500" aria-label="Error in evaluation" />
                                                    )}
                                                </div>

                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                                                    <div 
                                                        className={`h-full transition-all duration-500 ${student.status === 'evaluated' ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                                        style={{ width: `${student.progress}%` }}
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setReviewingStudentId(student.id);
                                                            setEditingMarks(student.breakdown || {});
                                                        }}
                                                        disabled={student.status !== 'evaluated'}
                                                        className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-white transition-all disabled:opacity-50"
                                                    >
                                                        Review Paper
                                                    </button>
                                                    <button 
                                                        onClick={() => setEvaluatedStudents(prev => prev.filter(s => s.id !== student.id))}
                                                        className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-200 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Final Results */}
                {step === 5 && (
                    <div className="w-full flex flex-col animate-in fade-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0 gap-4 mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    Final Results Summary
                                </h3>
                                <p className="text-slate-500 text-sm">Overview of students whose scripts are uploaded, evaluating, or evaluated.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                <button onClick={() => setStep(4)} className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                                    <ChevronLeft className="w-5 h-5 shrink-0" /> Back to Dashboard
                                </button>
                                <button 
                                    onClick={handleExportResults}
                                    disabled={evaluatedStudents.length === 0}
                                    className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 font-bold flex items-center justify-center gap-2"
                                >
                                    <UploadCloud className="w-5 h-5 shrink-0" /> Export CSV
                                </button>
                                <button 
                                    onClick={() => {
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
                                    }}
                                    disabled={evaluatedStudents.length === 0}
                                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5 shrink-0" /> Save Evaluation
                                </button>
                            </div>
                        </div>

                        {evaluatedStudents.some(s => s.status === 'evaluating') && (
                            <div className="mb-6 p-5 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in duration-300 shadow-sm">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-bold text-indigo-950">Evaluation Ongoing for Answer Scripts</p>
                                        <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live Updates</span>
                                    </div>
                                    <p className="text-xs font-medium text-indigo-800/90 mt-1">
                                        Scripts are fully uploaded and AI grading is in progress. The breakdown will automatically populate below upon completion.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Roll No</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider">Name</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-center">Status</th>
                                        {mockQuestions.map((_, i) => (
                                            <th key={i} className="p-4 font-bold text-slate-600 text-sm uppercase tracking-wider text-center whitespace-nowrap">Q{i + 1}</th>
                                        ))}
                                        <th className="p-4 font-black text-indigo-700 text-sm uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {evaluatedStudents.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 text-slate-900 font-medium whitespace-nowrap">{student.roll}</td>
                                            <td className="p-4 text-slate-900 font-bold min-w-[150px]">{student.name}</td>
                                            <td className="p-4 text-center whitespace-nowrap">
                                                {student.status === 'evaluated' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Evaluated
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 animate-pulse">
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ongoing ({student.progress}%)
                                                    </span>
                                                )}
                                            </td>
                                            {mockQuestions.map((_, i) => (
                                                <td key={i} className="p-4 text-slate-600 font-medium text-center">
                                                    {student.status === 'evaluated' ? (student.breakdown && student.breakdown[i] !== undefined ? student.breakdown[i] : '-') : (
                                                        <span className="text-slate-300 text-xs italic">-</span>
                                                    )}
                                                </td>
                                            ))}
                                            <td className="p-4 text-indigo-700 font-black text-right text-lg">
                                                {student.status === 'evaluated' ? (student.marks ?? '-') : (
                                                    <span className="text-indigo-400 text-xs font-bold italic">Grading...</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {evaluatedStudents.length === 0 && (
                                        <tr>
                                            <td colSpan={mockQuestions.length + 4} className="p-8 text-center text-slate-500 font-medium">No results to display.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
