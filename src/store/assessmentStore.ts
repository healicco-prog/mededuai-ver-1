import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AssessmentMode = 'Theory' | 'Practical' | 'Viva' | 'Clinical' | string;

export interface AssessmentModeDetail {
    mode: AssessmentMode;
    maxMarks: number;
    totalClasses?: number; // For attendance tracking
}

export type AssessmentType = 'formative' | 'internal' | 'clinical' | 'summative';

export interface Assessment {
    id: string;
    name: string;
    type: AssessmentType;
    date: string;
    
    // For Formative/Internal
    modes?: AssessmentModeDetail[];
    
    // For Clinical Posing
    clinicalAttendancePercent?: number;
    clinicalOverallAssessment?: readonly string[];
    clinicalRemarks?: string;
    isApproved?: boolean;
    
    // For Summative 
    papers?: { name: string; maxMarks: number }[];
    
    createdAt: string;
}

export interface StudentAssessmentRecord {
    id: string; // unique record ID
    assessmentId: string;
    studentId: string;
    
    // Marks/Attendance mapping where key is the `mode` or `paper name` 
    marks?: Record<string, number>;
    attendanceClassesAttended?: Record<string, number>;
    
    // For Clinical
    clinicalRemarks?: string;
}

export interface NonScholasticAchievement {
    id: string;
    studentId: string;
    achievement: string;
    date: string;
}

interface AssessmentState {
    assessments: Assessment[];
    studentRecords: StudentAssessmentRecord[];
    achievements: NonScholasticAchievement[];
    
    // Actions
    addAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
    updateAssessment: (id: string, updates: Partial<Assessment>) => void;
    deleteAssessment: (id: string) => void;
    
    upsertStudentRecord: (record: Omit<StudentAssessmentRecord, 'id'>) => void;
    
    addAchievement: (achievement: Omit<NonScholasticAchievement, 'id' | 'date'>) => void;
    deleteAchievement: (id: string) => void;
}

export const useAssessmentStore = create<AssessmentState>()(
    persist(
        (set) => ({
            assessments: [],
            studentRecords: [],
            achievements: [],

            addAssessment: (assessment) => set((state) => ({
                assessments: [
                    ...state.assessments,
                    {
                        ...assessment,
                        id: Math.random().toString(36).substring(2, 9),
                        createdAt: new Date().toISOString()
                    }
                ]
            })),

            updateAssessment: (id, updates) => set((state) => ({
                assessments: state.assessments.map(a => 
                    a.id === id ? { ...a, ...updates } : a
                )
            })),

            deleteAssessment: (id) => set((state) => ({
                assessments: state.assessments.filter(a => a.id !== id),
                studentRecords: state.studentRecords.filter(r => r.assessmentId !== id) // Cascade delete records
            })),

            upsertStudentRecord: (record) => set((state) => {
                const existingIndex = state.studentRecords.findIndex(
                    r => r.assessmentId === record.assessmentId && r.studentId === record.studentId
                );

                if (existingIndex >= 0) {
                    // Update existing
                    const newRecords = [...state.studentRecords];
                    newRecords[existingIndex] = {
                        ...newRecords[existingIndex],
                        ...record,
                    };
                    return { studentRecords: newRecords };
                } else {
                    // Add new
                    return {
                        studentRecords: [
                            ...state.studentRecords,
                            { ...record, id: Math.random().toString(36).substring(2, 9) }
                        ]
                    };
                }
            }),

            addAchievement: (achievement) => set((state) => ({
                achievements: [
                    ...state.achievements,
                    {
                        ...achievement,
                        id: Math.random().toString(36).substring(2, 9),
                        date: new Date().toISOString()
                    }
                ]
            })),

            deleteAchievement: (id) => set((state) => ({
                achievements: state.achievements.filter(a => a.id !== id)
            })),
        }),
        {
            name: 'mededuai-assessment-storage',
        }
    )
);
