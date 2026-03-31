"use client";

import { useState, useEffect, useRef } from 'react';
import { PenTool, Loader2, Sparkles, RefreshCcw, Download, Copy, CheckCircle, FileText, Save, Share2, FileDown, X, Plus, ListChecks, ArrowRight, ArrowLeft, Hash, HelpCircle, Check, Square, CheckSquare } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ANSWER_TYPES = [
    { id: 'long_answer', label: 'Long Answer (10 Marks)', desc: 'Detailed, structured essay-type answers' },
    { id: 'short_answer', label: 'Short Answer (5 Marks)', desc: 'Concise yet complete answers' },
    { id: 'viva_answer', label: 'Viva-Style Answer', desc: 'Oral examination format with key points' }
];

const ANSWER_DEPTH = ['Basic', 'Standard', 'Detailed', 'Expert'];

interface GeneratedQuestion {
    id: number;
    question: string;
    type: 'long' | 'short';
    frequency: string;
}

export default function EssayAnswerGenPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);

    // Step management
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1: Configuration
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const [topicsList, setTopicsList] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(10);

    // Step 2: Generated questions & selection
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // Step 3: Answer config & generation
    const [selectedAnswerType, setSelectedAnswerType] = useState('long_answer');
    const [answerDepth, setAnswerDepth] = useState('Standard');
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [result, setResult] = useState('');

    // UI helpers
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [shared, setShared] = useState(false);
    const topicInputRef = useRef<HTMLInputElement>(null);

    const activeCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];
    const activeSubject = activeCourse?.subjects.find(s => s.id === selectedSubjectId) || activeCourse?.subjects[0];

    useEffect(() => {
        if (!selectedCourseId && coursesList.length > 0) setSelectedCourseId(coursesList[0].id);
    }, [coursesList, selectedCourseId]);

    useEffect(() => {
        if (activeCourse && !selectedSubjectId && activeCourse.subjects.length > 0) {
            setSelectedSubjectId(activeCourse.subjects[0].id);
        }
    }, [activeCourse, selectedSubjectId]);

    // Topic handlers
    const handleAddTopic = () => {
        const trimmed = topicInput.trim();
        if (trimmed && !topicsList.includes(trimmed)) {
            setTopicsList(prev => [...prev, trimmed]);
            setTopicInput('');
            topicInputRef.current?.focus();
        }
    };

    const handleTopicKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); }
    };

    const handleRemoveTopic = (topic: string) => {
        setTopicsList(prev => prev.filter(t => t !== topic));
    };

    // Step 1 → Step 2: Generate Questions
    const handleGenerateQuestions = async () => {
        if (!currentUser) return;
        const finalTopics = [...topicsList];
        if (topicInput.trim() && !finalTopics.includes(topicInput.trim())) {
            finalTopics.push(topicInput.trim());
            setTopicsList(finalTopics);
            setTopicInput('');
        }
        if (finalTopics.length === 0) {
            alert('Please add at least one topic.');
            return;
        }

        setLoadingQuestions(true);
        setGeneratedQuestions([]);
        setSelectedQuestionIds(new Set());

        try {
            const res = await fetch('/api/essay-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: finalTopics.join(', '),
                    count: questionCount
                })
            });
            const data = await res.json();
            if (data.success && data.questions?.length > 0) {
                setGeneratedQuestions(data.questions);
                setCurrentStep(2);
            } else {
                alert('Failed to generate questions. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('Error generating questions. Please try again.');
        } finally {
            setLoadingQuestions(false);
        }
    };

    // Question selection
    const toggleQuestion = (id: number) => {
        setSelectedQuestionIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        setSelectedQuestionIds(new Set(generatedQuestions.map(q => q.id)));
    };

    const deselectAll = () => {
        setSelectedQuestionIds(new Set());
    };

    // Step 2 → Step 3: Generate Answers
    const handleGenerateAnswers = async () => {
        if (selectedQuestionIds.size === 0) {
            alert('Please select at least one question to generate answers for.');
            return;
        }
        if (!currentUser) return;
        const check = tokenService.checkAvailability(currentUser.id, 'Essay Answer Gen');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setLoadingAnswers(true);
        setResult('');

        const selectedQs = generatedQuestions
            .filter(q => selectedQuestionIds.has(q.id))
            .map(q => q.question);

        try {
            const res = await fetch('/api/essay-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: topicsList.join(', '),
                    answerType: selectedAnswerType,
                    depth: answerDepth,
                    questions: selectedQs,
                    instructions: additionalInstructions
                })
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.answer || 'No answers were generated.');
                tokenService.processTransaction(currentUser.id, 'Essay Answer Gen', 'gemini-2.5-flash');
                setCurrentStep(4);
            }
        } catch (e) {
            console.error(e);
            setResult("Generation failed. Please try again.");
            setCurrentStep(4);
        } finally {
            setLoadingAnswers(false);
        }
    };

    // Action handlers
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        try {
            const savedAnswers = JSON.parse(localStorage.getItem('mededuai_saved_essay_answers') || '[]');
            const selectedQs = generatedQuestions.filter(q => selectedQuestionIds.has(q.id));
            savedAnswers.push({
                id: Date.now(),
                course: activeCourse?.name,
                subject: activeSubject?.name,
                topics: topicsList.join(', '),
                questions: selectedQs.map(q => q.question),
                answerType: selectedAnswerType,
                depth: answerDepth,
                content: result,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('mededuai_saved_essay_answers', JSON.stringify(savedAnswers));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
    };

    const handleDownloadPDF = async () => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text(`Essay Answers: ${topicsList.join(', ')}`, 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`${activeCourse?.name} | ${activeSubject?.name} | ${answerDepth} | ${ANSWER_TYPES.find(t => t.id === selectedAnswerType)?.label}`, 15, 28);

            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(result, 180);
            let y = 38;
            for (let i = 0; i < lines.length; i++) {
                if (y > 280) { pdf.addPage(); y = 15; }
                pdf.text(lines[i], 15, y);
                y += 5.5;
            }
            pdf.save(`EssayAnswers_${topicsList[0]?.replace(/\s+/g, '_') || 'Answers'}.pdf`);
        } catch (err) { console.error(err); }
    };

    const handleDownloadWord = () => {
        try {
            const selectedQs = generatedQuestions.filter(q => selectedQuestionIds.has(q.id));
            const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Essay Answers - ${topicsList.join(', ')}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.6;margin:2cm;}
h1{color:#4c1d95;font-size:18pt;}h2{color:#6d28d9;font-size:14pt;}h3{color:#7c3aed;font-size:12pt;}
p{margin:6pt 0;}ul,ol{margin:6pt 0 6pt 20pt;}table{border-collapse:collapse;width:100%;margin:10pt 0;}
th,td{border:1px solid #ccc;padding:6pt 8pt;text-align:left;}th{background:#f5f3ff;}</style></head>
<body><h1>Essay Answers: ${topicsList.join(', ')}</h1>
<p><strong>Course:</strong> ${activeCourse?.name} | <strong>Subject:</strong> ${activeSubject?.name} | <strong>Depth:</strong> ${answerDepth}</p>
<p><strong>Questions answered:</strong> ${selectedQs.length}</p>
<hr/>${result.replace(/\n/g, '<br/>')}</body></html>`;
            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `EssayAnswers_${topicsList[0]?.replace(/\s+/g, '_') || 'Answers'}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: `Essay Answers: ${topicsList.join(', ')}`, text: result.substring(0, 500) + '...' });
            } else {
                const shareText = `📝 Essay Answers: ${topicsList.join(', ')}\n📚 ${activeCourse?.name} | ${activeSubject?.name}\n\n${result}`;
                await navigator.clipboard.writeText(shareText);
                setShared(true);
                setTimeout(() => setShared(false), 3000);
            }
        } catch (err) { console.error(err); }
    };

    const resetToStart = () => {
        setCurrentStep(1);
        setGeneratedQuestions([]);
        setSelectedQuestionIds(new Set());
        setResult('');
        setSaved(false);
    };

    // Step indicator
    const steps = [
        { num: 1, label: 'Configure' },
        { num: 2, label: 'Select Questions' },
        { num: 3, label: 'Answer Settings' },
        { num: 4, label: 'Results' },
    ];

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-5 flex-shrink-0">
                <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-fuchsia-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <PenTool className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Essay Answer Generator</h2>
                            <p className="text-violet-300/80 text-sm font-medium">AI-crafted model answers for essay-type questions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-1 mb-5 flex-shrink-0">
                {steps.map((step, idx) => (
                    <div key={step.num} className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            currentStep === step.num ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                            : currentStep > step.num ? 'bg-violet-100 text-violet-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                            {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : <span>{step.num}</span>}
                            <span className="hidden sm:inline">{step.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-6 h-0.5 mx-1 rounded ${currentStep > step.num ? 'bg-violet-400' : 'bg-slate-200'}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* ====== STEP 1: Configuration ====== */}
                {currentStep === 1 && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-300">
                        <div className="bg-gradient-to-b from-violet-50/50 to-white p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-violet-600" /> Step 1: Configure Questions
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Set up your course, subject, and topics to generate commonly asked essay questions</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Course & Subject */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                    <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium transition-all">
                                        {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium transition-all">
                                        {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) || <option>No Subjects</option>}
                                    </select>
                                </div>
                            </div>

                            {/* Topic Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topics</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-violet-500 transition-all">
                                    {topicsList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {topicsList.map((topic, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-800 text-sm font-semibold px-3 py-1.5 rounded-lg border border-violet-200 hover:bg-violet-200 transition-all">
                                                    {topic}
                                                    <button onClick={() => handleRemoveTopic(topic)} className="text-violet-500 hover:text-red-500 transition-colors">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input ref={topicInputRef} type="text" value={topicInput}
                                            onChange={e => setTopicInput(e.target.value)} onKeyDown={handleTopicKeyDown}
                                            placeholder={topicsList.length > 0 ? "Add another topic..." : "Type a topic and press Enter, e.g., 'Rheumatic Heart Disease'"}
                                            className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400" />
                                        <button onClick={handleAddTopic} disabled={!topicInput.trim()}
                                            className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Press Enter or click + to add topics. Questions will be generated based on these topics.</p>
                            </div>

                            {/* Number of Questions */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Total Questions to Create
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                        <button onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                                            className="px-3 py-2.5 text-slate-500 hover:bg-slate-100 transition-all font-bold text-lg">−</button>
                                        <input type="number" min={1} max={30} value={questionCount}
                                            onChange={e => setQuestionCount(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                                            className="w-16 text-center bg-transparent outline-none text-sm font-bold text-slate-800 py-2.5" />
                                        <button onClick={() => setQuestionCount(Math.min(30, questionCount + 1))}
                                            className="px-3 py-2.5 text-slate-500 hover:bg-slate-100 transition-all font-bold text-lg">+</button>
                                    </div>
                                    <span className="text-sm text-slate-500">commonly asked questions</span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button onClick={handleGenerateQuestions}
                                    disabled={loadingQuestions || (topicsList.length === 0 && !topicInput.trim())}
                                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                    {loadingQuestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {loadingQuestions ? 'Generating Questions...' : 'Create Questions'}
                                    {!loadingQuestions && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== STEP 2: Select Questions ====== */}
                {currentStep === 2 && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-300">
                        <div className="bg-gradient-to-b from-violet-50/50 to-white p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <ListChecks className="w-5 h-5 text-violet-600" /> Step 2: Select Questions for Answers
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">{generatedQuestions.length} questions generated based on commonly asked patterns. Select the ones you want answers for.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={selectAll} className="text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-200 hover:bg-violet-100 transition-all">Select All</button>
                                    <button onClick={deselectAll} className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all">Deselect All</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
                            {generatedQuestions.map(q => (
                                <div key={q.id}
                                    onClick={() => toggleQuestion(q.id)}
                                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-sm ${
                                        selectedQuestionIds.has(q.id) ? 'border-violet-500 bg-violet-50/70' : 'border-slate-100 hover:border-violet-200 bg-white'
                                    }`}>
                                    <div className="flex-shrink-0 mt-0.5">
                                        {selectedQuestionIds.has(q.id) 
                                            ? <CheckSquare className="w-5 h-5 text-violet-600" />
                                            : <Square className="w-5 h-5 text-slate-300" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold leading-relaxed ${selectedQuestionIds.has(q.id) ? 'text-violet-900' : 'text-slate-700'}`}>
                                            {q.question}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                q.type === 'long' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>{q.type === 'long' ? '10 Marks' : '5 Marks'}</span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                q.frequency === 'Very Common' ? 'bg-red-100 text-red-700'
                                                : q.frequency === 'Common' ? 'bg-orange-100 text-orange-700'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}>{q.frequency}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                            <button onClick={() => setCurrentStep(1)} className="text-sm font-bold text-slate-500 hover:text-violet-600 transition-all flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-violet-600">{selectedQuestionIds.size} question{selectedQuestionIds.size !== 1 ? 's' : ''} selected</span>
                                <button onClick={() => { if (selectedQuestionIds.size > 0) setCurrentStep(3); else alert('Select at least one question.'); }}
                                    disabled={selectedQuestionIds.size === 0}
                                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2">
                                    Configure Answers <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== STEP 3: Answer Settings ====== */}
                {currentStep === 3 && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-300">
                        <div className="bg-gradient-to-b from-violet-50/50 to-white p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-violet-600" /> Step 3: Answer Settings
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Configure how you want the answers to be generated for your {selectedQuestionIds.size} selected question{selectedQuestionIds.size !== 1 ? 's' : ''}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Selected Questions Preview */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Selected Questions ({selectedQuestionIds.size})</label>
                                <div className="bg-violet-50/50 rounded-xl border border-violet-100 p-4 space-y-2 max-h-40 overflow-y-auto">
                                    {generatedQuestions.filter(q => selectedQuestionIds.has(q.id)).map((q, i) => (
                                        <div key={q.id} className="flex items-start gap-2 text-sm">
                                            <span className="font-bold text-violet-500 flex-shrink-0">{i + 1}.</span>
                                            <span className="text-slate-700">{q.question}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Answer Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Answer Type</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {ANSWER_TYPES.map(type => (
                                        <label key={type.id} className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAnswerType === type.id ? 'border-violet-500 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-violet-200'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <input type="radio" name="answerType" value={type.id}
                                                    checked={selectedAnswerType === type.id} onChange={e => setSelectedAnswerType(e.target.value)}
                                                    className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300" />
                                                <span className={`text-sm font-bold ${selectedAnswerType === type.id ? 'text-violet-800' : 'text-slate-700'}`}>{type.label}</span>
                                            </div>
                                            <span className="text-[12px] text-slate-500 pl-6">{type.desc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Answer Depth */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Answer Depth</label>
                                <div className="flex gap-2">
                                    {ANSWER_DEPTH.map(level => (
                                        <button key={level} onClick={() => setAnswerDepth(level)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${answerDepth === level ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-violet-200'}`}>
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Additional Instructions */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Instructions</label>
                                <textarea value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)}
                                    placeholder="e.g., Include diagrams description, add flowcharts, reference latest guidelines..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium min-h-[80px] transition-all" />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button onClick={() => setCurrentStep(2)} className="text-sm font-bold text-slate-500 hover:text-violet-600 transition-all flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Back to Questions
                                </button>
                                <button onClick={handleGenerateAnswers}
                                    disabled={loadingAnswers}
                                    className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]">
                                    {loadingAnswers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {loadingAnswers ? 'Generating Answers...' : `Generate ${selectedQuestionIds.size} Answer${selectedQuestionIds.size !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== STEP 4: Results ====== */}
                {currentStep === 4 && result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="bg-white rounded-3xl border border-violet-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 border-b border-violet-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <PenTool className="w-5 h-5 text-violet-600" /> Generated Answers
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                                            <span className="font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-lg">{topicsList.join(', ')}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{selectedQuestionIds.size} question{selectedQuestionIds.size !== 1 ? 's' : ''}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{answerDepth}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{ANSWER_TYPES.find(t => t.id === selectedAnswerType)?.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-violet-100">
                                    <button onClick={handleSave}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-violet-600 text-white border border-violet-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-violet-50 hover:border-violet-300'}`}>
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                    <button onClick={handleDownloadPDF}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <Download className="w-4 h-4 text-blue-600" /> Download PDF
                                    </button>
                                    <button onClick={handleDownloadWord}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <FileDown className="w-4 h-4 text-indigo-600" /> Download Word
                                    </button>
                                    <button onClick={() => handleCopy(result)}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button onClick={handleShare}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${shared ? 'bg-violet-600 text-white border border-violet-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-violet-50 hover:border-violet-300'}`}>
                                        {shared ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4 text-violet-600" />}
                                        {shared ? 'Copied for sharing!' : 'Share'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 prose prose-slate max-w-none prose-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Bottom actions */}
                        <div className="flex items-center justify-center gap-6 pt-2">
                            <button onClick={() => setCurrentStep(2)}
                                className="text-sm font-bold text-slate-400 hover:text-violet-600 transition-colors flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" /> Select different questions
                            </button>
                            <button onClick={resetToStart}
                                className="text-sm font-bold text-slate-400 hover:text-violet-600 transition-colors flex items-center gap-2">
                                <RefreshCcw className="w-4 h-4" /> Start New
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
