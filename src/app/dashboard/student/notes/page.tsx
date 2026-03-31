"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCurriculumStore } from '../../../../store/curriculumStore';
import {
    BrainCircuit, BookOpen, Search, Bell, Download, ChevronRight, ChevronLeft, ChevronDown, CheckCircle2,
    Sparkles, ArrowLeft, Layers, MessageSquare, Plus, AlignLeft, CheckSquare, Presentation,
    Image as ImageIcon, RefreshCw, Trophy, Target, Clock, Zap, Menu, X, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper to parse MCQs
const parseMCQs = (text: string) => {
    // Advanced parsing that handles both multiline A) B) C) D) and inline a) b) c) d)
    if (!text) return [];

    const chunks = text.split(/(?=\d+\.\s)/).filter(Boolean);
    if (chunks.length <= 1) return [{ raw: text }];

    return chunks.map((chunk, idx) => {
        let lines = chunk.split('\n').filter(l => l.trim().length > 0);
        let question = lines[0];

        // Isolate answer line
        const answerLineIndex = lines.findIndex(l => l.toLowerCase().includes('answer:'));
        const answerRaw = answerLineIndex !== -1 ? lines[answerLineIndex] : null;
        const answer = answerRaw ? answerRaw.replace(/answer:/i, '').trim() : null;

        // Extract options
        let options: string[] = [];

        // Remove answer from consideration for options
        if (answerLineIndex !== -1) {
            lines = lines.slice(0, answerLineIndex);
        }

        const potentialOptionsStr = lines.slice(1).join(' ');

        // Regex to match "a) text b) text" or "(a) text (b) text" or "A. text B. text"
        const optionMatches = potentialOptionsStr.match(/(?:[a-dA-D][\.\)]|\([a-dA-D]\))\s*.*?(?=(?:[a-dA-D][\.\)]|\([a-dA-D]\))|$)/g);

        if (optionMatches && optionMatches.length > 0) {
            options = optionMatches.map(o => o.trim());
        }

        // Determine correct option letter/index from answer
        let correctOptionIndex = -1;
        if (answer && options.length > 0) {
            const answerMatch = answer.match(/^[a-dA-D]/i) || answer.match(/\([a-dA-D]\)/i);
            if (answerMatch) {
                const char = answerMatch[0].replace(/[^\w]/g, '').toLowerCase();
                if (char === 'a') correctOptionIndex = 0;
                else if (char === 'b') correctOptionIndex = 1;
                else if (char === 'c') correctOptionIndex = 2;
                else if (char === 'd') correctOptionIndex = 3;
            } else {
                // Fuzzy match text
                correctOptionIndex = options.findIndex(opt => opt.toLowerCase().includes(answer.toLowerCase()));
            }
        }

        return {
            id: idx,
            question,
            options: options.length > 0 ? options : null,
            answer,
            correctOptionIndex,
            raw: chunk
        };
    });
};

// Helper to parse Flashcards
const parseFlashcards = (text: string) => {
    if (!text) return [];

    // Look for Front: and Back: patterns
    const cards = [];
    const chunks = text.split(/Front:/i).filter(Boolean);

    for (const chunk of chunks) {
        if (chunk.toLowerCase().includes('back:')) {
            const [front, back] = chunk.split(/Back:/i);
            cards.push({ front: front.trim(), back: back.trim() });
        }
    }

    // Fallback if parsing fails but we have text
    if (cards.length === 0 && text.length > 10) {
        cards.push({ front: "Summary Concept", back: text.trim() });
    }

    return cards;
};

// --- Mock Components for parsed experiences ---

const FlashcardViewer = ({ rawText }: { rawText: string }) => {
    const cards = parseFlashcards(rawText);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!cards || cards.length === 0) {
        return <div className="p-6 bg-slate-50 rounded-2xl text-slate-600 whitespace-pre-wrap">{rawText}</div>;
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
            <div
                className="relative w-full h-80 perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} relative`}>

                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-8 border border-teal-100 flex flex-col justify-center items-center shadow-sm">
                        <span className="absolute top-6 left-6 text-teal-600/30 text-4xl font-black">Q.</span>
                        <h3 className="text-2xl font-bold text-teal-900 text-center leading-relaxed">{currentCard.front}</h3>
                        <p className="absolute bottom-6 text-sm text-teal-600/60 font-medium">Click to reveal answer</p>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 border border-purple-100 flex flex-col justify-center items-center shadow-lg rotate-y-180">
                        <span className="absolute top-6 left-6 text-purple-600/30 text-4xl font-black">A.</span>
                        <h3 className="text-xl font-medium text-purple-900 text-center leading-relaxed">{currentCard.back}</h3>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 mt-8">
                <button
                    onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
                    disabled={currentIndex === 0}
                    className="p-3 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm font-bold text-slate-400">
                    {currentIndex + 1} / {cards.length}
                </span>
                <button
                    onClick={() => { setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1)); setIsFlipped(false); }}
                    disabled={currentIndex === cards.length - 1}
                    className="p-3 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const MCQViewer = ({ rawText, colorClass = "indigo" }: { rawText: string, colorClass?: string }) => {
    const questions = parseMCQs(rawText) as any[];
    // Track selected option per question: { questionIndex: selectedOptionIndex }
    const [selectedOpts, setSelectedOpts] = useState<Record<number, number>>({});
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});

    if (questions.length === 1 && !questions[0].options) {
        return (
            <div className="prose max-w-none text-slate-700 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawText}</ReactMarkdown>
            </div>
        );
    }

    const colorMap: Record<string, any> = {
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-900', btn: 'bg-indigo-600 hover:bg-indigo-700', activeBtn: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
        coral: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-900', btn: 'bg-rose-600 hover:bg-rose-700', activeBtn: 'bg-rose-100 border-rose-300 text-rose-900' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-900', btn: 'bg-amber-600 hover:bg-amber-700', activeBtn: 'bg-amber-100 border-amber-300 text-amber-900' }
    };

    const c = colorMap[colorClass] || colorMap.indigo;

    const handleOptionSelect = (qIdx: number, optIdx: number) => {
        if (revealed[qIdx]) return; // locked
        setSelectedOpts(prev => ({ ...prev, [qIdx]: optIdx }));
    };

    const handleReveal = (qIdx: number) => {
        setRevealed(prev => ({ ...prev, [qIdx]: true }));
    };

    return (
        <div className="space-y-6">
            {questions.map((q, i) => {
                const isRevealed = revealed[i];
                const selectedIdx = selectedOpts[i];
                const isSelected = selectedIdx !== undefined;

                // Determine if parsing was successful enough to auto-grade
                const canAutoGrade = q.correctOptionIndex !== -1 && q.correctOptionIndex !== undefined;
                const isCorrect = canAutoGrade && selectedIdx === q.correctOptionIndex;

                return (
                    <div key={i} className={`p-6 rounded-2xl ${c.bg} ${c.border} border shadow-sm transition-all hover:shadow-md`}>
                        <h4 className={`font-bold text-lg ${c.text} mb-4 flex items-start gap-3`}>
                            <span className="shrink-0 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-sm">{i + 1}</span>
                            <div className="prose prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question}</ReactMarkdown></div>
                        </h4>

                        {q.options && (
                            <div className="space-y-2 mt-4 ml-11">
                                {q.options.map((opt: string, j: number) => {
                                    const isThisSelected = selectedIdx === j;

                                    let btnStyle = `bg-white/60 border-white/40 text-slate-700 hover:bg-white`; // Default idle

                                    if (isThisSelected && !isRevealed) {
                                        btnStyle = c.activeBtn; // Selected but not validated
                                    } else if (isRevealed) {
                                        if (canAutoGrade && j === q.correctOptionIndex) {
                                            btnStyle = `bg-emerald-100 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500`; // Correct Answer highlights green ALWAYS
                                        } else if (isThisSelected && j !== q.correctOptionIndex) {
                                            btnStyle = `bg-rose-100 border-rose-300 text-rose-900`; // Selected WRONG answer highlights red
                                        } else {
                                            btnStyle = `bg-white/40 border-transparent text-slate-400 opacity-60`; // Other non-selected
                                        }
                                    }

                                    return (
                                        <button
                                            key={j}
                                            onClick={() => handleOptionSelect(i, j)}
                                            disabled={isRevealed}
                                            className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${btnStyle} ${!isRevealed ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="ml-11 mt-6">
                            {isRevealed ? (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl shadow-sm border ${canAutoGrade ? (isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-white border-slate-200'}`}>
                                    {canAutoGrade && (
                                        <div className="flex items-center gap-2 mb-3">
                                            {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-rose-600" />}
                                            <p className={`text-sm font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {isCorrect ? 'Correct!' : 'Incorrect'}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-sm font-bold text-slate-600 mb-1">Explanation / Answer:</p>
                                    <div className="text-slate-800 font-medium prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.answer || "No answer provided in text."}</ReactMarkdown>
                                    </div>

                                    {!canAutoGrade && (
                                        <p className="text-xs text-slate-400 mt-3 font-semibold flex items-center gap-1"><Zap className="w-3 h-3" /> Self-assessment mode. Read the explanation above to score yourself.</p>
                                    )}
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => handleReveal(i)}
                                    disabled={!isSelected && q.options}
                                    className={`px-6 py-3 rounded-xl text-white text-sm font-bold shadow-sm transition-all ${isSelected || !q.options ? c.btn : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                                >
                                    Check Answer
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// ---------------- MAIN COMPONENT ----------------

export default function StudentLMSNotes() {
    const { coursesList } = useCurriculumStore();

    // Course selection state
    const [selectedCourseId, setSelectedCourseId] = useState<string>(coursesList[0]?.id || '');
    const currentCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];

    // UI States
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(currentCourse?.subjects?.[0]?.id || '');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedTopicId, setSelectedTopicId] = useState<string>('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
    const [topicSearchQuery, setTopicSearchQuery] = useState<string>('');

    const [activeTab, setActiveTab] = useState<string>('introduction');
    const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
    const [showSidebar, setShowSidebar] = useState<boolean>(false);
    const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
    const [chatInput, setChatInput] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [isTyping, setIsTyping] = useState<boolean>(false);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;
        setChatHistory(prev => [...prev, { role: 'user', content: text }]);
        setChatInput('');
        setIsTyping(true);

        setTimeout(() => {
            let mockResponse = "I am a simulated AI instance processing your request! In a live environment with an active API Key, I would synthesize contextual responses based on this exact syllabus topic.";

            const lowerText = text.toLowerCase();
            if (lowerText.includes('mnemonic')) {
                mockResponse = "Here's a clever way to remember this:\n\n**S**ome **L**overs **T**ry **P**ositions **T**hat **T**hey **C**an't **H**andle\n\n*(Scaphoid, Lunate, Triquetrum, Pisiform, Trapezium, Trapezoid, Capitate, Hamate)*";
            } else if (lowerText.includes('mcq')) {
                mockResponse = "I've generated some rapid practice questions for you:\n\n**1. What is the most common carpal bone fracture?**\na) Scaphoid\nb) Lunate\nc) Hamate\nd) Pisiform\n*Answer: a) Scaphoid*\n\n*(In live mode, I would generate exactly 5 dynamically!)*";
            } else if (lowerText.includes('simple')) {
                mockResponse = "Think of it this way: Just like a car needs an engine to provide power and gears to shift smoothly, your body relies on **muscles** as the engine and **joints** as the gears to create fluid movement!";
            }

            setChatHistory(prev => [...prev, { role: 'ai', content: mockResponse }]);
            setIsTyping(false);
        }, 1500);
    };

    // Initial setup
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setShowAIPanel(true);
        }
    }, []);

    const currentSubject = currentCourse?.subjects?.find(s => s.id === selectedSubjectId) || currentCourse?.subjects?.[0];
    const availableSections = currentSubject?.sections || [];
    const currentSection = availableSections.find(s => s.id === selectedSectionId) || availableSections[0];
    const currentTopic = currentSection?.topics.find(t => t.id === selectedTopicId);

    // Initial setup
    useEffect(() => {
        if (!selectedTopicId && availableSections.length > 0) {
            const firstSec = availableSections[0];
            const firstTop = firstSec.topics.filter(t => t.generatedNotes)?.[0];
            if (firstTop) setSelectedTopicId(firstTop.id);
        }
    }, [selectedSubjectId, availableSections, selectedTopicId]);

    const toggleSection = (id: string) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));

    // Extracting parts from generated notes based on structure IDs
    // Assuming structure IDs follow `l1`..`l10` format from `defaultLMSStructure`
    const notes = currentTopic?.generatedNotes || {};

    const contentMap = {
        introduction: notes['l1'] || null,
        detailed: notes['l2'] || null,
        summary: notes['l3'] || null,
        q10: notes['l4'] || null,
        q5: notes['l5'] || null,
        q3: notes['l6'] || null,
        q2: notes['l7'] || null,
        q1: notes['l8'] || null,
        flashcards: notes['l9'] || null,
        ppt: notes['l10'] || null,
    };

    const tabsList = [
        { id: 'introduction', label: 'Introduction' },
        { id: 'detailed', label: 'Detailed Notes' },
        { id: 'summary', label: 'Summary' },
        { id: 'q10', label: '10 Marks Q' },
        { id: 'q5', label: '5 Marks Q' },
        { id: 'q3', label: '3 Marks Reasoning' },
        { id: 'q2', label: 'Case-Based MCQs' },
        { id: 'q1', label: '1 Mark MCQs' },
        { id: 'revision', label: 'Revision Mode', isSpecial: true },
    ].filter(t => contentMap[t.id as keyof typeof contentMap] || t.isSpecial);

    // Provide a full screen overlay to bypass global dashboard constraints and meet prompt criteria
    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex overflow-hidden font-sans">

            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowSidebar(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[105] md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* 1. LEFT SIDEBAR NAVIGATION */}
            <aside className={`fixed inset-y-0 left-0 w-[300px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-[110] transform transition-transform duration-300 md:relative md:translate-x-0 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/dashboard/student'}>
                        <div className="w-10 h-10 bg-gradient-to-br from-[#6C63FF] to-[#8E6CFF] rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <BrainCircuit className="text-white w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl text-slate-900 tracking-tight">MedEduAI</span>
                    </div>
                </div>

                {/* Course & Subject Selectors */}
                <div className="p-6 pb-2 space-y-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Course</p>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => { setSelectedCourseId(e.target.value); const newCourse = coursesList.find(c => c.id === e.target.value); if (newCourse?.subjects?.[0]) { setSelectedSubjectId(newCourse.subjects[0].id); setSelectedTopicId(''); } }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all appearance-none cursor-pointer"
                        >
                            {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject</p>
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedTopicId(''); }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all appearance-none cursor-pointer"
                        >
                            {currentCourse?.subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Search Topic</p>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={topicSearchQuery}
                                onChange={(e) => setTopicSearchQuery(e.target.value)}
                                placeholder="Type keywords to filter..."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl pl-9 pr-8 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                            />
                            {topicSearchQuery && (
                                <button onClick={() => setTopicSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Topic List - Search filtered or all topics flat */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {(() => {
                        const allFlatTopics = availableSections.flatMap(section =>
                            section.topics.filter(t => t.generatedNotes).map(topic => ({ ...topic, sectionName: section.name }))
                        );
                        const query = topicSearchQuery.trim().toLowerCase();
                        const filteredTopics = query
                            ? allFlatTopics.filter(t => t.name.toLowerCase().includes(query))
                            : allFlatTopics;

                        if (filteredTopics.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                    <Search className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-xs font-bold">No topics found</p>
                                </div>
                            );
                        }

                        return filteredTopics.map((topic, idx) => {
                            const isActive = selectedTopicId === topic.id;
                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => { setSelectedTopicId(topic.id); setActiveTab('introduction'); setShowSidebar(false); }}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${isActive
                                        ? 'bg-purple-50 text-purple-700 shadow-sm shadow-purple-100/50'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                                    {isActive ? <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /> : <BookOpen className="w-4 h-4 opacity-40 shrink-0" />}
                                    <span className="truncate">{topic.name}</span>
                                </button>
                            );
                        });
                    })()}
                </div>

                {/* Overall Progress Card */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" /> Progress
                            </span>
                            <span className="text-sm font-black text-slate-800">68%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: '68%' }} />
                        </div>
                        <div className="mt-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">
                            Anatomy Master Badge Unlocked
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTAINER */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFC]">

                {/* 2. TOP NAVIGATION BAR */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between flex-shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-3 flex-1 max-w-xl">
                        <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-full pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6 ml-4 md:ml-8">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="relative">
                            <div onClick={() => setShowProfileMenu(p => !p)} className="flex items-center gap-3 pl-4 md:pl-6 border-l border-slate-200 cursor-pointer group">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-purple-600 transition-colors">John Doe</p>
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Medical Student</p>
                                </div>
                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=John&backgroundColor=f8fafc" alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 shrink-0 group-hover:ring-4 group-hover:ring-purple-100 transition-all" />
                            </div>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 origin-top-right"
                                        >
                                            <button onClick={() => window.location.href = '/dashboard/student'} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors">
                                                <ArrowLeft className="w-4 h-4 text-slate-400" /> Back to Dashboard
                                            </button>
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button onClick={() => window.location.href = '/login'} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                                                <LogOut className="w-4 h-4 text-rose-500" /> Log out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* CONTENT BROWSER FLEX */}
                <div className="flex-1 flex overflow-hidden">

                    {/* 3. MAIN LEARNING PANEL */}
                    <div className="flex-1 overflow-y-auto scroll-smooth">
                        {currentTopic ? (
                            <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">

                                {/* Topic Header */}
                                <div className="mb-6 md:mb-8">
                                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        <span className="truncate">{currentSubject.name}</span>
                                        <ChevronRight className="w-3 h-3 mx-2 shrink-0" />
                                        <span className="truncate">{currentSection?.name}</span>
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                                            {currentTopic.name}
                                        </h1>
                                        <div className="flex flex-wrap gap-2 md:gap-3">
                                            <button
                                                onClick={() => setCompletedTopics(prev => ({ ...prev, [currentTopic.id]: !prev[currentTopic.id] }))}
                                                className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 font-bold text-sm whitespace-nowrap ${completedTopics[currentTopic.id] ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-300' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> {completedTopics[currentTopic.id] ? 'Completed' : 'Mark Completed'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex flex-wrap gap-2 pb-4 mb-6 md:mb-8 pt-2">
                                    {tabsList.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${activeTab === tab.id
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105'
                                                : tab.isSpecial
                                                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border-orange-200 hover:border-orange-300'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {tab.id === 'revision' && <Zap className="w-4 h-4 inline-block mr-2 text-amber-500" />}
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Active Content Views */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="min-h-[400px]"
                                    >

                                        {/* Introduction View */}
                                        {activeTab === 'introduction' && contentMap.introduction && (
                                            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-8 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                                        <AlignLeft className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-blue-900">Introduction</h3>
                                                </div>
                                                <div className="prose prose-blue prose-lg max-w-none text-slate-700 leading-relaxed font-medium">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMap.introduction}</ReactMarkdown>
                                                </div>

                                                {/* Working Demonstration Illustration */}
                                                <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-blue-100">
                                                    <img 
                                                        src="/medical_illustration_1.png" 
                                                        alt={currentTopic?.name || "Medical Illustration"} 
                                                        className="w-full h-auto object-cover max-h-96"
                                                    />
                                                    <div className="bg-white/80 backdrop-blur-sm p-4 text-center border-t border-blue-50/50">
                                                        <span className="font-bold text-sm text-blue-900">Figure 1.</span> <span className="text-slate-600 text-sm">Visual representation related to {currentTopic?.name || "the current topic"}.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Detailed Notes View */}
                                        {activeTab === 'detailed' && contentMap.detailed && (
                                            <div className="space-y-4">
                                                <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
                                                    {/* Decorative background element */}
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>

                                                    <div className="flex items-center gap-3 mb-8 relative z-10">
                                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-purple-900">Comprehensive Notes</h3>
                                                    </div>

                                                    <div className="prose prose-purple prose-lg max-w-none text-slate-700 leading-relaxed relative z-10">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMap.detailed}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary View */}
                                        {activeTab === 'summary' && contentMap.summary && (
                                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-100 shadow-sm">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                                        <Target className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-emerald-900">Key Points Summary</h3>
                                                </div>
                                                <div className="bg-white/60 p-6 rounded-2xl border border-white font-medium text-emerald-900 leading-relaxed shadow-inner prose prose-emerald max-w-none">
                                                    <ReactMarkdown 
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            pre: ({node, ...props}: any) => (
                                                                <div className="my-8 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/40 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 transform transition hover:scale-[1.01] hover:shadow-purple-500/20">
                                                                    <div className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/5">
                                                                        <div className="flex gap-2">
                                                                            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                                                            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                                                            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                                                        </div>
                                                                        <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 ml-3 uppercase tracking-widest flex items-center gap-2">
                                                                            <Sparkles className="w-3 h-3 text-cyan-300" />
                                                                            Conceptual Visual Summary
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative p-6 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                                                                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 blur-2xl" />
                                                                        <pre className="relative z-10 font-mono text-[13px] md:text-sm leading-relaxed text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]" {...props} />
                                                                    </div>
                                                                </div>
                                                            ),
                                                            code: ({node, inline, ...props}: any) => (
                                                                inline 
                                                                    ? <code className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold" {...props} /> 
                                                                    : <code {...props} />
                                                            )
                                                        }}
                                                    >
                                                        {contentMap.summary}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}


                                        {/* MCQ Views */}
                                        {['q10', 'q5', 'q3', 'q2', 'q1'].includes(activeTab) && (
                                            <div className="py-4">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                                        <CheckSquare className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 capitalize">
                                                        {tabsList.find(t => t.id === activeTab)?.label}
                                                    </h3>
                                                </div>
                                                <MCQViewer
                                                    rawText={contentMap[activeTab as keyof typeof contentMap] || ""}
                                                    colorClass={activeTab === 'q1' || activeTab === 'q5' ? 'indigo' : activeTab === 'q3' ? 'amber' : 'coral'}
                                                />
                                            </div>
                                        )}

                                        {/* Revision Mode View */}
                                        {activeTab === 'revision' && (
                                            <div className="space-y-12">
                                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white shadow-xl shadow-orange-200">
                                                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Zap className="w-8 h-8" /> 5-Minute Revision Mode</h2>
                                                    <p className="font-medium text-white/80">High-yield points, rapid fire MCQs, and flashcards compiled for exam prep.</p>
                                                </div>

                                                {/* Pull in Summary */}
                                                {contentMap.summary && (
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-2">1. High Yield Points</h3>
                                                        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-orange-500 border-y border-r border-slate-200 shadow-sm text-slate-700 font-medium prose prose-orange max-w-none">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMap.summary}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pull in Q1 MCQs immediately revealed */}
                                                {contentMap.q1 && (
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-2">2. Rapid 1-Mark MCQs</h3>
                                                        <MCQViewer rawText={contentMap.q1} colorClass="indigo" />
                                                    </div>
                                                )}

                                                {/* Pull in Flashcards */}
                                                {contentMap.flashcards && (
                                                    <div>
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 px-2">3. Rapid Flashcards</h3>
                                                        <FlashcardViewer rawText={contentMap.flashcards} />
                                                    </div>
                                                )}

                                                {/* End screen */}
                                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
                                                    <h3 className="text-xl font-bold text-slate-700">Revision Complete</h3>
                                                    <p className="font-medium mt-1">You're ready for the exam!</p>
                                                    <button onClick={() => setActiveTab('introduction')} className="mt-6 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
                                                        Back to Topic
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </motion.div>
                                </AnimatePresence>

                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
                                <h3 className="text-xl font-bold text-slate-700">No Content Selected</h3>
                                <p>Select a topic from the sidebar to begin.</p>
                            </div>
                        )}
                    </div>

                    {/* 4. AI TUTOR PANEL (Right Sidebar) */}
                    <AnimatePresence>
                        {showAIPanel && (
                            <motion.aside
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 360, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="absolute right-0 inset-y-0 z-[60] md:relative border-l border-slate-200 bg-white flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden max-w-[calc(100vw-4rem)]"
                            >
                                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0 bg-gradient-to-r from-purple-50/50 to-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-bold text-slate-900">MedEduAI Mentor</h3>
                                    </div>
                                    <button onClick={() => setShowAIPanel(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Chat Area Space */}
                                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                                    {chatHistory.length === 0 ? (
                                        <>
                                            <div className="text-center mb-4 mt-4">
                                                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=medBot&backgroundColor=e2e8f0" alt="Bot" className="w-16 h-16 mx-auto rounded-full bg-slate-100 border-2 border-white shadow-sm mb-3" />
                                                <p className="text-sm text-slate-600 font-medium">Hi John! Need help understanding <strong className="text-slate-800">{currentTopic?.name || 'this topic'}</strong>?</p>
                                            </div>

                                            {/* Action Chips */}
                                            <div className="space-y-2 mt-auto">
                                                {["Explain in simple terms", "Create a mnemonic for this", "Generate 5 practice MCQs"].map((chip, idx) => (
                                                    <button key={idx} onClick={() => handleSendMessage(chip)} className="w-full text-left p-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors">
                                                        {chip}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4 flex-1">
                                            {chatHistory.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm prose prose-sm'}`}>
                                                        {msg.role === 'ai' ? (
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                                        ) : (
                                                            msg.content
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {isTyping && (
                                                <div className="flex justify-start">
                                                    <div className="p-4 rounded-2xl bg-slate-100 rounded-bl-sm flex gap-1 items-center">
                                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                                    <div className="flex items-center justify-between mb-3 px-2">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">3 Free Questions Left</span>
                                        <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1 cursor-pointer hover:underline"><Trophy className="w-3 h-3" /> Upgrade Pro</span>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(chatInput);
                                                }
                                            }}
                                            placeholder="Ask anything..."
                                            rows={2}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-purple-400 resize-none pr-12"
                                        />
                                        <button onClick={() => handleSendMessage(chatInput)} className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 shadow-sm transition-transform hover:scale-105">
                                            <Sparkles className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* AI Toggle Button (if hidden) */}
                    <AnimatePresence>
                        {!showAIPanel && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setShowAIPanel(true)}
                                className="absolute right-6 bottom-6 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-slate-800 transition-all z-50 ring-4 ring-white"
                            >
                                <Sparkles className="w-6 h-6 text-purple-300" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                </div>
            </main>

            {/* Global overrides needed specifically for this exact page to look like a full app */}
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Hide scrollbar structurally but allow scrolling */
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* 3D Flip Utilities */
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; }
            `}} />
        </div>
    );
}
