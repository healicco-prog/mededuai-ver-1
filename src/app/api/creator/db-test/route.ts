import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/creator/db-test
 * Diagnostic endpoint: checks DB connectivity and what tables/columns exist.
 * Returns a full status report.
 */
export async function GET(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    const report: Record<string, any> = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        tables: {},
        lmsContentColumns: [],
        lmsContentRowCount: 0,
        coursesRowCount: 0,
        errors: [] as string[],
    };

    try {
        const supabase = getSupabaseAdmin();

        // 1. Check courses table
        const { data: courses, error: coursesErr } = await supabase
            .from('courses').select('id, name').limit(5);
        if (coursesErr) {
            report.tables.courses = 'ERROR: ' + coursesErr.message;
            report.errors.push('courses: ' + coursesErr.message);
        } else {
            report.tables.courses = 'OK';
            report.coursesRowCount = courses?.length ?? 0;
            report.coursesSample = courses?.map(c => c.name) ?? [];
        }

        // 2. Check subjects table
        const { error: subjErr } = await supabase.from('subjects').select('id').limit(1);
        report.tables.subjects = subjErr ? 'ERROR: ' + subjErr.message : 'OK';

        // 3. Check topics table
        const { data: topics, error: topicsErr } = await supabase
            .from('topics').select('id, name, section').limit(5);
        if (topicsErr) {
            report.tables.topics = 'ERROR: ' + topicsErr.message;
            report.errors.push('topics: ' + topicsErr.message);
        } else {
            report.tables.topics = 'OK';
            report.topicsSample = topics?.map(t => t.name) ?? [];
        }

        // 4. Check lms_content table and columns
        const { data: lms, error: lmsErr } = await supabase
            .from('lms_content')
            .select('id, topic_id, version, course, subject, topic, introduction, detailed_notes, summary, marks_10_questions, marks_5_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs, flashcards')
            .limit(3);

        if (lmsErr) {
            report.tables.lms_content = 'ERROR: ' + lmsErr.message;
            report.errors.push('lms_content: ' + lmsErr.message);
        } else {
            report.tables.lms_content = 'OK';
            report.lmsContentRowCount = lms?.length ?? 0;
            if (lms && lms.length > 0) {
                report.lmsContentColumns = Object.keys(lms[0]);
                report.lmsContentHasMarksColumns = !!(lms[0] as any).marks_10_questions !== undefined;
            }
        }

        // 5. Check assessments table
        const { error: assessErr } = await supabase.from('assessments').select('id').limit(1);
        report.tables.assessments = assessErr ? 'ERROR: ' + assessErr.message : 'OK';

        // 6. Check users table
        const { data: users, error: usersErr } = await supabase
            .from('users').select('id, email, role').limit(3);
        if (usersErr) {
            report.tables.users = 'ERROR: ' + usersErr.message;
        } else {
            report.tables.users = 'OK';
            report.usersSample = users?.map(u => ({ email: u.email, role: u.role })) ?? [];
        }

        // 7. Check profiles table
        const { data: profiles, error: profilesErr } = await supabase
            .from('profiles').select('id, email, role').limit(3);
        if (profilesErr) {
            report.tables.profiles = 'ERROR: ' + profilesErr.message;
        } else {
            report.tables.profiles = 'OK';
            report.profilesSample = profiles?.map(p => ({ email: p.email, role: p.role })) ?? [];
        }

        // 8. Check all extended columns exist
        const { error: colMarksErr } = await supabase
            .from('lms_content').select('marks_10_questions, marks_3_reasoning, marks_2_case_mcqs, marks_1_mcqs').limit(1);
        const { error: colMetaErr } = await supabase
            .from('lms_content').select('version, course, subject, topic').limit(1);

        report.hasMarksColumns = !colMarksErr;
        report.hasMetaColumns = !colMetaErr;

        if (colMarksErr) {
            report.marksColumnError = colMarksErr.message;
            report.errors.push('marks columns missing (run migration SQL): ' + colMarksErr.message);
        }
        if (colMetaErr) {
            report.metaColumnError = colMetaErr.message;
            report.errors.push('version/course/subject/topic columns missing (run migration SQL): ' + colMetaErr.message);
        }

        report.status = report.errors.length === 0 ? 'ALL_OK' : 'HAS_ERRORS';
    } catch (err: any) {
        report.status = 'FATAL';
        report.fatalError = err.message;
    }

    return NextResponse.json(report, {
        headers: { 'Content-Type': 'application/json' },
    });
}

