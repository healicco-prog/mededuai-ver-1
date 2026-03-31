import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TopicCompetency {
    id: string;
    sn: number;
    section: string;
    topic: string;
    competencyNo: string;
    isCompleted?: boolean;
}

export interface StudentEntry {
    id: string;
    rn: number;
    regNo: string;
    name: string;
    email: string;
    mobileNo: string;
}

export interface WeeklyClassSlot {
    id: string;
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    fromTime: string; // HH:mm
    toTime: string;   // HH:mm
}

export interface TimetableFormat {
    id: string;
    instituteName: string;
    instituteLogoUrl: string | null;
    course: string;
    department: string;
    weeklySlots: WeeklyClassSlot[];
    facultyMembers: string[];
    topicsPool: TopicCompetency[];
    studentsList: StudentEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface ScheduledClass {
    id: string;
    date: string; // YYYY-MM-DD
    formatId: string; // Links back to TimetableFormat
    topicId: string; // ID from TopicCompetency
    topicName: string; // Cached for easy rendering
    competencyNo: string;
    activity: string; // "Lecture", "Tutorial", "Practical", etc.
    batch: 'Full' | 'Batch A' | 'Batch B' | 'Batch C' | 'Batch D' | 'Batch E' | string;
    staffName: string;
}

export interface Holiday {
    id: string;
    date: string; // YYYY-MM-DD
    details: string;
}

export interface SavedTimetable {
    id: string;
    formatId: string;
    month: string; // YYYY-MM
    instituteName: string;
    course: string;
    department: string;
    classCount: number;
    savedAt: string;
}

interface TimetableStoreState {
    formats: TimetableFormat[];
    schedules: ScheduledClass[];
    holidays: Holiday[];
    savedTimetables: SavedTimetable[];
    
    // Actions for Formats
    addFormat: (format: Omit<TimetableFormat, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateFormat: (id: string, updates: Partial<TimetableFormat>) => void;
    deleteFormat: (id: string) => void;
    
    // Actions for Scheduling
    scheduleClass: (scheduledClass: Omit<ScheduledClass, 'id'>) => void;
    updateScheduledClass: (id: string, updates: Partial<ScheduledClass>) => void;
    deleteScheduledClass: (id: string) => void;
    markTopicCompleted: (formatId: string, topicId: string, isCompleted: boolean) => void;

    // Actions for Holidays
    addHoliday: (date: string, details: string) => void;
    removeHoliday: (date: string) => void;

    // Actions for Saved Timetables
    saveTimetable: (timetable: Omit<SavedTimetable, 'id' | 'savedAt'>) => void;
    deleteSavedTimetable: (id: string) => void;
}

export const useTimetableStore = create<TimetableStoreState>()(
    persist(
        (set) => ({
            formats: [],
            schedules: [],
            holidays: [],
            savedTimetables: [],

            // --- Formats ---
            addFormat: (formatData) => set((state) => ({
                formats: [
                    ...state.formats,
                    {
                        ...formatData,
                        id: `format_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }
                ]
            })),
            updateFormat: (id, updates) => set((state) => ({
                formats: state.formats.map(format => 
                    format.id === id 
                        ? { ...format, ...updates, updatedAt: new Date().toISOString() } 
                        : format
                )
            })),
            deleteFormat: (id) => set((state) => ({
                formats: state.formats.filter(format => format.id !== id),
                schedules: state.schedules.filter(sched => sched.formatId !== id) // Cascade delete schedules
            })),

            // --- Scheduling ---
            scheduleClass: (classData) => set((state) => {
                // When scheduling a class, automatically mark the topic as completed in the format's pool
                const updatedFormats = state.formats.map(f => {
                    if (f.id === classData.formatId) {
                        return {
                            ...f,
                            topicsPool: f.topicsPool.map(t => 
                                t.id === classData.topicId ? { ...t, isCompleted: true } : t
                            )
                        };
                    }
                    return f;
                });

                return {
                    formats: updatedFormats,
                    schedules: [
                        ...state.schedules,
                        {
                            ...classData,
                            id: `class_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                        }
                    ]
                };
            }),
            updateScheduledClass: (id, updates) => set((state) => {
                // If the topic changed, we might need to toggle completion states... 
                // For simplicity in this demo, let's just update the schedule record.
                return {
                    schedules: state.schedules.map(sched => 
                        sched.id === id ? { ...sched, ...updates } : sched
                    )
                };
            }),
            deleteScheduledClass: (id) => set((state) => {
                const classToDelete = state.schedules.find(s => s.id === id);
                if (!classToDelete) return state;

                // When deleting a schedule, unmark the topic as completed
                const updatedFormats = state.formats.map(f => {
                    if (f.id === classToDelete.formatId) {
                        return {
                            ...f,
                            topicsPool: f.topicsPool.map(t => 
                                t.id === classToDelete.topicId ? { ...t, isCompleted: false } : t
                            )
                        };
                    }
                    return f;
                });

                return {
                    formats: updatedFormats,
                    schedules: state.schedules.filter(sched => sched.id !== id)
                };
            }),
            markTopicCompleted: (formatId, topicId, isCompleted) => set((state) => ({
                formats: state.formats.map(f => {
                    if (f.id === formatId) {
                        return {
                            ...f,
                            topicsPool: f.topicsPool.map(t => 
                                t.id === topicId ? { ...t, isCompleted } : t
                            )
                        };
                    }
                    return f;
                })
            })),

            // --- Holidays ---
            addHoliday: (date, details) => set((state) => {
                // Ensure we don't add duplicate holidays for the same date
                if (state.holidays.some(h => h.date === date)) return state;
                return {
                    holidays: [
                        ...state.holidays,
                        { id: `hol_${Date.now()}`, date, details }
                    ]
                };
            }),
            removeHoliday: (date) => set((state) => ({
                holidays: state.holidays.filter(h => h.date !== date)
            })),

            // --- Saved Timetables ---
            saveTimetable: (timetableData) => set((state) => {
                // Replace if same format+month combo already exists
                const filtered = state.savedTimetables.filter(
                    st => !(st.formatId === timetableData.formatId && st.month === timetableData.month)
                );
                return {
                    savedTimetables: [
                        ...filtered,
                        {
                            ...timetableData,
                            id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            savedAt: new Date().toISOString(),
                        }
                    ]
                };
            }),
            deleteSavedTimetable: (id) => set((state) => ({
                savedTimetables: state.savedTimetables.filter(st => st.id !== id)
            }))
        }),
        {
            name: 'mededuai-timetable-storage',
            version: 4,
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    if (persistedState.formats) {
                        persistedState.formats = persistedState.formats.map((f: any) => ({
                            ...f,
                            studentsList: f.studentsList || [],
                        }));
                    }
                }
                if (version < 3) {
                    persistedState.savedTimetables = persistedState.savedTimetables || [];
                }
                // v4: purge any format entries with a missing or very short instituteName
                //     (removes stale / demo / garbage entries like "ss — ass (Phase 1)")
                if (version < 4) {
                    if (persistedState.formats) {
                        persistedState.formats = persistedState.formats.filter(
                            (f: any) => f.instituteName && f.instituteName.trim().length > 2
                        );
                    }
                }
                return persistedState;
            },
        }
    )
);
