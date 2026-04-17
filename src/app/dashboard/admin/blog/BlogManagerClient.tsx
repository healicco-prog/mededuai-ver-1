"use client";

import { useState, useEffect } from 'react';
import { BlogPost } from '../../../../store/blogStore';
import { useUserStore } from '../../../../store/userStore';
import { tokenService } from '../../../../lib/tokenService';
import { blogService } from '../../../../lib/blogService';
import { PenTool, CheckCircle2, XCircle, Trash2, Edit2, Play, Eye, FileText, Globe, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BlogManagerClient({ currentUserRole }: { currentUserRole: 'masteradmin' | 'superadmin' }) {
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
    const [generatingAI, setGeneratingAI] = useState(false);

    // Bulk Generation States
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [generatingBulk, setGeneratingBulk] = useState(false);
    const [bulkForm, setBulkForm] = useState({
        numBlogs: 1,
        categories: ['AI in Medical Education'] as string[]
    });

    // Auto-SEO checks
    const [seoChecks, setSeoChecks] = useState({
        titleExists: false,
        metaDescriptionExists: false,
        primaryKeywordExists: false,
        imageExists: false,
        wordCount: false
    });

    const loadBlogs = async () => {
        setLoading(true);
        const data = await blogService.getAdminBlogs();
        setBlogs(data);
        setLoading(false);
    };

    useEffect(() => {
        loadBlogs();
    }, []);

    useEffect(() => {
        if (editingBlog) {
            const wc = (editingBlog.content || '').split(' ').length;
            setSeoChecks({
                titleExists: !!editingBlog.title,
                metaDescriptionExists: !!editingBlog.excerpt, // which acts as meta_desc
                primaryKeywordExists: !!editingBlog.primary_keyword,
                imageExists: !!editingBlog.featured_image,
                wordCount: wc >= 300 // Slightly lowered for practical testing
            });
        }
    }, [editingBlog]);

    const handleCreateNew = () => {
        setEditingBlog({
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            featured_image: '',
            category: 'AI in Medical Education',
            status: 'draft',
            author_role: currentUserRole,
            author_name: 'Dr. Jane Smith', // Mocks
            author_bio: 'A passionate educator',
            author_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&fit=crop',
            primary_keyword: '',
            secondary_keywords: '',
            tags: '',
            meta_title: '',
            faq_section: [],
            reading_time: 5,
            views_count: 0
        });
    };

    const handleGenerateAI = async () => {
        if (!editingBlog?.title) {
            alert("Please enter a Title (Topic) first to generate content!");
            return;
        }

        const currentUser = useUserStore.getState().users[0];
        const check = tokenService.checkAvailability(currentUser.id, 'Blog Generator');
        if (!check.allowed) {
            alert(`Insufficient Tokens. Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setGeneratingAI(true);
        try {
            const res = await fetch('/api/blog-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: editingBlog.title,
                    category: editingBlog.category || 'Medical Education Innovation'
                })
            });
            const data = await res.json();

            if (data.success && data.blog) {
                setEditingBlog(prev => ({
                    ...prev,
                    title: data.blog.title || prev?.title,
                    slug: data.blog.slug || prev?.slug,
                    content: data.blog.content,
                    excerpt: data.blog.excerpt,
                    meta_title: data.blog.meta_title,
                    primary_keyword: data.blog.primary_keyword,
                    secondary_keywords: data.blog.secondary_keywords,
                    tags: data.blog.tags,
                    faq_section: data.blog.faq_section || [],
                    featured_image: prev?.featured_image || `https://image.pollinations.ai/prompt/${encodeURIComponent((data.blog.title || prev?.title || 'medical education') + ' high quality modern professional photorealistic')}?width=1200&height=630&nologo=true`
                }));
                // Deduct Tokens on Success
                tokenService.processTransaction(currentUser.id, 'Blog Generator', 'gemini-1.5-flash');
            }
        } catch (e) {
            alert('Generation failed');
            console.error(e);
        }
        setGeneratingAI(false);
    };

    const handleSave = async (publish: boolean) => {
        if (!editingBlog) return;

        // Basic validation if trying to publish
        if (publish) {
            if (!seoChecks.titleExists || !seoChecks.metaDescriptionExists || !seoChecks.primaryKeywordExists) {
                if (!confirm("SEO checks are missing. Are you sure you want to publish?")) return;
            }
        }

        const blogData = {
            ...editingBlog,
            status: publish ? 'published' : 'draft',
            author_role: currentUserRole,
            author_id: 'unknown'
        } as Partial<BlogPost>;

        if (blogData.id) {
            await blogService.updateBlog(blogData.id, blogData);
        } else {
            if (!blogData.slug) blogData.slug = blogData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `post-${Date.now()}`;
            await blogService.createBlog(blogData);
        }

        setEditingBlog(null);
        loadBlogs();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            await blogService.deleteBlog(id);
            loadBlogs();
        }
    };

    const handleBulkGenerate = async () => {
        if (bulkForm.categories.length === 0) {
            alert("Please select at least one category.");
            return;
        }

        const currentUser = useUserStore.getState().users[0];
        const check = tokenService.checkAvailability(currentUser.id, 'Blog Generator');
        const requiredTotal = check.required * bulkForm.numBlogs;

        if (!check.allowed || check.remaining < requiredTotal) {
            alert(`Insufficient Tokens for Bulk Generation. Cost: ${requiredTotal}, Balance: ${check.remaining}`);
            return;
        }

        setGeneratingBulk(true);
        try {
            const res = await fetch('/api/bulk-blog-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulkForm)
            });
            const { data } = await res.json();

            if (data?.blogs && Array.isArray(data.blogs)) {
                for (const b of data.blogs) {
                    const mappedBlog: Partial<BlogPost> = {
                        title: b.title || "Untitled AI Blog",
                        slug: b.slug || `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        content: b.content || "<p>No content generated</p>",
                        excerpt: b.meta_description || "Generated SEO Description",
                        meta_title: b.meta_title || b.title,
                        primary_keyword: b.primary_keyword || "",
                        secondary_keywords: Array.isArray(b.secondary_keywords) ? b.secondary_keywords.join(', ') : (b.secondary_keywords || ""),
                        tags: Array.isArray(b.tags) ? b.tags.join(', ') : (b.tags || ""),
                        faq_section: b.faqs || [],
                        status: 'draft',
                        category: b.category || bulkForm.categories[0],
                        author_role: currentUserRole,
                        reading_time: Number(b.reading_time) || 5,
                        views_count: 0,
                        featured_image: `https://image.pollinations.ai/prompt/${encodeURIComponent((b.title || 'medical technology') + ' high quality modern professional photorealistic')}?width=1200&height=630&nologo=true`
                    };
                    await blogService.createBlog(mappedBlog);
                    // Deduct for each iteration
                    tokenService.processTransaction(currentUser.id, 'Blog Generator', 'gemini-2.5-bulk');
                }
                setShowBulkModal(false);
                loadBlogs();
                alert(`Successfully generated ${data.blogs.length} draft SEO blogs!`);
            }
        } catch (e) {
            alert('Bulk generation failed.');
            console.error(e);
        }
        setGeneratingBulk(false);
    };

    const insertTag = (tag: string) => {
        if (!editingBlog) return;
        const textarea = document.getElementById('blog-content-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = editingBlog.content || '';

        let newContent = '';
        if (tag === 'b') newContent = text.substring(0, start) + '<strong>' + text.substring(start, end) + '</strong>' + text.substring(end);
        else if (tag === 'i') newContent = text.substring(0, start) + '<em>' + text.substring(start, end) + '</em>' + text.substring(end);
        else if (tag === 'h2') newContent = text.substring(0, start) + '<h2>' + text.substring(start, end) + '</h2>' + text.substring(end);
        else if (tag === 'ul') newContent = text.substring(0, start) + '<ul><li>' + text.substring(start, end) + '</li></ul>' + text.substring(end);
        else if (tag === 'img') newContent = text.substring(0, start) + '<img src="URL" alt="image" />' + text.substring(end);
        else if (tag === 'code') newContent = text.substring(0, start) + '<pre><code>' + text.substring(start, end) + '</code></pre>' + text.substring(end);

        setEditingBlog({ ...editingBlog, content: newContent });
    };

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading engine...</div>;

    if (editingBlog) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col h-[80vh]">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between shadow-sm flex-wrap gap-4">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-3">
                        {editingBlog.id ? 'Edit Article' : 'Draft New Article'}
                        {currentUserRole === 'superadmin' && (
                            <button onClick={handleGenerateAI} disabled={generatingAI} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200 shadow-sm">
                                {generatingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Write with AI (SEO)
                            </button>
                        )}
                    </h3>
                    <div className="flex gap-3">
                        <button onClick={() => setEditingBlog(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-2 text-sm">
                            <XCircle className="w-4 h-4" /> Cancel
                        </button>
                        <button onClick={() => handleSave(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 shadow-md flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4" /> Save Draft
                        </button>
                        <button onClick={() => handleSave(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4" /> Publish Now
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0 grid grid-cols-1 lg:grid-cols-4">
                    {/* Left Col - Editor */}
                    <div className="col-span-1 lg:col-span-3 space-y-6 p-6 lg:border-r border-slate-200 bg-white">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Article Title</label>
                            <input
                                value={editingBlog.title || ''}
                                onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value })}
                                placeholder="E.g., The Future of AI in Surgery..."
                                className="w-full text-2xl font-bold text-slate-900 placeholder:text-slate-300 border-b border-transparent focus:border-slate-200 outline-none focus:ring-0 px-0 py-2 transition-colors"
                            />
                        </div>

                        {/* Rich Text Toolbar */}
                        <div className="flex flex-wrap gap-2 px-4 py-2 bg-slate-100/50 rounded-xl border border-slate-200 sticky top-0 z-10 backdrop-blur-md">
                            <button onClick={() => insertTag('h2')} className="p-2 text-slate-600 hover:bg-slate-200 rounded font-bold text-xs">H2</button>
                            <span className="w-px bg-slate-300 mx-1"></span>
                            <button onClick={() => insertTag('b')} className="p-2 text-slate-600 hover:bg-slate-200 rounded font-bold text-xs">B</button>
                            <button onClick={() => insertTag('i')} className="p-2 text-slate-600 hover:bg-slate-200 rounded italic text-xs">I</button>
                            <span className="w-px bg-slate-300 mx-1"></span>
                            <button onClick={() => insertTag('ul')} className="p-2 text-slate-600 hover:bg-slate-200 rounded text-xs">List (ul)</button>
                            <button onClick={() => insertTag('code')} className="p-2 text-slate-600 hover:bg-slate-200 rounded font-mono text-xs">{'</>'}</button>
                            <button onClick={() => insertTag('img')} className="p-2 text-slate-600 hover:bg-slate-200 rounded text-xs">Image</button>
                        </div>

                        <div>
                            <textarea
                                id="blog-content-editor"
                                value={editingBlog.content || ''}
                                onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value })}
                                placeholder="Start writing your HTML rich text here..."
                                className="w-full h-[600px] outline-none text-slate-700 text-base leading-relaxed resize-y border border-slate-200 focus:border-emerald-400 rounded-xl p-6 shadow-inner bg-slate-50/30"
                            />
                        </div>
                    </div>

                    {/* Right Col - Meta settings */}
                    <div className="col-span-1 p-6 space-y-6 bg-slate-50/50 text-sm">

                        {/* Auto-SEO Check Card */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-2 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> SEO Checklist</h4>
                            <ul className="space-y-2 text-xs">
                                <li className="flex items-center justify-between"><span className="text-slate-600">Title Exists</span> {seoChecks.titleExists ? <span className="text-emerald-600 font-bold">Pass</span> : <span className="text-red-500 font-bold">Fail</span>}</li>
                                <li className="flex items-center justify-between"><span className="text-slate-600">Meta Desc</span> {seoChecks.metaDescriptionExists ? <span className="text-emerald-600 font-bold">Pass</span> : <span className="text-red-500 font-bold">Fail</span>}</li>
                                <li className="flex items-center justify-between"><span className="text-slate-600">Prim. Keyword</span> {seoChecks.primaryKeywordExists ? <span className="text-emerald-600 font-bold">Pass</span> : <span className="text-red-500 font-bold">Fail</span>}</li>
                                <li className="flex items-center justify-between"><span className="text-slate-600">Cover Image</span> {seoChecks.imageExists ? <span className="text-emerald-600 font-bold">Pass</span> : <span className="text-red-500 font-bold">Fail</span>}</li>
                                <li className="flex items-center justify-between"><span className="text-slate-600">Count &gt; 300</span> {seoChecks.wordCount ? <span className="text-emerald-600 font-bold">Pass</span> : <span className="text-red-500 font-bold">Fail</span>}</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                                <select
                                    value={editingBlog.category || 'AI in Medical Education'}
                                    onChange={e => setEditingBlog({ ...editingBlog, category: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 appearance-none text-xs font-semibold text-slate-700 shadow-sm"
                                >
                                    <option value="AI in Medical Education">AI in Medical Education</option>
                                    <option value="Medical Education Innovation">Medical Education Innovation</option>
                                    <option value="LMS for Medical Institutes">LMS for Medical Institutes</option>
                                    <option value="Teacher & Faculty Management">Teacher & Faculty Management</option>
                                    <option value="Medical Exam Preparation">Medical Exam Preparation</option>
                                    <option value="Teaching Strategies for Medical Educators">Teaching Strategies for Medical Educators</option>
                                    <option value="EdTech & Startup Insights">EdTech & Startup Insights</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">URL Slug</label>
                                <input
                                    value={editingBlog.slug || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, slug: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs shadow-sm font-mono text-slate-500"
                                    placeholder="auto-generated"
                                />
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <h4 className="font-bold text-slate-800 text-[10px] mb-3 uppercase tracking-widest text-emerald-700">SEO & Meta Fields</h4>

                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-2">Meta Title (max 60)</label>
                                <input
                                    value={editingBlog.meta_title || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, meta_title: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs shadow-sm"
                                />

                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-3">Meta Description (Excerpt)</label>
                                <textarea
                                    value={editingBlog.excerpt || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs shadow-sm resize-none"
                                />

                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-3">Primary Keyword</label>
                                <input
                                    value={editingBlog.primary_keyword || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, primary_keyword: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-400 text-xs shadow-sm"
                                    placeholder="E.g. AI tools mbbs"
                                />

                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-3">Secondary Keywords (csv)</label>
                                <input
                                    value={editingBlog.secondary_keywords || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, secondary_keywords: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-400 text-xs shadow-sm"
                                />

                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-3">Tags (csv)</label>
                                <input
                                    value={editingBlog.tags || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, tags: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs shadow-sm"
                                />
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-2">Featured Image URL</label>
                                <input
                                    value={editingBlog.featured_image || ''}
                                    onChange={e => setEditingBlog({ ...editingBlog, featured_image: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs shadow-sm"
                                    placeholder="https://"
                                />
                                {editingBlog.featured_image && (
                                    <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                        <img src={editingBlog.featured_image} alt="Preview" className="w-full h-24 object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-sm flex-1 flex flex-col h-[75vh]">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <PenTool className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">All Published & Drafts</h3>
                        <p className="text-xs text-slate-500">{blogs.length} articles total</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {currentUserRole === 'superadmin' && (
                        <button onClick={() => setShowBulkModal(true)} className="px-5 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2 hover:bg-indigo-100">
                            <Sparkles className="w-4 h-4" /> Bulk AI Blogs
                        </button>
                    )}
                    <button onClick={handleCreateNew} className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2">
                        <Play className="w-4 h-4" /> New Article
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map(blog => (
                        <div key={blog.id} className={`border rounded-2xl p-5 group transition-all hover:shadow-lg ${blog.status === 'published' ? 'border-slate-200 bg-white' : 'border-dashed border-amber-300 bg-amber-50/30'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${blog.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {blog.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    {blog.status}
                                </span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingBlog(blog)} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(blog.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{blog.title}</h4>
                            <p className="text-slate-500 text-xs mb-4 line-clamp-2">{blog.excerpt}</p>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium tracking-wide">
                                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {blog.views_count}</div>
                            </div>

                            {blog.status === 'published' && (
                                <Link target="_blank" href={`/blog/${blog.slug}`} className="mt-4 w-full block text-center py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">
                                    View Live Article
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                {blogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <PenTool className="w-12 h-12 mb-4 opacity-50" />
                        <p>No blogs created yet. Write your first article.</p>
                    </div>
                )}
            </div>

            {/* Bulk Generate Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" /> SEO Bulk Blog Generator
                            </h3>
                            <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Number of Blogs</label>
                                <input
                                    type="number" min="1" max="10"
                                    value={bulkForm.numBlogs}
                                    onChange={e => setBulkForm({ ...bulkForm, numBlogs: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                />
                                <p className="text-xs text-slate-400 mt-2">The AI Master Engine will automatically brainstorm engaging topics, SEO keywords, lengths, and tones based on your selected categories.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Select Target Categories</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        "AI in Medical Education",
                                        "Medical Education Innovation",
                                        "LMS for Medical Institutes",
                                        "Teacher & Faculty Management",
                                        "Medical Exam Preparation",
                                        "Teaching Strategies for Medical Educators",
                                        "EdTech & Startup Insights"
                                    ].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                const newCats = bulkForm.categories.includes(cat)
                                                    ? bulkForm.categories.filter(c => c !== cat)
                                                    : [...bulkForm.categories, cat];
                                                setBulkForm({ ...bulkForm, categories: newCats });
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${bulkForm.categories.includes(cat) ? 'bg-indigo-500 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                {bulkForm.categories.length === 0 && <p className="text-red-500 text-xs mt-2">Please select at least one category.</p>}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkGenerate}
                                disabled={generatingBulk}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                {generatingBulk ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {generatingBulk ? 'Generating...' : 'Start Master Engine'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

