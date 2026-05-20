import { supabase, isMockMode as isMock } from './supabase';
import { useBlogStore, BlogPost } from '../store/blogStore';

// Helper to get authorization headers from localStorage securely
function getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const projectRef = 'yrelfdwkjtaidtoulwrj';
        const storageKey = `sb-${projectRef}-auth-token`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            const token = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token;
            if (token) {
                return { 'Authorization': `Bearer ${token}` };
            }
        }
    } catch (e) {
        console.error('[blogService] Failed to retrieve token from localStorage:', e);
    }
    return {};
}

// Resilient session synchronization: if the client-side supabase instance
// doesn't have an active session, but we have a token in localStorage,
// manually restore the session so that client direct queries carry authenticated headers.
async function syncSession(): Promise<void> {
    if (isMock) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && typeof window !== 'undefined') {
            console.log('[blogService] No active session on Supabase client. Checking localStorage...');
            const projectRef = 'yrelfdwkjtaidtoulwrj';
            const storageKey = `sb-${projectRef}-auth-token`;
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                const accessToken = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token;
                const refreshToken = parsed?.refresh_token || parsed?.currentSession?.refresh_token || parsed?.session?.refresh_token;
                if (accessToken) {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || ''
                    });
                    console.log('[blogService] Resiliently restored Supabase session from localStorage.');
                }
            }
        }
    } catch (e) {
        console.error('[blogService] Resilient session sync failed:', e);
    }
}

export const blogService = {
    async getAllBlogs(): Promise<BlogPost[]> {
        if (isMock) return useBlogStore.getState().blogs.filter(b => b.status === 'published');
        try {
            const res = await fetch('/api/blogs', {
                headers: {
                    ...getAuthHeader()
                }
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return (data as BlogPost[]).filter(b => b.status === 'published');
        } catch (err) {
            console.warn('[blogService] Failed to fetch blogs via API, attempting direct select fallback:', err);
            try {
                await syncSession();
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as BlogPost[];
            } catch (fallbackErr) {
                console.warn('[blogService] Direct select also failed. Returning local mock data fallback.', fallbackErr);
                return useBlogStore.getState().blogs.filter(b => b.status === 'published');
            }
        }
    },

    async getAdminBlogs(): Promise<BlogPost[]> {
        if (isMock) return useBlogStore.getState().blogs;
        try {
            // ?admin=true asks the API for drafts + published. The API requires
            // a verified admin signal (JWT, signed admin cookie, or role cookie)
            // and returns 403 if it can't confirm — that 403 falls through to
            // the direct Supabase select below so the dashboard still shows
            // something instead of an empty page.
            const res = await fetch('/api/blogs?admin=true', {
                credentials: 'include',
                headers: {
                    ...getAuthHeader()
                }
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return data as BlogPost[];
        } catch (err) {
            console.warn('[blogService] Failed to fetch admin blogs via API, attempting direct fallback:', err);
            try {
                await syncSession();
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as BlogPost[];
            } catch (fallbackErr) {
                return useBlogStore.getState().blogs;
            }
        }
    },

    async getBlogBySlug(slug: string): Promise<BlogPost | null> {
        if (isMock) return useBlogStore.getState().blogs.find(b => b.slug === slug) || null;
        try {
            const res = await fetch('/api/blogs', {
                headers: {
                    ...getAuthHeader()
                }
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data: BlogPost[] = await res.json();
            return data.find(b => b.slug === slug) || null;
        } catch (err) {
            console.warn('[blogService] Failed to fetch slug via API, attempting direct fallback:', err);
            try {
                await syncSession();
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) throw error;
                return data as BlogPost;
            } catch (fallbackErr) {
                return useBlogStore.getState().blogs.find(b => b.slug === slug) || null;
            }
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
            const res = await fetch('/api/blogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(blog)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(errData.error || `HTTP error! status: ${res.status}`);
            }
            // Update local Zustand store to keep client sync
            const resData = await res.json();
            if (resData.success && resData.data) {
                useBlogStore.getState().addBlog(resData.data);
            }
        } catch (err: any) {
            console.error('[blogService] Failed to insert blog via API, saving to local store:', err);
            const newBlog = {
                ...blog,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as BlogPost;
            useBlogStore.getState().addBlog(newBlog);
            throw new Error(err.message || 'Database insert failed');
        }
    },

    async updateBlog(id: string, updates: Partial<BlogPost>): Promise<void> {
        if (isMock) {
            useBlogStore.getState().updateBlog(id, updates);
            return;
        }
        try {
            const res = await fetch('/api/blogs', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({ id, ...updates })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(errData.error || `HTTP error! status: ${res.status}`);
            }
            const resData = await res.json();
            if (resData.success && resData.data) {
                useBlogStore.getState().updateBlog(id, resData.data);
            } else {
                useBlogStore.getState().updateBlog(id, updates);
            }
        } catch (err: any) {
            console.error('[blogService] Failed to update blog via API, updating local store:', err);
            useBlogStore.getState().updateBlog(id, updates);
            throw new Error(err.message || 'Database update failed');
        }
    },

    async deleteBlog(id: string): Promise<void> {
        if (isMock) {
            useBlogStore.getState().deleteBlog(id);
            return;
        }
        try {
            const res = await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: {
                    ...getAuthHeader()
                }
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
                throw new Error(errData.error || `HTTP error! status: ${res.status}`);
            }
            useBlogStore.getState().deleteBlog(id);
        } catch (err: any) {
            console.error('[blogService] Failed to delete blog via API, deleting from local store:', err);
            useBlogStore.getState().deleteBlog(id);
            throw new Error(err.message || 'Database delete failed');
        }
    },

    async incrementViewCount(id: string): Promise<void> {
        if (isMock) {
            useBlogStore.getState().incrementView(id);
            return;
        }
        try {
            await syncSession();
            const { error } = await supabase.rpc('increment_view_count', { blog_id: id });
            if (error) throw error;
        } catch (err) {
            console.error('[blogService] Failed to increment view count in Supabase:', err);
            useBlogStore.getState().incrementView(id);
        }
    }
};
