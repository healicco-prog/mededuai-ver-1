import { checkSecurity } from '@/lib/apiSecurity';
import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// In-memory cache to store daily news per server container instance
let cache: { date: string; news: any[] } | null = null;

export async function GET(req: Request) {
    const sec = await checkSecurity(req, { requireAuth: false });
    if (!sec.authorized) return sec.response;

    const { searchParams } = new URL(req.url);
    const today = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const cacheHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    };

    // If cache is valid and match today's date, serve it directly
    if (cache && cache.date === today && cache.news.length > 0) {
        return NextResponse.json({ success: true, news: cache.news }, { headers: cacheHeaders });
    }

    try {
        const prompt = `Generate 3 current, highly relevant medical news articles for today (${new Date().toDateString()}).
The articles should be related to: Patient Care, New drugs, New research, Medical Education, and Healthcare.
Format the output EXACTLY as a valid JSON array of objects, with no markdown wrapping or other text.
Each object must have the following fields:
1. "title": A short, catchy, professional title.
2. "summary": A 2-3 sentence overview of the news.
3. "category": One of "Patient Care", "New Drugs", "New Research", "Medical Education", or "Healthcare".
4. "url": A plausible, high-quality URL link to a real major health source (e.g. from fda.gov, who.int, nejm.org, nature.com, medscape.com, or pubmed.ncbi.nlm.nih.gov) that matches the context.

JSON schema template:
[
  {
    "title": "FDA Approves New Breakthrough Alzheimer Drug",
    "summary": "The FDA has granted accelerated approval to a novel monoclonal antibody that targets amyloid plaques in early-stage Alzheimer patients. Clinical trials showed a significant reduction in cognitive decline over 18 months.",
    "category": "New Drugs",
    "url": "https://www.fda.gov/news-events/press-announcements/fda-approves-new-treatment-alzheimers-disease"
  }
]`;

        const news = await generateJSON<any[]>(prompt);
        if (Array.isArray(news) && news.length >= 3) {
            cache = { date: today, news: news.slice(0, 3) };
            return NextResponse.json({ success: true, news: cache.news }, { headers: cacheHeaders });
        }
        throw new Error('Invalid news format generated');
    } catch (err: any) {
        console.error('[Dashboard News API] Failed to fetch news:', err);
        // High quality fallback news in case Gemini API fails
        const fallbackNews = [
            {
                title: "Emerging Artificial Intelligence Applications in Clinical Patient Care",
                summary: "Recent studies highlight how deep learning models are successfully assisting radiologists in detecting early-stage lung nodules, leading to faster treatment decisions.",
                category: "Patient Care",
                url: "https://pubmed.ncbi.nlm.nih.gov/"
            },
            {
                title: "Next-Generation Vaccines targeting Influenza and RSV in Trials",
                summary: "Phases 2 and 3 clinical trials for mRNA-based combination vaccines show strong immune responses in older adults. Researchers are optimistic for approvals next season.",
                category: "New Research",
                url: "https://www.who.int"
            },
            {
                title: "Competency-Based Medical Education Shifts to Active Learning",
                summary: "Leading medical institutions globally are adopting integrated, interactive case discussions instead of traditional lecture-heavy curricula to improve clinical reasoning.",
                category: "Medical Education",
                url: "https://www.medscape.com"
            }
        ];
        return NextResponse.json({ success: true, news: fallbackNews }, { headers: cacheHeaders });
    }
}
