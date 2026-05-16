import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

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
    isLoading: boolean;
    fetchData: () => Promise<void>;
    addFormat: (format: QPaperFormat) => Promise<void>;
    updateFormat: (format: QPaperFormat) => Promise<void>;
    deleteFormat: (id: string) => Promise<void>;
    savePaper: (paper: SavedPaper) => Promise<void>;
    deletePaper: (id: string) => Promise<void>;
    migrateLocalToSupabase: () => Promise<void>;
}

export const useQPaperStore = create<QPaperState>()(
    persist(
        (set, get) => ({
            formats: [],
            papers: [],
            isLoading: false,

            migrateLocalToSupabase: async () => {
                const state = get();
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    alert("Please log in first to sync data.");
                    return;
                }

                if (state.formats.length === 0 && state.papers.length === 0) {
                    alert("No local data found to migrate.");
                    return;
                }

                set({ isLoading: true });
                try {
                    // Migrate Formats
                    for (const format of state.formats) {
                        await supabase.from('q_paper_formats').upsert({
                            id: format.id,
                            user_id: session.user.id,
                            course: format.course,
                            department: format.department,
                            institute_name: format.instituteName,
                            logo_url: format.logoUrl,
                            paper_type: format.paperType,
                            allowed_types: format.allowedTypes,
                            type_tooltips: format.typeTooltips
                        });
                    }

                    // Migrate Papers
                    for (const paper of state.papers) {
                        await supabase.from('q_papers').upsert({
                            id: paper.id,
                            user_id: session.user.id,
                            format_id: paper.formatId,
                            course: paper.course,
                            department: paper.department,
                            institute_name: paper.instituteName,
                            logo_url: paper.logoUrl,
                            exam_name: paper.examName,
                            total_marks: paper.totalMarks,
                            questions: paper.questions,
                            created_at: paper.createdAt
                        });
                    }
                    alert("Migration complete! All local data is now in Supabase.");
                    // After migration, fetch to refresh state from cloud
                    await get().fetchData();
                } catch (error: any) {
                    console.error("Migration error:", error);
                    alert("Error during migration: " + error.message);
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchData: async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                set({ isLoading: true });
                try {
                    const [formatsRes, papersRes] = await Promise.all([
                        supabase.from('q_paper_formats').select('*').eq('user_id', session.user.id),
                        supabase.from('q_papers').select('*').eq('user_id', session.user.id)
                    ]);

                    if (formatsRes.data) {
                        const fetchedFormats: QPaperFormat[] = formatsRes.data.map(f => ({
                            id: f.id,
                            course: f.course,
                            department: f.department,
                            instituteName: f.institute_name,
                            logoUrl: f.logo_url,
                            paperType: f.paper_type,
                            allowedTypes: f.allowed_types || [],
                            typeTooltips: f.type_tooltips || {}
                        }));
                        set({ formats: fetchedFormats });
                    }

                    if (papersRes.data) {
                        const fetchedPapers: SavedPaper[] = papersRes.data.map(p => ({
                            id: p.id,
                            formatId: p.format_id,
                            course: p.course,
                            department: p.department,
                            instituteName: p.institute_name,
                            logoUrl: p.logo_url,
                            examName: p.exam_name,
                            totalMarks: p.total_marks,
                            questions: p.questions || [],
                            createdAt: Number(p.created_at)
                        }));
                        set({ papers: fetchedPapers });
                    }
                } catch (error) {
                    console.error('Error fetching QPaper data:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            addFormat: async (format) => {
                // Optimistic UI update
                set((state) => ({ formats: [...state.formats, format] }));
                
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('q_paper_formats').insert({
                        id: format.id,
                        user_id: session.user.id,
                        course: format.course,
                        department: format.department,
                        institute_name: format.instituteName,
                        logo_url: format.logoUrl,
                        paper_type: format.paperType,
                        allowed_types: format.allowedTypes,
                        type_tooltips: format.typeTooltips
                    });
                }
            },

            updateFormat: async (format) => {
                set((state) => ({ formats: state.formats.map(f => f.id === format.id ? format : f) }));

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('q_paper_formats').update({
                        course: format.course,
                        department: format.department,
                        institute_name: format.instituteName,
                        logo_url: format.logoUrl,
                        paper_type: format.paperType,
                        allowed_types: format.allowedTypes,
                        type_tooltips: format.typeTooltips
                    }).eq('id', format.id).eq('user_id', session.user.id);
                }
            },

            deleteFormat: async (id) => {
                set((state) => ({ formats: state.formats.filter(f => f.id !== id) }));
                
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('q_paper_formats').delete().eq('id', id).eq('user_id', session.user.id);
                }
            },

            savePaper: async (paper) => {
                set((state) => {
                    const existing = state.papers.find(p => p.id === paper.id);
                    if (existing) {
                        return { papers: state.papers.map(p => p.id === paper.id ? paper : p) };
                    }
                    return { papers: [...state.papers, paper] };
                });

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('q_papers').upsert({
                        id: paper.id,
                        user_id: session.user.id,
                        format_id: paper.formatId,
                        course: paper.course,
                        department: paper.department,
                        institute_name: paper.instituteName,
                        logo_url: paper.logoUrl,
                        exam_name: paper.examName,
                        total_marks: paper.totalMarks,
                        questions: paper.questions,
                        created_at: paper.createdAt
                    });
                }
            },

            deletePaper: async (id) => {
                set((state) => ({ papers: state.papers.filter(p => p.id !== id) }));

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await supabase.from('q_papers').delete().eq('id', id).eq('user_id', session.user.id);
                }
            },
        }),
        {
            name: 'qpaper-storage',
            version: 2,
        }
    )
);

