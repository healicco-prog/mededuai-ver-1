"use client";

import { useState, useEffect, useCallback } from 'react';
import { FilePenLine as FileEdit, Loader2, Sparkles, RefreshCcw, Download, Copy, CheckCircle, BookOpen, Save, Share2, FileDown, X, ChevronDown, Search, History, Trash2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DBTopic {
    id: string;
    name: string;
    section: string;
    hasNotes: boolean;
}

interface DBSubject {
    id: string;
    name: string;
    topics: DBTopic[];
}

interface DBCourse {
    id: string;
    name: string;
    subjects: DBSubject[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NOTE_STYLES = [
    { id: 'comprehensive', label: 'Comprehensive Notes', desc: 'Detailed, textbook-style notes covering all aspects' },
    { id: 'concise', label: 'Concise Summary', desc: 'Focused bullet-point notes for quick revision' },
    { id: 'cornell', label: 'Cornell Method', desc: 'Structured notes with cues, notes, and summary sections' },
    { id: 'mind_map', label: 'Mind Map Text', desc: 'Hierarchical concept mapping in text format' },
];

const NOTE_DEPTH = ['Basic', 'Intermediate', 'Advanced', 'Exam-Ready'];

function formatDbNotes(notes: Record<string, any>): string {
    // Combine DB note fields into a single readable markdown string (full LMS order)
    const parts: string[] = [];
    if (notes.introduction) parts.push(`## 📖 Introduction\n\n${notes.introduction}`);
    if (notes.detailed_notes) parts.push(`## 📝 Detailed Notes\n\n${notes.detailed_notes}`);
    if (notes.summary) parts.push(`## 📌 Summary\n\n${notes.summary}`);
    if (notes.marks_10_questions) parts.push(`## 🏆 10 Marks Questions\n\n${notes.marks_10_questions}`);
    if (notes.marks_5_questions) parts.push(`## ✏️ 5 Marks Questions\n\n${notes.marks_5_questions}`);
    if (notes.marks_3_reasoning) parts.push(`## 💡 3 Marks Reasoning Questions\n\n${notes.marks_3_reasoning}`);
    if (notes.marks_2_case_mcqs) parts.push(`## 🩺 2 Marks Case-based MCQs\n\n${notes.marks_2_case_mcqs}`);
    if (notes.marks_1_mcqs) parts.push(`## ✅ 1 Mark MCQs\n\n${notes.marks_1_mcqs}`);
    const flashcards = notes.flashcards;
    if (flashcards) {
        const flashText = typeof flashcards === 'string' ? flashcards : flashcards?.raw || JSON.stringify(flashcards);
        if (flashText) parts.push(`## 🃏 Flashcards\n\n${flashText}`);
    }
    return parts.join('\n\n---\n\n');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotesCreatorPage() {
    const currentUser = useUserStore(state => state.users[0]);

    // DB-driven course/subject/topic state
    const [dbCourses, setDbCourses] = useState<DBCourse[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');

    // Content state
    const [dbResult, setDbResult] = useState('');         // Notes from database
    const [aiResult, setAiResult] = useState('');          // Freshly AI-generated notes
    const [activeView, setActiveView] = useState<'db' | 'ai'>('db');

    // UI state
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [shared, setShared] = useState(false);

    const [savedNotes, setSavedNotes] = useState<any[]>([]);
    const [savedSearchQuery, setSavedSearchQuery] = useState('');
    const [isFetchingSaved, setIsFetchingSaved] = useState(true);

    // AI generation config
    const [selectedStyle, setSelectedStyle] = useState('comprehensive');
    const [depth, setDepth] = useState('Intermediate');
    const [customInstructions, setCustomInstructions] = useState('');

    // Derived
    const activeCourse = dbCourses.find(c => c.id === selectedCourseId);
    const activeSubject = activeCourse?.subjects.find(s => s.id === selectedSubjectId);
    const activeTopic = activeSubject?.topics.find(t => t.id === selectedTopicId);
    const displayResult = activeView === 'db' ? dbResult : aiResult;

    // ── Step 1: Load course/subject/topic hierarchy from DB ──
    useEffect(() => {
        const fetchHierarchy = async () => {
            setLoadingCourses(true);
            try {
                const res = await fetch('/api/creator/hierarchy');
                const data = await res.json();
                if (data.success && data.courses?.length > 0) {
                    setDbCourses(data.courses);
                    const first = data.courses[0];
                    setSelectedCourseId(first.id);
                    const firstSub = first.subjects?.[0];
                    if (firstSub) {
                        setSelectedSubjectId(firstSub.id);
                        const firstTopic = firstSub.topics?.find((t: DBTopic) => t.hasNotes) || firstSub.topics?.[0];
                        if (firstTopic) setSelectedTopicId(firstTopic.id);
                    }
                }
            } catch (err) {
                console.error('[NotesCreator] Failed to load hierarchy:', err);
            } finally {
                setLoadingCourses(false);
            }
        };
        fetchHierarchy();
    }, []);

    const fetchSavedNotes = async () => {
        setIsFetchingSaved(true);
        try {
            const res = await fetch('/api/notes-creator/saved/all');
            const data = await res.json();
            if (data.success) {
                setSavedNotes(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch saved notes:", error);
        } finally {
            setIsFetchingSaved(false);
        }
    };

    useEffect(() => {
        fetchSavedNotes();
    }, []);

    // ── Step 2: Load existing DB notes when topic changes ──
    useEffect(() => {
        if (!selectedTopicId) { setDbResult(''); return; }
        const loadNotes = async () => {
            setLoadingNotes(true);
            setDbResult('');
            setAiResult('');
            setActiveView('db');
            try {
                const res = await fetch(`/api/creator/topic-notes?topicId=${selectedTopicId}`);
                const data = await res.json();
                if (data.success && data.notes) {
                    setDbResult(formatDbNotes(data.notes));
                } else {
                    setDbResult('');
                }
            } catch (err) {
                console.error('[NotesCreator] Failed to load topic notes:', err);
            } finally {
                setLoadingNotes(false);
            }
        };
        loadNotes();
    }, [selectedTopicId]);

    // ── Step 3: AI regeneration (optional, on demand) ──
    const handleGenerate = async () => {
        if (!activeTopic || !activeCourse || !activeSubject) return;

        // If notes already exist in DB, ask for confirmation
        if (dbResult) {
            const confirmOverwrite = window.confirm(
                "Notes for this topic already exist in the database. Do you want to rewrite them with new AI-generated content?"
            );
            if (!confirmOverwrite) return;
        }

        setGenerating(true);
        setAiResult('');
        try {
            const res = await fetch('/api/notes-creator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse.name,
                    subject: activeSubject.name,
                    topic: activeTopic.name,
                    style: selectedStyle,
                    depth,
                    instructions: customInstructions,
                })
            });
            const data = await res.json();
            if (data.success) {
                setAiResult(data.notes || 'No notes were generated.');
                setActiveView('ai');
            }
        } catch (e) {
            console.error(e);
            setAiResult('Generation failed. Please try again.');
            setActiveView('ai');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(displayResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!currentUser || !displayResult) return;
        setSaved(false);

        try {
            const res = await fetch('/api/notes-creator/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    style: selectedStyle,
                    depth,
                    content: displayResult
                })
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                fetchSavedNotes();
            } else {
                alert("Failed to save notes.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save notes.");
        }
    };

    const handleDeleteSavedNote = async (id: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;
        try {
            const res = await fetch(`/api/notes-creator/save?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchSavedNotes();
            } else {
                alert("Failed to delete note.");
            }
        } catch (error) {
            console.error("Failed to delete note:", error);
        }
    };


    const handleDownloadPDF = async () => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16);
            pdf.text(`Notes: ${activeTopic?.name}`, 15, 20);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
            pdf.text(`${activeCourse?.name} | ${activeSubject?.name} | ${depth}`, 15, 28);
            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(displayResult, 180);
            let y = 38;
            for (let i = 0; i < lines.length; i++) {
                if (y > 280) { pdf.addPage(); y = 15; }
                pdf.text(lines[i], 15, y); y += 5.5;
            }
            pdf.save(`Notes_${activeTopic?.name?.replace(/\s+/g, '_') || 'Notes'}.pdf`);
        } catch (err) { console.error(err); }
    };

    const handleDownloadWord = () => {
        try {
            const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Notes - ${activeTopic?.name}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.6;margin:2cm;}
h1{color:#065f46;}h2{color:#047857;}h3{color:#059669;}p{margin:6pt 0;}
ul,ol{margin:6pt 0 6pt 20pt;}table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ccc;padding:6pt 8pt;}th{background:#ecfdf5;}</style></head>
<body><h1>Notes: ${activeTopic?.name}</h1>
<p><strong>Course:</strong> ${activeCourse?.name} | <strong>Subject:</strong> ${activeSubject?.name}</p>
<hr/>${displayResult.replace(/\n/g, '<br/>')}</body></html>`;
            const blob = new Blob([html], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Notes_${activeTopic?.name?.replace(/\s+/g, '_') || 'Notes'}.doc`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <FileEdit className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Notes Creator</h2>
                            <p className="text-emerald-300/80 text-sm font-medium">AI-powered departmental notes for your curriculum</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Topic Selector */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-emerald-50/50 to-white p-5 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" /> Select Topic
                        </h3>
                        <p className="text-sm text-slate-400 mt-0.5">Choose a course, subject, and topic to view its notes from the database.</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {loadingCourses ? (
                            <div className="flex items-center gap-3 text-slate-400 py-4">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Loading curriculum from database...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Course */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                    <select value={selectedCourseId}
                                        onChange={e => {
                                            setSelectedCourseId(e.target.value);
                                            const course = dbCourses.find(c => c.id === e.target.value);
                                            const firstSub = course?.subjects?.[0];
                                            setSelectedSubjectId(firstSub?.id || '');
                                            const firstTopic = firstSub?.topics?.find(t => t.hasNotes) || firstSub?.topics?.[0];
                                            setSelectedTopicId(firstTopic?.id || '');
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium">
                                        {dbCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                    <select value={selectedSubjectId}
                                        onChange={e => {
                                            setSelectedSubjectId(e.target.value);
                                            const sub = activeCourse?.subjects.find(s => s.id === e.target.value);
                                            const firstTopic = sub?.topics?.find(t => t.hasNotes) || sub?.topics?.[0];
                                            setSelectedTopicId(firstTopic?.id || '');
                                        }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium">
                                        {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                {/* Topic */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topic</label>
                                    <select value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium">
                                        {activeSubject?.topics.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.hasNotes ? '✅ ' : '⬜ '}{t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Active topic info badge */}
                        {activeTopic && (
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Viewing:</span>
                                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1.5 rounded-lg border border-emerald-200">
                                    {activeTopic.name}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-xs text-slate-500 font-medium">{activeTopic.section || activeSubject?.name}</span>
                                {activeTopic.hasNotes
                                    ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">✅ Notes in DB</span>
                                    : <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">⬜ No notes yet</span>
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Display */}
                {loadingNotes ? (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-10 flex items-center justify-center gap-3 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        <span className="text-sm font-medium">Loading notes from database...</span>
                    </div>
                ) : dbResult || aiResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg overflow-hidden">
                            {/* Notes header + actions */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border-b border-emerald-100">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <FileEdit className="w-5 h-5 text-emerald-600" />
                                            {activeView === 'db' ? 'Notes from Database' : 'AI Generated Notes'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
                                            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">{activeTopic?.name}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{activeCourse?.name}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{activeSubject?.name}</span>
                                        </div>
                                    </div>

                                    {/* Toggle DB / AI */}
                                    {dbResult && aiResult && (
                                        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                            <button onClick={() => setActiveView('db')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === 'db' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                Database
                                            </button>
                                            <button onClick={() => setActiveView('ai')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === 'ai' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                AI Generated
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-emerald-100">
                                    <button onClick={handleSave}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'}`}>
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>
                                    <button onClick={handleDownloadPDF}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <Download className="w-4 h-4 text-blue-600" /> PDF
                                    </button>
                                    <button onClick={handleDownloadWord}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        <FileDown className="w-4 h-4 text-indigo-600" /> Word
                                    </button>
                                    <button onClick={handleCopy}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Notes Content */}
                            <div className="p-6 prose prose-slate max-w-none prose-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{displayResult}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ) : selectedTopicId && !loadingNotes ? (
                    /* No DB notes — show AI generation panel */
                    <div className="bg-white rounded-3xl border border-amber-200 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-amber-100 bg-amber-50/50">
                            <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" /> No saved notes yet for this topic
                            </h3>
                            <p className="text-sm text-amber-600 mt-1">Generate AI notes below, or go to the Creator to bulk-generate and save notes.</p>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Style selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Note Style</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {NOTE_STYLES.map(style => (
                                        <label key={style.id} className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedStyle === style.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <input type="radio" name="noteStyle" value={style.id} checked={selectedStyle === style.id}
                                                    onChange={e => setSelectedStyle(e.target.value)}
                                                    className="w-4 h-4 text-emerald-600" />
                                                <span className={`text-sm font-bold ${selectedStyle === style.id ? 'text-emerald-800' : 'text-slate-700'}`}>{style.label}</span>
                                            </div>
                                            <span className="text-[12px] text-slate-500 pl-6">{style.desc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Depth */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Depth Level</label>
                                <div className="flex gap-2 flex-wrap">
                                    {NOTE_DEPTH.map(level => (
                                        <button key={level} onClick={() => setDepth(level)}
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${depth === level ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button onClick={handleGenerate} disabled={generating}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {generating ? 'Generating...' : 'Generate Notes with AI'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Regenerate with AI (when DB notes are showing) */}
                {dbResult && !generating && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <p className="text-sm font-bold text-slate-700">Want fresher notes with AI?</p>
                                <p className="text-xs text-slate-400 mt-0.5">Generate a new version with custom style and depth. Won't overwrite DB notes.</p>
                            </div>
                            <button onClick={handleGenerate} disabled={generating}
                                className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-emerald-600 text-white font-bold h-10 px-6 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm">
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                {generating ? 'Generating...' : 'Regenerate with AI'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Saved Notes Section */}
                <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                <BookOpen className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Saved Notes</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your previously generated notes</p>
                            </div>
                        </div>
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search saved notes..."
                                value={savedSearchQuery}
                                onChange={(e) => setSavedSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {isFetchingSaved ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                    ) : savedNotes.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                <BookOpen className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="text-slate-500 font-bold text-lg mb-1">Yet to save anything</h4>
                            <p className="text-slate-400 text-sm">Your saved notes will appear here.</p>
                        </div>
                    ) : (() => {
                        const filteredSavedNotes = savedNotes.filter(note => {
                            if (!savedSearchQuery) return true;
                            const search = savedSearchQuery.toLowerCase();
                            return (note.course || '').toLowerCase().includes(search) || (note.subject || '').toLowerCase().includes(search) || (note.topic || '').toLowerCase().includes(search) || (note.content || '').toLowerCase().includes(search);
                        });

                        if (filteredSavedNotes.length === 0) {
                            return (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-500 font-medium text-sm">No saved notes found matching your search.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-4">
                                {filteredSavedNotes.map((note) => (
                                    <div key={note.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg sm:text-xl">{note.topic || 'Untitled Note'}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                                                        {note.subject}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded-lg">
                                                        {note.depth}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium ml-1">
                                                        {new Date(note.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                <button
                                                    onClick={() => handleCopy()}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm shadow-sm"
                                                >
                                                    <Copy className="w-4 h-4" /> Copy
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSavedNote(note.id)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-red-600 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all text-sm shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 sm:p-6 bg-white prose prose-slate prose-sm sm:prose-base max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
