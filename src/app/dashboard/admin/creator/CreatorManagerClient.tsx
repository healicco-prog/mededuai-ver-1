"use client";

import { useState, useRef } from 'react';
import { BrainCircuit, Play, CheckCircle2, RotateCcw, AlertTriangle, Plus, Sparkles, BookOpen, Layers, Trash2, Edit2, Upload, X, Check, GripVertical } from 'lucide-react';

import { useCurriculumStore, type Course, type Subject, type Section, type Topic, type LMSNotesStructureItem, defaultLMSStructure } from '../../../../store/curriculumStore';

export default function LMSCreatorAdmin() {
    // Top-Level State
    const [activeTab, setActiveTab] = useState<'generation' | 'curriculum' | 'structure'>('curriculum');

    // Curriculum App State
    const { coursesList, setCoursesList } = useCurriculumStore();

    // UI Selection State for Curriculum
    const [selectedCourseId, setSelectedCourseId] = useState<string>('c1');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('s1');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('sec1');

    // Input States
    const [newCourseName, setNewCourseName] = useState('');
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');
    const [newTopicName, setNewTopicName] = useState('');

    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [editSubjectName, setEditSubjectName] = useState('');
    const [showBulkSubject, setShowBulkSubject] = useState(false);
    const [bulkSubjectText, setBulkSubjectText] = useState('');

    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editSectionName, setEditSectionName] = useState('');
    const [showBulkSection, setShowBulkSection] = useState(false);
    const [bulkSectionText, setBulkSectionText] = useState('');

    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editTopicName, setEditTopicName] = useState('');
    const [showBulkTopic, setShowBulkTopic] = useState(false);
    const [bulkTopicText, setBulkTopicText] = useState('');

    // Generation Engine State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [engineCourseId, setEngineCourseId] = useState<string>('c1');
    const [engineSubjectId, setEngineSubjectId] = useState<string>('');
    const [engineSectionId, setEngineSectionId] = useState<string>('');
    const [engineSelectedTopics, setEngineSelectedTopics] = useState<string[]>([]);
    const [currentTopicName, setCurrentTopicName] = useState('');
    const [editingGeneratedTopicId, setEditingGeneratedTopicId] = useState<string | null>(null);

    // Drag-and-drop state for LMS Structure sections
    const dragItemRef = useRef<number | null>(null);
    const dragOverItemRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

    // Derived Selection Data
    const currentCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];
    const currentSubject = currentCourse?.subjects.find(s => s.id === selectedSubjectId) || currentCourse?.subjects[0];
    const currentSection = currentSubject?.sections.find(s => s.id === selectedSectionId) || currentSubject?.sections[0];

    const engineCourse = coursesList.find(c => c.id === engineCourseId) || coursesList[0];
    const engineSubject = engineCourse?.subjects.find(s => s.id === engineSubjectId) || engineCourse?.subjects[0];
    const engineSection = engineSubject?.sections.find(s => s.id === engineSectionId) || engineSubject?.sections[0];

    // Handlers
    const handleAddCourse = () => {
        if (!newCourseName.trim()) return;
        const newCourse = { 
            id: Date.now().toString(), 
            name: newCourseName, 
            subjects: [], 
            lmsNotesStructure: JSON.parse(JSON.stringify(defaultLMSStructure)) 
        };
        setCoursesList([...coursesList, newCourse]);
        setSelectedCourseId(newCourse.id);
        setSelectedSubjectId('');
        setSelectedSectionId('');
        setNewCourseName('');
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim() || !currentCourse) return;
        const newSubject = { id: Date.now().toString(), name: newSubjectName, sections: [] };
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) return { ...c, subjects: [...c.subjects, newSubject] };
            return c;
        });
        setCoursesList(updatedCourses);
        setSelectedSubjectId(newSubject.id);
        setNewSubjectName('');
        setEditingSubjectId(null);
    };

    const handleDeleteSubject = (subjectId: string) => {
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse?.id) {
                return { ...c, subjects: c.subjects.filter(s => s.id !== subjectId) };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        if (selectedSubjectId === subjectId) {
            const remainingSubjects = updatedCourses.find(c => c.id === currentCourse?.id)?.subjects || [];
            setSelectedSubjectId(remainingSubjects.length > 0 ? remainingSubjects[0].id : '');
            if (remainingSubjects.length === 0) {
                setEditingSubjectId(null);
            }
        }
    };

    const handleUpdateSubject = () => {
        if (!editSubjectName.trim() || !editingSubjectId || !currentCourse) return;
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === editingSubjectId) return { ...s, name: editSubjectName };
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setEditingSubjectId(null);
    };

    const handleBulkUploadSubjects = () => {
        if (!bulkSubjectText.trim() || !currentCourse) return;
        const subjectNames = bulkSubjectText.split('\n').map(s => s.trim()).filter(s => s);
        if (subjectNames.length === 0) return;

        const newSubjects = subjectNames.map((name, i) => ({
            id: `bulk-${Date.now()}-${i}`,
            name,
            sections: []
        }));

        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return { ...c, subjects: [...c.subjects, ...newSubjects] };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setBulkSubjectText('');
        setShowBulkSubject(false);
        setEditingSubjectId(null);
        if (newSubjects.length > 0) {
            setSelectedSubjectId(newSubjects[0].id);
        }
    };

    const handleAddSection = () => {
        if (!newSectionName.trim() || !currentCourse || !currentSubject) return;
        const newSection = { id: Date.now().toString(), name: newSectionName, topics: [] };
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject.id) return { ...s, sections: [...s.sections, newSection] };
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setSelectedSectionId(newSection.id);
        setNewSectionName('');
        setEditingSectionId(null);
    };

    const handleDeleteSection = (sectionId: string) => {
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse?.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject?.id) {
                            return { ...s, sections: s.sections.filter(sec => sec.id !== sectionId) };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        if (selectedSectionId === sectionId) {
            const remainingSections = updatedCourses.find(c => c.id === currentCourse?.id)?.subjects.find(s => s.id === currentSubject?.id)?.sections || [];
            setSelectedSectionId(remainingSections.length > 0 ? remainingSections[0].id : '');
            if (remainingSections.length === 0) {
                setEditingSectionId(null);
            }
        }
    };

    const handleUpdateSection = () => {
        if (!editSectionName.trim() || !editingSectionId || !currentCourse || !currentSubject) return;
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject.id) {
                            return {
                                ...s, sections: s.sections.map(sec => {
                                    if (sec.id === editingSectionId) return { ...sec, name: editSectionName };
                                    return sec;
                                })
                            };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setEditingSectionId(null);
    };

    const handleBulkUploadSections = () => {
        if (!bulkSectionText.trim() || !currentCourse || !currentSubject) return;
        const sectionNames = bulkSectionText.split('\n').map(s => s.trim()).filter(s => s);
        if (sectionNames.length === 0) return;

        const newSections = sectionNames.map((name, i) => ({
            id: `bulk-sec-${Date.now()}-${i}`,
            name,
            topics: []
        }));

        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject.id) {
                            return { ...s, sections: [...s.sections, ...newSections] };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setBulkSectionText('');
        setShowBulkSection(false);
        setEditingSectionId(null);
        if (newSections.length > 0) {
            setSelectedSectionId(newSections[0].id);
        }
    };

    const handleAddTopic = () => {
        if (!newTopicName.trim() || !currentCourse || !currentSubject || !currentSection) return;
        const newTopic = { id: Date.now().toString(), name: newTopicName };
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject.id) {
                            return {
                                ...s, sections: s.sections.map(sec => {
                                    if (sec.id === currentSection.id) return { ...sec, topics: [...sec.topics, newTopic] };
                                    return sec;
                                })
                            };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setNewTopicName('');
        setEditingTopicId(null);
    };

    const handleDeleteTopic = (topicId: string) => {
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse?.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject?.id) {
                            return {
                                ...s, sections: s.sections.map(sec => {
                                    if (sec.id === currentSection?.id) {
                                        return { ...sec, topics: sec.topics.filter(t => t.id !== topicId) };
                                    }
                                    return sec;
                                })
                            };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
    };

    const handleUpdateTopic = () => {
        if (!editTopicName.trim() || !editingTopicId || !currentCourse || !currentSubject || !currentSection) return;
        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject.id) {
                            return {
                                ...s, sections: s.sections.map(sec => {
                                    if (sec.id === currentSection.id) {
                                        return {
                                            ...sec, topics: sec.topics.map(t => {
                                                if (t.id === editingTopicId) return { ...t, name: editTopicName };
                                                return t;
                                            })
                                        };
                                    }
                                    return sec;
                                })
                            };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setEditingTopicId(null);
    };

    const handleBulkUploadTopics = () => {
        if (!bulkTopicText.trim() || !currentCourse || !currentSubject || !currentSection) return;
        const topicNames = bulkTopicText.split('\n').map(t => t.trim()).filter(t => t);
        if (topicNames.length === 0) return;

        const newTopics = topicNames.map((name, i) => ({
            id: `bulk-t-${Date.now()}-${i}`,
            name
        }));

        const updatedCourses = coursesList.map(c => {
            if (c.id === currentCourse.id) {
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id === currentSubject.id) {
                            return {
                                ...s, sections: s.sections.map(sec => {
                                    if (sec.id === currentSection.id) {
                                        return { ...sec, topics: [...sec.topics, ...newTopics] };
                                    }
                                    return sec;
                                })
                            };
                        }
                        return s;
                    })
                };
            }
            return c;
        });
        setCoursesList(updatedCourses);
        setBulkTopicText('');
        setShowBulkTopic(false);
        setEditingTopicId(null);
    };

    const handleStartGeneration = async () => {
        if (!engineCourse || !engineSubject || !engineSection || engineSelectedTopics.length === 0) return;
        setIsGenerating(true);
        setProgress(0);

        const totalTopics = engineSelectedTopics.length;

        for (let i = 0; i < totalTopics; i++) {
            const topicId = engineSelectedTopics[i];

            // Find topic text
            let pName = 'Topic...';
            engineSection.topics.forEach(t => { if (t.id === topicId) pName = t.name; });
            setCurrentTopicName(pName);

            // Call Gemini AI generation engine
            let fetchedNotes: Record<string, string> = {};
            try {
                const response = await fetch('/api/creator', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseName: engineCourse.name,
                        subjectName: engineSubject.name,
                        sectionName: engineSection.name,
                        topicName: pName,
                        lmsStructure: engineCourse.lmsNotesStructure
                    })
                });

                const data = await response.json();

                if (data.success && data.generatedNotes) {
                    fetchedNotes = data.generatedNotes;
                } else {
                    console.error("Gemini generation failed, using fallback:", data.error);
                    const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                    // Fallback to error message
                    engineCourse.lmsNotesStructure.forEach(item => {
                        fetchedNotes[item.id] = `API Error: ${errorMsg}\n\nPlease check your API Key and Plan quotas.`;
                    });
                }
            } catch (err: any) {
                console.error("Generation API network error:", err);
                engineCourse.lmsNotesStructure.forEach(item => {
                    fetchedNotes[item.id] = `Error: Network failed to reach AI server. ${err.message || ''}`;
                });
            }

            setProgress(Math.round(((i + 1) / totalTopics) * 100));

            // Commit results back into coursesList
            setCoursesList(prev => prev.map(c => {
                if (c.id === engineCourse.id) {
                    return {
                        ...c, subjects: c.subjects.map(s => {
                            if (s.id === engineSubject.id) {
                                return {
                                    ...s, sections: s.sections.map(sec => {
                                        if (sec.id === engineSection.id) {
                                            return {
                                                ...sec, topics: sec.topics.map(t => {
                                                    if (t.id === topicId) return { ...t, generatedNotes: fetchedNotes };
                                                    return t;
                                                })
                                            };
                                        }
                                        return sec;
                                    })
                                };
                            }
                            return s;
                        })
                    };
                }
                return c;
            }));
        }

        setTimeout(() => {
            setIsGenerating(false);
            setEngineSelectedTopics([]);
            setCurrentTopicName('');
        }, 500);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Content Creator Intelligence</h2>
                <p className="text-slate-500">Mass trigger Gemini background jobs and build your curriculum.</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mx-auto mb-8">
                <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === 'curriculum' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Curriculum Setup
                </button>
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === 'structure' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    LMS Notes Structure
                </button>
                <button
                    onClick={() => setActiveTab('generation')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === 'generation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Generation Engine
                </button>
            </div>

            {activeTab === 'curriculum' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Sidebar / Setup */}
                    <div className="col-span-1 md:col-span-4 space-y-6">
                        {/* Course Card */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-wider">
                                <BookOpen className="w-4 h-4 text-violet-500" />
                                Context: Course
                            </h3>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => {
                                    setSelectedCourseId(e.target.value);
                                    // Reset subject and section selection
                                    const c = coursesList.find(c => c.id === e.target.value);
                                    if (c && c.subjects.length > 0) {
                                        setSelectedSubjectId(c.subjects[0].id);
                                        if (c.subjects[0].sections.length > 0) setSelectedSectionId(c.subjects[0].sections[0].id);
                                        else setSelectedSectionId('');
                                    } else {
                                        setSelectedSubjectId('');
                                        setSelectedSectionId('');
                                    }
                                }}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none mb-3 font-medium text-slate-900"
                            >
                                {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <div className="flex gap-2">
                                <input
                                    value={newCourseName}
                                    onChange={(e) => setNewCourseName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCourse()}
                                    placeholder="Add new course..."
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-violet-500"
                                />
                                <button onClick={handleAddCourse} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Subject Card */}
                        {currentCourse && (
                            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                                        <Layers className="w-4 h-4 text-blue-500" />
                                        Context: Subject
                                    </h3>
                                    <button
                                        onClick={() => setShowBulkSubject(!showBulkSubject)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <Upload className="w-3 h-3" /> Bulk Upload
                                    </button>
                                </div>

                                {showBulkSubject && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <label className="block text-xs text-blue-800 mb-2 font-medium">Paste subjects (one per line):</label>
                                        <textarea
                                            value={bulkSubjectText}
                                            onChange={(e) => setBulkSubjectText(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 outline-none focus:border-blue-400 resize-none mb-2"
                                            placeholder="Anatomy&#10;Physiology&#10;Biochemistry"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setShowBulkSubject(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                            <button onClick={handleBulkUploadSubjects} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Upload</button>
                                        </div>
                                    </div>
                                )}

                                {currentCourse.subjects.length > 0 ? (
                                    <div className="flex gap-2 mb-3 items-center">
                                        {editingSubjectId ? (
                                            <>
                                                <input
                                                    value={editSubjectName}
                                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject()}
                                                    className="w-full px-4 py-2 text-sm rounded-xl bg-white border border-blue-500 outline-none font-medium text-slate-800"
                                                    autoFocus
                                                />
                                                <button onClick={handleUpdateSubject} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingSubjectId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <select
                                                    value={selectedSubjectId}
                                                    onChange={(e) => {
                                                        setSelectedSubjectId(e.target.value);
                                                        const s = currentCourse.subjects.find(sub => sub.id === e.target.value);
                                                        if (s && s.sections.length > 0) setSelectedSectionId(s.sections[0].id);
                                                        else setSelectedSectionId('');
                                                    }}
                                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium text-slate-900"
                                                >
                                                    {currentCourse.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                {selectedSubjectId && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingSubjectId(selectedSubjectId);
                                                                setEditSubjectName(currentCourse.subjects.find(s => s.id === selectedSubjectId)?.name || '');
                                                            }}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition"
                                                            title="Edit Selected Subject"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubject(selectedSubjectId)}
                                                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition"
                                                            title="Delete Selected Subject"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 mb-3 italic">No subjects exist yet.</p>
                                )}

                                {!showBulkSubject && (
                                    <div className="flex gap-2">
                                        <input
                                            value={newSubjectName}
                                            onChange={(e) => setNewSubjectName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                                            placeholder="Add new subject..."
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-blue-500"
                                        />
                                        <button onClick={handleAddSubject} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Section Card */}
                        <div className={`bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${!currentSubject ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    Context: Section
                                </h3>
                                <button
                                    onClick={() => setShowBulkSection(!showBulkSection)}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    disabled={!currentSubject}
                                >
                                    <Upload className="w-3 h-3" /> Bulk Upload
                                </button>
                            </div>

                            {showBulkSection && (
                                <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <label className="block text-xs text-indigo-800 mb-2 font-medium">Paste sections (one per line):</label>
                                    <textarea
                                        value={bulkSectionText}
                                        onChange={(e) => setBulkSectionText(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 outline-none focus:border-indigo-400 resize-none mb-2"
                                        placeholder="General Anatomy&#10;Upper Limb&#10;Lower Limb"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setShowBulkSection(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                        <button onClick={handleBulkUploadSections} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Upload</button>
                                    </div>
                                </div>
                            )}

                            {currentSubject && currentSubject.sections.length > 0 ? (
                                <div className="flex gap-2 mb-3 items-center">
                                    {editingSectionId ? (
                                        <>
                                            <input
                                                value={editSectionName}
                                                onChange={(e) => setEditSectionName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateSection()}
                                                className="w-full px-4 py-2 text-sm rounded-xl bg-white border border-indigo-500 outline-none font-medium text-slate-800"
                                                autoFocus
                                            />
                                            <button onClick={handleUpdateSection} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditingSectionId(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <select
                                                value={selectedSectionId}
                                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                                className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium text-slate-900"
                                            >
                                                {currentSubject.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            {selectedSectionId && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingSectionId(selectedSectionId);
                                                            setEditSectionName(currentSubject.sections.find(s => s.id === selectedSectionId)?.name || '');
                                                        }}
                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition"
                                                        title="Edit Selected Section"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSection(selectedSectionId)}
                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition"
                                                        title="Delete Selected Section"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 mb-3 italic">No sections exist yet.</p>
                            )}

                            {!showBulkSection && (
                                <div className="flex gap-2">
                                    <input
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                                        placeholder="Add new section..."
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500"
                                    />
                                    <button onClick={handleAddSection} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area / Topics */}
                    <div className="col-span-1 md:col-span-8">
                        <div className={`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-full transition-all duration-300 ${(!currentSubject || !currentSection) ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <div className="flex items-start justify-between mb-8 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{currentSection?.name || 'No Section Selected'}</h3>
                                        <p className="text-sm text-slate-500">{currentSubject?.name || 'Subject'} &bull; {currentCourse?.name || 'Course'}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowBulkTopic(!showBulkTopic)}
                                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                                    >
                                        <Upload className="w-4 h-4" /> Bulk Upload
                                    </button>
                                </div>

                                {showBulkTopic && (
                                    <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <label className="block text-sm text-emerald-800 mb-2 font-medium">Paste topics (one per line):</label>
                                        <textarea
                                            value={bulkTopicText}
                                            onChange={(e) => setBulkTopicText(e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-3 text-sm rounded-lg border border-emerald-200 outline-none focus:border-emerald-400 resize-none mb-3"
                                            placeholder="Topic 1&#10;Topic 2&#10;Topic 3"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setShowBulkTopic(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                            <button onClick={handleBulkUploadTopics} className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">Upload All</button>
                                        </div>
                                    </div>
                                )}

                                {/* Add Manual Topic */}
                                {!showBulkTopic && (
                                    <div className="flex gap-3 mb-6">
                                        <input
                                            value={newTopicName}
                                            onChange={(e) => setNewTopicName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                                            placeholder="Manually add a specific topic..."
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                        />
                                        <button onClick={handleAddTopic} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                )}

                                {/* Topics List */}
                                <div className="space-y-3">
                                    {!currentSection || currentSection.topics.length === 0 ? (
                                        <div className="text-center py-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
                                            No topics added to {currentSection?.name || 'this section'} yet. <br /> Use bulk upload or add manually above.
                                        </div>
                                    ) : (
                                        currentSection.topics.map((topic, i) => (
                                            <div key={topic.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:border-slate-300 transition">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center">
                                                        {i + 1}
                                                    </span>
                                                    {editingTopicId === topic.id ? (
                                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                                            <input
                                                                value={editTopicName}
                                                                onChange={(e) => setEditTopicName(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateTopic()}
                                                                className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-white border border-emerald-500 outline-none font-medium text-slate-800"
                                                                autoFocus
                                                            />
                                                            <button onClick={handleUpdateTopic} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition">
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setEditingTopicId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="font-semibold text-slate-700">{topic.name}</span>
                                                    )}
                                                </div>
                                                {editingTopicId !== topic.id && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTopicId(topic.id);
                                                                setEditTopicName(topic.name);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTopic(topic.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'structure' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between mb-8 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">LMS Notes Structure</h3>
                            <p className="text-sm text-slate-500">Configure the output generation template for {currentCourse.name}</p>
                        </div>
                        <button onClick={() => {
                            const newId = Date.now().toString();
                            const updatedCourses = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: [...c.lmsNotesStructure, { id: newId, title: 'New Area', description: '', value: '', type: 'text' as 'text' | 'number' }] } : c);
                            setCoursesList(updatedCourses);
                        }} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-slate-800 transition">
                            <Plus className="w-4 h-4" /> Add Section
                        </button>
                    </div>

                    <div className="space-y-3 max-w-4xl">
                        {currentCourse.lmsNotesStructure.map((item, index) => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => {
                                    dragItemRef.current = index;
                                    setDraggingIndex(index);
                                }}
                                onDragEnter={() => {
                                    dragOverItemRef.current = index;
                                    setDragOverIndex(index);
                                }}
                                onDragEnd={() => {
                                    if (dragItemRef.current !== null && dragOverItemRef.current !== null && dragItemRef.current !== dragOverItemRef.current) {
                                        const structure = [...currentCourse.lmsNotesStructure];
                                        const draggedItem = structure.splice(dragItemRef.current, 1)[0];
                                        structure.splice(dragOverItemRef.current, 0, draggedItem);
                                        const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: structure } : c);
                                        setCoursesList(updated);
                                    }
                                    dragItemRef.current = null;
                                    dragOverItemRef.current = null;
                                    setDraggingIndex(null);
                                    setDragOverIndex(null);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                className={`flex flex-col md:flex-row gap-4 items-start md:items-center p-5 rounded-2xl border-2 group transition-all duration-200 ${
                                    draggingIndex === index
                                        ? 'bg-emerald-50 border-emerald-400 shadow-lg scale-[1.02] opacity-90'
                                        : dragOverIndex === index && draggingIndex !== null
                                        ? 'bg-emerald-50/50 border-emerald-300 border-dashed'
                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                }`}
                            >
                                {/* Drag Handle + Number */}
                                <div className="flex items-center gap-2 flex-shrink-0 cursor-grab active:cursor-grabbing select-none">
                                    <div className="text-slate-300 hover:text-slate-500 transition-colors">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
                                        {index + 1}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2 w-full">
                                    <input value={item.title} onChange={e => {
                                        const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.map(is => is.id === item.id ? { ...is, title: e.target.value } : is) } : c);
                                        setCoursesList(updated);
                                    }} className="w-full font-bold text-slate-800 bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-emerald-500 text-lg transition-colors" placeholder="Section Title (e.g. Introduction)" />
                                    <input value={item.description} onChange={e => {
                                        const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.map(is => is.id === item.id ? { ...is, description: e.target.value } : is) } : c);
                                        setCoursesList(updated);
                                    }} className="w-full text-xs font-semibold text-slate-500 bg-transparent outline-none border-b border-transparent focus:border-slate-300" placeholder="Description or Helper Text" />
                                </div>

                                <div className="w-full md:w-64 flex-shrink-0">
                                    {item.type === 'number' ? (
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">QTY</span>
                                            <input type="number" min="0" value={item.value} onChange={e => {
                                                const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.map(is => is.id === item.id ? { ...is, value: e.target.value } : is) } : c);
                                                setCoursesList(updated);
                                            }} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium" placeholder="0" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input type="text" value={item.value} onChange={e => {
                                                const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.map(is => is.id === item.id ? { ...is, value: e.target.value } : is) } : c);
                                                setCoursesList(updated);
                                            }} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none bg-white font-medium text-sm" placeholder="Format configuration" />
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Words</span>
                                                <input type="number" min="0" value={item.wordCount || ''} onChange={e => {
                                                    const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.map(is => is.id === item.id ? { ...is, wordCount: e.target.value } : is) } : c);
                                                    setCoursesList(updated);
                                                }} className="w-full pl-16 pr-4 py-2 rounded-xl border border-dashed border-slate-200 focus:border-indigo-400 outline-none bg-white font-medium text-sm" placeholder="e.g. 500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <select value={item.type} onChange={e => {
                                        const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.map(is => is.id === item.id ? { ...is, type: e.target.value as 'text' | 'number' } : is) } : c);
                                        setCoursesList(updated);
                                    }} className="px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white text-xs font-bold text-slate-600 focus:border-emerald-500">
                                        <option value="text">Text Format</option>
                                        <option value="number">Quantity / Number count</option>
                                    </select>

                                    <button onClick={() => {
                                        const updated = coursesList.map(c => c.id === currentCourse.id ? { ...c, lmsNotesStructure: c.lmsNotesStructure.filter(is => is.id !== item.id) } : c);
                                        setCoursesList(updated);
                                    }} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'generation' && (() => {
                const totalTopicsInSection = engineSection?.topics.length || 0;
                const createdTopicsInSection = engineSection?.topics.filter(t => t.generatedNotes).length || 0;
                const pendingTopicsInSection = totalTopicsInSection - createdTopicsInSection;
                const progressPercent = totalTopicsInSection > 0 ? Math.round((createdTopicsInSection / totalTopicsInSection) * 100) : 0;
                const uncreatedTopicIds = engineSection?.topics.filter(t => !t.generatedNotes).map(t => t.id) || [];

                return (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 h-[800px]">
                    {/* Setup / Options Side */}
                    <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col border border-slate-100 rounded-2xl bg-slate-50 overflow-hidden shadow-inner">
                        <div className="p-5 border-b border-slate-200 bg-white">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" /> Generation Queue
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Select topics to auto-generate LMS notes.</p>
                        </div>

                        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Context: Course</label>
                                <select
                                    value={engineCourseId}
                                    onChange={(e) => {
                                        setEngineCourseId(e.target.value);
                                        const c = coursesList.find(x => x.id === e.target.value);
                                        setEngineSubjectId(c?.subjects?.[0]?.id || '');
                                        setEngineSectionId(c?.subjects?.[0]?.sections?.[0]?.id || '');
                                    }}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 outline-none focus:border-indigo-500 transition-colors"
                                >
                                    {coursesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Context: Paper</label>
                                <select
                                    value={engineSubjectId}
                                    onChange={(e) => {
                                        setEngineSubjectId(e.target.value);
                                        const s = engineCourse?.subjects.find(x => x.id === e.target.value);
                                        setEngineSectionId(s?.sections?.[0]?.id || '');
                                    }}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 outline-none focus:border-indigo-500 transition-colors"
                                    disabled={!engineCourse || engineCourse.subjects.length === 0}
                                >
                                    {!engineCourse?.subjects.length && <option>No Subjects</option>}
                                    {engineCourse?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Context: Section</label>
                                <select
                                    value={engineSectionId}
                                    onChange={(e) => setEngineSectionId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 outline-none focus:border-indigo-500 transition-colors"
                                    disabled={!engineSubject || engineSubject.sections.length === 0}
                                >
                                    {!engineSubject?.sections.length && <option>No Sections</option>}
                                    {engineSubject?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Topics Selection Header with Select Uncreated / Select All */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Select Topics to Generate
                                    </label>
                                    {engineSection && engineSection.topics.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            {uncreatedTopicIds.length > 0 && (
                                                <button 
                                                    onClick={() => setEngineSelectedTopics(uncreatedTopicIds)}
                                                    className="text-[10px] font-bold text-amber-600 hover:text-amber-800 border border-amber-300 bg-amber-50 px-2 py-0.5 rounded-md transition-colors tracking-normal"
                                                >
                                                    select uncreated
                                                </button>
                                            )}
                                            <button onClick={() => {
                                                if (engineSelectedTopics.length === engineSection.topics.length) setEngineSelectedTopics([]);
                                                else setEngineSelectedTopics(engineSection.topics.map(t => t.id));
                                            }} className="text-[10px] font-bold text-slate-600 hover:text-slate-800 tracking-normal">
                                                {engineSelectedTopics.length === engineSection.topics.length ? 'select none' : 'select all'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── NOTES PROGRESS CARD ── */}
                                {engineSection && totalTopicsInSection > 0 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes Progress</span>
                                            <span className="text-sm font-extrabold text-slate-800">{createdTopicsInSection}/{totalTopicsInSection} created</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                                            {createdTopicsInSection > 0 && (
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            )}
                                            {pendingTopicsInSection > 0 && (
                                                <div 
                                                    className="h-full bg-amber-400 transition-all duration-500"
                                                    style={{ width: `${100 - progressPercent}%`, borderRadius: createdTopicsInSection === 0 ? '9999px' : '0 9999px 9999px 0' }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                                {createdTopicsInSection} Created
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                                                {pendingTopicsInSection} Pending
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col max-h-48">
                                    <div className="overflow-y-auto w-full p-2 space-y-1">
                                        {!engineSection || engineSection.topics.length === 0 ? (
                                            <p className="text-xs text-center text-slate-400 py-4 font-medium italic">No topics available in this context.</p>
                                        ) : (
                                            engineSection.topics.map(t => (
                                                <label
                                                    key={t.id}
                                                    onClick={() => {
                                                        if (engineSelectedTopics.includes(t.id)) {
                                                            setEngineSelectedTopics(prev => prev.filter(x => x !== t.id));
                                                        } else {
                                                            setEngineSelectedTopics(prev => [...prev, t.id]);
                                                        }
                                                    }}
                                                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition select-none group"
                                                >
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${engineSelectedTopics.includes(t.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                                                        {engineSelectedTopics.includes(t.id) && <Check className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700 flex-1">{t.name}</span>
                                                    {t.generatedNotes ? (
                                                        <span title="Already Generated"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /></span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Pending"></span>
                                                    )}
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                            {isGenerating && (
                                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 mb-2 uppercase tracking-wider">
                                        <span className="flex items-center gap-2"><RotateCcw className="w-3 h-3 animate-spin" /> Processing {currentTopicName}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                                            <div className="absolute inset-0 bg-white/30 w-full animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleStartGeneration}
                                disabled={isGenerating || engineSelectedTopics.length === 0}
                                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                {isGenerating ? 'Gemini Generating...' : `Generate ${engineSelectedTopics.length} Notes`}
                            </button>
                        </div>
                    </div>

                    {/* Review side */}
                    <div className="flex-1 flex flex-col min-w-0 border border-slate-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-emerald-500" /> Generated Content & Editor
                            </h3>
                            {editingGeneratedTopicId && (
                                <button onClick={() => setEditingGeneratedTopicId(null)} className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 shadow-sm rounded-lg hover:bg-slate-50">
                                    Close Editor
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {editingGeneratedTopicId ? (
                                <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
                                    {engineCourse?.lmsNotesStructure.map((structItem) => {
                                        const topic = engineSection?.topics.find(t => t.id === editingGeneratedTopicId);
                                        const value = topic?.generatedNotes?.[structItem.id] || '';

                                        return (
                                            <div key={structItem.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                <div className="mb-3">
                                                    <h4 className="font-bold text-sm text-slate-800">{structItem.title}</h4>
                                                    <p className="text-xs text-slate-500 font-medium">{structItem.description} • Auto-Formatting Style: {structItem.value}</p>
                                                </div>
                                                <textarea
                                                    className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 outline-none p-4 rounded-xl min-h-[120px] focus:border-indigo-500 focus:bg-white transition-all resize-y"
                                                    value={value}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setCoursesList(prev => prev.map(c => {
                                                            if (c.id === engineCourse.id) {
                                                                return {
                                                                    ...c, subjects: c.subjects.map(s => {
                                                                        if (s.id === engineSubject.id) {
                                                                            return {
                                                                                ...s, sections: s.sections.map(sec => {
                                                                                    if (sec.id === engineSection.id) {
                                                                                        return {
                                                                                            ...sec, topics: sec.topics.map(t => {
                                                                                                if (t.id === editingGeneratedTopicId) {
                                                                                                    return { ...t, generatedNotes: { ...t.generatedNotes, [structItem.id]: val } };
                                                                                                }
                                                                                                return t;
                                                                                            })
                                                                                        };
                                                                                    }
                                                                                    return sec;
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
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Latest Generated Notes from {engineSection?.name || 'Selection'}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {engineSection?.topics.filter(t => t.generatedNotes).length === 0 ? (
                                            <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl">
                                                <BrainCircuit className="w-10 h-10 text-slate-200 mb-3" />
                                                <p className="text-sm font-medium">No notes generated here yet.</p>
                                                <p className="text-xs mt-1">Select topics on the left to trigger generation.</p>
                                            </div>
                                        ) : (
                                            engineSection?.topics.filter(t => t.generatedNotes).map(t => (
                                                <div onClick={() => setEditingGeneratedTopicId(t.id)} key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        </div>
                                                        <Edit2 className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 line-clamp-1">{t.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-2 font-medium">Tap to edit generated payload based on template.</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                );
             })()}
        </div>
    );
}
