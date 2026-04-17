import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QPaperFormat {
    id: string;
    course: string;
    department: string;
    instituteName: string;
    logoUrl: string;
    paperType?: 'Essay' | 'MCQ';
    allowedTypes: string[];
    typeTooltips?: Record<string, string>;
}

export interface SavedPaper {
    id: string;
    formatId: string;
    course: string;
    department: string;
    instituteName: string;
    logoUrl: string;
    examName: string;
    totalMarks: number;
    questions: { id: string; questionNo: number; type: string; marks: number; generatedContent: string; mainOrSub: string }[];
    createdAt: number;
}

export interface QPaperState {
    formats: QPaperFormat[];
    papers: SavedPaper[];
    addFormat: (format: QPaperFormat) => void;
    updateFormat: (format: QPaperFormat) => void;
    deleteFormat: (id: string) => void;
    savePaper: (paper: SavedPaper) => void;
    deletePaper: (id: string) => void;
}

export const useQPaperStore = create<QPaperState>()(
    persist(
        (set) => ({
            formats: [],
            papers: [],
            addFormat: (format) => set((state) => ({ formats: [...state.formats, format] })),
            updateFormat: (format) => set((state) => ({ formats: state.formats.map(f => f.id === format.id ? format : f) })),
            deleteFormat: (id) => set((state) => ({ formats: state.formats.filter(f => f.id !== id) })),
            savePaper: (paper) => set((state) => {
                const existing = state.papers.find(p => p.id === paper.id);
                if (existing) {
                    return { papers: state.papers.map(p => p.id === paper.id ? paper : p) };
                }
                return { papers: [...state.papers, paper] };
            }),
            deletePaper: (id) => set((state) => ({ papers: state.papers.filter(p => p.id !== id) })),
        }),
        {
            name: 'qpaper-storage',
            version: 2,
        }
    )
);
