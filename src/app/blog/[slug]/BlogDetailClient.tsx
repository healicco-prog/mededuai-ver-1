"use client";

import { useEffect, useState } from 'react';
import { BlogPost, useBlogStore } from '../../../store/blogStore';
import { blogService } from '../../../lib/blogService';
import Link from 'next/link';
import { Calendar, Clock, Share2, Twitter, Linkedin, ChevronLeft, Eye, BookmarkPlus, ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import Head from 'next/head';

export default function BlogDetailClient({ initialBlog, slug, related }: { initialBlog: BlogPost | null, slug: string, related: BlogPost[] }) {
    const storeBlogs = useBlogStore(state => state.blogs);
    const [blog, setBlog] = useState<BlogPost | null>(initialBlog);
    const [loading, setLoading] = useState(!initialBlog);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [toc, setToc] = useState<{ id: string, text: string, level: number }[]>([]);

    useEffect(() => {
        if (initialBlog) {
            setLoading(false);
            return;
        }

        let allBlogs = storeBlogs;
        if (typeof window !== 'undefined') {
            try {
                const storedLocal = localStorage.getItem('blog-storage-seo');
                if (storedLocal) {
                    const parsed = JSON.parse(storedLocal);
                    if (parsed?.state?.blogs?.length > 0) {
                        allBlogs = parsed.state.blogs;
                    }
                }
            } catch (e) { }
        }

        const decodedSlug = decodeURIComponent(slug).toLowerCase();
        const localMatch = allBlogs.find(b =>
            b.slug === slug ||
            encodeURIComponent(b.slug) === slug ||
            b.slug.toLowerCase() === decodedSlug
        );

        if (localMatch) {
            setBlog(localMatch);
            setLoading(false);
            return;
        }

        // Fallback: wait a maximum of 2 seconds for server fetch before forcing a stop
        let timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        blogService.getBlogBySlug(slug).then(b => {
            if (b) setBlog(b);
            setLoading(false);
            clearTimeout(timer);
        }).catch(() => {
            setLoading(false);
            clearTimeout(timer);
        });

        return () => clearTimeout(timer);
    }, [initialBlog, slug, storeBlogs]);

    useEffect(() => {
        if (!blog) return;
        blogService.incrementViewCount(blog.id);

        // Generate TOC from content headings
        const parser = new DOMParser();
        const doc = parser.parseFromString(blog.content, 'text/html');
        const headings = doc.querySelectorAll('h2, h3');
        const tocItems = Array.from(headings).map((h, i) => {
            const text = h.textContent || `Section ${i}`;
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            // We mutate the HTML so we can link to it, but since we use dangerouslySetInnerHTML on the original string, 
            // we will need to render the mutated string or simple rely on the fact that we can append IDs dynamically below.
            return { id, text, level: h.tagName.toLowerCase() === 'h2' ? 2 : 3 };
        });
        setToc(tocItems);
    }, [blog?.id, blog?.content]);

    // Function to add IDs to text content dynamically
    const processedContent = () => {
        if (!blog || typeof window === 'undefined') return { __html: blog?.content || '' };
        const parser = new DOMParser();
        const doc = parser.parseFromString(blog.content, 'text/html');
        const headings = doc.querySelectorAll('h2, h3');
        headings.forEach((h, i) => {
            const text = h.textContent || `Section ${i}`;
            h.id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        });
        return { __html: doc.body.innerHTML };
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(blog?.title || '')}`);
        if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
        if (platform === 'native' && navigator.share) navigator.share({ title: blog?.title, url });
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-emerald-400 font-bold animate-pulse text-lg uppercase tracking-widest">Decrypting Post Data...</div>;
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <Sparkles className="w-16 h-16 text-slate-600 mb-6" />
                <h1 className="text-4xl font-extrabold mb-4">Article Not Found</h1>
                <p className="text-slate-400 mb-8 max-w-md text-center">We couldn't locate this transmission in the database.</p>
                <Link href="/blog" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-colors shadow-lg shadow-emerald-500/20">Return to Hub</Link>
            </div>
        );
    }

    const authorName = blog.author_name || 'System Admin';
    const authorImage = blog.author_image || `https://ui-avatars.com/api/?name=${authorName.replace(' ', '+')}&background=0284c7&color=fff`;

    const schemaMarkup = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://mededuai.com/blog/${blog.slug}`
        },
        "headline": blog.meta_title || blog.title,
        "description": blog.excerpt,
        "image": blog.featured_image ? [blog.featured_image] : [],
        "author": {
            "@type": "Person",
            "name": authorName
        },
        "publisher": {
            "@type": "Organization",
            "name": "MedEduAI",
            "logo": {
                "@type": "ImageObject",
                "url": "https://mededuai.com/logo.png"
            }
        },
        "datePublished": blog.created_at,
        "dateModified": blog.updated_at
    };

    const faqSchemaMarkup = blog.faq_section?.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": blog.faq_section.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    } : null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden pb-32">

            <Head>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
                {faqSchemaMarkup && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaMarkup) }} />
                )}
            </Head>

            {/* Back Button */}
            <div className="fixed top-8 left-8 z-50">
                <Link href="/blog" className="flex items-center justify-center w-12 h-12 rounded-full bg-white/50 border border-slate-200 hover:border-emerald-500 hover:bg-white text-slate-700 transition-all backdrop-blur-md shadow-lg">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
            </div>

            {/* Hero Section */}
            <div className="relative w-full h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden bg-slate-900 flex items-center justify-center border-b border-slate-200">
                {blog.featured_image && (
                    <img src={blog.featured_image} alt={blog.title} className="absolute inset-0 w-full h-full object-cover opacity-60 object-center scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />

                <div className="relative z-10 max-w-4xl mx-auto px-6 w-full text-center mt-20">
                    <div className="mb-6 inline-block bg-emerald-500/90 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                        {blog.category}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-300">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-400" /> {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> {blog.reading_time} min read</div>
                        <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /> {blog.views_count + 1} views</div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20 flex flex-col lg:flex-row gap-12">

                {/* Main Content Area */}
                <div className="flex-1 max-w-4xl">
                    {/* Tools & Author Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-2xl p-5 mb-12 shadow-xl">
                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                            <img src={authorImage} alt={authorName} className="w-12 h-12 rounded-full border border-slate-200 shadow-sm object-cover" />
                            <div>
                                <p className="text-slate-900 text-base font-bold">{authorName}</p>
                                <p className="text-xs text-slate-500 max-w-xs">{blog.author_bio || 'MedEduAI Educator'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsBookmarked(!isBookmarked)} className={`p-2.5 rounded-xl border transition-all ${isBookmarked ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'}`}>
                                <BookmarkPlus className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleShare('twitter')} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] transition-all text-slate-600"><Twitter className="w-5 h-5" /></button>
                            <button onClick={() => handleShare('linkedin')} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] transition-all text-slate-600"><Linkedin className="w-5 h-5" /></button>
                            <button onClick={() => handleShare('native')} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-500 transition-all text-slate-600 md:hidden"><Share2 className="w-5 h-5" /></button>
                        </div>
                    </div>

                    {/* Article Content Area */}
                    <article className="prose prose-slate max-w-none prose-lg md:prose-xl prose-headings:font-extrabold prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-emerald-600 prose-a:font-semibold hover:prose-a:text-emerald-500 prose-img:rounded-3xl prose-img:shadow-lg prose-img:border prose-img:border-slate-200 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
                        <div dangerouslySetInnerHTML={processedContent()} />
                    </article>

                    {/* FAQ Section */}
                    {blog.faq_section && blog.faq_section.length > 0 && (
                        <div className="mt-16 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-3xl font-extrabold text-slate-900 mb-8 border-b border-slate-100 pb-4">Frequently Asked Questions</h3>
                            <div className="space-y-6">
                                {blog.faq_section.map((faq, idx) => (
                                    <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <h4 className="text-lg font-bold text-slate-800 mb-3">{faq.question}</h4>
                                        <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Call to Action */}
                    <div className="mt-16 p-10 bg-slate-900 rounded-3xl text-center shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-600/10 blur-3xl rounded-full scale-150 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                        <div className="relative z-10">
                            <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Enhance Your Medical Career</h2>
                            <p className="text-slate-300 mb-8 max-w-xl mx-auto text-lg hover:text-white transition-colors">Start learning with MedEduAI's intelligent, AI-driven interactive tutors and next-generation clinical simulations.</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/login" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-full transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                                    <GraduationCap className="w-5 h-5" /> Try AI Mentor
                                </Link>
                                <Link href="/features" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all backdrop-blur-md flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" /> Download Notes
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sticky TOC Sidebar */}
                <div className="hidden lg:block w-80 shrink-0">
                    <div className="sticky top-24 pt-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                            <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-4">Table of Contents</h4>
                            {toc.length > 0 ? (
                                <ul className="space-y-3">
                                    {toc.map((item, idx) => (
                                        <li key={idx} className={`${item.level === 3 ? 'pl-4 border-l border-slate-100 ml-1' : ''}`}>
                                            <a href={`#${item.id}`} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors line-clamp-2">
                                                {item.text}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No headings found.</p>
                            )}
                        </div>

                        {/* Social Sidebar snippet */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Share this post</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => handleShare('twitter')} className="p-3 rounded-full bg-slate-50 border border-slate-200 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] transition-colors text-slate-600"><Twitter className="w-4 h-4" /></button>
                                <button onClick={() => handleShare('linkedin')} className="p-3 rounded-full bg-slate-50 border border-slate-200 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] transition-colors text-slate-600"><Linkedin className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            <div className="max-w-6xl mx-auto px-6 mt-24 pt-12 border-t border-slate-200 relative z-20">
                <h3 className="text-3xl font-extrabold text-slate-900 mb-8">Related Reads</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {related.length > 0 ? related.map(rel => (
                        <Link href={`/blog/${rel.slug}`} key={rel.id} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-emerald-300 hover:shadow-xl transition-all flex flex-col h-full shadow-sm">
                            <div className="h-48 bg-slate-100 relative overflow-hidden">
                                {rel.featured_image && <img src={rel.featured_image} alt={rel.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                            </div>
                            <div className="p-8 flex flex-col flex-1 justify-between">
                                <div>
                                    <div className="text-[10px] font-extrabold text-emerald-600 mb-3 uppercase tracking-widest">{rel.category}</div>
                                    <h4 className="font-bold text-slate-900 text-xl group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3 leading-snug">{rel.title}</h4>
                                </div>
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest mt-6 pt-6 border-t border-slate-100">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {rel.reading_time} MIN</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    )) : (
                        <p className="text-slate-500 italic">No related guides currently available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Ensure Sparkles icon is imported, wait, let me add it.
