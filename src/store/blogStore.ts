import { create } from 'zustand';

import { UserRole } from './userStore';

// ── One-time cleanup of the old persisted blog cache ──────────────────────
// Earlier versions wrote every blog (full HTML, base64 images) under
// `blog-storage-seo` in localStorage. On rich content this regularly hit the
// 5 MB quota and broke saves with "exceeded the quota". Supabase is the
// source of truth now — the in-memory store below is just a session cache,
// so we no longer persist, but we still need to evict any leftover blob
// from previous sessions.
if (typeof window !== 'undefined') {
    try {
        window.localStorage.removeItem('blog-storage-seo');
    } catch { /* private mode / storage disabled */ }
}

export interface BlogFAQ {
    question: string;
    answer: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;

    // SEO Fields
    meta_title: string;
    primary_keyword: string;
    secondary_keywords: string;
    tags: string;

    // Author Profile
    author_id: string;
    author_role: UserRole;
    author_name: string;
    author_bio: string;
    author_image: string;

    category: string;
    featured_image: string;
    faq_section: BlogFAQ[];

    status: 'draft' | 'published';
    reading_time: number;
    views_count: number;
    created_at: string;
    updated_at: string;
}

interface BlogState {
    blogs: BlogPost[];
    setBlogs: (blogs: BlogPost[]) => void;
    addBlog: (blog: BlogPost) => void;
    updateBlog: (id: string, blog: Partial<BlogPost>) => void;
    deleteBlog: (id: string) => void;
    incrementView: (id: string) => void;
}

const mockInitialBlogs: BlogPost[] = [];


export const useBlogStore = create<BlogState>()((set) => ({
    blogs: mockInitialBlogs,
    setBlogs: (blogs) => set({ blogs }),
    addBlog: (blog) => set((state) => ({ blogs: [blog, ...state.blogs] })),
    updateBlog: (id, updated) => set((state) => ({
        blogs: state.blogs.map((b) => (b.id === id ? { ...b, ...updated } : b))
    })),
    deleteBlog: (id) => set((state) => ({ blogs: state.blogs.filter((b) => b.id !== id) })),
    incrementView: (id) => set((state) => ({
        blogs: state.blogs.map((b) => (b.id === id ? { ...b, views_count: b.views_count + 1 } : b))
    }))
}));

