import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogService } from '../../../lib/blogService';
import BlogDetailClient from './BlogDetailClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const blog = await blogService.getBlogBySlug(params.slug);
    if (!blog) return { title: 'Post Not Found' };

    return {
        title: blog?.meta_title || (blog?.title ? `${blog.title} | MedEduAI Blog` : 'MedEduAI Blog Article'),
        description: blog?.excerpt || 'A MedEduAI Blog Post',
        keywords: blog?.primary_keyword ? [blog.primary_keyword, ...(blog.secondary_keywords?.split(',') || []), ...(blog.tags?.split(',') || [])] : undefined,
        authors: [{ name: blog?.author_name || 'MedEduAI Team' }],
        openGraph: {
            title: blog?.meta_title || blog?.title || 'MedEduAI Blog Article',
            description: blog?.excerpt || 'A MedEduAI Blog Post',
            url: `https://mededuai.com/blog/${params.slug}`,
            siteName: 'MedEduAI',
            images: blog?.featured_image ? [{ url: blog.featured_image, width: 1200, height: 630 }] : undefined,
            type: 'article',
            publishedTime: blog?.created_at,
            authors: [blog?.author_name || 'MedEduAI'],
            tags: blog?.tags?.split(',') || [],
        },
        twitter: {
            card: 'summary_large_image',
            title: blog?.meta_title || blog?.title || 'MedEduAI Blog Article',
            description: blog?.excerpt || 'A MedEduAI Blog Post',
            images: blog?.featured_image ? [blog.featured_image] : undefined,
        }
    };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
    const serverBlog = await blogService.getBlogBySlug(params.slug);

    const allBlogs = await blogService.getAllBlogs();
    const relatedBlogs = allBlogs
        .filter(b => b.category === serverBlog?.category && b.id !== serverBlog?.id)
        .slice(0, 3);

    // Pass the potentially null blog directly, BlogDetailClient will attempt hydration lookup
    return (
        <BlogDetailClient initialBlog={serverBlog} slug={params.slug} related={relatedBlogs} />
    );
}
