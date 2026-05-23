"use client";

import { useState, useEffect } from 'react';
import { Volume2, ChevronDown, Library, Loader2, BookOpenText, Sparkles, Globe, Save, Copy, CheckCircle, Database } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';

export default function VocabBuilderPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [numTerms, setNumTerms] = useState<number>(10);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [openedIndex, setOpenedIndex] = useState<number | null>(null);
    const [vocabList, setVocabList] = useState<any[]>([]);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);

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
        if (!activeTopic) return;
        if (!currentUser) return;
        const check = tokenService.checkAvailability(currentUser.id, 'Vocabulary Builder');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setLoading(true);
        setVocabList([]);
        setOpenedIndex(null);
        setSaved(false);

        try {
            const res = await fetch('/api/vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    numTerms: numTerms
                })
            });
            const data = await res.json();
            if (data.success && data.terms) {
                setVocabList(data.terms);
                if (data.geminiTokens) {
                    tokenService.processTransaction(currentUser.id, 'Vocabulary Builder', 'gemini-2.0-flash', data.geminiTokens * 2);
                } else {
                    tokenService.processTransaction(currentUser.id, 'Vocabulary Builder', 'gemini-2.0-flash');
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToDatabase = async () => {
        if (vocabList.length === 0) return;
        setSaving(true);
        try {
            const res = await fetch('/api/vocab/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    terms: vocabList
                })
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Failed to save to database. Please ensure the "saved_vocabulary" table exists.');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving to database.');
        } finally {
            setSaving(false);
        }
    };

    const playAudio = (text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-rose-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                                <BookOpenText className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Medical Vocabulary Builder</h2>
                                <p className="text-amber-300/80 text-sm font-medium">AI-powered terminology with audio pronunciation</p>
                            </div>
                        </div>
                        {vocabList.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl text-white/80 text-sm font-bold shadow-inner">
                                {vocabList.length} Terms Generated
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selector Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 flex-shrink-0 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Course</label>
                        <select
                            value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                        >
                            {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Subject</label>
                        <select
                            value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                        >
                            {activeCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>) || <option>No Subjects</option>}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Topic</label>
                        <select
                            value={selectedTopicId} onChange={e => setSelectedTopicId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                        >
                            {allTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>) || <option>No Topics</option>}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Number of Terms</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={numTerms}
                            onChange={e => setNumTerms(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                            placeholder="e.g. 10"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={handleGenerate}
                        disabled={!activeTopic || loading}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? 'Generating Terms...' : 'Generate Terms'}
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto pb-8 pr-2">
                {vocabList.length === 0 && !loading && (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white/50 rounded-3xl border border-slate-200/50">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl flex items-center justify-center border border-amber-100 shadow-sm">
                            <Library className="w-10 h-10 text-amber-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-slate-600">No vocabulary generated yet</p>
                            <p className="text-sm mt-1">Select a topic and number of terms, then click Generate.</p>
                        </div>
                    </div>
                )}
                {vocabList.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <div className="text-sm font-medium text-slate-500">
                            Results for: <span className="text-slate-800 font-bold">{activeTopic?.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveToDatabase}
                                disabled={saving}
                                className={`font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50'}`}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (saved ? <CheckCircle className="w-4 h-4" /> : <Database className="w-4 h-4" />)}
                                {saving ? 'Saving...' : (saved ? 'Saved to DB!' : 'Save to DB')}
                            </button>
                            <button
                                onClick={() => {
                                    const text = vocabList.map((v, i) => `${i+1}. ${v.term}: ${v.meaning}${v.example ? ` (Example: ${v.example})` : ''}${v.regional ? ` [${v.regional}]` : ''}`).join('\n');
                                    navigator.clipboard.writeText(text);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                            >
                                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy All'}
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    {vocabList.map((item, i) => (
                        <div key={i} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all duration-300 ${openedIndex === i ? 'border-amber-300 shadow-md ring-4 ring-amber-50' : 'border-slate-200 hover:shadow-md hover:border-amber-200'}`}>
                            <div
                                className="p-5 flex items-center justify-between cursor-pointer group"
                                onClick={() => setOpenedIndex(openedIndex === i ? null : i)}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold flex items-center justify-center text-lg border border-amber-200 shadow-sm">{i + 1}</span>
                                    <div>
                                        <span className="block font-bold text-xl text-slate-900 group-hover:text-amber-700 transition-colors">{item.term}</span>
                                        {item.category && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-amber-200"
                                        onClick={(e) => { e.stopPropagation(); playAudio(item.term); }}
                                        title="Play Pronunciation"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                    <div className={`p-2 rounded-xl transition-colors ${openedIndex === i ? 'bg-amber-50 text-amber-600' : 'text-slate-300 group-hover:text-amber-400'}`}>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openedIndex === i ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>

                            <div className={`grid transition-all duration-300 ease-in-out ${openedIndex === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="px-5 pb-5 pt-0 space-y-4">
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50/30 rounded-xl p-5 border border-amber-100/50 shadow-inner">
                                            <h4 className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <BookOpenText className="w-4 h-4" /> Meaning (Simple English)
                                            </h4>
                                            <p className="text-slate-800 font-medium text-base leading-relaxed">{item.meaning}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {item.example && (
                                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Example Usage</h4>
                                                    <p className="text-slate-600 italic leading-relaxed">&ldquo; {item.example} &rdquo;</p>
                                                </div>
                                            )}
                                            {item.regional && (
                                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl p-5 border border-emerald-100/50">
                                                    <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Globe className="w-4 h-4" /> Regional Language Equivalent
                                                    </h4>
                                                    <p className="text-emerald-800 font-semibold text-lg">{item.regional}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
