import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogService } from '../../../lib/blogService';
import BlogDetailClient from './BlogDetailClient';

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const blog = await blogService.getBlogBySlug(slug);
    if (!blog) return { title: 'Post Not Found' };

    const title = blog?.meta_title || (blog?.title ? `${blog.title} | MedEduAI Blog` : 'MedEduAI Blog Article');
    let description = blog?.excerpt || blog?.title || 'Explore the latest articles on MedEduAI.';
    if (description.length > 200) description = description.substring(0, 197) + '...';

    // Handle Pexels fallback and resizing for strict Facebook OG requirements (1200x630)
    let rawImage = blog?.featured_image || 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb';
    if (rawImage.includes('pexels.com')) {
        // Strip existing size params and enforce 1200x630
        rawImage = rawImage.split('&w=')[0].split('?')[0] + '?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop';
    }

    return {
        title: title,
        description: description,
        keywords: blog?.primary_keyword ? [blog.primary_keyword, ...(blog.secondary_keywords?.split(',') || []), ...(blog.tags?.split(',') || [])] : undefined,
        authors: [{ name: blog?.author_name || 'MedEduAI Team' }],
        openGraph: {
            title: blog?.meta_title || blog?.title || 'MedEduAI Blog Article',
            description: description,
            url: `https://mededuai.com/blog/${slug}`,
            siteName: 'MedEduAI',
            images: [
                {
                    url: rawImage,
                    width: 1200,
                    height: 630,
                    alt: title
                }
            ],
            type: 'article',
            publishedTime: blog?.created_at,
            authors: [blog?.author_name || 'MedEduAI'],
            tags: blog?.tags?.split(',') || [],
        },
        twitter: {
            card: 'summary_large_image',
            title: blog?.meta_title || blog?.title || 'MedEduAI Blog Article',
            description: description,
            images: [rawImage],
        }
    };
}

export default async function BlogDetailPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const serverBlog = await blogService.getBlogBySlug(slug);

    const allBlogs = await blogService.getAllBlogs();
    const relatedBlogs = allBlogs
        .filter(b => b.category === serverBlog?.category && b.id !== serverBlog?.id)
        .slice(0, 3);

    // Pass the potentially null blog directly, BlogDetailClient will attempt hydration lookup
    return (
        <BlogDetailClient initialBlog={serverBlog} slug={slug} related={relatedBlogs} />
    );
}
