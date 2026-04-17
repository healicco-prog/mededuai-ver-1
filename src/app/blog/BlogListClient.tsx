"use client";

import { useState, useEffect } from 'react';
import { BlogPost, useBlogStore } from '../../store/blogStore';
import { blogService } from '../../lib/blogService';
import { Search, Image as ImageIcon, Clock, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function BlogListClient({ initialBlogs }: { initialBlogs: BlogPost[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTag, setActiveTag] = useState('All');
    const storeBlogs = useBlogStore(state => state.blogs);
    const [displayBlogs, setDisplayBlogs] = useState<BlogPost[]>(initialBlogs);

    useEffect(() => {
        let mounted = true;

        // Load immediately from local store to prevent missing creations 
        const publishedLocal = storeBlogs.filter(b => b.status === 'published');
        if (publishedLocal.length > 0) {
            // Merge or use local store
            setDisplayBlogs(prev => {
                const combined = [...prev, ...publishedLocal];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            });
        }

        const loadClientBlogs = async () => {
            try {
                const data = await blogService.getAllBlogs();
                if (mounted && data && data.length > 0) {
                    setDisplayBlogs(prev => {
                        const combined = [...prev, ...data];
                        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                        return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    });
                }
            } catch (e) {
                // Ignore silent timeouts
            }
        };

        loadClientBlogs();
        return () => { mounted = false; };
    }, [initialBlogs, storeBlogs]);

    const categories = ['All', ...Array.from(new Set(displayBlogs.map(b => b.category)))];

    // Extract unique tags
    const allTags = displayBlogs.flatMap(b => b.tags ? b.tags.split(',').map(t => t.trim()) : []);
    const uniqueTags = ['All', ...Array.from(new Set(allTags)).filter(t => t !== '')];

    const filteredBlogs = displayBlogs.filter(blog => {
        const matchesCategory = activeCategory === 'All' || blog.category === activeCategory;

        let blogTags: string[] = [];
        if (blog.tags) blogTags = blog.tags.split(',').map(t => t.trim().toLowerCase());
        const matchesTag = activeTag === 'All' || blogTags.includes(activeTag.toLowerCase());

        const s = searchQuery.toLowerCase();
        const matchesSearch = blog.title.toLowerCase().includes(s) ||
            blog.excerpt.toLowerCase().includes(s) ||
            (blog.primary_keyword && blog.primary_keyword.toLowerCase().includes(s));

        return matchesCategory && matchesTag && matchesSearch && blog.status === 'published';
    });

    const trendingBlog = displayBlogs.reduce((max, blog) => max.views_count > blog.views_count ? max : blog, displayBlogs[0]);

    return (
        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
            {/* Header Section */}
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                    The Pulse of MedEduAI
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Dive into the architecture of modern medical learning. Exploring AI, cognitive science, and the future of healthcare education.
                </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="flex flex-col gap-4 w-full md:w-auto overflow-hidden">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Category:</span>
                        {categories.map(c => (
                            <button
                                key={c}
                                onClick={() => setActiveCategory(c)}
                                className={`px-4 py-1.5 text-sm rounded-full whitespace-nowrap font-medium border transition-all duration-300
                                ${activeCategory === c
                                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    {uniqueTags.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Tag:</span>
                            {uniqueTags.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTag(t)}
                                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-semibold border transition-all duration-300
                                    ${activeTag === t
                                            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-400'}`}
                                >
                                    #{t}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 text-glow" />
                    <input
                        type="text"
                        placeholder="Search algorithms, theories..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-3 pl-12 pr-6 text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-xl transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Trending / Featured Post */}
            {trendingBlog && activeCategory === 'All' && !searchQuery && (
                <div className="mb-20 group relative rounded-3xl overflow-hidden glass-panel border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-1 block backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.01] hover:border-emerald-500/30">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="flex flex-col lg:flex-row gap-8 bg-slate-900/40 rounded-[22px] p-6 lg:p-8 backdrop-blur-xl">
                        <div className="w-full lg:w-1/2 h-64 lg:h-96 rounded-2xl overflow-hidden relative border border-white/5">
                            {trendingBlog.featured_image ? (
                                <img src={trendingBlog.featured_image} alt="Featured" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-slate-600" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Trending Now
                            </div>
                        </div>

                        <div className="w-full lg:w-1/2 flex flex-col justify-center">
                            <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm mb-4">{trendingBlog.category}</span>
                            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-colors">
                                {trendingBlog.title}
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 line-clamp-3">
                                {trendingBlog.excerpt}
                            </p>

                            <div className="flex items-center gap-6 mt-auto">
                                <Link
                                    href={`/blog/${trendingBlog.slug}`}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(52,211,153,0.4)] flex items-center gap-3 transition-all transform hover:scale-105"
                                >
                                    Read Article <ChevronRight className="w-5 h-5" />
                                </Link>
                                <div className="flex justify-center flex-col text-slate-400 text-sm">
                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {trendingBlog.reading_time} min read</span>
                                    <span className="flex items-center gap-2 mt-1"><Calendar className="w-4 h-4" /> {new Date(trendingBlog.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBlogs.map(blog => (
                    <Link href={`/blog/${blog.slug}`} key={blog.id} className="group flex flex-col glass-card bg-slate-900/30 border border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(52,211,153,0.15)] hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-2">
                        <div className="h-48 w-full relative overflow-hidden bg-slate-800">
                            {blog.featured_image ? (
                                <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-600" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-200 uppercase tracking-widest border border-white/10">
                                {blog.category}
                            </div>
                        </div>

                        <div className="p-8 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-white mb-3 leading-snug group-hover:text-emerald-400 transition-colors">
                                {blog.title}
                            </h3>
                            <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1">
                                {blog.excerpt}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-white/5">
                                <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" /> {new Date(blog.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5" /> {blog.reading_time} min read</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {filteredBlogs.length === 0 && (
                <div className="py-20 text-center text-slate-500">
                    <h3 className="text-2xl font-bold text-slate-300 mb-2">No transmissions found</h3>
                    <p>Change your search parameters or query another frequency.</p>
                </div>
            )}
        </div>
    );
}
