"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Ear, PlayCircle, Loader2, CheckCircle, RefreshCcw, Sparkles, Radio, Stethoscope, Save, Copy, Download } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const instructionTypes = [
    "Case scenario based",
    "Test basic knowledge",
    "Test deeper knowledge",
    "Test Memory power",
    "Tests Critical thinking ability",
    "Tests Communication to patient",
    "Any other"
];

export default function VivaSimulatorPage() {
    const currentUser = useUserStore(state => state.users[0]);
    const { coursesList } = useCurriculumStore();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');

    const [instructionType, setInstructionType] = useState(instructionTypes[0]);
    const [customInstruction, setCustomInstruction] = useState('');

    const [started, setStarted] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    const [history, setHistory] = useState<{ role: 'user' | 'examiner', content: string }[]>([]);

    const [recording, setRecording] = useState(false);
    const [loadingResponse, setLoadingResponse] = useState(false);
    const [transcriptText, setTranscriptText] = useState('');
    const recognitionRef = useRef<any>(null);

    const activeCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];
    const activeSubject = activeCourse?.subjects.find(s => s.id === selectedSubjectId) || activeCourse?.subjects[0];
    const allTopics = activeSubject?.sections.flatMap(s => s.topics) || [];
    const activeTopic = allTopics.find(t => t.id === selectedTopicId) || allTopics[0];

    useEffect(() => {
        if (!selectedCourseId && coursesList.length > 0) setSelectedCourseId(coursesList[0].id);
    }, [coursesList, selectedCourseId]);

    useEffect(() => {
        if (activeCourse && !selectedSubjectId && activeCourse.subjects.length > 0) {
            setSelectedSubjectId(activeCourse.subjects[0].id);
        }
    }, [activeCourse, selectedSubjectId]);

    useEffect(() => {
        if (activeSubject && !selectedTopicId && activeSubject.sections.length > 0 && activeSubject.sections[0].topics.length > 0) {
            setSelectedTopicId(activeSubject.sections[0].topics[0].id);
        }
    }, [activeSubject, selectedTopicId]);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscriptText(currentTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setRecording(false);
            };
        }
    }, []);

    const fetchNextQuestion = async (updatedHistory: any[]) => {
        setLoadingResponse(true);
        try {
            const payload = {
                course: activeCourse?.name,
                subject: activeSubject?.name,
                topic: activeTopic?.name,
                instruction: instructionType === 'Any other' ? customInstruction : instructionType,
                history: updatedHistory,
                action: 'next'
            };

            const res = await fetch('/api/viva', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            const aiText = data.response;
            setHistory(prev => [...prev, { role: 'examiner', content: aiText }]);
            playAudio(aiText);

            if (currentUser) {
                tokenService.processTransaction(currentUser.id, 'Viva Simulator', 'gemini-1.5-flash');
            }
        } catch (e) {
            console.error(e);
            const fallbackText = "I am having trouble connecting. Let's try again in a moment.";
            setHistory(prev => [...prev, { role: 'examiner', content: fallbackText }]);
            playAudio(fallbackText);
        } finally {
            setLoadingResponse(false);
        }
    };

    const handleStart = () => {
        if (!currentUser) return;
        const check = tokenService.checkAvailability(currentUser.id, 'Viva Simulator');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setStarted(true);
        setHistory([]);
        fetchNextQuestion([]);
    };

    const handleToggleRecording = () => {
        if (recording) {
            recognitionRef.current?.stop();
            setRecording(false);
            if (transcriptText.trim()) {
                if (!currentUser) return;
                const check = tokenService.checkAvailability(currentUser.id, 'Viva Simulator');
                if (!check.allowed) {
                    const fallbackText = "You have exhausted your AI tokens. Please recharge your wallet to continue.";
                    setHistory(prev => [...prev, { role: 'examiner', content: fallbackText }]);
                    playAudio(fallbackText);
                    return;
                }

                const newHistory: any = [...history, { role: 'user', content: transcriptText.trim() }];
                setHistory(newHistory);
                setTranscriptText('');
                fetchNextQuestion(newHistory);
            }
        } else {
            setTranscriptText('');
            recognitionRef.current?.start();
            setRecording(true);
        }
    };

    const handleEndAndAnalyze = async () => {
        setAnalyzing(true);
        setRecording(false);
        recognitionRef.current?.stop();
        window.speechSynthesis.cancel();

        try {
            const payload = {
                course: activeCourse?.name,
                subject: activeSubject?.name,
                topic: activeTopic?.name,
                instruction: instructionType === 'Any other' ? customInstruction : instructionType,
                history,
                action: 'analyze'
            };

            const res = await fetch('/api/viva', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setAnalysisResult(data.response);

            if (currentUser) {
                tokenService.processTransaction(currentUser.id, 'Viva Simulator', 'gemini-1.5-flash');
            }
        } catch (e) {
            setAnalysisResult("Failed to generate analysis.");
        } finally {
            setAnalyzing(false);
        }
    };

    const playAudio = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    const currentExaminerQuestion = history.length > 0 && history[history.length - 1].role === 'examiner'
        ? history[history.length - 1].content
        : "Thinking...";

    const questionCount = history.filter(h => h.role === 'examiner').length;
    const answerCount = history.filter(h => h.role === 'user').length;

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-indigo-900 via-violet-900 to-purple-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <Stethoscope className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Viva Simulator</h2>
                                <p className="text-violet-300/80 text-sm font-medium">Voice-based interactive oral examination</p>
                            </div>
                        </div>
                        {started && !analysisResult && !analyzing && (
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl text-white/80 text-sm font-bold">
                                    Q: {questionCount} | A: {answerCount}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!started ? (
                /* ————— Setup Screen ————— */
                <div className="flex-1 overflow-y-auto pb-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-b from-violet-50 to-white p-8 border-b border-slate-100">
                            <p className="text-slate-600 text-center max-w-lg mx-auto leading-relaxed">Choose your parameters to practice structured mock-oral questions. Our AI handles realistic dynamic evaluation on the fly.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                    <select
                                        value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 text-sm font-medium transition-all"
                                    >
                                        {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <select
                                        value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 text-sm font-medium transition-all"
                                    >
                                        {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) || <option>No Subjects</option>}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topic</label>
                                <select
                                    value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 text-sm font-medium transition-all"
                                >
                                    {allTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>) || <option>No Topics</option>}
                                </select>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Instructions / Focus Area</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {instructionTypes.map((type, idx) => (
                                        <label key={idx} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${instructionType === type ? 'border-violet-500 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'}`}>
                                            <input
                                                type="radio" name="instructionType" value={type}
                                                checked={instructionType === type} onChange={e => setInstructionType(e.target.value)}
                                                className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-300"
                                            />
                                            <span className={`text-sm font-medium ${instructionType === type ? 'text-violet-800' : 'text-slate-700'}`}>{type}</span>
                                        </label>
                                    ))}
                                </div>
                                {instructionType === 'Any other' && (
                                    <input
                                        value={customInstruction} onChange={e => setCustomInstruction(e.target.value)}
                                        placeholder="Type your specific test instructions here..."
                                        className="w-full mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                                    />
                                )}
                            </div>

                            <button
                                onClick={handleStart}
                                disabled={!activeTopic}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <PlayCircle className="w-5 h-5" /> Start Simulation
                            </button>
                        </div>
                    </div>
                </div>
            ) : analysisResult ? (
                /* ————— Analysis Result ————— */
                <div className="flex-1 overflow-y-auto pb-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Performance Analysis</h3>
                                    <p className="text-sm text-emerald-600 font-medium">AI-generated assessment of your responses</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 prose prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult}</ReactMarkdown>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        try {
                                            const savedVivas = JSON.parse(localStorage.getItem('mededuai_saved_viva_results') || '[]');
                                            savedVivas.push({
                                                id: Date.now(),
                                                course: activeCourse?.name,
                                                subject: activeSubject?.name,
                                                topic: activeTopic?.name,
                                                instructionType,
                                                transcript: history,
                                                analysis: analysisResult,
                                                createdAt: new Date().toISOString()
                                            });
                                            localStorage.setItem('mededuai_saved_viva_results', JSON.stringify(savedVivas));
                                            setSaved(true);
                                            setTimeout(() => setSaved(false), 3000);
                                        } catch (err) { console.error(err); }
                                    }}
                                    className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}
                                >
                                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saved ? 'Saved!' : 'Save Analysis'}
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(analysisResult);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                                >
                                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <button
                                onClick={() => { setStarted(false); setAnalysisResult(''); setHistory([]); }}
                                className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <RefreshCcw className="w-5 h-5" /> Start New Simulation
                            </button>
                        </div>
                    </div>
                </div>
            ) : analyzing ? (
                /* ————— Analyzing ————— */
                <div className="flex-1 flex items-center justify-center pb-8">
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-lg text-center max-w-md">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing your performance...</h3>
                        <p className="text-slate-500">The AI is reviewing your transcript to provide structured feedback.</p>
                    </div>
                </div>
            ) : (
                /* ————— Active Simulation ————— */
                <div className="flex-1 flex flex-col pb-8">
                    <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 p-8">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-50 rounded-full blur-3xl opacity-50" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />

                        {loadingResponse ? (
                            <div className="relative flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                                <span className="text-slate-500 font-bold">Examiner is preparing next question...</span>
                            </div>
                        ) : (
                            <div className="relative max-w-2xl">
                                <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
                                    <Radio className="w-3 h-3" /> Examiner — Question {questionCount}
                                </div>
                                <p className="text-2xl font-medium text-slate-800 leading-relaxed mb-8">
                                    &ldquo;{currentExaminerQuestion}&rdquo;
                                </p>
                                <button
                                    onClick={() => playAudio(currentExaminerQuestion)}
                                    className="p-3 bg-slate-100 hover:bg-violet-100 rounded-full text-slate-500 hover:text-violet-600 transition-all hover:scale-110"
                                    title="Replay Audio"
                                >
                                    <Volume2 className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        {(recording || transcriptText) && (
                            <div className="absolute bottom-6 inset-x-6 bg-gradient-to-t from-white via-white to-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 shadow-lg">
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Ear className="w-3 h-3" /> Your Answer</p>
                                <p className="text-slate-800 min-h-6 font-medium">
                                    {transcriptText || "..."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Mic Control Bar */}
                    <div className="mt-6 flex flex-col items-center gap-4 flex-shrink-0">
                        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-full p-2 pl-6 pr-3 shadow-2xl flex items-center justify-between w-full max-w-md gap-4 border border-slate-700">
                            <div className="flex items-center gap-3">
                                <Ear className={`w-5 h-5 ${recording ? 'text-violet-400 animate-pulse' : 'text-slate-400'}`} />
                                <span className={`text-sm font-bold ${recording ? 'text-white' : 'text-slate-400'}`}>
                                    {recording ? 'Listening... tap to stop & send' : 'Tap Mic to Respond'}
                                </span>
                            </div>
                            <button
                                onClick={handleToggleRecording}
                                disabled={loadingResponse}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${recording 
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 scale-110' 
                                    : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:shadow-violet-500/30 hover:scale-105'
                                } disabled:opacity-50`}
                            >
                                {recording ? <Square className="w-5 h-5 text-white fill-current" /> : <Mic className="w-5 h-5 text-white" />}
                            </button>
                        </div>

                        <button
                            onClick={handleEndAndAnalyze}
                            disabled={loadingResponse || recording || history.length < 1}
                            className="text-sm font-bold text-slate-400 hover:text-violet-600 transition-colors underline underline-offset-4 disabled:opacity-40"
                        >
                            End simulation & analyze performance
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
