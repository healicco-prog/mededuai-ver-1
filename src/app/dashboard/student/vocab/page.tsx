"use client";

import { useState, useEffect } from 'react';
import { Volume2, ChevronDown, Library, Loader2, BookOpenText, Sparkles, Globe, Save, Copy, CheckCircle, Database, Search } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';

export default function VocabBuilderPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('Basic');
    const [numTerms, setNumTerms] = useState<number>(10);
    const [selectedLanguage, setSelectedLanguage] = useState('Hindi');

    const languages = ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Urdu', 'Spanish', 'French', 'Arabic', 'Mandarin', 'German', 'Russian', 'Japanese'];

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [vocabList, setVocabList] = useState<any[]>([]);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [allSavedVocab, setAllSavedVocab] = useState<any[]>([]);
    const [openedSavedTopic, setOpenedSavedTopic] = useState<string | null>(null);
    const [savedSearchQuery, setSavedSearchQuery] = useState('');
    const [generatedSearchQuery, setGeneratedSearchQuery] = useState('');

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
        const fetchAllSaved = async () => {
            try {
                const res = await fetch('/api/vocab/saved/all');
                const data = await res.json();
                if (data.success && data.savedRecords) {
                    setAllSavedVocab(data.savedRecords);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchAllSaved();
    }, []);

    const groupedVocab = allSavedVocab.reduce((acc: any, curr: any) => {
        if (!acc[curr.subject]) acc[curr.subject] = {};
        if (!acc[curr.subject][curr.topic]) acc[curr.subject][curr.topic] = curr.terms;
        return acc;
    }, {});

    const filteredGroupedVocab = Object.keys(groupedVocab).reduce((acc: any, subject) => {
        const matchingTopics = Object.keys(groupedVocab[subject]).filter(topic => 
            topic.toLowerCase().includes(savedSearchQuery.toLowerCase()) || 
            subject.toLowerCase().includes(savedSearchQuery.toLowerCase())
        );
        if (matchingTopics.length > 0) {
            acc[subject] = {};
            matchingTopics.forEach(topic => {
                acc[subject][topic] = groupedVocab[subject][topic];
            });
        }
        return acc;
    }, {});

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
        setGeneratedSearchQuery('');
        setSaved(false);

        try {
            const res = await fetch('/api/vocab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic: activeTopic?.name,
                    level: selectedLevel,
                    numTerms: numTerms,
                    language: selectedLanguage
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

    const handleLoadSaved = async () => {
        if (!activeTopic) return;
        setLoading(true);
        setVocabList([]);
        setGeneratedSearchQuery('');
        setSaved(false);
        try {
            const res = await fetch('/api/vocab/saved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: activeTopic?.name })
            });
            const data = await res.json();
            if (data.success && data.savedRecord && data.savedRecord.terms) {
                setVocabList(data.savedRecord.terms);
            } else {
                alert('No saved vocabulary found for this topic.');
            }
        } catch (error) {
            console.error(error);
            alert('Error loading from database.');
        } finally {
            setLoading(false);
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
        <div className="max-w-5xl mx-auto flex flex-col h-auto lg:h-[calc(100vh-7rem)]">
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
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
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
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Level</label>
                        <select
                            value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                        >
                            <option value="Basic">Basic</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
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
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Select Language</label>
                        <select
                            value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                        >
                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={handleLoadSaved}
                        disabled={!activeTopic || loading}
                        className="w-full sm:w-auto justify-center bg-white border border-slate-200 text-slate-700 font-bold h-12 px-8 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <Database className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                        <span className="whitespace-nowrap">Load Saved</span>
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!activeTopic || loading}
                        className="w-full sm:w-auto justify-center bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : <Sparkles className="w-5 h-5 flex-shrink-0" />}
                        <span className="whitespace-nowrap">{loading ? 'Generating...' : 'Generate Terms'}</span>
                    </button>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 lg:overflow-y-auto pb-8 lg:pr-2">
                {vocabList.length === 0 && !loading && allSavedVocab.length === 0 && (
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
                {vocabList.length === 0 && !loading && allSavedVocab.length > 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-200">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">Your Saved Vocabulary</h3>
                                    <p className="text-sm text-slate-500 font-medium">Browse previously saved terms below</p>
                                </div>
                            </div>
                            <div className="relative max-w-sm w-full">
                                <input
                                    type="text"
                                    placeholder="Search topic or subject..."
                                    value={savedSearchQuery}
                                    onChange={(e) => setSavedSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all shadow-sm"
                                />
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {Object.keys(filteredGroupedVocab).length === 0 ? (
                                <div className="text-center py-8 text-slate-500 font-medium">No topics found matching your search.</div>
                            ) : Object.keys(filteredGroupedVocab).map(subject => (
                                Object.keys(filteredGroupedVocab[subject]).map(topic => {
                                    const topicKey = `${subject}-${topic}`;
                                    const isOpen = openedSavedTopic === topicKey;
                                    return (
                                        <div key={topicKey} className="flex flex-col">
                                            <div 
                                                className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-200 transition-all"
                                                onClick={() => setOpenedSavedTopic(isOpen ? null : topicKey)}
                                            >
                                                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-800 border border-amber-100/50 flex-shrink-0">
                                                            <Library className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-lg sm:text-xl font-bold text-amber-800">{subject}</span>
                                                    </div>
                                                    
                                                    <div className="hidden sm:block w-1 h-6 bg-amber-400 rounded-full mx-2"></div>
                                                    
                                                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                        <span className="text-lg sm:text-xl font-bold text-slate-700 flex-1">{topic}</span>
                                                        <span className="bg-slate-100/80 text-slate-600 font-bold px-2.5 py-1 rounded-lg text-xs border border-slate-200 whitespace-nowrap">{filteredGroupedVocab[subject][topic].length} terms</span>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-xl transition-colors flex-shrink-0 ${isOpen ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400 group-hover:bg-amber-50'}`}>
                                                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>

                                            {/* Accordion Content */}
                                            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4 mb-6' : 'grid-rows-[0fr] opacity-0'}`}>
                                                <div className="overflow-hidden">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {filteredGroupedVocab[subject][topic].map((item: any, i: number) => (
                                                            <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col gap-3 hover:border-amber-300 hover:shadow-md hover:bg-white transition-all group">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <span className="font-bold text-lg text-slate-900 group-hover:text-amber-700 transition-colors">{item.term}</span>
                                                                        {item.category && <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{item.category}</span>}
                                                                    </div>
                                                                    <button
                                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                                        onClick={(e) => { e.stopPropagation(); playAudio(item.term); }}
                                                                        title="Play Pronunciation"
                                                                    >
                                                                        <Volume2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                                <p className="text-sm text-slate-600 flex-1 leading-relaxed">{item.meaning}</p>
                                                                {item.regional && (
                                                                    <div className="bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-2 rounded-xl mt-auto border border-emerald-100/50">
                                                                        {item.regional}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>
                )}
                {vocabList.length > 0 && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <div className="text-sm font-medium text-slate-500 w-full lg:w-auto">
                            Results for: <span className="text-slate-800 font-bold">{activeTopic?.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search terms..."
                                    value={generatedSearchQuery}
                                    onChange={(e) => setGeneratedSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 pl-10 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-300 text-sm font-medium transition-all"
                                />
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <button
                                onClick={handleSaveToDatabase}
                                disabled={saving}
                                className={`w-full sm:w-auto justify-center font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50'}`}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : (saved ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <Database className="w-4 h-4 flex-shrink-0" />)}
                                <span className="whitespace-nowrap">{saving ? 'Saving...' : (saved ? 'Saved!' : 'Save to DB')}</span>
                            </button>
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden ml-2" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>

                            <button
                                onClick={() => {
                                    const text = vocabList.map((v, i) => `${i+1}. ${v.term}: ${v.meaning}${v.example ? ` (Example: ${v.example})` : ''}${v.regional ? ` [${v.regional}]` : ''}`).join('\n');
                                    navigator.clipboard.writeText(text);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="w-full sm:w-auto justify-center bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                            >
                                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
                                <span className="whitespace-nowrap">{copied ? 'Copied!' : 'Copy All'}</span>
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    {vocabList.filter(item => 
                        item.term.toLowerCase().includes(generatedSearchQuery.toLowerCase()) || 
                        item.meaning.toLowerCase().includes(generatedSearchQuery.toLowerCase())
                    ).map((item, i) => (
                        <div key={i} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300`}>
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold flex items-center justify-center text-lg border border-amber-200 shadow-sm">{i + 1}</span>
                                    <div>
                                        <span className="block font-bold text-xl text-slate-900 transition-colors">{item.term}</span>
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
                                </div>
                            </div>

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
                    ))}
                    {vocabList.length > 0 && vocabList.filter(item => 
                        item.term.toLowerCase().includes(generatedSearchQuery.toLowerCase()) || 
                        item.meaning.toLowerCase().includes(generatedSearchQuery.toLowerCase())
                    ).length === 0 && (
                        <div className="text-center py-8 text-slate-500 font-medium">No terms found matching your search.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
