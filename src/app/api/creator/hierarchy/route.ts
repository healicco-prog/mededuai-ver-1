import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/creator/hierarchy
 * Returns the full course → subject → topic tree from the database,
 * including a `hasNotes` flag on each topic.
 */
export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        // Fetch all topics with their subject + course chain
        const { data: topics, error } = await supabase
            .from('topics')
            .select(`
                id, name, section,
                subject:subjects!inner(
                    id, name,
                    course:courses!inner(id, name)
                )
            `)
            .order('name');

        if (error) throw error;

        // Fetch topic_ids that have LMS content
        const { data: lmsRows } = await supabase
            .from('lms_content')
            .select('topic_id')
            .not('detailed_notes', 'is', null);

        const notesSet = new Set((lmsRows || []).map(r => r.topic_id));

        // Build the hierarchy: courses → subjects → topics
        const coursesMap: Record<string, any> = {};

        for (const topic of (topics || [])) {
            const subjectData = Array.isArray(topic.subject) ? topic.subject[0] : topic.subject;
            const courseData = Array.isArray(subjectData?.course) ? subjectData.course[0] : subjectData?.course;

            if (!subjectData || !courseData) continue;

            const courseId = courseData.id;
            const subjectId = subjectData.id;

            if (!coursesMap[courseId]) {
                coursesMap[courseId] = {
                    id: courseId,
                    name: courseData.name,
                    subjects: {},
                };
            }

            if (!coursesMap[courseId].subjects[subjectId]) {
                coursesMap[courseId].subjects[subjectId] = {
                    id: subjectId,
                    name: subjectData.name,
                    topics: [],
                };
            }

            coursesMap[courseId].subjects[subjectId].topics.push({
                id: topic.id,
                name: topic.name,
                section: topic.section || '',
                hasNotes: notesSet.has(topic.id),
            });
        }

        // Convert maps to arrays and sort
        const courses = Object.values(coursesMap).map((c: any) => ({
            ...c,
            subjects: Object.values(c.subjects).map((s: any) => ({
                ...s,
                topics: s.topics.sort((a: any, b: any) => a.name.localeCompare(b.name)),
            })).sort((a: any, b: any) => a.name.localeCompare(b.name)),
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));

        return NextResponse.json({ success: true, courses });
    } catch (error: any) {
        console.error('[Hierarchy API] Error:', error?.message);
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
    }
}
