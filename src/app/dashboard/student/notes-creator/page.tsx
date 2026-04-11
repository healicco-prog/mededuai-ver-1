"use client";

import { useState, useEffect, useRef } from 'react';
import { FileEdit, Loader2, Sparkles, RefreshCcw, Download, Copy, CheckCircle, BookOpen, Save, Share2, FileDown, X, Plus } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SavedNotesModal from '@/components/SavedNotesModal';

const NOTE_STYLES = [
    { id: 'comprehensive', label: 'Comprehensive Notes', desc: 'Detailed, textbook-style notes covering all aspects' },
    { id: 'concise', label: 'Concise Summary', desc: 'Focused bullet-point notes for quick revision' },
    { id: 'cornell', label: 'Cornell Method', desc: 'Structured notes with cues, notes, and summary sections' },
    { id: 'mind_map', label: 'Mind Map Text', desc: 'Hierarchical concept mapping in text format' },
];

const NOTE_DEPTH = ['Basic', 'Intermediate', 'Advanced', 'Exam-Ready'];

export default function NotesCreatorPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const [topicsList, setTopicsList] = useState<string[]>([]);
    const [selectedStyle, setSelectedStyle] = useState('comprehensive');
    const [depth, setDepth] = useState('Intermediate');
    const [customInstructions, setCustomInstructions] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [shared, setShared] = useState(false);
    const [showSavedModal, setShowSavedModal] = useState(false);
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

    const handleAddTopic = () => {
        const trimmed = topicInput.trim();
        if (trimmed && !topicsList.includes(trimmed)) {
            setTopicsList(prev => [...prev, trimmed]);
            setTopicInput('');
            topicInputRef.current?.focus();
        }
    };

    const handleTopicKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTopic();
        }
    };

    const handleRemoveTopic = (topic: string) => {
        setTopicsList(prev => prev.filter(t => t !== topic));
    };

    const handleGenerate = async () => {
        if (!currentUser) return;
        if (topicsList.length === 0 && !topicInput.trim()) {
            alert('Please add at least one topic to generate notes.');
            return;
        }
        const check = tokenService.checkAvailability(currentUser.id, 'Notes Creator');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        // If there's text in the input but not yet added, add it
        const finalTopics = [...topicsList];
        if (topicInput.trim() && !finalTopics.includes(topicInput.trim())) {
            finalTopics.push(topicInput.trim());
            setTopicsList(finalTopics);
            setTopicInput('');
        }

        let appendMode = false;
        if (result) {
            const overwrite = window.confirm("You already have generated notes. Do you want to overwrite them?\n\nClick 'OK' to replace them, or 'Cancel' to append the new notes at the bottom.");
            appendMode = !overwrite;
        }

        setLoading(true);
        if (!appendMode) {
            setResult('');
        }
        setSaved(false);

        try {
            const res = await fetch('/api/notes-creator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: finalTopics.join(', '),
                    style: selectedStyle,
                    depth,
                    instructions: customInstructions
                })
            });
            const data = await res.json();

            if (data.success) {
                if (appendMode) {
                    setResult(prev => prev + '\n\n---\n\n' + (data.notes || 'No new notes were generated.'));
                } else {
                    setResult(data.notes || 'No notes were generated.');
                }
                tokenService.processTransaction(currentUser.id, 'Notes Creator', 'gemini-2.5-flash');
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

    const handleSave = () => {
        try {
            const savedNotes = JSON.parse(localStorage.getItem('mededuai_saved_notes') || '[]');
            savedNotes.push({
                id: Date.now(),
                course: activeCourse?.name,
                subject: activeSubject?.name,
                topics: topicsList.join(', '),
                style: selectedStyle,
                depth,
                content: result,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('mededuai_saved_notes', JSON.stringify(savedNotes));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text(`Notes: ${topicsList.join(', ')}`, 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`${activeCourse?.name} | ${activeSubject?.name} | ${depth}`, 15, 28);

            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(result, 180);
            let y = 38;
            const pageHeight = 280;

            for (let i = 0; i < lines.length; i++) {
                if (y > pageHeight) {
                    pdf.addPage();
                    y = 15;
                }
                pdf.text(lines[i], 15, y);
                y += 5.5;
            }

            pdf.save(`Notes_${topicsList[0]?.replace(/\s+/g, '_') || 'Notes'}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadWord = () => {
        try {
            const htmlContent = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Notes - ${topicsList.join(', ')}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.6;margin:2cm;}
h1{color:#065f46;font-size:18pt;}h2{color:#047857;font-size:14pt;}h3{color:#059669;font-size:12pt;}
p{margin:6pt 0;}ul,ol{margin:6pt 0 6pt 20pt;}table{border-collapse:collapse;width:100%;margin:10pt 0;}
th,td{border:1px solid #ccc;padding:6pt 8pt;text-align:left;}th{background:#ecfdf5;}</style></head>
<body><h1>Notes: ${topicsList.join(', ')}</h1>
<p><strong>Course:</strong> ${activeCourse?.name} | <strong>Subject:</strong> ${activeSubject?.name} | <strong>Depth:</strong> ${depth}</p>
<hr/>${result.replace(/\n/g, '<br/>')}</body></html>`;

            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Notes_${topicsList[0]?.replace(/\s+/g, '_') || 'Notes'}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Notes: ${topicsList.join(', ')}`,
            text: `${activeCourse?.name} - ${activeSubject?.name}\n\n${result.substring(0, 500)}...`,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy a shareable text to clipboard
                const shareText = `📝 Notes: ${topicsList.join(', ')}\n📚 ${activeCourse?.name} | ${activeSubject?.name}\n\n${result}`;
                await navigator.clipboard.writeText(shareText);
                setShared(true);
                setTimeout(() => setShared(false), 3000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
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
                            <p className="text-emerald-300/80 text-sm font-medium">AI-powered study notes tailored to your curriculum</p>
                        </div>
                    </div>
                    
                    <div className="absolute top-6 right-6 z-10 hidden sm:block">
                        <button 
                            onClick={() => setShowSavedModal(true)} 
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border border-white/20"
                        >
                            <BookOpen className="w-4 h-4" /> Saved Notes Library
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Saved Notes Button */}
            <div className="sm:hidden mb-4">
                <button 
                    onClick={() => setShowSavedModal(true)} 
                    className="w-full flex justify-center items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                    <BookOpen className="w-4 h-4" /> View Saved Notes Library
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Configuration Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-emerald-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" /> Notes Configuration
                        </h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Course & Subject Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Course</label>
                                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all">
                                    {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject</label>
                                <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all">
                                    {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) || <option>No Subjects</option>}
                                </select>
                            </div>
                        </div>

                        {/* Topic Input - Free text with tags */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topics</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-300 transition-all">
                                {/* Topic Tags */}
                                {topicsList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {topicsList.map((topic, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 group hover:bg-emerald-200 transition-all">
                                                {topic}
                                                <button onClick={() => handleRemoveTopic(topic)} className="text-emerald-500 hover:text-red-500 transition-colors ml-0.5">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {/* Input Row */}
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={topicInputRef}
                                        type="text"
                                        value={topicInput}
                                        onChange={e => setTopicInput(e.target.value)}
                                        onKeyDown={handleTopicKeyDown}
                                        placeholder={topicsList.length > 0 ? "Add another topic..." : "Type a topic and press Enter or click + to add, e.g., 'Brachial Plexus'"}
                                        className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                    />
                                    <button
                                        onClick={handleAddTopic}
                                        disabled={!topicInput.trim()}
                                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Press Enter or click + to add multiple topics. Notes will cover all added topics.</p>
                        </div>

                        {/* Note Style */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Note Style</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {NOTE_STYLES.map(style => (
                                    <label key={style.id} className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedStyle === style.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input type="radio" name="noteStyle" value={style.id}
                                                checked={selectedStyle === style.id} onChange={e => setSelectedStyle(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                            />
                                            <span className={`text-sm font-bold ${selectedStyle === style.id ? 'text-emerald-800' : 'text-slate-700'}`}>{style.label}</span>
                                        </div>
                                        <span className="text-[12px] text-slate-500 pl-6">{style.desc}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Depth Level */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Depth Level</label>
                            <div className="flex gap-2">
                                {NOTE_DEPTH.map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setDepth(level)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${depth === level
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-emerald-200'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Additional */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Instructions</label>
                            <textarea
                                value={customInstructions} onChange={e => setCustomInstructions(e.target.value)}
                                placeholder="e.g., Focus on clinical applications, include diagrams description, add mnemonics..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium min-h-[80px] transition-all"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || (topicsList.length === 0 && !topicInput.trim())}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Creating Notes...' : 'Create Notes'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                        <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 border-b border-emerald-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <FileEdit className="w-5 h-5 text-emerald-600" /> Generated Notes
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                                            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">{topicsList.join(', ')}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{depth}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{NOTE_STYLES.find(s => s.id === selectedStyle)?.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Row */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-emerald-100">
                                    {/* Save */}
                                    <button
                                        onClick={handleSave}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${
                                            saved
                                                ? 'bg-emerald-600 text-white border border-emerald-600'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
                                        }`}
                                    >
                                        {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Saved!' : 'Save'}
                                    </button>

                                    {/* Download PDF */}
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-2 text-sm shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-blue-600" /> Download PDF
                                    </button>

                                    {/* Download Word */}
                                    <button
                                        onClick={handleDownloadWord}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-2 text-sm shadow-sm"
                                    >
                                        <FileDown className="w-4 h-4 text-indigo-600" /> Download Word
                                    </button>

                                    {/* Copy */}
                                    <button
                                        onClick={() => handleCopy(result)}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>

                                    {/* Share */}
                                    <button
                                        onClick={handleShare}
                                        className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${
                                            shared
                                                ? 'bg-violet-600 text-white border border-violet-600'
                                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-violet-50 hover:border-violet-300'
                                        }`}
                                    >
                                        {shared ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4 text-violet-600" />}
                                        {shared ? 'Copied for sharing!' : 'Share'}
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 prose prose-slate max-w-none prose-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Regenerate */}
                        <div className="text-center pt-2">
                            <button
                                onClick={handleGenerate}
                                className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RefreshCcw className="w-4 h-4" /> Regenerate with same parameters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <SavedNotesModal isOpen={showSavedModal} onClose={() => setShowSavedModal(false)} />
        </div>
    );
}
