"use client";

import { useState, useEffect } from 'react';
import { ListChecks, Loader2, Sparkles, CheckCircle, XCircle, RefreshCcw, Trophy, BarChart3, ChevronRight, Target, Save, Copy, Download, History, Search } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';

interface MCQ {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

type Phase = 'setup' | 'quiz' | 'results';

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Mixed'];

export default function McqGeneratorPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionCount, setQuestionCount] = useState('10');

    const [phase, setPhase] = useState<Phase>('setup');
    const [loading, setLoading] = useState(false);
    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [answered, setAnswered] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

    const [savedMcqs, setSavedMcqs] = useState<any[]>([]);
    const [savedSearchQuery, setSavedSearchQuery] = useState('');
    const [isFetchingSaved, setIsFetchingSaved] = useState(true);

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

    const fetchSavedMcqs = async () => {
        setIsFetchingSaved(true);
        try {
            const res = await fetch('/api/mcqs/saved/all');
            const data = await res.json();
            if (data.success && data.savedRecords) {
                setSavedMcqs(data.savedRecords);
            }
        } catch (e) {
            console.error('Error fetching saved MCQs:', e);
        } finally {
            setIsFetchingSaved(false);
        }
    };

    useEffect(() => {
        fetchSavedMcqs();
    }, []);

    const handleGenerate = async () => {
        if (!currentUser) return;
        const check = tokenService.checkAvailability(currentUser.id, 'MCQ Generator');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setLoading(true);
        setMcqs([]);
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setShowExplanation(false);

        try {
            const res = await fetch('/api/mcqs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    difficulty,
                    count: parseInt(questionCount) || 10
                })
            });
            const data = await res.json();

            if (data.success && data.mcqs) {
                setMcqs(data.mcqs);
                setAnswers(new Array(data.mcqs.length).fill(null));
                setPhase('quiz');
                if (data.geminiTokens) {
                    tokenService.processTransaction(currentUser.id, 'MCQ Generator', 'gemini-2.0-flash', data.geminiTokens * 2);
                } else {
                    tokenService.processTransaction(currentUser.id, 'MCQ Generator', 'gemini-2.0-flash');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = (optionIdx: number) => {
        if (answered) return;
        setSelectedAnswer(optionIdx);
    };

    const handleConfirmAnswer = () => {
        if (selectedAnswer === null) return;
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setAnswers(newAnswers);
        setAnswered(true);
        setShowExplanation(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < mcqs.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setAnswered(false);
            setShowExplanation(false);
        } else {
            setPhase('results');
        }
    };

    const calculateScore = () => {
        let correct = 0;
        answers.forEach((ans, idx) => {
            if (ans === mcqs[idx]?.correctAnswer) correct++;
        });
        return correct;
    };

    const handleRestart = () => {
        setPhase('setup');
        setMcqs([]);
        setAnswers([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setShowExplanation(false);
    };

    const handleSave = async () => {
        if (mcqs.length === 0) return;
        try {
            const res = await fetch('/api/mcqs/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    difficulty,
                    score,
                    totalQuestions: totalQ,
                    percentage: pct,
                    mcqsData: mcqs.map((m, i) => ({ question: m.question, options: m.options, correctAnswer: m.correctAnswer, userAnswer: answers[i], explanation: m.explanation }))
                })
            });
            const data = await res.json();
            if (data.success && data.savedRecord) {
                setSavedMcqs(prev => [data.savedRecord, ...prev]);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Failed to save: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error saving MCQ results:', err);
            alert('An error occurred while saving.');
        }
    };

    const currentMcq = mcqs[currentQuestionIndex];
    const score = calculateScore();
    const totalQ = mcqs.length;
    const pct = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-fuchsia-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                                <ListChecks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">MCQ Generator</h2>
                                <p className="text-rose-300/80 text-sm font-medium">AI-generated interactive practice questions</p>
                            </div>
                        </div>
                        {phase === 'quiz' && (
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl text-white/80 text-sm font-bold">
                                    {currentQuestionIndex + 1} / {totalQ}
                                </div>
                                {/* Progress bar */}
                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                                    <div className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transition-all duration-500"
                                        style={{ width: `${((currentQuestionIndex + 1) / totalQ) * 100}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* ————— SETUP PHASE ————— */}
                {phase === 'setup' && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-b from-rose-50/50 to-white p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Target className="w-5 h-5 text-rose-600" /> Quiz Configuration
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                    <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-300 text-sm font-medium transition-all">
                                        {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-300 text-sm font-medium transition-all">
                                        {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) || <option>No Subjects</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topic</label>
                                    <select value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-300 text-sm font-medium transition-all">
                                        {allTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>) || <option>No Topics</option>}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty Level</label>
                                    <div className="flex gap-2">
                                        {DIFFICULTY_LEVELS.map(level => (
                                            <button
                                                key={level} onClick={() => setDifficulty(level)}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${difficulty === level
                                                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-rose-200'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">No. of Questions</label>
                                    <input type="number" value={questionCount} onChange={e => setQuestionCount(e.target.value)}
                                        min={1} max={30}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-300 text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !activeTopic}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {loading ? 'Generating MCQs...' : 'Start Quiz'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ————— QUIZ PHASE ————— */}
                {phase === 'quiz' && currentMcq && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                            {/* Question */}
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
                                        Question {currentQuestionIndex + 1}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold">{difficulty}</span>
                                </div>
                                <p className="text-lg font-semibold text-slate-900 leading-relaxed">{currentMcq.question}</p>
                            </div>

                            {/* Options */}
                            <div className="p-6 space-y-3">
                                {currentMcq.options.map((opt, optIdx) => {
                                    const isSelected = selectedAnswer === optIdx;
                                    const isCorrect = answered && optIdx === currentMcq.correctAnswer;
                                    const isWrong = answered && isSelected && optIdx !== currentMcq.correctAnswer;

                                    return (
                                        <button
                                            key={optIdx}
                                            onClick={() => handleSelectAnswer(optIdx)}
                                            disabled={answered}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                                                isCorrect
                                                    ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
                                                    : isWrong
                                                        ? 'border-red-400 bg-red-50 shadow-md shadow-red-100'
                                                        : isSelected
                                                            ? 'border-rose-400 bg-rose-50 shadow-sm'
                                                            : 'border-slate-200 hover:border-rose-200 hover:bg-slate-50'
                                            } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                                isCorrect
                                                    ? 'bg-emerald-500 text-white'
                                                    : isWrong
                                                        ? 'bg-red-500 text-white'
                                                        : isSelected
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-700'
                                            }`}>
                                                {isCorrect ? <CheckCircle className="w-5 h-5" /> : isWrong ? <XCircle className="w-5 h-5" /> : String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <span className={`font-medium ${isCorrect ? 'text-emerald-800' : isWrong ? 'text-red-800' : 'text-slate-700'}`}>
                                                {opt}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation */}
                            {showExplanation && currentMcq.explanation && (
                                <div className="mx-6 mb-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">💡 Explanation</h4>
                                    <p className="text-slate-700 text-sm leading-relaxed">{currentMcq.explanation}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="p-6 border-t border-slate-100 flex justify-between">
                                {!answered ? (
                                    <button
                                        onClick={handleConfirmAnswer}
                                        disabled={selectedAnswer === null}
                                        className="ml-auto bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-40 flex items-center gap-2"
                                    >
                                        Confirm Answer
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNextQuestion}
                                        className="ml-auto bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                                    >
                                        {currentQuestionIndex < totalQ - 1 ? 'Next Question' : 'View Results'}
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ————— RESULTS PHASE ————— */}
                {phase === 'results' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Score Card */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                            <div className="p-8 text-center">
                                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${pct >= 80 ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20' : pct >= 50 ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-rose-500/20'}`}>
                                    <Trophy className="w-12 h-12 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-2">{pct}%</h3>
                                <p className="text-slate-500 text-lg font-medium mb-1">{score} out of {totalQ} correct</p>
                                <p className={`text-sm font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {pct >= 80 ? '🎉 Excellent Performance!' : pct >= 50 ? '💪 Good Effort — Review Mistakes' : '📚 Needs More Practice'}
                                </p>
                            </div>
                        </div>

                        {/* Review Questions */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                                <BarChart3 className="w-5 h-5 text-rose-600" /> Question Review
                            </h3>
                            {mcqs.map((mcq, idx) => {
                                const userAns = answers[idx];
                                const isCorrect = userAns === mcq.correctAnswer;

                                return (
                                    <div key={idx} className={`bg-white rounded-2xl border shadow-sm p-5 ${isCorrect ? 'border-emerald-200' : 'border-red-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {isCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900 text-sm mb-2">{idx + 1}. {mcq.question}</p>
                                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                                                    <span className="text-slate-500">Your answer: <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>{userAns !== null ? mcq.options[userAns] : 'Skipped'}</span></span>
                                                    {!isCorrect && (
                                                        <span className="text-slate-500">Correct: <span className="font-bold text-emerald-600">{mcq.options[mcq.correctAnswer]}</span></span>
                                                    )}
                                                </div>
                                                {mcq.explanation && !isCorrect && (
                                                    <p className="mt-3 text-xs text-indigo-700 bg-indigo-50 rounded-lg p-3 border border-indigo-100">{mcq.explanation}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 justify-center pt-4">
                            <button
                                onClick={handleSave}
                                className={`font-bold h-12 px-6 rounded-xl transition-all flex items-center gap-2 shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}
                            >
                                {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                                {saved ? 'Saved!' : 'Save Results'}
                            </button>
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden ml-2" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>

                            <button
                                onClick={() => {
                                    const text = mcqs.map((m, i) => `Q${i+1}: ${m.question}\nYour Answer: ${answers[i] !== null ? m.options[answers[i]!] : 'Skipped'}\nCorrect: ${m.options[m.correctAnswer]}\nExplanation: ${m.explanation}`).join('\n\n');
                                    navigator.clipboard.writeText(`MCQ Results: ${score}/${totalQ} (${pct}%)\n\n${text}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="bg-white text-slate-700 font-bold h-12 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                            >
                                {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                {copied ? 'Copied!' : 'Copy Results'}
                            </button>
                            <button
                                onClick={handleRestart}
                                className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <RefreshCcw className="w-5 h-5" /> New Quiz
                            </button>
                        </div>
                    </div>
                )}

                {/* Saved MCQs Section */}
                {phase === 'setup' && (
                    <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                    <History className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Saved Quiz Results</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your past performance history</p>
                                </div>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search saved quizzes..."
                                    value={savedSearchQuery}
                                    onChange={(e) => setSavedSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-300 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {isFetchingSaved ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                            </div>
                        ) : savedMcqs.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                    <History className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-slate-500 font-bold text-lg mb-1">Yet to save anything</h4>
                                <p className="text-slate-400 text-sm">Your saved quizzes will appear here.</p>
                            </div>
                        ) : (() => {
                            const filtered = savedMcqs.filter(q => {
                                if (!savedSearchQuery) return true;
                                const search = savedSearchQuery.toLowerCase();
                                return (q.course || '').toLowerCase().includes(search) || (q.subject || '').toLowerCase().includes(search) || (q.topic || '').toLowerCase().includes(search);
                            });
                            
                            if (filtered.length === 0) {
                                return (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-slate-500 font-medium text-sm">No saved quizzes found matching your search.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-4">
                                    {filtered.map(quiz => (
                                        <div key={quiz.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-5 w-full sm:w-auto">
                                                <div className={`w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm ${quiz.percentage >= 80 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : quiz.percentage >= 50 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                    {quiz.percentage}%
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-lg sm:text-xl line-clamp-1">{quiz.topic || 'General Quiz'}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                                                            {quiz.difficulty}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                                            {quiz.score}/{quiz.total_questions} Correct
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-medium ml-1">
                                                            {new Date(quiz.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full sm:w-auto">
                                                <button
                                                    onClick={() => {
                                                        const text = quiz.mcqs_data?.map((m: any, i: number) => `Q${i+1}: ${m.question}\nYour Answer: ${m.userAnswer !== null ? m.options[m.userAnswer] : 'Skipped'}\nCorrect: ${m.options[m.correctAnswer]}\nExplanation: ${m.explanation}`).join('\n\n') || '';
                                                        navigator.clipboard.writeText(`MCQ Results: ${quiz.score}/${quiz.total_questions} (${quiz.percentage}%)\n\n${text}`);
                                                        alert('Copied results to clipboard!');
                                                    }}
                                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm shadow-sm"
                                                >
                                                    <Copy className="w-4 h-4" /> Copy Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}
