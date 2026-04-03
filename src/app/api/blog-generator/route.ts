import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
    let body: any = {};
    try {
        body = await req.json();
        const { topic, category } = body;

        const promptText = `Act as an expert Medical SEO content writer. Create a fully optimized blog post about: "${topic}" in the category "${category}".
Return ONLY a raw valid JSON object. Do not return markdown blocks or backticks. Format exactly matching this structure:
{
  "title": "A highly engaging SEO optimized title",
  "slug": "seo-optimized-slug",
  "meta_title": "SEO Meta Title (max 60 chars)",
  "excerpt": "SEO Meta description (max 160 chars)",
  "primary_keyword": "Main targeted keyword",
  "secondary_keywords": "comma, separated, related, keywords",
  "tags": "comma, separated, tags",
  "content": "<h2>Generate at least 4-5 well-structured paragraphs in HTML... Use <h2> and <h3>, maybe an <ul> list. Give me 600 words minimum.</h2><p>...</p>",
  "faq_section": [
      { "question": "Relevant FAQ Question 1?", "answer": "Answer 1" },
      { "question": "Relevant FAQ Question 2?", "answer": "Answer 2" }
  ]
}
Escape all strings properly. Ensure rigorous quality for medical education technology.`;

        const parsed = await generateJSON(promptText);
        return NextResponse.json({ success: true, blog: parsed });
    } catch (error: any) {
        console.warn('Blog Gen API Error:', error.message);
        return NextResponse.json({
            success: true,
            blog: {
                title: "Mock AI Generated Blog: " + (body.topic || 'Demo'),
                slug: "mock-ai-generated-blog",
                meta_title: "Mock AI SEO Meta Title",
                excerpt: "This is a mock description generated because the AI quota was exceeded.",
                primary_keyword: "AI Tools",
                secondary_keywords: "simulation, learning, VR",
                tags: "AI, Education",
                content: "<h2>Introduction</h2><p>When the AI API fails or hits rate limits, this mock content is generated.</p><h3>The Role of Fallbacks</h3><p>Robust fallbacks ensure the UI continues to function perfectly.</p>",
                faq_section: [{ question: "Why see this?", answer: "Because API limit was reached." }]
            },
            isMock: true
        });
    }
}
