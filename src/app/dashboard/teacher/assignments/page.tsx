"use client";

import { useState, useEffect, useRef } from 'react';
import { FilePenLine as FileEdit, Loader2, Sparkles, RefreshCcw, Download, Copy, CheckCircle, Save, Share2, FileDown, X, Plus, Search, History, ClipboardType, Trash2 } from 'lucide-react';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ASSIGNMENT_TYPES = [
    'Case scenario',
    'Role Play',
    'OSPE Station',
    'OPSC Station',
    'Problem-Based Learning (PBL)',
    'Mini-CEX',
    'DOPS',
    'Other'
];

export default function AssignmentsPage() {
    const { coursesList } = useCurriculumStore();
    const currentUser = useUserStore(state => state.users[0]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [topic, setTopic] = useState('');
    const [competency, setCompetency] = useState('');
    const [assignmentType, setAssignmentType] = useState(ASSIGNMENT_TYPES[0]);
    const [criteria, setCriteria] = useState('');

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [shared, setShared] = useState(false);

    const [savedAssignments, setSavedAssignments] = useState<any[]>([]);
    const [savedSearchQuery, setSavedSearchQuery] = useState('');
    const [isFetchingSaved, setIsFetchingSaved] = useState(true);

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

    const fetchSavedAssignments = async () => {
        setIsFetchingSaved(true);
        try {
            const res = await fetch('/api/assignments/saved/all');
            const data = await res.json();
            if (data.success) {
                setSavedAssignments(data.savedRecords || []);
            }
        } catch (error) {
            console.error("Failed to fetch saved assignments:", error);
        } finally {
            setIsFetchingSaved(false);
        }
    };

    useEffect(() => {
        fetchSavedAssignments();
    }, []);

    const handleGenerate = async () => {
        if (!currentUser) return;
        if (!topic.trim()) {
            alert('Please add a topic to generate an assignment.');
            return;
        }
        const check = tokenService.checkAvailability(currentUser.id, 'Assignments');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setLoading(true);
        setResult('');
        setSaved(false);

        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic,
                    competency,
                    type: assignmentType,
                    criteria
                })
            });
            const data = await res.json();

            if (data.success) {
                setResult(data.content || 'No assignment was generated.');
                if (data.geminiTokens) {
                    tokenService.processTransaction(currentUser.id, 'Assignments', 'gemini-2.0-flash', data.geminiTokens * 2);
                } else {
                    tokenService.processTransaction(currentUser.id, 'Assignments', 'gemini-2.0-flash');
                }
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

    const handleSave = async () => {
        if (!currentUser || !result) return;
        setSaved(false);

        try {
            const res = await fetch('/api/assignments/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course: activeCourse?.name,
                    subject: activeSubject?.name,
                    topic,
                    competency,
                    type: assignmentType,
                    criteria,
                    content: result
                })
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                fetchSavedAssignments();
            } else {
                if (data.error && data.error.includes("run migrations")) {
                    alert('Table "saved_assignments" does not exist in Supabase. Please ask the developer to create it.');
                } else {
                    alert("Failed to save assignment.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save assignment.");
        }
    };

    const handleDeleteSavedAssignment = async (id: string) => {
        if (!confirm("Are you sure you want to delete this assignment?")) return;
        try {
            const res = await fetch(`/api/assignments/save?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchSavedAssignments();
            } else {
                alert("Failed to delete assignment.");
            }
        } catch (error) {
            console.error("Failed to delete assignment:", error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Assignment: ${topic}`,
            text: `${activeCourse?.name} - ${activeSubject?.name}\n\n${result.substring(0, 500)}...`,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                const shareText = `📝 Assignment: ${topic}\n📚 ${activeCourse?.name} | ${activeSubject?.name}\n\n${result}`;
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
                            <ClipboardType className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Assignments Generator</h2>
                            <p className="text-emerald-300/80 text-sm font-medium">Create tailored medical assignments</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Configuration Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-emerald-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardType className="w-5 h-5 text-emerald-600" /> Assignment Details
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

                        {/* Topic Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="e.g. Brachial Plexus"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all"
                            />
                        </div>

                        {/* Competency Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Competency (if any) with No:</label>
                            <input
                                type="text"
                                value={competency}
                                onChange={e => setCompetency(e.target.value)}
                                placeholder="e.g. AN 10.1 Describe the boundaries..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all"
                            />
                        </div>

                        {/* Assignment Type Select */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">What assignment you want to create</label>
                            <select value={assignmentType} onChange={e => setAssignmentType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all">
                                {ASSIGNMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Criteria Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">What criteria it has to follow (if any)</label>
                            <textarea
                                value={criteria} onChange={e => setCriteria(e.target.value)}
                                placeholder="e.g. Must include communication skills checklist, must be for 10 marks..."
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium min-h-[80px] transition-all"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !topic.trim()}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Generating...' : 'Generate Assignment'}
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
                                            <FileEdit className="w-5 h-5 text-emerald-600" /> Generated Assignment
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                                            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg">{topic}</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="font-bold text-slate-500">{assignmentType}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Row */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-emerald-100">
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
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>

                                    <button
                                        onClick={() => handleCopy(result)}
                                        className="bg-white text-slate-700 font-bold h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm"
                                    >
                                        {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>

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

                        <div className="text-center pt-2">
                            <button
                                onClick={handleGenerate}
                                className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RefreshCcw className="w-4 h-4" /> Regenerate
                            </button>
                        </div>
                    </div>
                )}

                {/* Saved Assignments Section */}
                <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                <History className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Saved Assignments</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your previously generated assignments</p>
                            </div>
                        </div>
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by keywords..."
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
                    ) : savedAssignments.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                <ClipboardType className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="text-slate-500 font-bold text-lg mb-1">Yet to save anything</h4>
                            <p className="text-slate-400 text-sm">Your saved assignments will appear here.</p>
                        </div>
                    ) : (() => {
                        const filteredSaved = savedAssignments.filter(record => {
                            if (!savedSearchQuery) return true;
                            const search = savedSearchQuery.toLowerCase();
                            return (record.course || '').toLowerCase().includes(search) || 
                                   (record.subject || '').toLowerCase().includes(search) || 
                                   (record.topic || '').toLowerCase().includes(search) || 
                                   (record.competency || '').toLowerCase().includes(search) || 
                                   (record.assignment_type || '').toLowerCase().includes(search) || 
                                   (record.content || '').toLowerCase().includes(search);
                        });

                        if (filteredSaved.length === 0) {
                            return (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-500 font-medium text-sm">No saved assignments found matching your search.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-4">
                                {filteredSaved.map((record) => (
                                    <div key={record.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg sm:text-xl">{record.topic || 'Untitled Assignment'}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                                                        {record.assignment_type}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded-lg">
                                                        {record.subject}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium ml-1">
                                                        {new Date(record.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                <button onClick={() => window.print()} className="font-bold h-9 px-4 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden" title="Share as PDF">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                                    PDF
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(record.content)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm shadow-sm"
                                                >
                                                    <Copy className="w-4 h-4" /> Copy
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSavedAssignment(record.id)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-red-600 font-bold h-9 px-4 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all text-sm shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4 sm:p-6 bg-white prose prose-slate prose-sm sm:prose-base max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{record.content}</ReactMarkdown>
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
