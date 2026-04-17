"use client";

import { useState } from 'react';
import { useCurriculumStore } from '../../../../store/curriculumStore';
import { Library, Edit2, CheckCircle2, BookOpen, Clock, FileText, ChevronRight } from 'lucide-react';

export default function AdminLMSDatabase() {
    const { coursesList, setCoursesList } = useCurriculumStore();

    const [selectedCourseId, setSelectedCourseId] = useState<string>(coursesList[0]?.id || '');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

    const currentCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];
    const currentSubject = currentCourse?.subjects.find(s => s.id === selectedSubjectId) || currentCourse?.subjects[0];
    const currentTopic = currentCourse?.subjects
        .flatMap(s => s.sections)
        .flatMap(sec => sec.topics)
        .find(t => t.id === editingTopicId);

    // Filter to only topics with generated data
    const getGeneratedTopics = (subjectId: string) => {
        const subject = currentCourse?.subjects.find(s => s.id === subjectId);
        if (!subject) return [];
        return subject.sections.flatMap(sec => sec.topics).filter(t => t.generatedNotes);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                        <Library className="w-8 h-8 text-emerald-600" />
                        LMS Database Console
                    </h2>
                    <p className="text-slate-500">Edit, approve, and manage all auto-generated content before it goes live to students.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 min-h-0 flex-1">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-80 flex flex-col gap-6 flex-shrink-0">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Filter by Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => {
                                setSelectedCourseId(e.target.value);
                                const c = coursesList.find(x => x.id === e.target.value);
                                setSelectedSubjectId(c?.subjects?.[0]?.id || '');
                                setEditingTopicId(null);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-semibold text-slate-700"
                        >
                            {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex-1 overflow-y-auto">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Subjects Overview</label>
                        <div className="space-y-2">
                            {currentCourse?.subjects.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No subjects created yet.</p>
                            ) : (
                                currentCourse?.subjects.map(s => {
                                    const generatedCount = getGeneratedTopics(s.id).length;
                                    return (
                                        <div key={s.id} className="space-y-2">
                                            <button
                                                onClick={() => { setSelectedSubjectId(s.id); setEditingTopicId(null); }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition font-semibold text-sm ${selectedSubjectId === s.id ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'hover:bg-slate-50 text-slate-700 border border-transparent'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 opacity-70" /> {s.name}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${generatedCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                                                    {generatedCount} Notes
                                                </span>
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm min-w-0 flex flex-col h-[75vh]">
                    {editingTopicId && currentTopic ? (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex items-center justify-between flex-shrink-0">
                                <div>
                                    <button onClick={() => setEditingTopicId(null)} className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-800 mb-2 flex items-center gap-1">
                                        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Library
                                    </button>
                                    <h3 className="text-2xl font-bold text-slate-900">{currentTopic.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{currentSubject?.name} • Live in Student App</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                        <CheckCircle2 className="w-4 h-4" /> Published
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {currentCourse.lmsNotesStructure.map(structItem => {
                                    const value = currentTopic.generatedNotes?.[structItem.id] || '';
                                    return (
                                        <div key={structItem.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-600" /> {structItem.title}
                                                </h4>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Template: {structItem.type}</span>
                                            </div>
                                            <div className="p-1">
                                                <textarea
                                                    className="w-full text-sm font-medium text-slate-700 bg-white border-0 outline-none p-4 min-h-[140px] focus:ring-2 focus:ring-emerald-500 transition-all resize-y"
                                                    value={value}
                                                    placeholder={`Enter ${structItem.title} content...`}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setCoursesList(prev => prev.map(c => {
                                                            if (c.id === currentCourse.id) {
                                                                return {
                                                                    ...c, subjects: c.subjects.map(s => {
                                                                        if (s.id === currentSubject?.id) {
                                                                            return {
                                                                                ...s, sections: s.sections.map(sec => {
                                                                                    return {
                                                                                        ...sec, topics: sec.topics.map(t => {
                                                                                            if (t.id === editingTopicId) {
                                                                                                return { ...t, generatedNotes: { ...t.generatedNotes, [structItem.id]: val } };
                                                                                            }
                                                                                            return t;
                                                                                        })
                                                                                    };
                                                                                })
                                                                            };
                                                                        }
                                                                        return s;
                                                                    })
                                                                };
                                                            }
                                                            return c;
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 h-full flex flex-col">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">{currentSubject ? `Library: ${currentSubject.name}` : 'Select a Subject'}</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2">
                                {!currentSubject ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Library className="w-16 h-16 text-slate-200 mb-4" />
                                        <p>Select a matching course and subject to view generated materials.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {getGeneratedTopics(currentSubject.id).length === 0 ? (
                                            <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                                                <Clock className="w-10 h-10 text-slate-200 mb-3" />
                                                <p className="text-sm font-medium text-slate-500">No content available.</p>
                                                <p className="text-xs mt-1">Generate content for {currentSubject.name} using the LMS Auto-Gen tool.</p>
                                            </div>
                                        ) : (
                                            getGeneratedTopics(currentSubject.id).map(t => (
                                                <div onClick={() => setEditingTopicId(t.id)} key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all group flex flex-col">
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <Edit2 className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 line-clamp-2">{t.name}</h4>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Database Live
                                                        </p>
                                                        <span className="text-xs font-semibold text-emerald-600 group-hover:underline">Review & Edit</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
