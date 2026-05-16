import { NextResponse } from 'next/server';
import { checkSecurity } from '@/lib/apiSecurity';
import { generateTopicContent } from '@/lib/creatorEngine';

// ── Increase Node.js default timeout for this route ──
// 300s = 5 min (Vercel Hobby/Pro limit). Chunked generation for a single topic
// (text + dedicated sections + grouped sections + top-up rounds) can take up to
// 4-5 min with thinking disabled. Keep at 300 for Vercel compatibility;
// Cloud Run has no hard limit and will use the full 300s budget.
export const maxDuration = 900;

export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    let topicName = 'Unknown Topic';

    try {
        const body = await req.json();
        topicName = body.topicName || topicName;

        const result = await generateTopicContent({
            courseName: body.courseName || '',
            subjectName: body.subjectName || '',
            sectionName: body.sectionName || '',
            topicName,
            lmsStructure: (body.lmsStructure || []).filter((s: any) => s.id !== 'l10'),
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[Creator API] AI generation failed:', {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            stack: error?.stack?.split('\n').slice(0, 5).join(' | '),
        });

        const message = error?.message || '';
        const isOverload = message.includes('503') || message.includes('UNAVAILABLE') || message.includes('overloaded') || message.includes('high demand') || message.includes('exhausted');

        return NextResponse.json({
            success: false,
            error: isOverload
                ? 'The AI service is temporarily overloaded. All fallback models were tried. Please retry in a minute.'
                : (message || 'AI generation failed. Please check your API Key and quota.'),
            isMock: false,
        });
    }
}

