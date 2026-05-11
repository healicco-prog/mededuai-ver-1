"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuit, Play, CheckCircle2, RotateCcw, AlertTriangle, Plus, Sparkles, BookOpen, Layers, Trash2, Edit2, Upload, X, Check, GripVertical, XCircle, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAuthHeaders } from '@/lib/clientAuth';

import { useCurriculumStore, type Course, type Subject, type Section, type Topic, type LMSNotesStructureItem, defaultLMSStructure } from '../../../../store/curriculumStore';
import { useCurriculumStoreHydrated } from '@/hooks/useCurriculumStoreHydrated';

const MEDEDUAI_PROJECT_REF = 'yrelfdwkjtaidtoulwrj';

export default function LMSCreatorAdmin() {
    const fetchAuthHeaders = getAuthHeaders;
    // ── Hydration guard: prevents Zustand persist rehydration mismatch crash ──
    // Must be called before any store access so the component returns a loading
    // state on the first render (before localStorage data is loaded into the store).
    const storeHydrated = useCurriculumStoreHydrated();

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

    // DB connectivity status
    const [dbStatus, setDbStatus] = useState<'unknown' | 'ok' | 'error' | 'checking'>('unknown');
    const [dbStatusMsg, setDbStatusMsg] = useState<string>('');
    const [dbMigrationSql, setDbMigrationSql] = useState<string | null>(null);

    // Generation Engine State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [engineCourseId, setEngineCourseId] = useState<string>('c1');
    const [engineSubjectId, setEngineSubjectId] = useState<string>('');
    const [engineSectionId, setEngineSectionId] = useState<string>('');
    const [engineSelectedTopics, setEngineSelectedTopics] = useState<string[]>([]);
    const [currentTopicName, setCurrentTopicName] = useState('');
    const [editingGeneratedTopicId, setEditingGeneratedTopicId] = useState<string | null>(null);
    // Curriculum version (e.g. "2025", "2026", "2027") — used to tag generated content
    const [engineVersion, setEngineVersion] = useState<string>(new Date().getFullYear().toString());

    // ── Background Batch Mode State ──
    const [batchId, setBatchId] = useState<string | null>(null);
    const [batchJobs, setBatchJobs] = useState<any[]>([]);
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchMessage, setBatchMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
    const batchAbortRef = useRef(false);

    // Drag-and-drop state for LMS Structure sections
    const dragItemRef = useRef<number | null>(null);
    const dragOverItemRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

    // ── ROBUST Auth header helper ──
    // Using centralized getAuthHeaders from @/lib/clientAuth

    // Derived Selection Data
    const currentCourse = coursesList.find(c => c.id === selectedCourseId) || coursesList[0];
    const currentSubject = currentCourse?.subjects.find(s => s.id === selectedSubjectId) || currentCourse?.subjects[0];
    const currentSection = currentSubject?.sections.find(s => s.id === selectedSectionId) || currentSubject?.sections[0];

    const engineCourse = coursesList.find(c => c.id === engineCourseId) || coursesList[0];
    const engineSubject = engineCourse?.subjects.find(s => s.id === engineSubjectId) || engineCourse?.subjects[0];
    const engineSection = engineSectionId === '__all__' ? engineSubject?.sections[0] : (engineSubject?.sections.find(s => s.id === engineSectionId) || engineSubject?.sections[0]);
    // Effective topics for display & generation (supports "All Sections" mode)
    const effectiveSections = engineSectionId === '__all__'
        ? (engineSubject?.sections || [])
        : (engineSection ? [engineSection] : []);
    const effectiveTopicsForDisplay = effectiveSections.flatMap(sec =>
        sec.topics.map(t => ({ ...t, _sectionId: sec.id, _sectionName: sec.name }))
    );
    const topicSectionMap = new Map(
        effectiveTopicsForDisplay.map(t => [t.id, { id: t._sectionId, name: t._sectionName }])
    );

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
        if (!engineCourse || !engineSubject || effectiveTopicsForDisplay.length === 0 || engineSelectedTopics.length === 0) return;

        // ── Check if any selected topics are already generated ──
        const alreadyGenerated = effectiveTopicsForDisplay.filter(t =>
            engineSelectedTopics.includes(t.id) &&
            t.generatedNotes && Object.keys(t.generatedNotes).length > 0
        );

        if (alreadyGenerated.length > 0) {
            const topicNames = alreadyGenerated.map(t => t.name).join(', ');
            const confirmRewrite = window.confirm(
                `WARNING: The following topics already have saved notes in the database: \n\n${topicNames.length > 200 ? topicNames.substring(0, 200) + '...' : topicNames}\n\nOverwriting will permanently replace existing content with new AI-generated notes. Do you want to proceed?`
            );
            if (!confirmRewrite) return;
        }

        setIsGenerating(true);
        setProgress(0);

        const totalTopics = engineSelectedTopics.length;

        // Helper to pause between sequential API calls to avoid 429 rate-limiting
        const cooldown = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


        // ── Proactively refresh session ONCE before the entire batch starts ──
        await fetchAuthHeaders(true);

        // ── Generate a single topic with full retry + auth refresh logic ──
        const generateSingleTopic = async (topicId: string, topicIndex: number): Promise<{ topicId: string; notes: Record<string, string>; success: boolean }> => {
            let pName = 'Topic...';
            const _topicMeta = effectiveTopicsForDisplay.find(t => t.id === topicId);
            if (_topicMeta) pName = _topicMeta.name;
            const _topicSectionName = topicSectionMap.get(topicId)?.name || engineSection?.name || '';

            let fetchedNotes: Record<string, string> = {};
            let success = false;
            const maxTopicRetries = 5; // Increased from 3 to 5 for resilience

            for (let attempt = 1; attempt <= maxTopicRetries; attempt++) {
                try {
                    setCurrentTopicName(`${pName} (${topicIndex + 1}/${totalTopics}${attempt > 1 ? ` — Retry ${attempt}` : ''})`);

                    // ── Refresh session every 5 topics or on auth-retry to prevent JWT expiry ──
                    const needsRefresh = attempt > 1 || topicIndex % 5 === 0;

                    const controller = new AbortController();
                    // 8-minute timeout per topic — aligns with server maxDuration=300s
                    // plus buffer for chunked generation (text + dedicated sections).
                    // Thinking tokens are disabled server-side (thinkingBudget:0), so
                    // typical generation is 60–180s; 480s covers worst-case top-up rounds.
                    const timeoutId = setTimeout(() => controller.abort(), 480000);

                    const response = await fetch('/api/creator', {
                        method: 'POST',
                        headers: await fetchAuthHeaders(needsRefresh),
                        signal: controller.signal,
                        body: JSON.stringify({
                            courseName: engineCourse.name,
                            subjectName: engineSubject.name,
                            sectionName: _topicSectionName,
                            topicName: pName,
                            lmsStructure: engineCourse.lmsNotesStructure.filter((s: any) => s.id !== 'l10')
                        })
                    });

                    clearTimeout(timeoutId);

                    // ── Handle 401 specifically: force-refresh and retry immediately ──
                    if (response.status === 401 && attempt < maxTopicRetries) {
                        console.warn(`[Generation Engine] 401 Unauthorized for "${pName}" — force-refreshing session…`);
                        await fetchAuthHeaders(true); // Force refresh
                        await cooldown(1000);
                        continue; // Retry immediately with fresh token
                    }

                    // ── Handle 429 rate limit: wait longer and retry ──
                    if (response.status === 429 && attempt < maxTopicRetries) {
                        const retryAfter = parseInt(response.headers.get('Retry-After') || '30', 10);
                        console.warn(`[Generation Engine] Rate limited for "${pName}" — waiting ${retryAfter}s…`);
                        await cooldown(retryAfter * 1000);
                        continue;
                    }

                    // ── Guard: server returned HTML instead of JSON (route not deployed / compile error) ──
                    const contentType = response.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        const bodyText = await response.text();
                        const hint = bodyText.includes('Module not found') || bodyText.includes('Cannot find module')
                            ? 'Server compile error — restart the dev server (npm run dev) to pick up new modules.'
                            : `Server returned non-JSON (status ${response.status}) — ensure the API route is deployed and restart if in dev mode.`;
                        throw new Error(hint);
                    }

                    const data = await response.json();

                    if (data.success && data.generatedNotes) {
                        fetchedNotes = data.generatedNotes;
                        success = true;

                        // ── Synchronous Save to Supabase (awaited — guaranteed DB write) ──
                        const saveToDb = async (retries = 3) => {
                            for (let s = 0; s < retries; s++) {
                                try {
                                    const authH = await fetchAuthHeaders(s > 0);
                                    const saveRes = await fetch('/api/creator/save', {
                                        method: 'POST',
                                        headers: authH,
                                        body: JSON.stringify({
                                            courseName: engineCourse.name,
                                            subjectName: engineSubject.name,
                                            sectionName: _topicSectionName,
                                            topicName: pName,
                                            generatedNotes: fetchedNotes,
                                            version: engineVersion,
                                        }),
                                    });
                                    const saveResult = await saveRes.json();
                                    if (saveResult.success) {
                                        return;
                                    }
                                    console.warn(`[Auto-Save] ⚠️ "${pName}" save attempt ${s + 1} failed:`, saveResult.error);
                                } catch (saveErr) {
                                    console.warn(`[Auto-Save] ⚠️ Network error saving "${pName}" attempt ${s + 1}:`, saveErr);
                                }
                                if (s < retries - 1) await cooldown(2000);
                            }
                            console.error(`[Auto-Save] ❌ "${pName}" could not be saved after ${retries} attempts.`);
                        };
                        await saveToDb(); // AWAITED — ensures content is in DB before moving on

                        break; // Success — exit retry loop
                    } else {
                        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                        console.warn(`[Generation Engine] Topic "${pName}" attempt ${attempt} failed: ${errorMsg}`);

                        if (attempt < maxTopicRetries) {
                            const retryDelay = 3000 * Math.pow(2, attempt - 1);
                            await cooldown(retryDelay);
                        } else {
                            // All retries exhausted
                            engineCourse.lmsNotesStructure.filter((item: any) => item.id !== 'l10').forEach(item => {
                                fetchedNotes[item.id] = `Generation failed after ${maxTopicRetries} attempts: ${errorMsg}`;
                            });
                        }
                    }
                } catch (err: any) {
                    const isAbort = err.name === 'AbortError';
                    console.error(`[Generation Engine] Topic "${pName}" attempt ${attempt} ${isAbort ? 'timed out' : 'network error'}:`, err.message);

                    if (attempt < maxTopicRetries) {
                        const retryDelay = isAbort ? 5000 : 3000 * Math.pow(2, attempt - 1);
                        await cooldown(retryDelay);
                    } else {
                        engineCourse.lmsNotesStructure.filter((item: any) => item.id !== 'l10').forEach(item => {
                            fetchedNotes[item.id] = `${isAbort ? 'Timeout' : 'Network error'} after ${maxTopicRetries} attempts: ${err.message || 'Unknown error'}`;
                        });
                    }
                }
            }

            return { topicId, notes: fetchedNotes, success };
        };

        // ── SEQUENTIAL GENERATION (one topic at a time) ──
        // Gemini free tier: 15 RPM, ~500 RPD for 2.5 Flash.
        // Each topic makes ~8 API calls inside the route, so running 4 in parallel
        // fires 32 simultaneous requests — guaranteed 429s.
        // Sequential generation with a cooldown between topics stays well within limits.
        let completedCount = 0;

        for (let i = 0; i < totalTopics; i++) {
            const topicId = engineSelectedTopics[i];

            const result = await generateSingleTopic(topicId, i);

            // Commit result for this topic immediately so the UI updates
            setCoursesList(prev => prev.map(c => {
                if (c.id === engineCourse.id) {
                    return {
                        ...c, subjects: c.subjects.map(s => {
                            if (s.id === engineSubject.id) {
                                return {
                                    ...s, sections: s.sections.map(sec => {
                                        if (sec.id === (topicSectionMap.get(result.topicId)?.id || engineSection?.id)) {
                                            return {
                                                ...sec, topics: sec.topics.map(t => {
                                                    if (t.id === result.topicId) return { ...t, generatedNotes: result.notes };
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

            completedCount += 1;
            setProgress(Math.round((completedCount / totalTopics) * 100));

            // ── Cooldown between topics to respect Gemini RPM limits ──
            if (i < totalTopics - 1) {
                const waitTime = 8000; // 8s gap — each topic uses ~8 calls, keeps us under 15 RPM
                await cooldown(waitTime);
            }
        }

        setTimeout(() => {
            setIsGenerating(false);
            setEngineSelectedTopics([]);
            setCurrentTopicName('');
        }, 500);
    };

    // ── BACKGROUND BATCH GENERATION ──────────────────────────────────────
    // Uses the creator_jobs Supabase table + server-side batch-process endpoint.
    // The browser can be closed — jobs persist in DB and can be resumed.
    // No JWT expiry risk: all calls use x-admin-secret header.

    const handleStartBatch = async () => {
        if (!engineCourse || !engineSubject || engineSelectedTopics.length === 0) return;

        batchAbortRef.current = false;
        setIsBatchRunning(true);
        setBatchMessage({ type: 'info', text: `Enqueuing ${engineSelectedTopics.length} topic(s) as background jobs…` });

        const topicsToQueue = engineSelectedTopics.map(topicId => {
            const t = effectiveTopicsForDisplay.find(x => x.id === topicId);
            const sName = topicSectionMap.get(topicId)?.name || engineSection?.name || '';
            return {
                topicId,
                topicName: t?.name || topicId,
                sectionName: sName,
                courseName: engineCourse.name,
                subjectName: engineSubject.name,
                lmsStructure: engineCourse.lmsNotesStructure.filter((s: any) => s.id !== 'l10'),
                version: engineVersion,
            };
        });

        try {
            const enqueueRes = await fetch('/api/creator/batch-start', {
                method: 'POST',
                headers: await fetchAuthHeaders(true),
                body: JSON.stringify({ topics: topicsToQueue }),
            });
            const enqueueData = await enqueueRes.json();
            if (!enqueueData.success) {
                setBatchMessage({ type: 'error', text: enqueueData.error || 'Failed to enqueue jobs.' });
                setIsBatchRunning(false);
                return;
            }

            const newBatchId = enqueueData.batchId;
            setBatchId(newBatchId);
            // Persist in localStorage so user can resume after closing browser
            try { localStorage.setItem('mededuai_last_batch_id', newBatchId); } catch (_) {}
            setBatchMessage({ type: 'info', text: `✅ ${enqueueData.jobCount} jobs queued (Batch: ${newBatchId.slice(0, 8)}…). Processing now…` });

            // ── Drive processing: call batch-process repeatedly until done ──
            await runBatchProcessingLoop(newBatchId);

        } catch (err: any) {
            setBatchMessage({ type: 'error', text: `Batch error: ${err.message}` });
            setIsBatchRunning(false);
        }
    };

    const runBatchProcessingLoop = async (targetBatchId: string) => {
        batchAbortRef.current = false;
        setIsBatchRunning(true);

        // ── Track when we last force-refreshed the JWT so long-running
        //    batches don't fail at the 1-hour Supabase JWT expiry mark.
        //    We pre-emptively refresh every 30 minutes.
        let lastTokenRefresh = Date.now();

        while (!batchAbortRef.current) {
            try {
                // ── Pre-emptive JWT refresh every 30 minutes to outlive the 1h Supabase
                //    access token. This is the most common cause of long batches dying. ──
                const elapsedMs = Date.now() - lastTokenRefresh;
                const shouldRefresh = elapsedMs > 30 * 60 * 1000; // 30 min
                let headers = await fetchAuthHeaders(shouldRefresh);
                if (shouldRefresh) lastTokenRefresh = Date.now();

                let processRes = await fetch('/api/creator/batch-process', {
                    method: 'POST',
                    headers,
                    credentials: 'include',
                    body: JSON.stringify({ batchId: targetBatchId }),
                });

                // ── If we hit 401, try once with a force-refreshed token. ──
                if (processRes.status === 401) {
                    console.warn('[Batch Loop] 401 — refreshing token and retrying once');
                    headers = await fetchAuthHeaders(true);
                    lastTokenRefresh = Date.now();
                    processRes = await fetch('/api/creator/batch-process', {
                        method: 'POST',
                        headers,
                        credentials: 'include',
                        body: JSON.stringify({ batchId: targetBatchId }),
                    });
                }

                const processData = await processRes.json();

                if (!processData.success) {
                    setBatchMessage({ type: 'error', text: `Processing error: ${processData.error}` });
                    break;
                }

                // ── If a topic was completed, hydrate local state so UI shows tick ──
                if (processData.generatedNotes && processData.clientTopicId) {
                    setCoursesList(prev => prev.map(c => {
                        if (c.id !== engineCourse?.id) return c;
                        return {
                            ...c, subjects: c.subjects.map(s => {
                                if (s.id !== engineSubject?.id) return s;
                                return {
                                    ...s, sections: s.sections.map(sec => ({
                                        ...sec, topics: sec.topics.map(t =>
                                            t.id === processData.clientTopicId
                                                ? { ...t, generatedNotes: processData.generatedNotes }
                                                : t
                                        )
                                    }))
                                };
                            })
                        };
                    }));
                }

                // ── Refresh status display ──
                await refreshBatchStatus(targetBatchId);

                if (processData.done) {
                    setBatchMessage({ type: 'success', text: `🎉 All ${batchJobs.length || engineSelectedTopics.length} topics generated and saved to database!` });
                    break;
                }

                // Brief pause between jobs to respect rate limits
                await new Promise(r => setTimeout(r, 3000));

            } catch (loopErr: any) {
                if (loopErr.name === 'AbortError') break;
                setBatchMessage({ type: 'error', text: `Loop error: ${loopErr.message}` });
                break;
            }
        }

        setIsBatchRunning(false);
    };

    const refreshBatchStatus = async (targetBatchId: string) => {
        try {
            const statusRes = await fetch(`/api/creator/batch-status?batchId=${targetBatchId}`, {
                headers: await fetchAuthHeaders(),
            });
            const statusData = await statusRes.json();
            if (statusData.success) {
                setBatchJobs(statusData.jobs || []);
                const { completed, failed, total, pending, processing } = statusData;
                if (!statusData.isDone) {
                    setBatchMessage({ type: 'info', text: `⏳ Processing… ${completed} done, ${failed} failed, ${pending + processing} remaining / ${total} total` });
                }
            }
        } catch (_) { /* ignore poll errors */ }
    };

    const handleResumeBatch = async () => {
        let resumeId = batchId;
        if (!resumeId) {
            try { resumeId = localStorage.getItem('mededuai_last_batch_id'); } catch (_) {}
        }
        if (!resumeId) {
            setBatchMessage({ type: 'error', text: 'No batch to resume. Start a new batch first.' });
            return;
        }
        setBatchId(resumeId);
        await refreshBatchStatus(resumeId);
        setBatchMessage({ type: 'info', text: `Resuming batch ${resumeId.slice(0, 8)}…` });
        await runBatchProcessingLoop(resumeId);
    };

    const handleStopBatch = () => {
        batchAbortRef.current = true;
        setIsBatchRunning(false);
        setBatchMessage({ type: 'info', text: '⏸ Batch paused. Jobs remain in queue — click Resume to continue.' });
    };

    // ── Load Existing Notes from DB ──────────────────────────────────────
    // When the engine course/subject/section changes, fetch any already-saved
    // notes from the database and hydrate the local coursesList state so that
    // topics with existing content are shown as "Created" (green tick).
    const loadExistingNotes = useCallback(async () => {
        if (!engineCourse || !engineSubject || !engineSection) return;

        try {
            const params = new URLSearchParams({
                courseName: engineCourse.name,
                subjectName: engineSubject.name,
                sectionName: engineSection.name,
            });
            const res = await fetch(`/api/creator/load?${params}`, { headers: await fetchAuthHeaders() });
            const data = await res.json();

            if (!data.success || !data.notes || Object.keys(data.notes).length === 0) return;

            // Merge DB notes into coursesList topics by matching topic name
            setCoursesList(prev => prev.map(c => {
                if (c.id !== engineCourse.id) return c;
                return {
                    ...c, subjects: c.subjects.map(s => {
                        if (s.id !== engineSubject.id) return s;
                        return {
                            ...s, sections: s.sections.map(sec => {
                                if (sec.id !== engineSection.id) return sec;
                                return {
                                    ...sec, topics: sec.topics.map(t => {
                                        const existingNotes = data.notes[t.name];
                                        // Only hydrate if topic doesn't already have notes in memory
                                        if (existingNotes && (!t.generatedNotes || Object.keys(t.generatedNotes).length === 0)) {
                                            return { ...t, generatedNotes: existingNotes };
                                        }
                                        return t;
                                    })
                                };
                            })
                        };
                    })
                };
            }));
        } catch (err) {
            console.warn('[DB Load] Failed to fetch existing notes:', err);
        }
    }, [engineCourse?.id, engineSubject?.id, engineSection?.id]);

    // Run on mount and whenever the section selection changes
    useEffect(() => {
        loadExistingNotes();
    }, [loadExistingNotes]);

    // ── DB Health Check on mount ─────────────────────────────────────────
    useEffect(() => {
        const checkDb = async () => {
            setDbStatus('checking');
            try {
                const r = await fetch('/api/creator/db-test', { headers: await fetchAuthHeaders() });
                // If the server returns HTML (404/error page from Cloud Run), treat as "not deployed yet"
                const contentType = r.headers.get('content-type') || '';
                if (!contentType.includes('application/json') || !r.ok) {
                    setDbStatus('unknown');
                    return;
                }
                const data = await r.json();
                if (data.status === 'ALL_OK') {
                    setDbStatus('ok');
                    setDbStatusMsg(`✅ DB connected: ${data.supabaseUrl?.replace('https://', '').replace('.supabase.co', '')} | lms_content rows: ${data.lmsContentRowCount}`);
                } else if (data.errors?.length > 0) {
                    setDbStatus('error');
                    const errSummary = data.errors.join('; ');
                    setDbStatusMsg(`❌ DB issue: ${errSummary}`);
                    // Fetch migration SQL if columns are missing
                    try {
                        const r2 = await fetch('/api/creator/db-migrate', { method: 'POST', headers: await fetchAuthHeaders() });
                        const ct = r2.headers.get('content-type') || '';
                        if (ct.includes('application/json')) {
                            const m = await r2.json();
                            if (m?.status === 'MIGRATION_REQUIRED') {
                                setDbMigrationSql(m.sqlToRun);
                                setDbStatusMsg(`❌ Missing DB columns: ${m.missingColumns?.join(', ')}. Run the SQL below in Supabase SQL Editor.`);
                            }
                        }
                    } catch (_) {}
                } else {
                    setDbStatus('ok');
                    setDbStatusMsg(`✅ DB OK | URL: ${data.supabaseUrl}`);
                }
            } catch (_) {
                setDbStatus('unknown');
            }
        };
        checkDb();
    }, []);

    // ── Force Save Generated Content to Supabase ────────────────────────
    // Saves all topics that have generatedNotes in Zustand but may not be in DB
    const [isForceSaving, setIsForceSaving] = useState(false);
    const [forceSaveProgress, setForceSaveProgress] = useState(0);
    const [forceSaveMessage, setForceSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── Direct Supabase save (bypasses Cloud Run entirely) ─────────────────
    // resolveOrCreate: look up a row by matchFields, create it if missing
    const resolveOrCreate = async (
        table: string,
        matchFields: Record<string, string>,
        insertFields: Record<string, string>
    ): Promise<string | null> => {
        let query = (supabase.from(table) as any).select('id').limit(1);
        for (const [k, v] of Object.entries(matchFields)) query = query.eq(k, v);
        const { data: existing } = await query.maybeSingle();
        if (existing?.id) return existing.id;
        const { data: created, error } = await (supabase.from(table) as any)
            .insert(insertFields).select('id').single();
        if (error || !created?.id) {
            console.error(`[DirectSave] insert into ${table} failed:`, error?.message);
            return null;
        }
        return created.id;
    };

    const handleForceSaveToDb = async () => {
        if (!engineCourse || !engineSubject || !engineSection) return;

        const topicsToSave = engineSection.topics.filter(t =>
            t.generatedNotes && Object.keys(t.generatedNotes).length > 0
        );

        if (topicsToSave.length === 0) {
            setForceSaveMessage({ type: 'error', text: 'No generated content found in memory to save.' });
            setTimeout(() => setForceSaveMessage(null), 4000);
            return;
        }

        setIsForceSaving(true);
        setForceSaveProgress(0);
        setForceSaveMessage(null);

        let savedCount = 0;
        let failedCount = 0;
        let lastError = '';

        // ── Resolve course + subject IDs once (shared across all topic saves) ──
        // DB schema: courses → subjects → topics (section stored as TEXT in topics.section)
        // There is NO separate 'sections' table.
        // We write DIRECTLY to Supabase from the browser — bypasses Cloud Run auth entirely.
        let courseId: string | null = null;
        let subjectId: string | null = null;
        try {
            courseId = await resolveOrCreate(
                'courses', { name: engineCourse.name }, { name: engineCourse.name }
            );
            if (courseId) subjectId = await resolveOrCreate(
                'subjects',
                { name: engineSubject.name, course_id: courseId },
                { name: engineSubject.name, course_id: courseId }
            );
        } catch (e: any) {
            console.warn('[DirectSave] Could not resolve course/subject:', e.message);
        }

        for (let i = 0; i < topicsToSave.length; i++) {
            const t = topicsToSave[i];
            setForceSaveProgress(Math.round(((i) / topicsToSave.length) * 100));
            try {
                if (!subjectId) throw new Error('Could not resolve subject in DB');

                // Resolve/create topic — section stored as text column, not FK
                const { data: existingTopic } = await supabase
                    .from('topics')
                    .select('id')
                    .eq('name', t.name)
                    .eq('subject_id', subjectId)
                    .maybeSingle();

                let topicId: string | null = existingTopic?.id || null;
                if (!topicId) {
                    const { data: newTopic, error: topicErr } = await supabase
                        .from('topics')
                        .insert({ name: t.name, subject_id: subjectId, section: engineSection.name })
                        .select('id')
                        .single();
                    if (topicErr || !newTopic?.id) throw new Error(`Could not create topic: ${topicErr?.message}`);
                    topicId = newTopic.id;
                }
                if (!topicId) throw new Error('Could not resolve topic in DB');

                // Build lms_content payload
                const notes = t.generatedNotes!;

                const lmsPayload: Record<string, any> = {
                    topic_id: topicId,
                    last_generated_at: new Date().toISOString(),
                    // ── Denormalized metadata ──
                    version: engineVersion,
                    course: engineCourse.name,
                    subject: engineSubject.name,
                    topic: t.name,
                    // ── Content columns ──
                    introduction: notes.l1 || null,
                    detailed_notes: notes.l2 || null,
                    summary: notes.l3 || null,
                    flashcards: notes.l9 || null,
                };
                // Add marks columns (use standardised column names matching lms_content schema)
                if (notes.l4) lmsPayload['marks_10_questions'] = notes.l4;
                if (notes.l5) lmsPayload['marks_5_questions'] = notes.l5;
                if (notes.l6) lmsPayload['marks_3_reasoning'] = notes.l6;
                if (notes.l7) lmsPayload['marks_2_case_mcqs'] = notes.l7;
                if (notes.l8) lmsPayload['marks_1_mcqs'] = notes.l8;

                // Check if existing row exists
                const { data: existingLms } = await supabase
                    .from('lms_content').select('id').eq('topic_id', topicId).maybeSingle();

                let saveError: any = null;
                if (existingLms?.id) {
                    const { error } = await supabase.from('lms_content').update(lmsPayload).eq('id', existingLms.id);
                    saveError = error;
                } else {
                    const { error } = await supabase.from('lms_content').insert(lmsPayload);
                    // If extended columns missing, retry with core columns only
                    if (error?.message?.includes('column') || error?.message?.includes('does not exist')) {
                        const corePayload = {
                            topic_id: topicId,
                            last_generated_at: lmsPayload.last_generated_at,
                            introduction: lmsPayload.introduction,
                            detailed_notes: lmsPayload.detailed_notes,
                            summary: lmsPayload.summary,
                            flashcards: lmsPayload.flashcards,
                        };
                        const { error: coreErr } = await supabase.from('lms_content').insert(corePayload);
                        saveError = coreErr;
                    } else {
                        saveError = error;
                    }
                }

                if (saveError) throw new Error(saveError.message);

                savedCount++;

            } catch (err: any) {
                failedCount++;
                lastError = err.message;
                console.warn(`[DirectSave] ⚠️ Failed "${t.name}":`, err.message);
            }
            if (i < topicsToSave.length - 1) await new Promise(r => setTimeout(r, 200));
        }
        setForceSaveProgress(100);
        setIsForceSaving(false);

        if (failedCount === 0) {
            setForceSaveMessage({ type: 'success', text: `✅ Saved ${savedCount} topic(s) to database. Content is now visible to all users!` });
        } else {
            setForceSaveMessage({
                type: savedCount > 0 ? 'success' : 'error',
                text: savedCount > 0
                    ? `Saved ${savedCount} topic(s). ${failedCount} failed — ${lastError || 'please retry.'}`
                    : `Saved ${savedCount} topic(s). ${failedCount} failed — ${lastError || 'please retry.'}`
            });
        }
        setTimeout(() => setForceSaveMessage(null), 10000);
    };

    // ── Delete Generated Content from Supabase ──────────────────────────
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleDeleteContent = async (mode: 'selected' | 'section') => {
        if (!engineCourse || !engineSubject || !engineSection) return;

        const topicsToDelete = mode === 'selected'
            ? engineSection.topics.filter(t => engineSelectedTopics.includes(t.id) && t.generatedNotes)
            : engineSection.topics.filter(t => t.generatedNotes);

        if (topicsToDelete.length === 0) {
            setDeleteMessage({ type: 'error', text: 'No generated content found to delete.' });
            setTimeout(() => setDeleteMessage(null), 3000);
            return;
        }

        const topicNames = topicsToDelete.map(t => t.name);
        const confirmMsg = mode === 'selected'
            ? `Delete generated content for ${topicNames.length} selected topic(s)?\n\n${topicNames.join(', ')}\n\nThis will remove notes & assessments from the database so you can re-generate them.`
            : `Delete ALL generated content for section "${engineSection.name}"?\n\n${topicNames.length} topic(s) will have their notes & assessments removed from the database.`;

        if (!window.confirm(confirmMsg)) return;

        setIsDeleting(true);
        setDeleteMessage(null);

        try {
            const res = await fetch('/api/creator/delete', {
                method: 'POST',
                headers: await fetchAuthHeaders(),
                body: JSON.stringify({
                    courseName: engineCourse.name,
                    subjectName: engineSubject.name,
                    sectionName: engineSection.name,
                    topicNames: mode === 'selected' ? topicNames : undefined,
                    deleteAll: mode === 'section',
                }),
            });

            const data = await res.json();

            // ── Determine which topic names to clear from local state ──
            // If DB delete succeeded, use the confirmed list from the server.
            // If DB returned "not found" (content was never saved or already deleted),
            // still clear local Zustand state — the user's intent is to wipe & re-generate.
            const isNotFoundError = !data.success && (
                res.status === 404 ||
                (typeof data.error === 'string' && (
                    data.error.toLowerCase().includes('not found') ||
                    data.error.toLowerCase().includes('no matching')
                ))
            );

            const shouldClearLocal = data.success || isNotFoundError;
            const namesToClear = new Set<string>(
                data.success ? (data.deletedTopics || topicNames) : topicNames
            );

            if (shouldClearLocal) {
                // Always clear generatedNotes from Zustand for the affected topics
                setCoursesList(prev => prev.map(c => {
                    if (c.id !== engineCourse.id) return c;
                    return {
                        ...c, subjects: c.subjects.map(s => {
                            if (s.id !== engineSubject.id) return s;
                            return {
                                ...s, sections: s.sections.map(sec => {
                                    if (sec.id !== engineSection.id) return sec;
                                    return {
                                        ...sec, topics: sec.topics.map(t => {
                                            if (namesToClear.has(t.name)) {
                                                // Remove generatedNotes — topic row stays, just notes cleared
                                                const { generatedNotes: _removed, ...rest } = t;
                                                return rest as Topic;
                                            }
                                            return t;
                                        })
                                    };
                                })
                            };
                        })
                    };
                }));
                setEngineSelectedTopics([]);

                if (data.success) {
                    setDeleteMessage({
                        type: 'success',
                        text: `✅ Deleted ${data.deletedCount} topic(s) from database. You can now re-generate.`
                    });
                } else {
                    // Not in DB but local state cleared
                    setDeleteMessage({
                        type: 'success',
                        text: `Cleared ${namesToClear.size} topic(s) from local state (content was not yet saved to DB). Ready to re-generate.`
                    });
                }
            } else {
                setDeleteMessage({ type: 'error', text: data.error || 'Delete failed.' });
            }
        } catch (err: any) {
            setDeleteMessage({ type: 'error', text: err.message || 'Network error during delete.' });
        } finally {
            setIsDeleting(false);
            setTimeout(() => setDeleteMessage(null), 5000);
        }
    };

    // ── Block render until Zustand persist has finished rehydrating from localStorage ──
    // Without this guard, the first render uses default MBBS state while the real
    // persisted state is loading — Zustand's state update then causes a React crash.
    if (!storeHydrated) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center space-y-4">
                    <div className="w-10 h-10 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-400 font-semibold">Loading Content Creator...</p>
                </div>
            </div>
        );
    }

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
                    onClick={() => {
                        // Sync engine course/subject/section with curriculum tab selections
                        // so the Generation Engine always uses the same structure the user just configured
                        setEngineCourseId(selectedCourseId);
                        setEngineSubjectId(selectedSubjectId);
                        setEngineSectionId(selectedSectionId);
                        setActiveTab('generation');
                    }}
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
                    </div>

                    <div className="space-y-3 max-w-4xl">
                        {currentCourse.lmsNotesStructure.filter(item => item.id !== 'l10').map((item, index) => (
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

                    {/* CONFIRM STRUCTURE BUTTON — syncs engine selections so Generation uses the same course */}
                    <div className="mt-8 flex justify-end max-w-4xl">
                        <button
                            onClick={() => {
                                // Sync the Generation Engine's course/subject/section to match the Structure tab
                                setEngineCourseId(selectedCourseId);
                                setEngineSubjectId(selectedSubjectId);
                                setEngineSectionId(selectedSectionId);
                                setEngineSelectedTopics([]);
                                setActiveTab('generation');
                            }}
                            className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-3 hover:-translate-y-1"
                        >
                            Confirm Structure <CheckCircle2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'generation' && (() => {
                const totalTopicsInSection = effectiveTopicsForDisplay.length;
                const createdTopicsInSection = effectiveTopicsForDisplay.filter(t => t.generatedNotes && Object.keys(t.generatedNotes).length > 0).length;
                const pendingTopicsInSection = totalTopicsInSection - createdTopicsInSection;
                const progressPercent = totalTopicsInSection > 0 ? Math.round((createdTopicsInSection / totalTopicsInSection) * 100) : 0;
                const uncreatedTopicIds = effectiveTopicsForDisplay.filter(t => !t.generatedNotes || Object.keys(t.generatedNotes).length === 0).map(t => t.id);

                return (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 h-[800px]">
                    {/* ── DB Status Banner ── */}
                    {dbStatus !== 'ok' && (
                        <div className={`absolute top-0 left-0 right-0 z-20 px-4 py-2 text-xs font-semibold flex items-start gap-2 ${
                            dbStatus === 'checking' ? 'bg-blue-50 text-blue-700 border-b border-blue-200' :
                            dbStatus === 'error' ? 'bg-red-50 text-red-700 border-b border-red-200' :
                            'bg-slate-50 text-slate-500 border-b border-slate-200'
                        }`}>
                            <span className="shrink-0">{dbStatus === 'checking' ? '⏳' : '❌'}</span>
                            <div className="flex-1">
                                <span>{dbStatusMsg || (dbStatus === 'checking' ? 'Checking database connection...' : '')}</span>
                                {dbMigrationSql && (
                                    <div className="mt-2">
                                        <p className="font-bold mb-1">Run this SQL in your <a href={`https://supabase.com/dashboard/project/${(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace('https://','').replace('.supabase.co','')}/sql`} target="_blank" rel="noreferrer" className="underline">Supabase SQL Editor</a>, then restart the dev server:</p>
                                        <pre className="bg-red-900 text-red-100 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">{dbMigrationSql}</pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {dbStatus === 'ok' && (
                        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border-b border-emerald-100 flex items-center gap-2">
                            <span>✅</span><span>{dbStatusMsg}</span>
                        </div>
                    )}

                    {/* Setup / Options Side */}
                    <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col border border-slate-100 rounded-2xl bg-slate-50 overflow-hidden shadow-inner" style={{ marginTop: dbStatus !== 'unknown' ? '36px' : '0' }}>
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
                                    {engineSubject && engineSubject.sections.length > 0 && (
                                        <option value="__all__">(All sections)</option>
                                    )}
                                    {engineSubject?.sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* ── Curriculum Version ── */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Curriculum Version</label>
                                <div className="flex gap-2">
                                    <select
                                        value={engineVersion}
                                        onChange={(e) => setEngineVersion(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm rounded-lg bg-white border border-indigo-200 outline-none focus:border-indigo-500 transition-colors font-semibold text-indigo-700"
                                    >
                                        {['2024', '2025', '2026', '2027', '2028'].map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={engineVersion}
                                        onChange={(e) => setEngineVersion(e.target.value.trim())}
                                        placeholder="Custom…"
                                        className="w-24 px-2 py-2 text-sm rounded-lg bg-white border border-slate-200 outline-none focus:border-indigo-500 transition-colors text-center"
                                        maxLength={10}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Tags all generated content with this version (e.g. 2025, 2026).</p>
                            </div>

                            {/* ── Active LMS Structure Summary ── */}
                            {engineCourse?.lmsNotesStructure && engineCourse.lmsNotesStructure.length > 0 && (
                                <div className="mt-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Active LMS Structure</span>
                                        <button
                                            onClick={() => setActiveTab('structure')}
                                            disabled={isGenerating || isBatchRunning}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline tracking-normal disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {engineCourse.lmsNotesStructure.filter(item => item.id !== 'l10').map(item => {
                                            const isText = item.type === 'text';
                                            const wordCount = parseInt(item.wordCount || '0', 10);
                                            const qty = parseInt(item.value, 10);
                                            return (
                                                <div key={item.id} className="flex items-center justify-between text-[11px]">
                                                    <span className="font-semibold text-slate-700 truncate flex-1 mr-2">{item.title}</span>
                                                    {isText ? (
                                                        <span className="flex items-center gap-1.5 shrink-0">
                                                            <span className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-bold text-indigo-700">{item.value || 'Markdown'}</span>
                                                            {wordCount > 0 && (
                                                                <span className="px-1.5 py-0.5 bg-indigo-100 rounded text-[10px] font-bold text-indigo-800">{wordCount}w</span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded text-[10px] font-bold text-indigo-700">
                                                            {isNaN(qty) ? item.value : `${qty} items`}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Topics Selection Header with Select Uncreated / Select All */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Select Topics to Generate
                                    </label>
                                    {effectiveTopicsForDisplay.length > 0 && (
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
                                                if (engineSelectedTopics.length === effectiveTopicsForDisplay.length) setEngineSelectedTopics([]);
                                                else setEngineSelectedTopics(effectiveTopicsForDisplay.map(t => t.id));
                                            }} className="text-[10px] font-bold text-slate-600 hover:text-slate-800 tracking-normal">
                                                {engineSelectedTopics.length === effectiveTopicsForDisplay.length ? 'select none' : 'select all'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── NOTES PROGRESS CARD ── */}
                                {effectiveTopicsForDisplay.length > 0 && totalTopicsInSection > 0 && (
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

                                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col max-h-64">
                                    {effectiveTopicsForDisplay.length > 1 && (
                                        <label
                                            onClick={() => {
                                                const allIds = effectiveTopicsForDisplay.map(t => t.id);
                                                if (engineSelectedTopics.length === effectiveTopicsForDisplay.length) setEngineSelectedTopics([]);
                                                else setEngineSelectedTopics(allIds);
                                            }}
                                            className="flex items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200 cursor-pointer select-none hover:bg-indigo-50 transition-colors group shrink-0"
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                                engineSelectedTopics.length === effectiveTopicsForDisplay.length
                                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                                    : engineSelectedTopics.length > 0
                                                    ? 'bg-indigo-100 border-indigo-400 text-indigo-600'
                                                    : 'border-slate-300 bg-white group-hover:border-indigo-400'
                                            }`}>
                                                {engineSelectedTopics.length === effectiveTopicsForDisplay.length
                                                    ? <Check className="w-3.5 h-3.5" />
                                                    : engineSelectedTopics.length > 0
                                                    ? <Minus className="w-3.5 h-3.5" />
                                                    : null}
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 flex-1">(All topics)</span>
                                            <span className="text-[10px] font-semibold text-slate-400">{effectiveTopicsForDisplay.length} total</span>
                                        </label>
                                    )}
                                    <div className="overflow-y-auto w-full p-2 space-y-1">
                                        {effectiveTopicsForDisplay.length === 0 ? (
                                            <p className="text-xs text-center text-slate-400 py-4 font-medium italic">No topics available in this context.</p>
                                        ) : (
                                            effectiveTopicsForDisplay.map(t => (
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
                                                    {engineSectionId === '__all__' && (
                                                        <span className="text-[10px] text-slate-400 shrink-0 max-w-[80px] truncate" title={(t as any)._sectionName}>{(t as any)._sectionName}</span>
                                                    )}
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

                            {/* ── BACKGROUND BATCH MODE ── */}
                            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                                        🚀 Background Batch Mode
                                    </span>
                                    <span className="text-[10px] text-violet-500 font-semibold">No token expiry · Close browser safely</span>
                                </div>

                                {/* Batch Status Display */}
                                {batchJobs.length > 0 && (
                                    <div className="bg-white/80 rounded-lg p-2 border border-violet-100">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1.5">
                                            <span>Batch Progress</span>
                                            <span>{batchJobs.filter(j => j.status === 'completed').length}/{batchJobs.length} done</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                                                style={{ width: `${Math.round((batchJobs.filter(j => j.status === 'completed').length / batchJobs.length) * 100)}%` }} />
                                            <div className="h-full bg-amber-400 transition-all duration-500"
                                                style={{ width: `${Math.round((batchJobs.filter(j => j.status === 'processing').length / batchJobs.length) * 100)}%` }} />
                                            <div className="h-full bg-red-400 transition-all duration-500"
                                                style={{ width: `${Math.round((batchJobs.filter(j => j.status === 'failed').length / batchJobs.length) * 100)}%` }} />
                                        </div>
                                        <div className="flex gap-3 mt-1.5 flex-wrap">
                                            <span className="text-[10px] font-semibold text-emerald-700">✅ {batchJobs.filter(j => j.status === 'completed').length} done</span>
                                            <span className="text-[10px] font-semibold text-amber-700">⏳ {batchJobs.filter(j => j.status === 'pending' || j.status === 'processing').length} pending</span>
                                            {batchJobs.filter(j => j.status === 'failed').length > 0 && (
                                                <span className="text-[10px] font-semibold text-red-600">❌ {batchJobs.filter(j => j.status === 'failed').length} failed</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Batch Message */}
                                {batchMessage && (
                                    <div className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                                        batchMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        batchMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                        {isBatchRunning && <RotateCcw className="w-3 h-3 animate-spin inline mr-1" />}
                                        {batchMessage.text}
                                    </div>
                                )}

                                {/* Batch Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleStartBatch}
                                        disabled={isBatchRunning || isGenerating || engineSelectedTopics.length === 0}
                                        className="flex-1 py-2 bg-violet-600 text-white font-bold text-xs rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                                        title="Enqueue selected topics as background jobs — safe to close browser, uses admin secret (no JWT expiry)"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                        {isBatchRunning ? 'Running…' : `Queue ${engineSelectedTopics.length} Jobs`}
                                    </button>
                                    {isBatchRunning ? (
                                        <button
                                            onClick={handleStopBatch}
                                            className="px-3 py-2 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors"
                                            title="Pause — jobs stay in DB, resume later"
                                        >
                                            Pause
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleResumeBatch}
                                            disabled={isBatchRunning || isGenerating}
                                            className="px-3 py-2 bg-violet-50 text-violet-700 font-bold text-xs rounded-lg border border-violet-300 hover:bg-violet-100 transition-colors disabled:opacity-40"
                                            title="Resume the last batch (persisted in DB)"
                                        >
                                            Resume
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── SEPARATOR ── */}
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or quick mode</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

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
                                onClick={() => handleStartGeneration().catch((err: any) => { console.error('[Generation Engine] Unhandled error:', err); setIsGenerating(false); setCurrentTopicName(''); })}
                                disabled={isGenerating || isBatchRunning || isDeleting || isForceSaving || engineSelectedTopics.length === 0}
                                className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                title="Quick mode: runs in this browser tab (keep tab open)"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                {isGenerating ? 'Gemini Generating...' : `Generate ${engineSelectedTopics.length} Notes`}
                            </button>

                            {/* ── Force Save to DB ── */}
                            {(() => {
                                const topicsWithNotes = engineSection?.topics.filter(t => t.generatedNotes && Object.keys(t.generatedNotes).length > 0) || [];
                                if (topicsWithNotes.length === 0) return null;
                                return (
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleForceSaveToDb}
                                            disabled={isGenerating || isBatchRunning || isDeleting || isForceSaving}
                                            className="w-full py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            title="Push all in-memory generated notes to Supabase so they are visible to all users"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {isForceSaving
                                                ? `Saving... ${forceSaveProgress}%`
                                                : `Save ${topicsWithNotes.length} Notes to DB`}
                                        </button>
                                        {isForceSaving && (
                                            <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${forceSaveProgress}%` }} />
                                            </div>
                                        )}
                                        {forceSaveMessage && (
                                            <div className={`rounded-lg p-2.5 text-xs font-semibold flex items-start gap-2 ${forceSaveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                {forceSaveMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                                                {forceSaveMessage.text}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* ── Delete Content Controls ── */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDeleteContent('selected')}
                                    disabled={isGenerating || isBatchRunning || isDeleting || engineSelectedTopics.length === 0}
                                    className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Delete generated content for selected topics so you can re-generate"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {isDeleting ? 'Deleting...' : 'Delete Selected'}
                                </button>
                                <button
                                    onClick={() => handleDeleteContent('section')}
                                    disabled={isGenerating || isBatchRunning || isDeleting || createdTopicsInSection === 0}
                                    className="flex-1 py-2.5 bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Delete all generated content in this section"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    {isDeleting ? 'Deleting...' : 'Delete All in Section'}
                                </button>
                            </div>

                            {/* Delete status message */}
                            {deleteMessage && (
                                <div className={`rounded-lg p-2.5 text-xs font-semibold flex items-center gap-2 ${deleteMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {deleteMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                                    {deleteMessage.text}
                                </div>
                            )}
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
                                    {engineCourse?.lmsNotesStructure.filter(s => s.id !== 'l10').map((structItem) => {
                                        const topic = engineSection?.topics.find(t => t.id === editingGeneratedTopicId);
                                        const value = topic?.generatedNotes?.[structItem.id] || '';

                                        const isNumberType = structItem.type === 'number';
                                        const expectedCount = isNumberType ? (parseInt(structItem.value, 10) || 0) : 0;
                                        const actualItemCount = isNumberType && value ? (value.match(/(?:^|\n)\s*\d+\.\s/g) || []).length : 0;
                                        const countMismatch = isNumberType && expectedCount > 0 && actualItemCount < expectedCount;

                                        return (
                                            <div key={structItem.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${countMismatch ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'}`}>
                                                <div className="mb-3 flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-slate-800">{structItem.title}</h4>
                                                        <p className="text-xs text-slate-500 font-medium">
                                                            {structItem.description} • {isNumberType ? `Expected: ${expectedCount} items` : `Format: ${structItem.value}`}
                                                            {structItem.wordCount && structItem.type === 'text' ? ` • Target: ${structItem.wordCount} words` : ''}
                                                        </p>
                                                    </div>
                                                    {isNumberType && expectedCount > 0 && (
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${countMismatch ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                                            {actualItemCount}/{expectedCount} items
                                                        </span>
                                                    )}
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
