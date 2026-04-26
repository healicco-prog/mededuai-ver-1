import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';

/**
 * POST /api/creator/delete
 *
 * Deletes generated LMS content and assessments from the database
 * so that the superadmin can re-trigger content creation for failed topics.
 *
 * Supports three modes:
 *   1. Delete specific topics   → body: { topicNames: [...], courseName, subjectName }
 *   2. Delete entire section    → body: { courseName, subjectName, sectionName, deleteAll: true }
 *   3. Delete all content for a subject → body: { courseName, subjectName, deleteAll: true }
 */
export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    try {
        const body = await req.json();
        const { courseName, subjectName, sectionName, topicNames, deleteAll } = body;

        if (!courseName || !subjectName) {
            return NextResponse.json({ success: false, error: 'courseName and subjectName are required.' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // ── Resolve Course ──
        const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('name', courseName)
            .maybeSingle();

        if (!course?.id) {
            // Course not in DB — content was never saved or already cleaned up.
            // Return success so the client still clears local state.
            console.log(`[Creator Delete] Course "${courseName}" not found in DB — nothing to delete.`);
            return NextResponse.json({
                success: true,
                deletedCount: 0,
                deletedTopics: [],
                lmsDeleted: 0,
                assessmentsDeleted: 0,
                message: `Course "${courseName}" not found in database — content was not saved to DB.`,
            });
        }

        // ── Resolve Subject ──
        const { data: subject } = await supabase
            .from('subjects')
            .select('id')
            .eq('name', subjectName)
            .eq('course_id', course.id)
            .maybeSingle();

        if (!subject?.id) {
            console.log(`[Creator Delete] Subject "${subjectName}" not found in DB — nothing to delete.`);
            return NextResponse.json({
                success: true,
                deletedCount: 0,
                deletedTopics: [],
                lmsDeleted: 0,
                assessmentsDeleted: 0,
                message: `Subject "${subjectName}" not found in database — content was not saved to DB.`,
            });
        }

        // ── Resolve Topics ──
        let topicsQuery = supabase
            .from('topics')
            .select('id, name')
            .eq('subject_id', subject.id);

        if (sectionName) {
            topicsQuery = topicsQuery.eq('section', sectionName);
        }

        if (topicNames && Array.isArray(topicNames) && topicNames.length > 0 && !deleteAll) {
            topicsQuery = topicsQuery.in('name', topicNames);
        }

        const { data: topics } = await topicsQuery;

        if (!topics || topics.length === 0) {
            return NextResponse.json({
                success: true,
                deletedCount: 0,
                deletedTopics: [],
                lmsDeleted: 0,
                assessmentsDeleted: 0,
                message: 'No matching topics found in database.',
            });
        }

        const topicIds = topics.map(t => t.id);
        const deletedNames = topics.map(t => t.name);

        // ── Delete lms_content for these topics ──
        const { error: lmsError, count: lmsCount } = await supabase
            .from('lms_content')
            .delete({ count: 'exact' })
            .in('topic_id', topicIds);

        if (lmsError) {
            console.error('[Creator Delete] lms_content delete error:', lmsError.message);
        }

        // ── Delete assessments for these topics ──
        const { error: assessError, count: assessCount } = await supabase
            .from('assessments')
            .delete({ count: 'exact' })
            .in('topic_id', topicIds);

        if (assessError) {
            console.error('[Creator Delete] assessments delete error:', assessError.message);
        }

        console.log(`[Creator Delete] Deleted lms_content: ${lmsCount ?? 0}, assessments: ${assessCount ?? 0} for ${topicIds.length} topics`);

        return NextResponse.json({
            success: true,
            deletedCount: topicIds.length,
            deletedTopics: deletedNames,
            lmsDeleted: lmsCount ?? 0,
            assessmentsDeleted: assessCount ?? 0,
        });
    } catch (error: any) {
        console.error('[Creator Delete API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
    }
}
