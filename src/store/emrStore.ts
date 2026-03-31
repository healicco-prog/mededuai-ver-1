import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EvaluatedStudent {
    id: number;
    name: string;
    roll: string;
    reg: string;
    marks: number;
    breakdown: { [qIdx: string]: number };
    status: 'evaluated' | 'absent' | 'pending';
    omrImageUrl?: string;
}

export interface EmrEvaluation {
    id: string;
    examName: string;
    course: string;
    department: string;
    instituteName: string;
    date: number;
    questions: {
        text: string;
        type: string;
        marks: number;
        subdivided: boolean;
        subQ1?: string;
        subQ2?: string;
    }[];
    answerKey: Record<string, string>; // e.g {"0": "A", "1": "C", "1_i": "D", "1_ii": "A"}
    students: EvaluatedStudent[];
    maxMarks: number;
}

export interface EmrState {
    evaluations: EmrEvaluation[];
    saveEvaluation: (evaluation: EmrEvaluation) => void;
    deleteEvaluation: (id: string) => void;
}

export const useEmrStore = create<EmrState>()(
    persist(
        (set) => ({
            evaluations: [],
            saveEvaluation: (evaluation) => set((state) => {
                const existing = state.evaluations.find(e => e.id === evaluation.id);
                if (existing) {
                    return { evaluations: state.evaluations.map(e => e.id === evaluation.id ? evaluation : e) };
                }
                return { evaluations: [evaluation, ...state.evaluations] };
            }),
            deleteEvaluation: (id) => set((state) => ({ evaluations: state.evaluations.filter(e => e.id !== id) })),
        }),
        {
            name: 'emr-storage',
            version: 1,
        }
    )
);
