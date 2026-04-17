import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LessonPlan = {
    id: string;
    createdAt: string;
    topicTitle: string;
    generalInfo: {
        course: string; department: string; subject: string; topic: string;
        competency: string; yearOfStudents: string; numberOfStudents: string;
        duration: string; teachingMethod: string; date: string; venue: string; teacherName: string;
    };
    learningObjectives: string[];
    priorKnowledge: string[];
    teachingAids: { selected: string[]; other: string };
    teachingPlan: { time: string; teacherActivity: string; studentActivity: string; teachingMethod: string; teachingAid: string; }[];
    formativeAssessment: { questions: string[]; methods: string[] };
    summary: string[];
    takeHomeMessage: string;
    suggestedReading: string[];
    feedback: { wentWell: string; toImprove: string };
    tags: string[];
};

export const defaultLessonPlan = (): LessonPlan => ({
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    topicTitle: '',
    generalInfo: {
        course: '', department: '', subject: '', topic: '',
        competency: '', yearOfStudents: '', numberOfStudents: '',
        duration: '', teachingMethod: '', date: '', venue: '', teacherName: ''
    },
    learningObjectives: ['', '', '', ''],
    priorKnowledge: ['', '', ''],
    teachingAids: { selected: [], other: '' },
    teachingPlan: [{ time: '', teacherActivity: '', studentActivity: '', teachingMethod: '', teachingAid: '' }],
    formativeAssessment: { questions: ['', '', '', ''], methods: [] },
    summary: ['', '', ''],
    takeHomeMessage: '',
    suggestedReading: ['', '', ''],
    feedback: { wentWell: '', toImprove: '' },
    tags: []
});

interface LessonPlanState {
    lessonPlans: LessonPlan[];
    saveLessonPlan: (plan: LessonPlan) => void;
    deleteLessonPlan: (id: string) => void;
}

export const useLessonPlanStore = create<LessonPlanState>()(
    persist(
        (set) => ({
            lessonPlans: [],
            saveLessonPlan: (plan) => set((state) => {
                const exists = state.lessonPlans.findIndex(p => p.id === plan.id);
                if (exists >= 0) {
                    const newPlans = [...state.lessonPlans];
                    newPlans[exists] = plan;
                    return { lessonPlans: newPlans };
                }
                return { lessonPlans: [plan, ...state.lessonPlans] };
            }),
            deleteLessonPlan: (id) => set((state) => ({
                lessonPlans: state.lessonPlans.filter(p => p.id !== id)
            }))
        }),
        { name: 'lesson-plan-storage' }
    )
);
