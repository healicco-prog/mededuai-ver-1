import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EvaluatedStudent {
    id: number;
    name: string;
    roll: string;
    marks: number;
    breakdown: { [qIdx: number]: number };
    status: string;
}

export interface ExamEvaluation {
    id: string;
    examName: string;
    course: string;
    department: string;
    instituteName: string;
    date: number;
    questions: string[];
    students: EvaluatedStudent[];
}

interface EmsState {
    evaluations: ExamEvaluation[];
    saveEvaluation: (evaluation: ExamEvaluation) => void;
    deleteEvaluation: (id: string) => void;
}

export const useEmsStore = create<EmsState>()(
    persist(
        (set) => ({
            evaluations: [],
            saveEvaluation: (evaluation) => set((state) => {
                const existing = state.evaluations.find(e => e.id === evaluation.id);
                if (existing) {
                    return { evaluations: state.evaluations.map(e => e.id === evaluation.id ? evaluation : e) };
                }
                return { evaluations: [...state.evaluations, evaluation] };
            }),
            deleteEvaluation: (id) => set((state) => ({ evaluations: state.evaluations.filter(e => e.id !== id) })),
        }),
        {
            name: 'ems-storage',
            version: 1,
        }
    )
);
