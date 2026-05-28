import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const course = searchParams.get('course');
    
    if (!query) {
        return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    // Replace commas to avoid breaking the .or() syntax
    const safeQuery = query.replace(/,/g, ' ');
    const searchString = `%${safeQuery}%`;
    const orCondition = `topic.ilike.${searchString},introduction.ilike.${searchString},detailed_notes.ilike.${searchString},summary.ilike.${searchString},flashcards.ilike.${searchString}`;

    let dbQuery = supabase
        .from('lms_content')
        .select('topic_id, topic, subject, version, section, course')
        .or(orCondition)
        .order('last_generated_at', { ascending: false });

    if (course) {
        dbQuery = dbQuery.ilike('course', course);
    }

    // Limit to prevent huge payloads
    dbQuery = dbQuery.limit(20);

    const { data, error } = await dbQuery;

    if (error) {
        // Fallback for older schemas lacking some columns (e.g., section)
        let fallbackQuery = supabase
            .from('lms_content')
            .select('topic_id, topic, subject, version, course')
            .or(`topic.ilike.${searchString},introduction.ilike.${searchString},detailed_notes.ilike.${searchString},summary.ilike.${searchString}`)
            .order('last_generated_at', { ascending: false });
            
        if (course) fallbackQuery = fallbackQuery.ilike('course', course);
        
        const { data: fallbackData, fallbackError } = await fallbackQuery.limit(20) as any;
        
        if (fallbackError) {
            console.error('[LMS Search] Error:', fallbackError);
            return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 });
        }
        return NextResponse.json({ success: true, results: fallbackData });
    }

    return NextResponse.json({ success: true, results: data });
}
