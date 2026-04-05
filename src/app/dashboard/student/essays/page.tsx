"use client";

import { useState, useEffect } from 'react';
import { FileText, Loader2, PenTool, Sparkles, RefreshCcw, Download, Share2, ChevronDown, ChevronUp, Clock, Copy, CheckCircle, Save } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PAPER_TYPES = [
    { id: 'model_paper', label: 'Model Paper', desc: 'AI-generated essay-style assessment questions' },
    { id: 'short_answers', label: 'Short Answers', desc: 'Concise answer-type questionnaire format' },
    { id: 'case_based', label: 'Case-Based', desc: 'Clinical scenario-built structured questions' }
];

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Mixed'];

export default function EssayGeneratorPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [selectedPaperType, setSelectedPaperType] = useState('model_paper');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questionCount, setQuestionCount] = useState('5');
    const [additionalInstructions, setAdditionalInstructions] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [answerKey, setAnswerKey] = useState('');
    const [showAnswerKey, setShowAnswerKey] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);

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

    const handleGenerate = async () => {
        if (!currentUser) return;
        const check = tokenService.checkAvailability(currentUser.id, 'Essay Generator');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setLoading(true);
        setResult('');
        setAnswerKey('');
        setShowAnswerKey(false);

        try {
            const res = await fetch('/api/essays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    paperType: selectedPaperType,
                    difficulty,
                    questionCount: parseInt(questionCount) || 5,
                    instructions: additionalInstructions
                })
            });
            const data = await res.json();

            if (data.success) {
                setResult(data.questions || 'No questions were generated.');
                setAnswerKey(data.answerKey || '');
                tokenService.processTransaction(currentUser.id, 'Essay Generator', 'gemini-2.5-flash');
            }
        } catch (e) {
            console.error(e);
            setResult("Generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = async (content: string, title: string) => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');

            const lines = pdf.splitTextToSize(content, 180);
            let y = 15;
            const pageHeight = 280;

            for (let i = 0; i < lines.length; i++) {
                if (y > pageHeight) {
                    pdf.addPage();
                    y = 15;
                }
                pdf.text(lines[i], 15, y);
                y += 6;
            }

            pdf.save(`${title}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <PenTool className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Essay Question Generator</h2>
                            <p className="text-blue-300/80 text-sm font-medium">AI-generated assessment questions with answer keys</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Configuration Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-indigo-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" /> Paper Configuration
                        </h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 text-sm font-medium transition-all">
                                    {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 text-sm font-medium transition-all">
                                    {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) || <option>No Subjects</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topic</label>
                                <select value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 text-sm font-medium transition-all">
                                    {allTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>) || <option>No Topics</option>}
                                </select>
                            </div>
                        </div>

                        {/* Paper Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Paper Type</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {PAPER_TYPES.map(type => (
                                    <label key={type.id} className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPaperType === type.id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input type="radio" name="paperType" value={type.id}
                                                checked={selectedPaperType === type.id} onChange={e => setSelectedPaperType(e.target.value)}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                            />
                                            <span className={`text-sm font-bold ${selectedPaperType === type.id ? 'text-indigo-800' : 'text-slate-700'}`}>{type.label}</span>
                                        </div>
                                        <span className="text-[12px] text-slate-500 pl-6">{type.desc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty & Count */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Difficulty Level</label>
                                <div className="flex gap-2">
                                    {DIFFICULTY_LEVELS.map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${difficulty === level
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-indigo-200'
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
                                    min={1} max={20}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 text-sm font-medium transition-all"
                                />
                            </div>
                        </div>

                        {/* Additional */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Instructions</label>
                            <textarea
                                value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)}
                                placeholder="e.g., Include questions on recent guidelines, focus on clinical scenarios..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 text-sm font-medium min-h-[80px] transition-all"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !activeTopic}
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Generating Paper...' : 'Generate Paper'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        {/* Questions */}
                        <div className="bg-white rounded-3xl border border-indigo-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <PenTool className="w-5 h-5 text-indigo-600" /> Generated Questions
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                                        <span className="font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-lg">{activeTopic?.name}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="font-bold text-slate-500">{difficulty}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="font-bold text-slate-500">{PAPER_TYPES.find(p => p.id === selectedPaperType)?.label}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            try {
                                                const savedEssays = JSON.parse(localStorage.getItem('mededuai_saved_essays') || '[]');
                                                savedEssays.push({
                                                    id: Date.now(),
                                                    course: activeCourse?.name,
                                                    subject: activeSubject?.name,
                                                    topic: activeTopic?.name,
                                                    paperType: selectedPaperType,
                                                    difficulty,
                                                    questions: result,
                                                    answerKey,
                                                    createdAt: new Date().toISOString()
                                                });
                                                localStorage.setItem('mededuai_saved_essays', JSON.stringify(savedEssays));
                                                setSaved(true);
                                                setTimeout(() => setSaved(false), 3000);
                                            } catch (err) { console.error(err); }
                                        }}
                                        className={`font-bold h-9 px-4 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}
                                    >
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => handleCopy(result)}
                                        className="bg-white text-slate-600 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={() => handleExportPDF(result, `Essay_${activeTopic?.name?.replace(/\s+/g, '_')}`)}
                                        className="bg-indigo-100 text-indigo-700 font-bold h-9 px-4 rounded-xl hover:bg-indigo-200 transition-all flex items-center gap-2 text-sm"
                                    >
                                        <Download className="w-4 h-4" /> PDF
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 prose prose-slate max-w-none prose-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Answer Key */}
                        {answerKey && (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                                <button
                                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                                    className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <span className="flex items-center gap-2 font-bold text-slate-800">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" /> Answer Key
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {showAnswerKey ? 'Hide' : 'Reveal'}
                                        </span>
                                        {showAnswerKey ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                    </div>
                                </button>
                                {showAnswerKey && (
                                    <div className="p-6 border-t border-slate-100 prose prose-slate max-w-none prose-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{answerKey}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Regenerate */}
                        <div className="text-center pt-2">
                            <button
                                onClick={handleGenerate}
                                className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RefreshCcw className="w-4 h-4" /> Regenerate with same parameters
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
