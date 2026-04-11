"use client";

import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Target, Plus, Search, Trash2, ArrowLeft, Loader2, Clock, Sparkles, Filter, ArrowUpDown, Copy, Share2, Mail, Globe, MessageCircle } from 'lucide-react';
import { useLessonPlanStore, LessonPlan, defaultLessonPlan } from '@/store/lessonPlanStore';
import { useCurriculumStore } from '@/store/curriculumStore';
import { useReactToPrint } from 'react-to-print';

const teachingAidsList = ['PowerPoint Presentation', 'Whiteboard / Blackboard', 'Models / Specimens', 'Charts / Diagrams', 'Videos / Animations', 'Handouts / Case scenarios'];
const assessmentMethodsList = ['Oral questions', 'MCQs', 'Case discussion', 'Short answer questions', 'Quiz'];

export default function LessonPlanGenerator() {
    const { lessonPlans, saveLessonPlan, deleteLessonPlan } = useLessonPlanStore();
    const coursesList = useCurriculumStore(s => s.coursesList);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // AI Modal State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiForm, setAiForm] = useState({ course: 'MBBS', subject: '', topic: '' });
    const [generating, setGenerating] = useState(false);

    const [activePlan, setActivePlan] = useState<LessonPlan>(defaultLessonPlan());
    const [tagInput, setTagInput] = useState('');

    // --- Autosave ---
    useEffect(() => {
        if (view === 'editor' && (activePlan.topicTitle || activePlan.generalInfo.topic)) {
            const timer = setTimeout(() => {
                saveLessonPlan(activePlan);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [activePlan, view, saveLessonPlan]);

    // --- Filtering & Sorting ---
    const allSubjects = Array.from(new Set(lessonPlans.map(p => p.generalInfo.subject).filter(Boolean)));

    const filteredPlans = lessonPlans
        .filter(p => {
            if (subjectFilter && p.generalInfo.subject !== subjectFilter) return false;
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                p.topicTitle?.toLowerCase().includes(q) ||
                p.generalInfo?.course?.toLowerCase().includes(q) ||
                p.generalInfo?.subject?.toLowerCase().includes(q) ||
                p.tags?.some(tag => tag.toLowerCase().includes(q)) ||
                p.learningObjectives?.some(obj => obj.toLowerCase().includes(q))
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

    // --- Handlers ---
    const handleCreateNew = () => {
        setActivePlan(defaultLessonPlan());
        setView('editor');
    };

    const handleEdit = (plan: LessonPlan) => {
        setActivePlan(JSON.parse(JSON.stringify(plan)));
        setView('editor');
    };

    const handleDuplicate = (plan: LessonPlan, e: React.MouseEvent) => {
        e.stopPropagation();
        const duplicate = JSON.parse(JSON.stringify(plan));
        duplicate.id = Date.now().toString();
        duplicate.createdAt = new Date().toISOString();
        duplicate.topicTitle = `${duplicate.topicTitle} (Copy)`;
        duplicate.generalInfo.topic = duplicate.topicTitle;
        saveLessonPlan(duplicate);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this lesson plan?")) {
            deleteLessonPlan(id);
        }
    };

    const printRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Lesson Plan - ${activePlan.topicTitle || 'Untitled'}`,
    });

    const handleExportPDF = (e?: React.MouseEvent, plan?: LessonPlan) => {
        if (e) e.stopPropagation();

        // If triggered directly from a card in the list view, load it into the editor first to mount the printable DOM
        if (plan && view === 'list') {
            setActivePlan(JSON.parse(JSON.stringify(plan)));
            setView('editor');
            setTimeout(() => {
                if (reactToPrintFn) reactToPrintFn();
            }, 300); // 300ms delay to ensure the DOM is fully rendered
            return;
        }

        if (printRef.current && reactToPrintFn) {
            reactToPrintFn();
        } else {
            window.print();
        }
    };

    const handleShare = (platform: 'email' | 'whatsapp' | 'linkedin', plan: LessonPlan, e: React.MouseEvent) => {
        e.stopPropagation();
        const text = `Check out my lesson plan on ${plan.generalInfo.topic || plan.topicTitle}: ${window.location.origin}/dashboard/teacher/lesson-plan`;
        if (platform === 'email') window.open(`mailto:?subject=Lesson Plan: ${plan.topicTitle}&body=${encodeURIComponent(text)}`);
        if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
        if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`);
    };

    const handleAIGenerate = async () => {
        if (!aiForm.course || !aiForm.subject || !aiForm.topic) {
            alert("Please enter Course, Subject, and Topic to generate with AI.");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch('/api/lesson-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiForm)
            });
            const data = await res.json();

            if (data.success && data.plan) {
                const newPlan = defaultLessonPlan();
                newPlan.topicTitle = aiForm.topic;
                newPlan.generalInfo.course = aiForm.course;
                newPlan.generalInfo.subject = aiForm.subject;
                newPlan.generalInfo.topic = aiForm.topic;
                newPlan.learningObjectives = data.plan.learningObjectives || newPlan.learningObjectives;
                newPlan.priorKnowledge = data.plan.priorKnowledge || newPlan.priorKnowledge;
                newPlan.teachingAids = data.plan.teachingAids || newPlan.teachingAids;
                newPlan.teachingPlan = data.plan.teachingPlan || newPlan.teachingPlan;
                newPlan.formativeAssessment = data.plan.formativeAssessment || newPlan.formativeAssessment;
                newPlan.summary = data.plan.summary || newPlan.summary;
                newPlan.takeHomeMessage = data.plan.takeHomeMessage || newPlan.takeHomeMessage;
                newPlan.suggestedReading = data.plan.suggestedReading || newPlan.suggestedReading;

                setActivePlan(newPlan);
                saveLessonPlan(newPlan); // Initial save
                setShowAIModal(false);
                setAiForm({ course: 'MBBS', subject: '', topic: '' });
                setView('editor');
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate with AI.");
        } finally {
            setGenerating(false);
        }
    };

    const updateGeneral = (field: string, value: string) => {
        setActivePlan(p => ({
            ...p,
            topicTitle: field === 'topic' ? value : p.topicTitle,
            generalInfo: { ...p.generalInfo, [field]: value }
        }));
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 print:max-w-none print:m-0 print:p-0">
            {/* --- LIST VIEW --- */}
            {view === 'list' && (
                <div className="space-y-6 print:hidden">
                    {/* Premium Gradient Header */}
                    <div className="relative overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-cyan-800 to-sky-900" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.25),transparent_60%)]" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-600/20 to-transparent rounded-full blur-2xl" />

                        <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                        <FileText className="w-6 h-6 text-teal-200" />
                                    </div>
                                    <p className="text-[10px] font-bold text-teal-300 uppercase tracking-[0.2em]">Department Admin</p>
                                </div>
                                <h2 className="text-3xl font-extrabold text-white tracking-tight">Teaching Database</h2>
                                <p className="text-teal-200/80 mt-1.5 font-medium">Manage and export your structured academic lesson plans.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAIModal(true)}
                                    className="bg-white/10 backdrop-blur-sm text-white font-bold h-12 px-6 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/20"
                                >
                                    <Sparkles className="w-5 h-5" /> Generate with AI
                                </button>
                                <button
                                    onClick={handleCreateNew}
                                    className="bg-white text-teal-900 font-bold h-12 px-6 rounded-xl hover:bg-teal-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Plus className="w-5 h-5" /> Create New Plan
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                        <div className="flex-1 flex items-center gap-3 min-w-[200px] border-r border-slate-100 pr-4">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by topic, course, or keyword..."
                                className="flex-1 bg-transparent outline-none text-slate-700 font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
                                className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
                            >
                                <option value="">All Subjects</option>
                                {allSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
                        >
                            <ArrowUpDown className="w-4 h-4" /> Date {sortOrder === 'desc' ? 'Desc' : 'Asc'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlans.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <p className="text-lg text-slate-500 font-medium">No lesson plans found. Create one manually or generate with AI.</p>
                                <div className="flex gap-4 mt-2">
                                    <button onClick={handleCreateNew} className="bg-blue-600 text-white font-bold h-10 px-6 rounded-xl hover:bg-blue-700 transition-all">Create New Plan</button>
                                    <button onClick={() => setShowAIModal(true)} className="bg-indigo-100 text-indigo-700 font-bold h-10 px-6 rounded-xl hover:bg-indigo-200 transition-all flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate with AI</button>
                                </div>
                            </div>
                        )}
                        {filteredPlans.map(plan => (
                            <div key={plan.id} onClick={() => handleEdit(plan)} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col select-none">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100/50 flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate text-lg" title={plan.topicTitle || 'Untitled Topic'}>{plan.topicTitle || 'Untitled Topic'}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(plan.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-6">
                                    <span className="bg-slate-100 px-2.5 py-1 rounded-md">{plan.generalInfo.course || 'Course'}</span>
                                    {plan.generalInfo.subject && <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">{plan.generalInfo.subject}</span>}
                                    {plan.generalInfo.teacherName && <span className="text-slate-400 capitalize normal-case text-xs font-medium ml-auto">By {plan.generalInfo.teacherName}</span>}
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(plan); }} className="text-sm font-bold text-blue-600 hover:underline">Edit Plan</button>
                                    <div className="flex items-center gap-1">
                                        <button onClick={(e) => handleDuplicate(plan, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>
                                        <div className="relative group/share">
                                            <button onClick={(e) => e.stopPropagation()} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Share"><Share2 className="w-4 h-4" /></button>
                                            <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-hover/share:flex flex-col gap-1 z-10 w-40">
                                                <button onClick={(e) => handleShare('email', plan, e)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-50 p-2 rounded-lg w-full text-left font-medium"><Mail className="w-4 h-4 text-slate-400" /> Email</button>
                                                <button onClick={(e) => handleShare('whatsapp', plan, e)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-emerald-50 text-emerald-700 p-2 rounded-lg w-full text-left font-medium"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
                                                <button onClick={(e) => handleShare('linkedin', plan, e)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-blue-50 text-blue-700 p-2 rounded-lg w-full text-left font-medium"><Globe className="w-4 h-4" /> LinkedIn</button>
                                                <div className="h-px bg-slate-100 my-1"></div>
                                                <button onClick={(e) => handleExportPDF(e, plan)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-50 p-2 rounded-lg w-full text-left font-medium"><Download className="w-4 h-4 text-slate-400" /> Export PDF</button>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleDelete(plan.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- AI GENERATOR MODAL --- */}
            {showAIModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
                            <h3 className="text-2xl font-bold flex items-center gap-2 text-indigo-900"><Sparkles className="w-6 h-6 text-indigo-500" /> Generate with AI</h3>
                            <p className="text-slate-500 text-sm mt-1">Automatically draft a rigorous MBBS lesson plan.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Course</label>
                                <input list="ai-course-list" value={aiForm.course} onChange={e => setAiForm({ ...aiForm, course: e.target.value })} placeholder="e.g. MBBS" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                                <datalist id="ai-course-list">
                                    {coursesList.map(c => <option key={c.id} value={c.name} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                                <input list="ai-subject-list" value={aiForm.subject} onChange={e => setAiForm({ ...aiForm, subject: e.target.value })} placeholder="e.g. Anatomy" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                                <datalist id="ai-subject-list">
                                    {(coursesList.find(c => c.name === aiForm.course)?.subjects || []).map(s => <option key={s.id} value={s.name} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Topic</label>
                                <input list="ai-topic-list" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} placeholder="e.g. Brachial Plexus" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" />
                                <datalist id="ai-topic-list">
                                    {(coursesList.find(c => c.name === aiForm.course)?.subjects.find(s => s.name === aiForm.subject)?.sections.flatMap(sec => sec.topics) || []).map(t => <option key={t.id} value={t.name} />)}
                                </datalist>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowAIModal(false)} disabled={generating} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                            <button onClick={handleAIGenerate} disabled={generating || !aiForm.subject || !aiForm.topic} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {generating ? 'Masterminding Plan...' : 'Generate AI Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDITOR VIEW --- */}
            {view === 'editor' && (
                <div className="space-y-6 flex flex-col min-h-screen">
                    <div className="flex items-center justify-between mb-4 print:hidden sticky top-0 z-20 bg-slate-50/90 backdrop-blur pb-4 pt-2 -mx-4 px-4 border-b border-slate-200/50">
                        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <ArrowLeft className="w-4 h-4" /> Back to List
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full hidden sm:flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Saving enabled
                            </span>
                            <button onClick={() => handleExportPDF()} className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                <Download className="w-4 h-4" /> Export PDF
                            </button>
                            {/* Explicit share drop down on editor */}
                            <div className="relative group/shareEditor border border-slate-200 shadow-sm rounded-xl">
                                <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl p-2 hidden group-hover/shareEditor:flex flex-col gap-1 z-10 w-40">
                                    <button onClick={(e) => handleShare('email', activePlan, e)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-50 p-2 rounded-lg w-full text-left font-medium"><Mail className="w-4 h-4 text-slate-400" /> Email</button>
                                    <button onClick={(e) => handleShare('whatsapp', activePlan, e)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-emerald-50 text-emerald-700 p-2 rounded-lg w-full text-left font-medium"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
                                    <button onClick={(e) => handleShare('linkedin', activePlan, e)} className="flex items-center gap-2 text-sm text-slate-700 hover:bg-blue-50 text-blue-700 p-2 rounded-lg w-full text-left font-medium"><Globe className="w-4 h-4" /> LinkedIn</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6 print:hidden">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Keyword Tags (For Searching Database)</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {activePlan.tags?.map((tag, i) => (
                                <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-indigo-100">
                                    {tag} <button onClick={() => setActivePlan(p => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) }))} className="hover:text-red-500">&times;</button>
                                </span>
                            ))}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); if (tagInput.trim()) { setActivePlan(p => ({ ...p, tags: [...(p.tags || []), tagInput.trim()] })); setTagInput(''); } }} className="flex gap-2 max-w-md">
                            <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag..." className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700">Add</button>
                        </form>
                    </div>

                    {/* PDF Printable Area */}
                    <div ref={printRef} className="bg-white p-10 md:p-14 rounded-3xl border border-slate-200 shadow-xl print:border-none print:shadow-none print:p-0">
                        <div className="text-center mb-10 border-b-4 border-double border-slate-800 pb-6 print:pb-4">
                            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">MBBS Lesson Plan</h1>
                            {activePlan.generalInfo.course && <p className="text-slate-500 font-bold tracking-widest mt-2">{activePlan.generalInfo.course}</p>}
                        </div>

                        <div className="space-y-12">
                            {/* 1. General Information */}
                            <section>
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">1. General Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 text-base whitespace-pre-wrap px-2">
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Course:</strong> <input value={activePlan.generalInfo.course} onChange={e => updateGeneral('course', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0 uppercase" placeholder="Enter course..." /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Department:</strong> <input value={activePlan.generalInfo.department} onChange={e => updateGeneral('department', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="Enter department..." /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Subject:</strong> <input value={activePlan.generalInfo.subject} onChange={e => updateGeneral('subject', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="Enter subject..." /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Topic:</strong> <input value={activePlan.generalInfo.topic} onChange={e => updateGeneral('topic', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold text-blue-700 print:border-none print:text-black print:bg-transparent print:p-0" placeholder="Enter topic..." /></div>
                                    <div className="flex flex-col gap-2 pb-2 col-span-1 md:col-span-2"><strong className="text-slate-700 leading-tight">Competency Addressed <span className="text-xs font-normal text-slate-400 print:hidden">(if applicable)</span>:</strong> <input value={activePlan.generalInfo.competency} onChange={e => updateGeneral('competency', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="Enter competency..." /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Year of Students:</strong> <input value={activePlan.generalInfo.yearOfStudents} onChange={e => updateGeneral('yearOfStudents', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="e.g. 1st Year" /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Number of Students:</strong> <input value={activePlan.generalInfo.numberOfStudents} onChange={e => updateGeneral('numberOfStudents', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="e.g. 100" /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Duration:</strong> <input value={activePlan.generalInfo.duration} onChange={e => updateGeneral('duration', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="e.g. 1 Hour" /></div>
                                    <div className="flex flex-col gap-2 pb-2 relative group/dropdown">
                                        <strong className="text-slate-700">Teaching Method:</strong>
                                        <select value={activePlan.generalInfo.teachingMethod} onChange={e => updateGeneral('teachingMethod', e.target.value)} className="w-full border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium cursor-pointer print:border-none print:bg-transparent print:appearance-none print:p-0">
                                            <option value="">Select Method...</option>
                                            <option value="Lecture">Lecture</option>
                                            <option value="Tutorial">Tutorial</option>
                                            <option value="Small Group Discussion">Small Group Discussion</option>
                                            <option value="Practical">Practical</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Date:</strong> <input value={activePlan.generalInfo.date} onChange={e => updateGeneral('date', e.target.value)} type="date" className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" /></div>
                                    <div className="flex flex-col gap-2 pb-2"><strong className="text-slate-700">Venue:</strong> <input value={activePlan.generalInfo.venue} onChange={e => updateGeneral('venue', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium print:border-none print:bg-transparent print:p-0" placeholder="Enter venue..." /></div>
                                    <div className="flex flex-col gap-2 pb-2 col-span-1 md:col-span-2"><strong className="text-slate-700">Name of Teacher:</strong> <input value={activePlan.generalInfo.teacherName} onChange={e => updateGeneral('teacherName', e.target.value)} className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold print:border-none print:bg-transparent print:p-0" placeholder="Enter teacher name..." /></div>
                                </div>
                            </section>

                            {/* 2. Learning Objectives */}
                            <section>
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-4 print:bg-gray-200 uppercase tracking-widest text-slate-800">2. Learning Objectives</h2>
                                <p className="text-base font-semibold mb-4 text-slate-800 italic">By the end of the session, the student should be able to:</p>
                                <ol className="list-decimal list-inside space-y-3 text-base pl-4 marker:font-bold marker:text-slate-400 group/list">
                                    {activePlan.learningObjectives.map((obj, i) => (
                                        <li key={i} className="flex group/item items-start gap-2">
                                            <span>{i + 1}.</span>
                                            <input value={obj} onChange={e => { const updated = [...activePlan.learningObjectives]; updated[i] = e.target.value; setActivePlan({ ...activePlan, learningObjectives: updated }) }} className="flex-1 border-b border-slate-200/50 hover:border-slate-300 focus:border-blue-500 outline-none print:border-none bg-transparent transition-colors" />
                                            <button onClick={() => { const updated = [...activePlan.learningObjectives]; updated.splice(i, 1); setActivePlan({ ...activePlan, learningObjectives: updated }) }} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                        </li>
                                    ))}
                                </ol>
                                <button onClick={() => setActivePlan(p => ({ ...p, learningObjectives: [...p.learningObjectives, ''] }))} className="mt-4 text-blue-600 font-bold text-sm flex items-center gap-1 print:hidden hover:underline bg-blue-50 px-3 py-1.5 rounded-lg w-fit ml-4 transition-colors">
                                    <Plus className="w-4 h-4" /> Add Objective
                                </button>
                            </section>

                            {/* 3. Prior Knowledge */}
                            <section>
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-4 print:bg-gray-200 uppercase tracking-widest text-slate-800">3. Prior Knowledge</h2>
                                <p className="text-base font-semibold mb-4 text-slate-800 italic">Students should already know:</p>
                                <ul className="list-disc list-inside space-y-3 text-base pl-4 marker:text-slate-400 group/list">
                                    {activePlan.priorKnowledge.map((item, i) => (
                                        <li key={i} className="flex group/item items-start gap-2">
                                            <span className="text-slate-400">•</span>
                                            <input value={item} onChange={e => { const updated = [...activePlan.priorKnowledge]; updated[i] = e.target.value; setActivePlan({ ...activePlan, priorKnowledge: updated }) }} className="flex-1 border-b border-slate-200/50 hover:border-slate-300 focus:border-blue-500 outline-none print:border-none bg-transparent transition-colors" />
                                            <button onClick={() => { const updated = [...activePlan.priorKnowledge]; updated.splice(i, 1); setActivePlan({ ...activePlan, priorKnowledge: updated }) }} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setActivePlan(p => ({ ...p, priorKnowledge: [...p.priorKnowledge, ''] }))} className="mt-4 text-blue-600 font-bold text-sm flex items-center gap-1 print:hidden hover:underline bg-blue-50 px-3 py-1.5 rounded-lg w-fit ml-4 transition-colors">
                                    <Plus className="w-4 h-4" /> Add Row
                                </button>
                            </section>

                            {/* 4. Teaching Aids */}
                            <section className="print:break-inside-avoid">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">4. Teaching Aids / Learning Resources</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-base pl-4">
                                    {teachingAidsList.map(aid => (
                                        <label key={aid} className="flex items-center gap-4 cursor-pointer group/cb">
                                            <input type="checkbox" checked={activePlan.teachingAids.selected.includes(aid)} onChange={(e) => {
                                                const sel = new Set(activePlan.teachingAids.selected);
                                                if (e.target.checked) sel.add(aid); else sel.delete(aid);
                                                setActivePlan(p => ({ ...p, teachingAids: { ...p.teachingAids, selected: Array.from(sel) } }));
                                            }} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 print:accent-black print:appearance-auto transition-colors" />
                                            <span className="group-hover/cb:text-blue-700 transition-colors font-medium">{aid}</span>
                                        </label>
                                    ))}
                                    <div className="col-span-1 sm:col-span-2 flex items-center gap-4 mt-2">
                                        <span className="font-bold text-slate-800">• Other:</span>
                                        <input value={activePlan.teachingAids.other} onChange={e => setActivePlan(p => ({ ...p, teachingAids: { ...p.teachingAids, other: e.target.value } }))} className="flex-1 border-b border-slate-300 focus:border-blue-500 outline-none print:border-none bg-transparent" />
                                    </div>
                                </div>
                            </section>

                            {/* 5. Teaching Plan Table */}
                            <section className="print:break-inside-auto">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">5. Teaching–Learning Plan</h2>
                                <div className="overflow-x-auto print:overflow-visible">
                                    <table className="w-full text-sm sm:text-base border-collapse border border-slate-300 shadow-sm print:shadow-none bg-white">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-800 font-bold print:bg-gray-100">
                                                <th className="border border-slate-300 p-3 text-left w-24">Time</th>
                                                <th className="border border-slate-300 p-3 text-left w-1/4">Teacher Activity</th>
                                                <th className="border border-slate-300 p-3 text-left w-1/4">Student Activity</th>
                                                <th className="border border-slate-300 p-3 text-left">Teaching Method</th>
                                                <th className="border border-slate-300 p-3 text-left">Teaching Aid</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activePlan.teachingPlan.map((row, i) => (
                                                <tr key={i} className="group/tr relative">
                                                    <td className="border border-slate-300 p-0 align-top"><input value={row.time} onChange={e => {
                                                        const newRows = [...activePlan.teachingPlan];
                                                        newRows[i].time = e.target.value;
                                                        setActivePlan({ ...activePlan, teachingPlan: newRows });
                                                    }} className="w-full h-full p-3 font-medium outline-none print:border-none min-w-[80px]" /></td>
                                                    <td className="border border-slate-300 p-0 align-top"><textarea value={row.teacherActivity} onChange={e => {
                                                        const newRows = [...activePlan.teachingPlan]; newRows[i].teacherActivity = e.target.value; setActivePlan({ ...activePlan, teachingPlan: newRows });
                                                    }} className="w-full min-h-[5rem] p-3 outline-none resize-none print:border-none leading-relaxed" /></td>
                                                    <td className="border border-slate-300 p-0 align-top"><textarea value={row.studentActivity} onChange={e => {
                                                        const newRows = [...activePlan.teachingPlan]; newRows[i].studentActivity = e.target.value; setActivePlan({ ...activePlan, teachingPlan: newRows });
                                                    }} className="w-full min-h-[5rem] p-3 outline-none resize-none print:border-none leading-relaxed" /></td>
                                                    <td className="border border-slate-300 p-0 align-top"><textarea value={row.teachingMethod} onChange={e => {
                                                        const newRows = [...activePlan.teachingPlan]; newRows[i].teachingMethod = e.target.value; setActivePlan({ ...activePlan, teachingPlan: newRows });
                                                    }} className="w-full min-h-[5rem] p-3 outline-none resize-none print:border-none font-medium text-slate-700" /></td>
                                                    <td className="border border-slate-300 p-0 align-top relative">
                                                        <textarea value={row.teachingAid} onChange={e => {
                                                            const newRows = [...activePlan.teachingPlan]; newRows[i].teachingAid = e.target.value; setActivePlan({ ...activePlan, teachingPlan: newRows });
                                                        }} className="w-full min-h-[5rem] p-3 pr-8 outline-none resize-none print:border-none font-medium text-slate-700" />
                                                        <button onClick={() => { const r = [...activePlan.teachingPlan]; r.splice(i, 1); setActivePlan({ ...activePlan, teachingPlan: r }) }} className="absolute top-2 right-2 opacity-0 group-hover/tr:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity p-1 bg-white rounded-md shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={() => setActivePlan(p => ({ ...p, teachingPlan: [...p.teachingPlan, { time: '', teacherActivity: '', studentActivity: '', teachingMethod: '', teachingAid: '' }] }))} className="mt-4 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm flex items-center gap-2 print:hidden px-4 py-2 rounded-xl transition-colors">
                                    <Plus className="w-4 h-4" /> Add Row
                                </button>
                            </section>

                            {/* 6. Formative Assessment */}
                            <section className="print:break-inside-avoid">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">6. Formative Assessment</h2>
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 print:border-none print:p-0">
                                    <p className="text-base font-semibold mb-4 text-slate-800 italic">Questions or activities used during the session:</p>
                                    <ol className="list-decimal list-inside space-y-3 text-base pl-4 mb-8 marker:font-bold marker:text-slate-400">
                                        {activePlan.formativeAssessment.questions.map((q, i) => (
                                            <li key={i} className="flex group/item items-start gap-2">
                                                <span>{i + 1}.</span>
                                                <input value={q} onChange={e => { const updated = [...activePlan.formativeAssessment.questions]; updated[i] = e.target.value; setActivePlan({ ...activePlan, formativeAssessment: { ...activePlan.formativeAssessment, questions: updated } }) }} className="flex-1 border-b border-slate-200 hover:border-slate-300 focus:border-blue-500 outline-none print:border-none bg-transparent transition-colors" />
                                                <button onClick={() => { const updated = [...activePlan.formativeAssessment.questions]; updated.splice(i, 1); setActivePlan({ ...activePlan, formativeAssessment: { ...activePlan.formativeAssessment, questions: updated } }) }} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                            </li>
                                        ))}
                                    </ol>
                                    <button onClick={() => setActivePlan(p => ({ ...p, formativeAssessment: { ...p.formativeAssessment, questions: [...p.formativeAssessment.questions, ''] } }))} className="mt-2 text-blue-600 font-bold text-sm flex items-center gap-1 print:hidden hover:underline bg-white px-3 py-1.5 rounded-lg w-fit transition-colors shadow-sm mb-8 border border-slate-100">
                                        <Plus className="w-4 h-4" /> Add Assessment Question
                                    </button>

                                    <h3 className="font-bold text-slate-800 mb-4 uppercase tracking-widest text-sm border-t pt-8 border-slate-200 print:border-t-0 print:pt-0">Assessment Method:</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 text-base pl-2">
                                        {assessmentMethodsList.map(method => (
                                            <label key={method} className="flex items-center gap-3 cursor-pointer group/cb">
                                                <input type="checkbox" checked={activePlan.formativeAssessment.methods.includes(method)} onChange={(e) => {
                                                    const sel = new Set(activePlan.formativeAssessment.methods);
                                                    if (e.target.checked) sel.add(method); else sel.delete(method);
                                                    setActivePlan(p => ({ ...p, formativeAssessment: { ...p.formativeAssessment, methods: Array.from(sel) } }));
                                                }} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 print:accent-black print:appearance-auto transition-colors" />
                                                <span className="group-hover/cb:text-blue-700 transition-colors font-medium">{method}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* 7. Summary */}
                            <section className="print:break-inside-avoid">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">7. Summary of Key Points</h2>
                                <ul className="list-disc list-inside space-y-3 text-base pl-4 marker:text-slate-400">
                                    {activePlan.summary.map((item, i) => (
                                        <li key={i} className="flex group/item items-start gap-2">
                                            <span className="text-slate-400">•</span>
                                            <input value={item} onChange={e => { const updated = [...activePlan.summary]; updated[i] = e.target.value; setActivePlan({ ...activePlan, summary: updated }) }} className="flex-1 border-b border-slate-200/50 hover:border-slate-300 focus:border-blue-500 outline-none print:border-none bg-transparent font-medium text-slate-800 transition-colors" />
                                            <button onClick={() => { const updated = [...activePlan.summary]; updated.splice(i, 1); setActivePlan({ ...activePlan, summary: updated }) }} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setActivePlan(p => ({ ...p, summary: [...p.summary, ''] }))} className="mt-4 text-blue-600 font-bold text-sm flex items-center gap-1 print:hidden hover:underline bg-blue-50 px-3 py-1.5 rounded-lg w-fit ml-4 transition-colors">
                                    <Plus className="w-4 h-4" /> Add Row
                                </button>
                            </section>

                            {/* 8. Take-Home */}
                            <section className="print:break-inside-avoid">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">8. Take-Home Message</h2>
                                <textarea
                                    value={activePlan.takeHomeMessage}
                                    onChange={e => setActivePlan({ ...activePlan, takeHomeMessage: e.target.value })}
                                    className="w-full min-h-[120px] bg-indigo-50/50 border border-indigo-100 p-6 outline-none resize-y rounded-2xl text-lg font-medium text-indigo-900 leading-relaxed print:border-none print:p-0 print:bg-transparent shadow-sm"
                                    placeholder="Enter your concise core message here..."
                                />
                            </section>

                            {/* 9. Suggested Reading */}
                            <section className="print:break-inside-avoid">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">9. Suggested Reading</h2>
                                <p className="text-base font-semibold mb-4 text-slate-800 italic">Textbooks / References:</p>
                                <ol className="list-decimal list-inside space-y-3 text-base pl-4 marker:font-bold marker:text-slate-400">
                                    {activePlan.suggestedReading.map((item, i) => (
                                        <li key={i} className="flex group/item items-start gap-2">
                                            <span>{i + 1}.</span>
                                            <input value={item} onChange={e => { const updated = [...activePlan.suggestedReading]; updated[i] = e.target.value; setActivePlan({ ...activePlan, suggestedReading: updated }) }} className="flex-1 border-b border-slate-200/50 hover:border-slate-300 focus:border-blue-500 outline-none print:border-none bg-transparent italic font-medium transition-colors text-slate-700" />
                                            <button onClick={() => { const updated = [...activePlan.suggestedReading]; updated.splice(i, 1); setActivePlan({ ...activePlan, suggestedReading: updated }) }} className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 print:hidden transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                        </li>
                                    ))}
                                </ol>
                                <button onClick={() => setActivePlan(p => ({ ...p, suggestedReading: [...p.suggestedReading, ''] }))} className="mt-4 text-blue-600 font-bold text-sm flex items-center gap-1 print:hidden hover:underline bg-blue-50 px-3 py-1.5 rounded-lg w-fit ml-4 transition-colors">
                                    <Plus className="w-4 h-4" /> Add Reference
                                </button>
                            </section>

                            {/* 10. Feedback */}
                            <section className="print:break-inside-avoid mb-20">
                                <h2 className="text-xl font-bold bg-slate-100 px-4 py-2.5 border-l-4 border-slate-800 mb-6 print:bg-gray-200 uppercase tracking-widest text-slate-800">10. Feedback / Reflection by Teacher <span className="text-sm text-slate-400 normal-case font-medium print:hidden">(Optional)</span></h2>
                                <div className="space-y-6 text-base font-semibold text-slate-800 bg-slate-50 p-6 rounded-2xl border border-slate-200 print:bg-transparent print:border-none print:p-0">
                                    <div>
                                        <label className="block mb-3 text-emerald-700 font-bold uppercase tracking-wider text-sm flex items-center gap-2">What went well:</label>
                                        <textarea value={activePlan.feedback.wentWell} onChange={e => setActivePlan(p => ({ ...p, feedback: { ...p.feedback, wentWell: e.target.value } }))} className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500 font-normal resize-y min-h-[100px] print:border-none print:p-0 print:bg-transparent shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block mb-3 text-amber-700 font-bold uppercase tracking-wider text-sm flex items-center gap-2">What can be improved:</label>
                                        <textarea value={activePlan.feedback.toImprove} onChange={e => setActivePlan(p => ({ ...p, feedback: { ...p.feedback, toImprove: e.target.value } }))} className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-amber-500 font-normal resize-y min-h-[100px] print:border-none print:p-0 print:bg-transparent shadow-sm" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Global print styles to strip all background styling and ensure crisp academic document format */}
            <style jsx global>{`
                @media print {
                    @page { size: auto; margin: 20mm 15mm; }
                    body { 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background-color: white !important;
                    }
                    input, textarea, select { 
                        appearance: none !important; 
                        border: none !important; 
                        background: transparent !important; 
                        padding: 0 !important;
                        box-shadow: none !important;
                        color: black !important;
                    }
                    input[type="checkbox"] {
                        display: inline-block !important;
                        position: relative;
                        top: 2px;
                    }
                    ::-webkit-input-placeholder { color: transparent !important; }
                    :-moz-placeholder { color: transparent !important; }
                    ::-moz-placeholder { color: transparent !important; }
                    :-ms-input-placeholder { color: transparent !important; }
                    .page-break-auto { page-break-inside: auto; }
                    .page-break-inside-avoid { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
