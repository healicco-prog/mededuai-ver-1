"use client";

import { useState, useRef, useEffect } from 'react';
import { ClipboardType, Sparkles, UploadCloud, Upload, Users, CheckCircle2, FileSearch, HelpCircle, Camera, Settings, Trash2, ChevronLeft, ChevronRight, X, FolderOpen, Save, Target, Edit2, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useQPaperStore } from '@/store/qPaperStore';
import { useEmrStore, EvaluatedStudent } from '@/store/emrStore';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Papa from 'papaparse'; // We will use papaparse to parse the CSV
import * as XLSX from 'xlsx';

export default function EmrMcqsPortal() {
    const store = useQPaperStore();
    const emrStore = useEmrStore();

    useEffect(() => {
        store.fetchData();
    }, []);

    const [step, setStep] = useState(0);

    // Context State
    const [instituteName, setInstituteName] = useState('');
    const [course, setCourse] = useState('');
    const [department, setDepartment] = useState('');
    const [examName, setExamName] = useState('');
    const [selectedPaperId, setSelectedPaperId] = useState('');
    
    // Questions from the DB 
    const [paperQuestions, setPaperQuestions] = useState<any[]>([]);

    // Answer Key
    const [answerKey, setAnswerKey] = useState<Record<string, string>>({}); // Mapping question index (or sub-index) to Option A/B/C/D

    // Student Roster
    const [students, setStudents] = useState<EvaluatedStudent[]>([]);
    
    // Manual Student Entry Setup
    const [manualRoll, setManualRoll] = useState('');
    const [manualReg, setManualReg] = useState('');
    const [manualName, setManualName] = useState('');

    // Scanning Workflow
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [uploadedOmr, setUploadedOmr] = useState<string | null>(null);
    const [omrFile, setOmrFile] = useState<File | null>(null);
    const [simulatedScore, setSimulatedScore] = useState<number | null>(null);

    // Results Review 
    const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
    const [manualOverrideScore, setManualOverrideScore] = useState<{ [qIdx: string]: number }>({});

    // Inline row editing in Step 2
    const [inlineEditId, setInlineEditId] = useState<number | null>(null);
    const [inlineEditData, setInlineEditData] = useState({ roll: '', reg: '', name: '' });

    // Upload Word Paper State
    const [paperSource, setPaperSource] = useState<'qpaper' | 'upload'>('qpaper');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isParsingWord, setIsParsingWord] = useState(false);
    const [parseError, setParseError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const wordFileRef = useRef<HTMLInputElement>(null);
    const [parsedTotalMarks, setParsedTotalMarks] = useState(0);

    const handleWordUpload = async (file: File) => {
        setUploadedFile(file);
        setIsParsingWord(true);
        setParseError('');
        setPaperQuestions([]);
        setAnswerKey({});

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

            if (data.institution) setInstituteName(data.institution);
            if (data.course) setCourse(data.course);
            if (data.department) setDepartment(data.department);
            if (data.paperTitle) setExamName(data.paperTitle);

            const newQuestions = data.questions.map((q: any, i: number) => {
                const isMcq2M = q.type?.includes('2 Marks') || q.type?.includes('2 sub questions') || q.subdivided;
                return {
                    questionNo: `Q${i + 1}`,
                    text: q.text,
                    type: q.type || 'MCQ',
                    marks: q.marks || 1,
                    subdivided: isMcq2M,
                };
            });
            setPaperQuestions(newQuestions);
            setParsedTotalMarks(data.totalMarks || 0);

        } catch (err: any) {
            setParseError('Network error: ' + err.message);
        } finally {
            setIsParsingWord(false);
        }
    };

    // Parse CSV or Excel
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        if (isExcel) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                if (bstr) {
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    processParsedData(data);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    processParsedData(results.data);
                },
                error: (err) => {
                    alert('Error parsing CSV: ' + err.message);
                }
            });
        }
    };

    const processParsedData = (data: any[]) => {
        const parsedStudents = data.map((row: any, i) => ({
            id: Date.now() + i,
            roll: String(row['Roll No'] || row['Roll Number'] || row['Roll'] || row['RN'] || row['rn'] || `R-${i+1}`).trim(),
            reg: String(row['Reg No'] || row['Registration'] || row['Reg'] || row['REG. NO'] || row['reg. no'] || `REG-${i+1}`).trim(),
            name: String(row['Name'] || row['Student Name'] || row['NAME'] || `Student ${i+1}`).trim(),
            marks: 0,
            breakdown: {},
            status: 'pending' as const
        }));

        const validStudents = parsedStudents.filter(s => s.roll || s.name);
        if (validStudents.length > 0) {
            setStudents(prev => [...prev, ...validStudents]);
        } else {
            alert('Could not find Roll No or Name columns in file.');
        }
    };

    const handleAddManualStudent = () => {
        if (!manualRoll || !manualName) return alert("Roll Number and Name are required.");
        const newStudent: EvaluatedStudent = {
            id: Date.now(),
            roll: manualRoll,
            reg: manualReg,
            name: manualName,
            marks: 0,
            breakdown: {},
            status: 'pending'
        };
        setStudents([...students, newStudent]);
        setManualRoll('');
        setManualReg('');
        setManualName('');
    };

    const handleMarkAbsent = (studentId: number) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'absent', marks: 0, breakdown: {} } : s));
    };

    // Calculate total possible marks
    let totalMaxMarks = 0;
    const questionsListForKey: { id: string, label: string, marks: number }[] = [];
    
    paperQuestions.forEach((q, i) => {
        let displayQNo = String(q.questionNo || (i + 1));
        if (q.text) {
            // More robust extraction: look for the first number that looks like a question number
            const qMatch = q.text.match(/(?:^|[\s\n*])Q?\s*(\d+)\s*[.)]/i);
            if (qMatch) {
                displayQNo = qMatch[1];
            }
        }

        const optionAMatches = q.text ? q.text.match(/(?:^|[\s\n])(?:\*\*)?(?:[Aa][.)]|\([Aa]\))(?:\*\*)?\s*/g) : null;
        let detectedCount = optionAMatches ? optionAMatches.length : 0;
        
        if (detectedCount <= 1 && q.text) {
            const hasI = /(?:^|[\s\n*])\(?[iI]\)[\s\n.]/.test(q.text);
            const hasII = /(?:^|[\s\n*])\(?ii\)[\s\n.]/i.test(q.text);
            const hasIII = /(?:^|[\s\n*])\(?iii\)[\s\n.]/i.test(q.text);
            if (hasI && hasII && hasIII) detectedCount = 3;
            else if (hasI && hasII) detectedCount = 2;
        }

        let finalCount = 1;
        if (detectedCount > 1) {
            finalCount = detectedCount;
        } else if (q.subdivided || q.marks > 1) {
            finalCount = q.marks; // Assume 1 mark per subquestion if marks > 1
        }

        if (finalCount > 1) {
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
            const marksPerSub = q.marks / finalCount;
            for (let j = 0; j < finalCount; j++) {
                const subLabel = romanNumerals[j] || (j + 1).toString();
                questionsListForKey.push({ id: `${i}_${j}`, label: `${displayQNo}(${subLabel})`, marks: marksPerSub });
            }
            totalMaxMarks += q.marks;
        } else {
            questionsListForKey.push({ id: `${i}`, label: `${displayQNo}`, marks: q.marks });
            totalMaxMarks += q.marks;
        }
    });

    const isAnswerKeyComplete = questionsListForKey.length > 0 && questionsListForKey.every(q => answerKey[q.id]);

    const handleExecuteScan = async () => {
        if (!omrFile || !selectedStudentId) return alert("Please upload an OMR sheet to scan.");
        
        setIsScanning(true);
        try {
            const formData = new FormData();
            formData.append('image', omrFile);
            formData.append('answerKey', JSON.stringify(answerKey));
            formData.append('questions', JSON.stringify(questionsListForKey));

            const response = await fetch('/api/emr-mcq/scan', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.extractedAnswers) {
                const aiAnswers = data.extractedAnswers;
                let total = 0;
                const bd: Record<string, number> = {};

                // Match AI labels back to our question IDs
                questionsListForKey.forEach(q => {
                    // Try to match label with or without trailing dot
                    const aiMark = aiAnswers[q.label] || aiAnswers[q.label + '.'] || aiAnswers[q.label.replace(/\.$/, '')];
                    
                    const correctMark = answerKey[q.id];
                    
                    if (aiMark === correctMark && aiMark !== null) {
                        bd[q.id] = q.marks;
                        total += q.marks;
                    } else {
                        bd[q.id] = 0;
                    }
                });

                setStudents(prev => prev.map(s =>
                    s.id === selectedStudentId
                    ? { ...s, status: 'evaluated' as const, marks: total, breakdown: bd, omrImageUrl: uploadedOmr ?? undefined }
                    : s
                ));
                
                setSelectedStudentId(null);
                setUploadedOmr(null);
                setOmrFile(null);
            } else {
                alert("Scan failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Scan error:", err);
            alert("An error occurred during scanning. Please try again.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleExportResults = () => {
        if (!students || students.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Headers
        const qHeaders = questionsListForKey.map(q => q.label.replace(/,/g, '')).join(",");
        csvContent += `Roll No,Registration No,Student Name,Total Marks (${totalMaxMarks}),Status,${qHeaders}\n`;

        students.forEach(student => {
            const qMarks = questionsListForKey.map(q => {
                if (student.status === 'absent') return "ABSENT";
                return student.breakdown && student.breakdown[q.id] !== undefined ? student.breakdown[q.id] : 0;
            }).join(",");
            const row = `"${student.roll}","${student.reg || ''}","${student.name}",${student.marks},${student.status},${qMarks}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${examName || 'mcq_results'}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 flex flex-col pb-24 lg:pb-0 min-h-screen lg:h-[calc(100vh-8rem)] pt-4 lg:pt-0">
            {/* Premium Gradient Header */}
            <div className="relative overflow-hidden rounded-3xl flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-800 to-pink-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.25),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-violet-600/20 to-transparent rounded-full blur-2xl" />

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <ClipboardType className="w-6 h-6 text-violet-200" />
                            </div>
                            <p className="text-[10px] font-bold text-violet-300 uppercase tracking-[0.2em]">Department Admin</p>
                        </div>
                        <h2 className="text-3xl font-extrabold text-white tracking-tight">EMR — MCQs Scanner</h2>
                        <p className="text-violet-200/80 mt-1.5 font-medium">Fast OMR sheet evaluation using AI Vision against your established Answer Keys.</p>
                    </div>
                </div>
            </div>

            {/* Stepper */}
            {step > 0 && (
                <div className="flex items-center justify-center gap-4 mb-4 flex-shrink-0">
                    {[
                        { num: 1, title: 'Answer Key' },
                        { num: 2, title: 'Student List' },
                        { num: 3, title: 'OMR Scanner' },
                        { num: 4, title: 'Final Results' },
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step === s.num ? 'bg-emerald-600 text-white' :
                                step > s.num ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
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

            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 lg:p-8 flex flex-col h-auto lg:h-0 overflow-visible lg:overflow-y-auto relative min-h-[600px] lg:min-h-0">

                {/* Step 0: Dashboard */}
                {step === 0 && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">MCQ Evaluations</h3>
                                <p className="text-slate-500 font-medium mt-1">Access past OMR results or scan new sheets.</p>
                            </div>
                            <button onClick={() => setStep(1)} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-transform"><Target className="w-5 h-5" /> New OMR Scanning Session</button>
                        </div>

                        {emrStore.evaluations.length === 0 ? (
                            <div className="text-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                                <ClipboardType className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h4 className="text-xl font-bold text-slate-700">No Saved OMR Evaluations Yet</h4>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">Start a new evaluation session to scan student OMR sheets and score marks instantly.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {emrStore.evaluations.map(evalu => (
                                    <div key={evalu.id} className="bg-white border text-slate-800 border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 group cursor-pointer relative overflow-hidden flex flex-col items-start gap-4">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                            <ClipboardType className="w-6 h-6" />
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
                                                setPaperQuestions(evalu.questions);
                                                setAnswerKey(evalu.answerKey);
                                                setStudents(evalu.students);
                                                setStep(4);
                                            }} className="bg-white text-emerald-600 font-bold px-6 py-2 rounded-xl shadow-lg border border-emerald-100 scale-95 group-hover:scale-100 transition-all">View Results</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 1: Select Paper & Answer Key */}
                {step === 1 && (
                    <div className="max-w-4xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Assign Question Paper & Answer Key</h3>
                            <p className="text-slate-500 mt-2">Select a pre-generated MCQ paper and provide the correct answers for the scanner.</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-emerald-500" /> Question Paper Source</label>
                            
                            <div className="flex flex-wrap gap-2 mb-4 bg-slate-200/50 p-1.5 rounded-xl w-max">
                                <button onClick={() => setPaperSource('qpaper')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${paperSource === 'qpaper' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}>Select from Q-Paper Dev</button>
                                <button onClick={() => { setPaperSource('upload'); setUploadedFile(null); setPaperQuestions([]); setParseError(''); setAnswerKey({}); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${paperSource === 'upload' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-800'}`}><Upload className="w-3.5 h-3.5"/> Upload Question Paper (Word)</button>
                            </div>

                            {paperSource === 'qpaper' && (
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
                                    value={selectedPaperId}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        setSelectedPaperId(id);
                                        const paper = store.papers.find(p => p.id === id);
                                        if (paper) {
                                            setInstituteName(paper.instituteName);
                                            setCourse(paper.course);
                                            setDepartment(paper.department);
                                            setExamName(paper.examName);
                                            
                                            // Parse out questions to build the key
                                            const parsedQs = paper.questions.map(q => {
                                                const isMcq2M = q.type.includes('2 Marks') || q.type.includes('2 sub questions') || (q as any).subdivided;
                                                return {
                                                    questionNo: q.questionNo,
                                                    text: q.generatedContent,
                                                    type: q.type,
                                                    marks: q.marks,
                                                    subdivided: isMcq2M,
                                                };
                                            });
                                            setPaperQuestions(parsedQs);
                                            setAnswerKey({}); // Reset key
                                        }
                                    }}
                                >
                                    <option value="" disabled>Select a saved MCQ question paper...</option>
                                    {store.papers.filter(p => {
                                        const format = store.formats.find(f => f.id === p.formatId);
                                        return format?.paperType === 'MCQ';
                                    }).length === 0 && <option value="" disabled>No MCQ formats found in Q-Paper Dev.</option>}
                                    {store.papers.filter(p => {
                                        const format = store.formats.find(f => f.id === p.formatId);
                                        return format?.paperType === 'MCQ';
                                    }).map(p => (
                                        <option key={p.id} value={p.id}>{p.examName} ({p.course} - {p.department})</option>
                                    ))}
                                </select>
                            )}

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
                                                    : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/40'
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
                                        <div className="flex flex-col items-center gap-5 py-10 bg-white rounded-3xl border border-slate-200">
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

                                    {/* Parsed Results Summary */}
                                    {paperQuestions.length > 0 && !isParsingWord && (
                                        <div className="space-y-4 animate-in fade-in duration-300">
                                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                                        <CheckCircle className="w-7 h-7 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-emerald-900 text-lg">Successfully Parsed!</p>
                                                        <p className="text-base text-emerald-700">{paperQuestions.length} questions · {parsedTotalMarks} total marks · {uploadedFile?.name}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setUploadedFile(null); setPaperQuestions([]); setParseError(''); setAnswerKey({}); }}
                                                    className="text-sm font-bold text-slate-500 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors shrink-0 ml-4"
                                                >Remove</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {((paperSource === 'qpaper' && selectedPaperId) || (paperSource === 'upload')) && paperQuestions.length > 0 && (
                            <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                                <h4 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">Set Correct Answers</h4>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {paperQuestions.map((q, i) => {
                                        const subQuestions = questionsListForKey.filter(kq => kq.id === `${i}` || kq.id.startsWith(`${i}_`));
                                        if (subQuestions.length === 0) return null;
                                        
                                        return (
                                            <div key={i} className="bg-white border text-slate-700 border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-lg">
                                                            {subQuestions.length === 1 ? `Q${subQuestions[0].label}` : `Q${i + 1}`} 
                                                            <span className="text-slate-400 font-normal text-sm ml-2">({q.marks}m)</span>
                                                        </span>
                                                        {subQuestions.every(sq => answerKey[sq.id]) && (
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Completed</span>
                                                        )}
                                                    </div>
                                                    {q.text && (
                                                        <div className="mt-3 text-lg font-medium text-slate-800 prose prose-slate max-w-none prose-p:my-1 prose-headings:my-2">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {q.text.split('\n').map((line: string) => line.trimStart()).join('\n')}
                                                            </ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-col gap-3 shrink-0 pt-2 md:pt-0">
                                                    {subQuestions.map(sq => (
                                                        <div key={sq.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-end">
                                                            {subQuestions.length > 1 && (
                                                                <span className="text-sm font-bold text-slate-500 w-12 text-left sm:text-right">({sq.label.split('(')[1] || sq.label}</span>
                                                            )}
                                                            <div className="flex gap-1 bg-slate-50 p-1.5 rounded-lg shrink-0 h-10">
                                                                {['A', 'B', 'C', 'D'].map(opt => (
                                                                    <button 
                                                                        key={`${sq.id}-${opt}`}
                                                                        onClick={() => setAnswerKey(prev => ({ ...prev, [sq.id]: opt }))}
                                                                        className={`w-8 h-8 rounded-md font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 ${answerKey[sq.id] === opt ? 'bg-emerald-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-500'}`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button 
                                onClick={() => setStep(2)}
                                disabled={(paperSource === 'qpaper' && !selectedPaperId) || (paperSource === 'upload' && paperQuestions.length === 0) || !isAnswerKeyComplete}
                                className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                Continue to Examinees <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Student List */}
                {step === 2 && (
                    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                         <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Upload Student Roster</h3>
                                <p className="text-slate-500 text-sm mt-1">Upload an Excel/CSV file with Roll No, Reg No, and Name columns, or add students manually.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                            <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 hover:border-emerald-400 p-8 rounded-3xl flex flex-col items-center justify-center text-center transition-colors relative group">
                                <div className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                    <input type="file" accept=".csv,.xlsx,.xls" className="w-full h-full cursor-pointer" onChange={handleFileUpload} />
                                </div>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-emerald-900">Upload CSV/Excel List</h4>
                                <p className="text-sm font-medium text-emerald-700/70 mt-2 max-w-[200px]">Must contain headers: Roll No, Reg No, Name.</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
                                <h4 className="font-bold text-slate-800">Manual Entry</h4>
                                <div>
                                    <input value={manualRoll} onChange={e => setManualRoll(e.target.value)} placeholder="Roll No (e.g. 1)" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-medium focus:border-emerald-500" />
                                </div>
                                <div>
                                    <input value={manualReg} onChange={e => setManualReg(e.target.value)} placeholder="Reg No (Optional)" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-medium focus:border-emerald-500" />
                                </div>
                                <div>
                                    <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-medium focus:border-emerald-500" />
                                </div>
                                <button onClick={handleAddManualStudent} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:border-emerald-500 hover:text-emerald-700 transition">Add To List</button>
                            </div>
                        </div>

                        {students.length > 0 && (
                            <div className="bg-white border text-slate-800 border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-8">
                                <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                                    <span>Imported Students</span>
                                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-xs">{students.length} Total</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 bg-white shadow-sm font-bold text-slate-500 uppercase tracking-wider text-xs z-10">
                                            <tr>
                                                <th className="p-3 pl-6 border-b border-slate-100">Roll No</th>
                                                <th className="p-3 border-b border-slate-100">Reg No</th>
                                                <th className="p-3 border-b border-slate-100">Name</th>
                                                <th className="p-3 pr-6 border-b border-slate-100 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(s => (
                                                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                                                    {inlineEditId === s.id ? (
                                                        <>
                                                            <td className="p-3 pl-6">
                                                                <input 
                                                                    value={inlineEditData.roll} 
                                                                    onChange={(e) => setInlineEditData({ ...inlineEditData, roll: e.target.value })} 
                                                                    className="w-full px-2 py-1 border border-emerald-300 rounded font-mono text-sm outline-none focus:ring-1 focus:ring-emerald-500" 
                                                                />
                                                            </td>
                                                            <td className="p-3">
                                                                <input 
                                                                    value={inlineEditData.reg} 
                                                                    onChange={(e) => setInlineEditData({ ...inlineEditData, reg: e.target.value })} 
                                                                    className="w-full px-2 py-1 border border-emerald-300 rounded font-mono text-sm outline-none focus:ring-1 focus:ring-emerald-500" 
                                                                />
                                                            </td>
                                                            <td className="p-3">
                                                                <input 
                                                                    value={inlineEditData.name} 
                                                                    onChange={(e) => setInlineEditData({ ...inlineEditData, name: e.target.value })} 
                                                                    className="w-full px-2 py-1 border border-emerald-300 rounded font-bold text-sm outline-none focus:ring-1 focus:ring-emerald-500" 
                                                                />
                                                            </td>
                                                            <td className="p-3 pr-6 text-right flex justify-end gap-2">
                                                                <button onClick={() => {
                                                                    setStudents(prev => prev.map(st => st.id === s.id ? { ...st, roll: inlineEditData.roll, reg: inlineEditData.reg, name: inlineEditData.name } : st));
                                                                    setInlineEditId(null);
                                                                }} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md"><CheckCircle2 className="w-4 h-4" /></button>
                                                                <button onClick={() => setInlineEditId(null)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-md"><X className="w-4 h-4" /></button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="p-3 pl-6 font-mono font-medium text-slate-600">{s.roll}</td>
                                                            <td className="p-3 font-mono text-slate-500">{s.reg || '-'}</td>
                                                            <td className="p-3 font-bold text-slate-800">{s.name}</td>
                                                            <td className="p-3 pr-6 text-right flex justify-end gap-2">
                                                                <button onClick={() => {
                                                                    setInlineEditId(s.id);
                                                                    setInlineEditData({ roll: s.roll, reg: s.reg, name: s.name });
                                                                }} className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => setStudents(prev => prev.filter(st => st.id !== s.id))} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-6 border-t border-slate-100">
                             <button onClick={() => setStep(1)} className="text-slate-500 font-bold px-4 py-2 rounded-xl hover:bg-slate-100">Back</button>
                             <button 
                                onClick={() => setStep(3)}
                                disabled={students.length === 0}
                                className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                Start Scanning OMR Sheets <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: OMR Scanner */}
                {step === 3 && (
                    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center shrink-0 w-full">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">OMR Scanning Queue</h3>
                                <p className="text-sm text-slate-500 font-medium">Select a student to scan their sheet.</p>
                            </div>
                            <button onClick={() => setStep(4)} className="hidden lg:flex bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg hover:bg-slate-800 items-center gap-2">Finish & View Session <ChevronRight className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 w-full flex flex-col lg:flex-row gap-6 min-h-0">
                            {/* Student Queue Sidebar */}
                        <div className="w-full lg:w-80 flex flex-col bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shrink-0 h-[350px] lg:h-auto">
                            <div className="p-4 bg-white border-b border-slate-200">
                                <h3 className="font-bold text-slate-900">Student Queue</h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Select a student to scan their OMR sheet.</p>
                                
                                <div className="mt-4 flex gap-2">
                                    <div className="flex-1 bg-green-50 rounded-lg p-2 text-center border border-green-100">
                                        <div className="text-lg font-black text-green-700">{students.filter(s => s.status === 'evaluated').length}</div>
                                        <div className="text-[10px] font-bold text-green-600 uppercase">Done</div>
                                    </div>
                                    <div className="flex-1 bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                                        <div className="text-lg font-black text-amber-700">{students.filter(s => s.status === 'pending').length}</div>
                                        <div className="text-[10px] font-bold text-amber-600 uppercase">Pending</div>
                                    </div>
                                    <div className="flex-1 bg-slate-100 rounded-lg p-2 text-center border border-slate-200">
                                        <div className="text-lg font-black text-slate-700">{students.filter(s => s.status === 'absent').length}</div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Absent</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {students.map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => { setSelectedStudentId(s.id); setUploadedOmr(s.omrImageUrl || null); setOmrFile(null); }}
                                        className={`w-full text-left p-3 rounded-xl flex justify-between items-center transition-all ${selectedStudentId === s.id ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-200 text-slate-700'}`}
                                    >
                                        <div className="flex flex-col truncate">
                                            <span className="font-bold text-sm truncate">{s.name}</span>
                                            <span className={`text-[10px] font-medium tracking-wider uppercase ${selectedStudentId === s.id ? 'text-emerald-200' : 'text-slate-500'}`}>{s.roll}</span>
                                        </div>
                                        {s.status === 'evaluated' && <CheckCircle2 className={`w-5 h-5 shrink-0 ${selectedStudentId === s.id ? 'text-white' : 'text-green-500'}`} />}
                                        {s.status === 'absent' && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${selectedStudentId === s.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>ABS</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Scanner View */}
                        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm p-6 relative overflow-hidden">
                            {selectedStudentId ? (
                                (() => {
                                    const activeStudent = students.find(s => s.id === selectedStudentId);
                                    if (!activeStudent) return null;

                                    if (isScanning) {
                                        return (
                                            <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                                                <div className="relative">
                                                     <div className="w-24 h-24 border-4 border-emerald-100 rounded-full"></div>
                                                     <div className="absolute top-0 left-0 w-24 h-24 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                                                     <Target className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-600" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-xl font-bold text-slate-900">AI Vison Scanning...</h3>
                                                    <p className="text-slate-500 font-medium">Extracting bubbles and matching with answer key.</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="w-full h-full flex flex-col">
                                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900">{activeStudent.name}</h3>
                                                    <div className="flex gap-3 text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">
                                                        <span>ROLL: {activeStudent.roll}</span>
                                                        {activeStudent.reg && <span>• REG: {activeStudent.reg}</span>}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {activeStudent.status !== 'absent' && (
                                                        <button 
                                                            onClick={() => handleMarkAbsent(activeStudent.id)}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
                                                        >
                                                            Mark Absent
                                                        </button>
                                                    )}
                                                    {activeStudent.status === 'absent' && (
                                                        <button 
                                                            onClick={() => setStudents(prev => prev.map(s => s.id === activeStudent.id ? { ...s, status: 'pending' } : s))}
                                                            className="px-4 py-2 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                                                        >
                                                            Undo Absent
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {activeStudent.status === 'absent' ? (
                                                <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50">
                                                    <Users className="w-16 h-16 text-slate-400 mb-4" />
                                                    <h4 className="text-xl font-bold text-slate-600">Student Marked Absent</h4>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col lg:flex-row gap-6">
                                                    <div className={`flex-1 min-h-[300px] lg:min-h-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 transition-colors group ${uploadedOmr ? 'border-solid border-slate-200 p-0' : 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'}`}>
                                                        {uploadedOmr ? (
                                                            <>
                                                                <img src={uploadedOmr} alt="Scanned OMR" className="w-full h-full object-contain" />
                                                                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <button onClick={() => { setUploadedOmr(null); setOmrFile(null); }} className="bg-white text-slate-900 font-bold px-6 py-2 rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4"/> Remove Image</button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center gap-6 w-full p-8">
                                                                <div className="flex flex-col gap-4 w-full max-w-xs">
                                                                    <button className="flex items-center justify-center gap-3 bg-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all relative overflow-hidden active:scale-95">
                                                                        <Camera className="w-6 h-6" />
                                                                        Open Camera
                                                                        <input 
                                                                            type="file" 
                                                                            accept="image/*" 
                                                                            capture="environment" 
                                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    setUploadedOmr(URL.createObjectURL(file));
                                                                                    setOmrFile(file);
                                                                                }
                                                                            }} 
                                                                        />
                                                                    </button>

                                                                    <button className="flex items-center justify-center gap-3 bg-white border-2 border-emerald-100 text-emerald-600 font-bold py-4 px-6 rounded-2xl hover:bg-emerald-50 transition-all relative overflow-hidden active:scale-95">
                                                                        <Upload className="w-6 h-6" />
                                                                        Upload Gallery
                                                                        <input 
                                                                            type="file" 
                                                                            accept="image/*" 
                                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    setUploadedOmr(URL.createObjectURL(file));
                                                                                    setOmrFile(file);
                                                                                }
                                                                            }} 
                                                                        />
                                                                    </button>
                                                                </div>
                                                                <p className="text-sm font-medium text-slate-400">Supported formats: JPG, PNG, HEIC</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="w-full lg:w-72 flex flex-col justify-between shrink-0">
                                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                                            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">Results Map</h4>
                                                            {activeStudent.status === 'evaluated' ? (
                                                                <div className="text-center pb-4">
                                                                    <div className="text-4xl font-black text-emerald-600">{activeStudent.marks} <span className="text-lg text-slate-400 font-bold">/ {totalMaxMarks}</span></div>
                                                                    <p className="text-sm font-bold text-emerald-700/70 mt-1 uppercase tracking-widest">Total Scored</p>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-6 text-slate-400 text-sm font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-xl">Pending Scan</div>
                                                            )}
                                                        </div>

                                                        <button 
                                                            disabled={!uploadedOmr}
                                                            onClick={handleExecuteScan}
                                                            className="w-full py-4 mt-4 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
                                                        >
                                                            <Target className="w-5 h-5" /> Execute Scan Analysis
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12 md:py-0">
                                    <ClipboardType className="w-16 h-16 opacity-50" />
                                    <h4 className="text-xl font-bold text-slate-500 text-center">Select a student from the queue to scan.</h4>
                                </div>
                            )}
                        </div>
                        </div>
                        
                        <div className="lg:hidden flex justify-center w-full mt-4">
                            <button onClick={() => setStep(4)} className="bg-slate-900 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-slate-800 flex items-center gap-2 w-full justify-center">Finish & View Session <ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}

                {/* Step 4: Final Results & Export */}
                {step === 4 && (
                    <div className="w-full h-full flex flex-col animate-in fade-in duration-300">
                        <div className="flex justify-between items-end mb-6 shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{examName}</h3>
                                <div className="flex gap-2 items-center mt-1">
                                    <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">OMR Scanning Session Complete</span>
                                    <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-md">{students.length} Records</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => {
                                    emrStore.saveEvaluation({
                                        id: Date.now().toString(),
                                        examName,
                                        course,
                                        department,
                                        instituteName,
                                        date: Date.now(),
                                        questions: paperQuestions,
                                        answerKey,
                                        students,
                                        maxMarks: totalMaxMarks
                                    });
                                    alert("OMR Evaluation results successfully saved to folder!");
                                    setStep(0);
                                }} className="bg-white border-2 border-emerald-600 text-emerald-600 font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-2 transition-colors"><Save className="w-4 h-4" /> Save to Folder</button>
                                <button onClick={handleExportResults} className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-2">Export CSV Dataset</button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-max">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200">
                                            <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-100 z-10 w-32 border-r border-slate-200">Roll/Reg</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-48">Student Name</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-24 text-center">Status</th>
                                            <th className="p-4 text-xs font-black text-emerald-700 uppercase tracking-widest w-24 text-center">Totals</th>
                                            {questionsListForKey.map(q => (
                                                <th key={q.id} className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-16 text-center border-l border-slate-200">{q.label}</th>
                                            ))}
                                            <th className="p-4 pr-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {students.map((s) => (
                                            <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="p-4 pl-6 font-mono text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-100 flex flex-col">
                                                    <span className="font-bold">{s.roll}</span>
                                                    <span className="text-[10px] text-slate-400">{s.reg}</span>
                                                </td>
                                                <td className="p-4 font-bold text-slate-800">{s.name}</td>
                                                <td className="p-4 text-center">
                                                    {s.status === 'evaluated' && <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2 py-1 rounded-md">Scanned</span>}
                                                    {s.status === 'absent' && <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-1 rounded-md">Absent</span>}
                                                    {s.status === 'pending' && <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-1 rounded-md">Pending</span>}
                                                </td>
                                                <td className="p-4 text-center font-black text-lg text-emerald-700 border-x border-slate-100">{s.status === 'absent' ? '0' : s.marks}</td>
                                                {questionsListForKey.map(q => (
                                                    <td key={q.id} className="p-4 text-center font-bold text-slate-600 border-r border-slate-50">
                                                        {s.status === 'absent' ? '-' : s.status === 'pending' ? '-' : (s.breakdown?.[q.id] || 0)}
                                                    </td>
                                                ))}
                                                <td className="p-4 pr-6 text-right">
                                                    <button onClick={() => {
                                                        // Fallback direct edit overlay logic could go here
                                                        setEditingStudentId(s.id);
                                                        setManualOverrideScore(s.breakdown || {});
                                                    }} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:border-emerald-300">Review</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modals for reviewing a student's marks explicitly */}
                        {editingStudentId !== null && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 shrink-0">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">Review Marks Breakdown</h3>
                                            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">{students.find(s => s.id === editingStudentId)?.name} • ROLL: {students.find(s => s.id === editingStudentId)?.roll}</p>
                                        </div>
                                        <button onClick={() => setEditingStudentId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                         {questionsListForKey.map(q => (
                                             <div key={q.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center">
                                                 <span className="font-bold text-slate-700 text-sm mb-2">{q.label} <span className="text-slate-400 font-normal">({q.marks}m)</span></span>
                                                 <input 
                                                    type="number" 
                                                    min="0" 
                                                    max={q.marks} 
                                                    step="0.5"
                                                    value={manualOverrideScore[q.id] !== undefined ? manualOverrideScore[q.id] : 0}
                                                    onChange={e => setManualOverrideScore(prev => ({ ...prev, [q.id]: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full text-center font-black text-xl text-emerald-700 bg-white border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl py-2 shadow-sm"
                                                 />
                                             </div>
                                         ))}
                                    </div>

                                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                                        <div className="font-bold text-slate-600">
                                            Total: <span className="text-2xl font-black text-slate-900">{Object.values(manualOverrideScore).reduce((a, b) => a + b, 0)}</span> <span className="text-slate-400">/ {totalMaxMarks}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setEditingStudentId(null)} className="px-6 py-3 font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                            <button onClick={() => {
                                                const newTotal = Object.values(manualOverrideScore).reduce((a, b) => a + b, 0);
                                                setStudents(prev => prev.map(s => s.id === editingStudentId ? { ...s, marks: newTotal, breakdown: manualOverrideScore, status: s.status === 'pending' ? 'evaluated' : s.status } : s));
                                                setEditingStudentId(null);
                                            }} className="px-6 py-3 font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Apply Overrides</button>
                                        </div>
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
