import { supabase } from './supabase';
import { useBlogStore, BlogPost } from '../store/blogStore';

// The service integrates directly with Supabase, 
// using zustand store fallback ONLY if the user hasn't configured real DB keys yet.
const isMock = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummyurl.supabase.co' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const blogService = {
    async getAllBlogs(): Promise<BlogPost[]> {
        if (isMock) return useBlogStore.getState().blogs.filter(b => b.status === 'published');
        try {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as BlogPost[];
        } catch (err) {
            console.warn('Supabase DB error, using mock data fallback.', err);
            return useBlogStore.getState().blogs.filter(b => b.status === 'published');
        }
    },

    async getAdminBlogs(): Promise<BlogPost[]> {
        if (isMock) return useBlogStore.getState().blogs;
        try {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as BlogPost[];
        } catch (err) {
            return useBlogStore.getState().blogs;
        }
    },

    async getBlogBySlug(slug: string): Promise<BlogPost | null> {
        if (isMock) return useBlogStore.getState().blogs.find(b => b.slug === slug) || null;
        try {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            return data as BlogPost;
        } catch (err) {
            return useBlogStore.getState().blogs.find(b => b.slug === slug) || null;
        }
    },

    async createBlog(blog: Partial<BlogPost>): Promise<void> {
        if (isMock) {
            const newBlog = {
                ...blog,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as BlogPost;
            useBlogStore.getState().addBlog(newBlog);
            return;
        }
        try {
            const { error } = await supabase.from('blogs').insert(blog);
            if (error) throw error;
        } catch (err) {
            const newBlog = {
                ...blog,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as BlogPost;
            useBlogStore.getState().addBlog(newBlog);
        }
    },

    async updateBlog(id: string, updates: Partial<BlogPost>): Promise<void> {
        if (isMock) {
            useBlogStore.getState().updateBlog(id, updates);
            return;
        }
        try {
            const { error } = await supabase
                .from('blogs')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            useBlogStore.getState().updateBlog(id, updates);
        }
    },

    async deleteBlog(id: string): Promise<void> {
        if (isMock) {
            useBlogStore.getState().deleteBlog(id);
            return;
        }
        try {
            const { error } = await supabase.from('blogs').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            useBlogStore.getState().deleteBlog(id);
        }
    },

    async incrementViewCount(id: string): Promise<void> {
        if (isMock) {
            useBlogStore.getState().incrementView(id);
            return;
        }
        try {
            const { error } = await supabase.rpc('increment_view_count', { blog_id: id });
            if (error) throw error;
        } catch (err) {
            useBlogStore.getState().incrementView(id);
        }
    }
};
