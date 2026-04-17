import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserRole } from './userStore';

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

const mockInitialBlogs: BlogPost[] = [
    {
        id: '1',
        title: 'How AI Will Change Startups in 2026',
        slug: 'how-ai-will-change-startups',
        content: `<h2>The Rise of AI Agents</h2><p>As we enter 2026, AI has transitioned from conversational interfaces to autonomous agents that act on your behalf.</p><p>This shift allows tiny startups to achieve the operational capacity of massive enterprises.</p><ul><li>Automated customer support</li><li>Self-healing codebases</li><li>Generative marketing</li></ul><h3>The Future</h3><p>Startups that don't adapt to AI-first architectures will simply be outpaced.</p>`,
        excerpt: 'Explore how autonomous AI agents are revolutionizing the way startups operate and scale in 2026 and beyond.',
        meta_title: 'AI in Startups 2026: The Rise of AI Agents',
        primary_keyword: 'AI Startups 2026',
        secondary_keywords: 'Autonomous agents, generative marketing',
        tags: 'AI, Startups, Future',
        featured_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop',
        category: 'EdTech & Startup Insights',
        author_id: '6',
        author_role: 'superadmin',
        author_name: 'Dr. Sarah Chen',
        author_bio: 'Medical Education Technologist and AI Researcher aiming to bridge the gap between AI and learning.',
        author_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=250&auto=format&fit=crop',
        faq_section: [
            { question: "What are AI agents?", answer: "AI agents are autonomous systems that act on your behalf to complete complex tasks." }
        ],
        status: 'published',
        reading_time: 4,
        views_count: 145,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Designing Futuristic UX/UI Interfaces',
        slug: 'designing-futuristic-ux-ui',
        content: `<h2>Glassmorphism vs Neumorphism</h2><p>Modern design has evolved. Neon accents, smooth blurs, and adaptive dark modes are the new standard.</p><h3>Implementing SEO in modern apps</h3><p>SEO is critical for discovery...</p>`,
        excerpt: 'A comprehensive guide on creating modern, glossy, and highly engaging user interfaces using Tailwind CSS.',
        meta_title: 'Futuristic UX/UI Design 2026 Guide',
        primary_keyword: 'Futuristic UX',
        secondary_keywords: 'Glassmorphism, Tailwind CSS, UI design',
        tags: 'Design, UI, UX, Tailwind',
        featured_image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2000&auto=format&fit=crop',
        category: 'Medical Education Innovation',
        author_id: '5',
        author_role: 'deptadmin',
        author_name: 'Alex Rivera',
        author_bio: 'Lead Product Designer focusing on next-gen interfaces for medical platforms.',
        author_image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=250&auto=format&fit=crop',
        faq_section: [],
        status: 'published',
        reading_time: 3,
        views_count: 89,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
    }
];

export const useBlogStore = create<BlogState>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'blog-storage-seo',
            version: 2,
        }
    )
);
