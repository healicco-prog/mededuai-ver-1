import { Metadata } from 'next';
import BlogListClient from './BlogListClient';
import { blogService } from '../../lib/blogService';

export const metadata: Metadata = {
    title: 'MedEduAI Blog | The Future of Medical Learning',
    description: 'Insights, tutorials, and deep-dives into medical education technology, AI in healthcare, and advanced learning methodologies.',
    openGraph: {
        title: 'MedEduAI Blog',
        description: 'Deep-dives into medical education technology and AI.',
        images: [{ url: '/blog-og.jpg' }]
    }
};

export default async function BlogPage() {
    // Server-side fetching
    const blogs = await blogService.getAllBlogs();

    return (
        <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <BlogListClient initialBlogs={blogs} />
        </div>
    );
}
