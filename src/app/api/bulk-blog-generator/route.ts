import { checkSecurity, validateInput } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    const sec = await checkSecurity(req);
    if (!sec.authorized) return sec.response;

    let body: any = {};
    try {
        body = await req.json();
        const { numBlogs, categories } = body;

        const promptText = `You are an expert SEO content strategist and medical education writer.
Your task is to brainstorm unique, high-quality, and SEO-optimized blog post topics that can rank on search engines.

INPUT PARAMETERS:
Number_of_Blogs: ${numBlogs || 1}
Blog_Categories: ${categories && categories.length > 0 ? categories.join(', ') : 'Medical Education'}

OUTPUT REQUIREMENT:
Brainstorm exactly ${numBlogs || 1} unique blog post concepts distributed across the provided categories. 
For each, define a click-optimized title, category, targeted primary keyword, and related secondary keywords.

Return output in structured JSON. Do NOT wrap it in markdown. Return ONLY raw JSON starting with { and ending with }. Escape all strings properly.

Example structure:
{
  "topics": [
    {
      "title": "Click-Optimized Blog Post Title",
      "category": "A highly relevant dynamically determined category based on the title",
      "primary_keyword": "Primary SEO keyword to target",
      "secondary_keywords": "comma, separated, secondary, keywords"
    }
  ]
}`;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, data: parsed });
    } catch (error: any) {
        console.warn('Bulk Blog API Error:', error.message);
        
        // Let's create beautiful mock brainstormed topics as a fallback so that the user is always wowed and gets working results even if the quota is hit!
        const requestedCategories = body.categories || ['Medical Technology'];
        const mockTopics = Array.from({ length: body.numBlogs || 1 }).map((_, i) => {
            const cat = requestedCategories[i % requestedCategories.length];
            return {
                title: `How Modern Technology is Revolutionizing ${cat} (Topic #${i + 1})`,
                category: cat,
                primary_keyword: `${cat.toLowerCase()} technology`,
                secondary_keywords: "education, learning outcomes, modern solutions, medical training"
            };
        });

        return NextResponse.json({
            success: false,
            data: {
                topics: mockTopics
            },
            isMock: true
        });
    }
}

