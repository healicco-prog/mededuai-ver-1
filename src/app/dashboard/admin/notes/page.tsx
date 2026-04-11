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

// Helper to normalise raw content from DB (might be JSONB array, JSON string array, or plain string)
const normaliseContent = (raw: any): string => {
    if (!raw) return '';
    // Already an array
    if (Array.isArray(raw)) {
        return raw.map((item: any, i: number) => typeof item === 'string' ? item : JSON.stringify(item)).join('\n\n');
    }
    // JSONB object with .raw key (flashcards, ppt)
    if (typeof raw === 'object' && raw.raw) {
        return normaliseContent(raw.raw);  // recurse in case raw.raw is itself an array or string
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        // JSON string array like '["1. Question text", "2. ..."]'
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map((item: any, i: number) => typeof item === 'string' ? item : JSON.stringify(item)).join('\n\n');
                }
                if (typeof parsed === 'object' && parsed.raw) {
                    return normaliseContent(parsed.raw);
                }
            } catch (_) { /* Not valid JSON, fall through */ }
        }
        return raw;
    }
    return JSON.stringify(raw);
};

// Helper to parse a single question chunk into prompt and options
const parseSingleQuestion = (chunk: string, idx: number) => {
    // Strip Q1: or similar prefix
    let processedChunk = chunk.replace(/^(?:Q\d+:|[ivx]+[.)])\s*/i, '').trim();
    
    let lines = processedChunk.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Find where the Answer line is
    const answerLineIndex = lines.findIndex(l => /^\s*Answer:/i.test(l));
    const answerRaw = answerLineIndex !== -1 ? lines[answerLineIndex] : null;
    const answer = answerRaw ? answerRaw.replace(/^\s*Answer:/i, '').trim() : null;

    // Everything before the Answer line is Question + Options
    const contentLines = answerLineIndex !== -1 ? lines.slice(0, answerLineIndex) : lines;
    const contentStr = contentLines.join('\n');
    
    // Look for the first option (a) to split question text from options
    const firstOptionMatch = contentStr.match(/(?:^|\s)(?:a\)|A\)|a\.|A\.)\s+/);
    
    let questionText = contentStr;
    let optionsStr = "";
    
    if (firstOptionMatch && firstOptionMatch.index !== undefined) {
        questionText = contentStr.substring(0, firstOptionMatch.index).trim();
        optionsStr = contentStr.substring(firstOptionMatch.index).trim();
    }
    
    // Parse options: a) ... b) ... c) ... d) ...
    const optionMatches = optionsStr.match(/(?:[a-dA-D][.)]|\([a-dA-D]\))\s*[\s\S]*?(?=(?:[a-dA-D][.)]|\([a-dA-D]\))|$)/g);
        
    let options: string[] | null = null;
    if (optionMatches && optionMatches.length >= 2) {
        options = optionMatches.map(o => o.trim()).filter(Boolean);
    }

    let correctOptionIndex = -1;
    if (answer && options) {
        const answerChar = answer.match(/^[a-dA-D]/i)?.[0]?.toLowerCase();
        if (answerChar === 'a') correctOptionIndex = 0;
        else if (answerChar === 'b') correctOptionIndex = 1;
        else if (answerChar === 'c') correctOptionIndex = 2;
        else if (answerChar === 'd') correctOptionIndex = 3;
        else {
            correctOptionIndex = options.findIndex(opt => opt.toLowerCase().includes((answer || '').toLowerCase().slice(0, 15)));
        }
    }

    return { 
        id: idx, 
        question: questionText, 
        options, 
        answer, 
        correctOptionIndex, 
        isEssay: (!options || options.length === 0) 
    };
};

// Helper to parse MCQs/Questions - handles numbered text, case-based MCQs, and essay questions
const parseMCQs = (rawInput: any) => {
    const text = normaliseContent(rawInput);
    if (!text || text.trim() === '' || text.trim() === 'None requested.') return [];

    // Split on newline followed by a number and period (e.g. "1. " or "2. ")
    const chunks = text.split(/(?:^|\n)(?=\d+\.\s)/).map(c => c.trim()).filter(c => c.length > 5);
    
    if (chunks.length === 0) {
        // Fallback for non-numbered content
        return [{ id: 0, question: text.trim(), options: null, answer: null, correctOptionIndex: -1, raw: text, isEssay: true }];
    }

    return chunks.map((chunk, idx) => {
        // Remove the leading "1. " from the chunk
        const cleanedChunk = chunk.replace(/^\d+\.\s*/, '').trim();
        const hasCasePrefix = /^Case:/im.test(cleanedChunk);
        
        if (hasCasePrefix) {
            // Case-based with multiple sub-questions
            const splitByQ = cleanedChunk.split(/(?=\bQ\d+:|\b[ivx]+\)|\b[ivx]+\.)/im);
            const caseText = splitByQ[0].replace(/^Case:\s*/i, '').trim();
            const subChunks = splitByQ.slice(1);
            
            const subQuestions = subChunks.map((sq, sIdx) => parseSingleQuestion(sq, sIdx));
            
            return {
                id: idx,
                question: caseText ? `**Case:** ${caseText}` : '',
                options: null,
                answer: null,
                correctOptionIndex: -1,
                raw: chunk,
                isEssay: false,
                subQuestions: subQuestions
            };
        } else {
            // Standard single question
            const q = parseSingleQuestion(cleanedChunk, idx);
            return { ...q, raw: chunk };
        }
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

const FlashcardViewer = ({ rawText }: { rawText: any }) => {
    const text = normaliseContent(rawText);
    const cards = parseFlashcards(text);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!cards || cards.length === 0) {
        return <div className="p-6 bg-slate-50 rounded-2xl text-slate-600 whitespace-pre-wrap">{text || 'No flashcard content available.'}</div>;
    }

    const currentCard = cards[currentIndex];

    return (
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
            <div
                className="relative w-full h-80 perspective-1000 cursor-pointer group"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} relative`}>
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-8 border border-teal-100 flex flex-col justify-center items-center shadow-sm">
                        <span className="absolute top-6 left-6 text-teal-600/30 text-4xl font-black">Q.</span>
                        <h3 className="text-2xl font-bold text-teal-900 text-center leading-relaxed">{currentCard.front}</h3>
                        <p className="absolute bottom-6 text-sm text-teal-600/60 font-medium">Click to reveal answer</p>
                    </div>
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 border border-purple-100 flex flex-col justify-center items-center shadow-lg rotate-y-180">
                        <span className="absolute top-6 left-6 text-purple-600/30 text-4xl font-black">A.</span>
                        <h3 className="text-xl font-medium text-purple-900 text-center leading-relaxed">{currentCard.back}</h3>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6 mt-8">
                <button onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }} disabled={currentIndex === 0} className="p-3 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm font-bold text-slate-400">{currentIndex + 1} / {cards.length}</span>
                <button onClick={() => { setCurrentIndex(prev => Math.min(cards.length - 1, prev + 1)); setIsFlipped(false); }} disabled={currentIndex === cards.length - 1} className="p-3 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-30 transition">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const PPTSlideViewer = ({ rawText }: { rawText: any }) => {
    const text = normaliseContent(rawText);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = React.useMemo(() => {
        if (!text || text.trim() === '' || text.trim() === 'None requested.') return [];

        // Strategy 1: Split by ---SLIDE--- delimiter
        if (text.includes('---SLIDE---')) {
            return text.split('---SLIDE---').map(s => s.trim()).filter(Boolean).map((chunk, i) => {
                const lines = chunk.split('\n').filter(l => l.trim());
                const heading = lines[0]?.replace(/^#{1,3}\s*/, '').trim() || `Slide ${i + 1}`;
                const body = lines.slice(1).join('\n').trim();
                return { number: i + 1, heading, body };
            });
        }

        // Strategy 2: Split by "Slide N:" pattern
        const slidePattern = /(?=Slide\s+\d+\s*[:\-–])/i;
        if (slidePattern.test(text)) {
            return text.split(slidePattern).filter(Boolean).map((chunk, i) => {
                const lines = chunk.trim().split('\n').filter(l => l.trim());
                const firstLine = lines[0];
                const headingMatch = firstLine.match(/Slide\s+\d+\s*[:\-–]\s*(.*)/i);
                const heading = headingMatch ? headingMatch[1].trim() : firstLine.trim();
                const body = lines.slice(1).join('\n').trim();
                return { number: i + 1, heading, body };
            });
        }

        // Strategy 3: Split by markdown headings (## Heading)
        const headingPattern = /(?=^#{1,3}\s)/m;
        if (headingPattern.test(text)) {
            return text.split(headingPattern).filter(Boolean).map((chunk, i) => {
                const lines = chunk.trim().split('\n').filter(l => l.trim());
                const heading = lines[0]?.replace(/^#{1,3}\s*/, '').trim() || `Slide ${i + 1}`;
                const body = lines.slice(1).join('\n').trim();
                return { number: i + 1, heading, body };
            });
        }

        // Fallback: one slide with all content
        return [{ number: 1, heading: 'Presentation', body: text }];
    }, [text]);

    if (!slides.length) {
        return <div className="p-6 bg-slate-50 rounded-2xl text-slate-600">No PPT content available.</div>;
    }

    const slide = slides[currentSlide] || slides[0];
    const gradients = [
        'from-indigo-600 via-purple-600 to-violet-700',
        'from-emerald-600 via-teal-600 to-cyan-700',
        'from-rose-600 via-pink-600 to-fuchsia-700',
        'from-amber-600 via-orange-600 to-red-700',
        'from-blue-600 via-sky-600 to-cyan-700',
        'from-violet-600 via-purple-600 to-indigo-700',
        'from-teal-600 via-emerald-600 to-green-700',
        'from-pink-600 via-rose-600 to-red-700',
    ];
    const gradient = gradients[currentSlide % gradients.length];

    return (
        <div className="space-y-6">
            {/* Slide Display */}
            <div className={`relative bg-gradient-to-br ${gradient} rounded-3xl p-8 md:p-10 min-h-[480px] flex flex-col shadow-2xl overflow-hidden`}>
                {/* Decorative orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                {/* Top bar */}
                <div className="relative z-10 flex items-center justify-between mb-6">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10">
                        Slide {slide.number} of {slides.length}
                    </span>
                    <Presentation className="w-6 h-6 text-white/40" />
                </div>

                {/* Heading */}
                <h2 className="relative z-10 text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-6 drop-shadow-lg">
                    {slide.heading}
                </h2>

                {/* Body Content */}
                <div className="relative z-10 flex-1">
                    {slide.body ? (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="prose prose-invert prose-lg max-w-none text-white/90 leading-relaxed font-medium [&_strong]:text-white [&_li]:marker:text-white/60">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.body}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 flex items-center justify-center min-h-[200px]">
                            <p className="text-white/60 text-lg font-medium italic">Title Slide</p>
                        </div>
                    )}
                </div>

                {/* Bottom bar */}
                <div className="relative z-10 mt-6 flex items-center justify-between">
                    <span className="text-white/30 text-xs font-bold">MedEduAI Presentation</span>
                    <div className="flex gap-1">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white w-6' : 'bg-white/30 w-2 hover:bg-white/50'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                    disabled={currentSlide === 0}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm disabled:opacity-30 hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm font-black text-slate-400 px-4 tabular-nums">{currentSlide + 1} / {slides.length}</span>
                <button
                    onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                    disabled={currentSlide === slides.length - 1}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm disabled:opacity-30 hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const MCQViewer = ({ rawText, colorClass = "indigo", marks = 1, currentTopic, currentSubject }: { rawText: any, colorClass?: string, marks?: number, currentTopic?: any, currentSubject?: any }) => {
    const questions = parseMCQs(rawText) as any[];
    const [selectedOpts, setSelectedOpts] = useState<Record<string, number>>({});
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});
    const [generatedAnswers, setGeneratedAnswers] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

    if (!questions || questions.length === 0) {
        const text = normaliseContent(rawText);
        return (
            <div className="prose max-w-none text-slate-700 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || ''}</ReactMarkdown>
            </div>
        );
    }

    if (questions.length === 1 && questions[0].isEssay) {
        const text = normaliseContent(rawText);
        return (
            <div className="prose max-w-none text-slate-700 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || ''}</ReactMarkdown>
            </div>
        );
    }

    const colorMap: Record<string, any> = {
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-900', btn: 'bg-indigo-600 hover:bg-indigo-700', activeBtn: 'bg-indigo-100 border-indigo-300 text-indigo-900' },
        coral: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-900', btn: 'bg-rose-600 hover:bg-rose-700', activeBtn: 'bg-rose-100 border-rose-300 text-rose-900' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-900', btn: 'bg-amber-600 hover:bg-amber-700', activeBtn: 'bg-amber-100 border-amber-300 text-amber-900' }
    };
    const c = colorMap[colorClass] || colorMap.indigo;

    const handleOptionSelect = (qIdx: number, subIdx: number, optIdx: number) => {
        const key = `${qIdx}-${subIdx}`;
        if (revealed[key]) return;
        setSelectedOpts(prev => ({ ...prev, [key]: optIdx }));
        setRevealed(prev => ({ ...prev, [key]: true }));
    };
    const handleReveal = (qIdx: number, subIdx: number) => {
        const key = `${qIdx}-${subIdx}`;
        setRevealed(prev => ({ ...prev, [key]: true }));
    };

    const handleGenerateAnswer = async (qIdx: number, qText: string) => {
        const key = `${qIdx}-essay`;
        setIsGenerating(prev => ({ ...prev, [key]: true }));
        try {
            const answerType = marks === 10 ? 'long_answer' : marks === 5 ? 'short_answer' : 'viva_answer';
            const res = await fetch('/api/essay-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: "Medical Exam",
                    subject: currentSubject?.name || "Topic Subject",
                    topic: currentTopic?.name || "Topic",
                    answerType,
                    depth: "Detailed",
                    questions: [qText]
                })
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedAnswers(prev => ({ ...prev, [key]: data.answer }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleDownloadPdf = (qIdx: number, qText: string) => {
        const key = `${qIdx}-essay`;
        const ans = generatedAnswers[key] || "No answer generated";
        // Print-based PDF download logic using marked.js to render PDF properly
        const win = window.open('', '_blank');
        if (win) {
             win.document.write(`
                <html><head><title>MedEduAI - Generated Answer</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; max-width: 900px; margin: 0 auto; }
                    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
                    p { margin-bottom: 1em; }
                    ul, ol { margin-left: 20px; margin-bottom: 1em; }
                    li { margin-bottom: 8px; }
                    hr { border: 0; border-top: 2px solid #e2e8f0; margin: 2em 0; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .branding { font-weight: 900; font-size: 24px; color: #6366f1; letter-spacing: -0.5px; }
                </style>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                </head><body>
                
                <div class="header">
                    <div class="branding">MedEduAI</div>
                    <p style="color: #64748b; font-size: 14px;">Automated Essay Generation Report</p>
                </div>
                
                <h3>Question: ${qText}</h3>
                <hr/>
                <div id="content">Loading generated content...</div>
                
                <script>
                    try {
                        const rawText = ${JSON.stringify(ans)};
                        document.getElementById('content').innerHTML = marked.parse(rawText);
                        // Wait a tiny bit for render to finish before triggering print dialog
                        setTimeout(() => { window.print(); }, 500);
                    } catch (e) {
                        document.getElementById('content').innerHTML = "<p>Error formatting the document.</p>";
                    }
                </script>
                </body></html>
            `);
             win.document.close();
        }
    };

    return (
        <div className="space-y-6">
            {questions.map((q, i) => {
                const questionsToRender = q.subQuestions && q.subQuestions.length > 0 ? q.subQuestions : [q];
                
                return (
                    <div key={i} className={`p-6 rounded-2xl ${c.bg} ${c.border} border shadow-sm transition-all hover:shadow-md`}>
                        <h4 className={`font-bold text-lg ${c.text} mb-4 flex items-start gap-3`}>
                            <span className="shrink-0 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-sm font-black">{i + 1}</span>
                            <div className="prose prose-sm max-w-none flex-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question || ''}</ReactMarkdown>
                            </div>
                        </h4>

                        <div className="ml-11 space-y-8">
                            {questionsToRender.map((subQ: any, subIdx: number) => {
                                const key = `${i}-${subIdx}`;
                                const isRevealed = revealed[key];
                                const selectedIdx = selectedOpts[key];
                                const isSelected = selectedIdx !== undefined;
                                const isEssay = q.isEssay || (!subQ.options || subQ.options.length === 0);
                                const canAutoGrade = !isEssay && subQ.correctOptionIndex !== -1 && subQ.correctOptionIndex !== undefined;
                                const isCorrect = canAutoGrade && selectedIdx === subQ.correctOptionIndex;
                                const hasSubQuestions = q.subQuestions && q.subQuestions.length > 0;
                                
                                const essayKey = `${i}-essay`;
                                const generatedAns = generatedAnswers[essayKey];
                                const generating = isGenerating[essayKey];
                                
                                return (
                                    <div key={subIdx} className={hasSubQuestions ? "pl-4 border-l-2 border-indigo-200" : ""}>
                                        {hasSubQuestions && (
                                            <h5 className={`font-bold text-md ${c.text} mb-3 flex items-start gap-2`}>
                                                <span className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-xs font-black">Q{subIdx + 1}</span>
                                                <div className="prose prose-sm max-w-none flex-1">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{subQ.question || ''}</ReactMarkdown>
                                                </div>
                                            </h5>
                                        )}

                                        {!isEssay && subQ.options && (
                                            <div className="space-y-2 mt-4">
                                                {subQ.options.map((opt: string, j: number) => {
                                                    const isThisSelected = selectedIdx === j;
                                                    let btnStyle = 'bg-white/60 border-white/40 text-slate-700 hover:bg-white';
                                                    if (isThisSelected && !isRevealed) {
                                                        btnStyle = c.activeBtn;
                                                    } else if (isRevealed) {
                                                        if (canAutoGrade && j === subQ.correctOptionIndex) {
                                                            btnStyle = 'bg-emerald-100 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500';
                                                        } else if (isThisSelected) {
                                                            btnStyle = 'bg-rose-100 border-rose-300 text-rose-900';
                                                        } else {
                                                            btnStyle = 'bg-white/40 border-transparent text-slate-400 opacity-60';
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={j}
                                                            onClick={() => handleOptionSelect(i, subIdx, j)}
                                                            className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${btnStyle} ${isRevealed ? 'cursor-default' : 'hover:shadow-sm'}`}
                                                            disabled={isRevealed}
                                                        >
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isThisSelected ? 'border-current' : 'border-slate-300'}`}>
                                                                {isThisSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                                                            </div>
                                                            <span className="font-medium">{opt}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="mt-6">
                                            {isEssay ? (
                                                <div className="flex gap-4 items-center">
                                                    <button
                                                        onClick={() => handleGenerateAnswer(i, hasSubQuestions ? subQ.question : q.question)}
                                                        disabled={generating}
                                                        className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm transition-all ${c.btn} ${generating ? 'opacity-50' : ''}`}
                                                    >
                                                        {generating ? 'Generating...' : 'Generate Answer'}
                                                    </button>
                                                    {generatedAns && (
                                                        <button
                                                            onClick={() => handleDownloadPdf(i, hasSubQuestions ? subQ.question : q.question)}
                                                            className="px-6 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
                                                            Download PDF
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                !isRevealed && (
                                                    <button
                                                        onClick={() => handleReveal(i, subIdx)}
                                                        className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm transition-all ${c.btn}`}
                                                    >
                                                        Check Answer
                                                    </button>
                                                )
                                            )}

                                            {(!isEssay && isRevealed) && (
                                                <div className="mt-4 bg-white rounded-xl p-5 border border-slate-200">
                                                    <div className="flex items-start gap-3">
                                                        {canAutoGrade && (
                                                            <div className={`mt-1 shrink-0 p-1.5 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <p className="font-bold text-slate-800 mb-2">
                                                                {canAutoGrade ? (isCorrect ? 'Correct!' : 'Incorrect.') : 'Correct Answer:'}
                                                            </p>
                                                            <p className="text-slate-700 font-medium whitespace-pre-wrap">{subQ.answer || 'Refer to text.'}</p>
                                                            {subQ.reason && (
                                                                <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                                    <p className="text-sm text-blue-900 mb-1 font-bold">Reasoning:</p>
                                                                    <p className="text-sm text-blue-800">{subQ.reason}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(isEssay && generatedAns) && (
                                                <div className="mt-4 bg-white rounded-xl p-5 border border-slate-200">
                                                    <p className="font-bold text-slate-800 mb-4">Generated Model Answer:</p>
                                                    <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedAns}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


export default function TeacherLMSNotes() {
    const { coursesList } = useCurriculumStore();

    // Course selection state
    const [selectedCourseId, setSelectedCourseId] = useState<string>(coursesList[0]?.id || '');
    const currentCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];

    // DB-driven topic map: topicId → DB uuid (from /api/creator/hierarchy)
    const [dbTopicMap, setDbTopicMap] = useState<Record<string, string>>({});   // topicName → topicId
    // Notes loaded fresh from Supabase
    const [dbNotes, setDbNotes] = useState<Record<string, string>>({});          // lx keys → content
    const [loadingDbNotes, setLoadingDbNotes] = useState(false);

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
            if (lowerText.includes('discussion')) {
                mockResponse = "Here are 3 engaging discussion questions for your seminar:\n\n1. How does the arrangement of the carpal bones facilitate both stability and extreme mobility in the human hand?\n2. In what ways do the flexor retinaculums prevent 'bowstringing' of tendons?\n3. What are the evolutionary trade-offs of the opponens pollicis muscle development?";
            } else if (lowerText.includes('assignment')) {
                mockResponse = "**Assignment: Upper Limb Pathology**\n\n**Instructions:** Have students draw a diagram of the brachial plexus. They must identify the exact roots, trunks, divisions, cords, and branches. Then, they must highlight the expected sensory and motor deficits arising from an Erb-Duchenne palsy (C5-C6 root tear).";
            } else if (lowerText.includes('summarize')) {
                mockResponse = "The core syllabus points are:\n- The shoulder joint (glenohumeral) allows maximum mobility at the cost of stability.\n- The elbow joint is a hinge primarily for flexion and extension.\n- The wrist includes 8 carpal bones.\n- Intrinsic muscles of the hand are responsible for fine motor skills under median and ulnar nerve innervations.";
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

    // Load the DB topic map once (topicName → DB uuid)
    useEffect(() => {
        fetch('/api/creator/hierarchy')
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;
                const map: Record<string, string> = {};
                for (const course of (data.courses || [])) {
                    for (const subject of (course.subjects || [])) {
                        for (const topic of (subject.topics || [])) {
                            map[topic.name] = topic.id;
                        }
                    }
                }
                setDbTopicMap(map);
            })
            .catch(() => {});
    }, []);

    const currentSubject = currentCourse?.subjects?.find(s => s.id === selectedSubjectId) || currentCourse?.subjects?.[0];
    const availableSections = currentSubject?.sections || [];
    const currentSection = availableSections.find(s => s.id === selectedSectionId) || availableSections[0];
    const currentTopic = currentSection?.topics.find(t => t.id === selectedTopicId);

    // Fetch FRESH notes from DB whenever the selected topic changes
    useEffect(() => {
        if (!currentTopic) { setDbNotes({}); return; }
        const dbId = dbTopicMap[currentTopic.name];
        if (!dbId) return;
        setLoadingDbNotes(true);
        fetch(`/api/creator/topic-notes?topicId=${dbId}`)
            .then(r => r.json())
            .then(data => {
                if (data.success && data.notes) {
                    const n = data.notes;
                    const mapped: Record<string, string> = {};
                    if (n.introduction)          mapped['l1'] = n.introduction;
                    if (n.detailed_notes)        mapped['l2'] = n.detailed_notes;
                    if (n.summary)               mapped['l3'] = n.summary;
                    if (n.marks_10_questions)    mapped['l4'] = n.marks_10_questions;
                    if (n.marks_5_questions)     mapped['l5'] = n.marks_5_questions;
                    if (n.marks_3_reasoning)     mapped['l6'] = n.marks_3_reasoning;
                    if (n.marks_2_case_mcqs)     mapped['l7'] = n.marks_2_case_mcqs;
                    if (n.marks_1_mcqs)          mapped['l8'] = n.marks_1_mcqs;
                    if (n.flashcards?.raw)       mapped['l9'] = n.flashcards.raw;
                    else if (typeof n.flashcards === 'string') mapped['l9'] = n.flashcards;
                    if (n.ppt_content?.raw)      delete n.ppt_content;
                    else if (typeof n.ppt_content === 'string') delete n.ppt_content;
                    setDbNotes(mapped);
                } else {
                    setDbNotes({});
                }
            })
            .catch(() => setDbNotes({}))
            .finally(() => setLoadingDbNotes(false));
    }, [currentTopic?.id, dbTopicMap]);

    // Initial topic selection
    useEffect(() => {
        if (!selectedTopicId && availableSections.length > 0) {
            const firstSec = availableSections[0];
            const firstTop = firstSec.topics.filter(t => t.generatedNotes)?.[0] || firstSec.topics?.[0];
            if (firstTop) setSelectedTopicId(firstTop.id);
        }
    }, [selectedSubjectId, availableSections, selectedTopicId]);

    const toggleSection = (id: string) => setExpandedSections(p => ({ ...p, [id]: !p[id] }));

    // Prefer freshly-fetched DB notes over stale Zustand/localStorage cache
    const storeNotes = currentTopic?.generatedNotes || {};
    const notes = Object.keys(dbNotes).length > 0 ? dbNotes : storeNotes;

    const contentMap = {
        introduction: notes['l1'] ? normaliseContent(notes['l1']) : null,
        detailed: notes['l2'] ? normaliseContent(notes['l2']) : null,
        summary: notes['l3'] ? normaliseContent(notes['l3']) : null,
        q10: notes['l4'] ? normaliseContent(notes['l4']) : null,
        q5: notes['l5'] ? normaliseContent(notes['l5']) : null,
        q3: notes['l6'] ? normaliseContent(notes['l6']) : null,
        q2: notes['l7'] ? normaliseContent(notes['l7']) : null,
        q1: notes['l8'] ? normaliseContent(notes['l8']) : null,
        flashcards: notes['l9'] ? normaliseContent(notes['l9']) : null,
        ppt: notes['l10'] ? normaliseContent(notes['l10']) : null,
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
        { id: 'flashcards', label: 'Flashcards' },
        { id: 'ppt', label: 'PPT' },
    ].filter(t => contentMap[t.id as keyof typeof contentMap]);

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
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/dashboard/teacher'}>
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
                                    <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-purple-600 transition-colors">Teacher User</p>
                                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">TEACHER</p>
                                </div>
                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Teacher&backgroundColor=f8fafc" alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 shrink-0 group-hover:ring-4 group-hover:ring-purple-100 transition-all" />
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
                                            <button onClick={() => window.location.href = '/dashboard/teacher'} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors">
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
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
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


                                        
                                        {/* 10 Marks Questions View */}
                                        {activeTab === 'q10' && contentMap.q10 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                                        <CheckSquare className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-indigo-900">10 Marks Questions</h3>
                                                        <p className="text-xs text-indigo-600 font-medium">Long answer questions for board exams</p>
                                                    </div>
                                                </div>
                                                <MCQViewer rawText={contentMap.q10} colorClass="indigo"  marks={10} currentTopic={currentTopic} currentSubject={currentSubject} />
                                            </div>
                                        )}

                                        {/* 5 Marks Questions View */}
                                        {activeTab === 'q5' && contentMap.q5 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600">
                                                        <CheckSquare className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-violet-900">5 Marks Questions</h3>
                                                        <p className="text-xs text-violet-600 font-medium">Medium answer questions</p>
                                                    </div>
                                                </div>
                                                <MCQViewer rawText={contentMap.q5} colorClass="indigo"  marks={5} currentTopic={currentTopic} currentSubject={currentSubject} />
                                            </div>
                                        )}

                                        {/* 3 Marks Reasoning View */}
                                        {activeTab === 'q3' && contentMap.q3 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                                        <MessageSquare className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-amber-900">3 Marks Reasoning Questions</h3>
                                                        <p className="text-xs text-amber-600 font-medium">Short reasoning and application</p>
                                                    </div>
                                                </div>
                                                <MCQViewer rawText={contentMap.q3} colorClass="amber"  marks={3} currentTopic={currentTopic} currentSubject={currentSubject} />
                                            </div>
                                        )}

                                        {/* 2 Marks Case-based MCQs View */}
                                        {activeTab === 'q2' && contentMap.q2 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                                                        <Target className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-rose-900">2 Marks Case-Based MCQs</h3>
                                                        <p className="text-xs text-rose-600 font-medium">Clinical scenario questions</p>
                                                    </div>
                                                </div>
                                                <MCQViewer rawText={contentMap.q2} colorClass="coral"  marks={2} currentTopic={currentTopic} currentSubject={currentSubject} />
                                            </div>
                                        )}

                                        {/* 1 Mark MCQs View */}
                                        {activeTab === 'q1' && contentMap.q1 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-teal-900">1 Mark MCQs</h3>
                                                        <p className="text-xs text-teal-600 font-medium">Quick recall and factual MCQs</p>
                                                    </div>
                                                </div>
                                                <MCQViewer rawText={contentMap.q1} colorClass="indigo"  marks={1} currentTopic={currentTopic} currentSubject={currentSubject} />
                                            </div>
                                        )}

                                        {/* Flashcards View */}
                                        {activeTab === 'flashcards' && contentMap.flashcards && (
                                            <div className="py-8">
                                                <FlashcardViewer rawText={contentMap.flashcards} />
                                            </div>
                                        )}

                                        {/* PPT Slide View */}
                                        {activeTab === 'ppt' && contentMap.ppt && (
                                            <div className="py-8">
                                                <PPTSlideViewer rawText={contentMap.ppt} />
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
                                                <p className="text-sm text-slate-600 font-medium">Hi Teacher! Need help building material for <strong className="text-slate-800">{currentTopic?.name || 'this topic'}</strong>?</p>
                                            </div>

                                            {/* Action Chips */}
                                            <div className="space-y-2 mt-auto">
                                                {["Generate discussion questions", "Create an assignment", "Summarize core syllabus points"].map((chip, idx) => (
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
