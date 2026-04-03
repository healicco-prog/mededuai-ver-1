import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    let body: any = {};
    try {
        body = await req.json();
        const { numBlogs, categories } = body;

        const promptText = `You are an expert SEO content strategist and medical education writer.
Your task is to generate high-quality, SEO optimized blog posts that can rank on search engines.

INPUT PARAMETERS:
Number_of_Blogs: ${numBlogs || 1}
Blog_Categories: ${categories && categories.length > 0 ? categories.join(', ') : 'Medical Education'}

OUTPUT REQUIREMENT:
Generate ${numBlogs || 1} unique blog posts distributed among the provided categories. 
For each blog, you must autonomously generate a highly engaging Primary Topic, Target Keywords, Target Audience, Blog Length (~1500 words), and Professional Tone based on the assigned category.

Return output in structured JSON. Do NOT wrap it in markdown \`\`\`json. Return ONLY raw JSON starting with { and ending with }. Escape all strings properly.
Ensure rigorous quality for medical education technology. Follow E-E-A-T guidelines.
Each generated blog must target a different keyword variation, avoid repeating headings, and maintain SEO diversity.

Example structure:
{
  "blogs": [
    {
      "title": "SEO Click-Optimized Title (H1)",
      "meta_title": "Max 60 chars",
      "meta_description": "Max 160 chars, encouraging clicks",
      "slug": "seo-friendly-slug",
      "primary_keyword": "Select the most important keyword",
      "secondary_keywords": "5-10 related keywords comma separated",
      "tags": "5-8 comma separated tags",
      "content": "<h2>Generate engaging content... Use H2 and H3, bullet points, etc. Minimum length 1500 words</h2><p>...</p>",
      "faqs": [
        { "question": "Relevant FAQ Question 1?", "answer": "Answer 1 (50-100 words)" }
      ],
      "reading_time": 5,    
      "schema_markup": "BlogPosting JSON-LD string... optional"
    }
  ]
}`;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, data: parsed });
    } catch (error: any) {
        console.warn('Bulk Blog API Error:', error.message);
        return NextResponse.json({
            success: true,
            data: {
                blogs: [
                    {
                        title: "Mock AI Generated Blog: " + (body.primaryTopic || 'Bulk Demo'),
                        slug: "mock-bulk-generated-blog-" + Date.now(),
                        meta_title: "Mock AI SEO Meta Title",
                        meta_description: "This is a mock description generated because the AI quota was exceeded.",
                        primary_keyword: "AI Tools",
                        secondary_keywords: "simulation, learning, VR",
                        tags: "AI, Education",
                        content: "<h2>Introduction</h2><p>When the AI API fails or hits rate limits, this mock content is generated.</p><h3>The Role of Fallbacks</h3><p>Robust fallbacks ensure the UI continues to function perfectly.</p>",
                        faqs: [{ question: "Why see this?", answer: "Because API limit was reached." }],
                        reading_time: 4,
                        schema_markup: ""
                    }
                ]
            },
            isMock: true
        });
    }
}
