import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';

/**
 * POST /api/creator/db-migrate
 * Checks lms_content schema health and returns the exact SQL to run in
 * Supabase SQL Editor if any columns need to be added, renamed, or removed.
 * Safe to call repeatedly — only reports what is genuinely missing/wrong.
 */
export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    try {
        const supabase = getSupabaseAdmin();

        const migrationSQL = [
            '-- lms_content schema migration — run once in Supabase SQL Editor',
            '-- https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql/new',
            '',
            '-- 1. Ensure correct columns exist',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_10_questions TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_5_questions TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_3_reasoning TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_2_case_mcqs TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS marks_1_mcqs TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS flashcards TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS version TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS course TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS subject TEXT;',
            'ALTER TABLE public.lms_content ADD COLUMN IF NOT EXISTS topic TEXT;',
            '',
            '-- 2. Migrate old column names to new names and drop old columns',
            'DO $$ BEGIN',
            '  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=\'lms_content\' AND column_name=\'marks_3_questions\') THEN',
            '    UPDATE public.lms_content SET marks_3_reasoning = marks_3_questions WHERE marks_3_reasoning IS NULL AND marks_3_questions IS NOT NULL;',
            '    ALTER TABLE public.lms_content DROP COLUMN marks_3_questions;',
            '  END IF;',
            '  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=\'lms_content\' AND column_name=\'marks_2_questions\') THEN',
            '    UPDATE public.lms_content SET marks_2_case_mcqs = marks_2_questions WHERE marks_2_case_mcqs IS NULL AND marks_2_questions IS NOT NULL;',
            '    ALTER TABLE public.lms_content DROP COLUMN marks_2_questions;',
            '  END IF;',
            '  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=\'lms_content\' AND column_name=\'marks_1_questions\') THEN',
            '    UPDATE public.lms_content SET marks_1_mcqs = marks_1_questions WHERE marks_1_mcqs IS NULL AND marks_1_questions IS NOT NULL;',
            '    ALTER TABLE public.lms_content DROP COLUMN marks_1_questions;',
            '  END IF;',
            'END $$;',
            '',
            '-- 3. Drop ppt_content (PPT feature removed)',
            'DO $$ BEGIN',
            '  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=\'lms_content\' AND column_name=\'ppt_content\') THEN',
            '    ALTER TABLE public.lms_content DROP COLUMN ppt_content;',
            '  END IF;',
            'END $$;',
            '',
            '-- 4. Unique constraint on topic_id',
            'DO $$ BEGIN',
            '  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = \'lms_content_topic_id_key\') THEN',
            '    ALTER TABLE public.lms_content ADD CONSTRAINT lms_content_topic_id_key UNIQUE (topic_id);',
            '  END IF;',
            'END $$;',
            '',
            '-- 5. RLS policies',
            'DROP POLICY IF EXISTS teacher_write_lms ON public.lms_content;',
            'CREATE POLICY teacher_write_lms ON public.lms_content FOR ALL USING (',
            '  (SELECT role FROM public.users WHERE id = auth.uid()) IN (\'teacher\',\'admin\',\'super_admin\',\'master_admin\',\'institution_admin\')',
            '  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN (\'teacher\',\'admin\',\'super_admin\',\'master_admin\',\'institution_admin\')',
            ');',
            'DROP POLICY IF EXISTS read_lms ON public.lms_content;',
            'CREATE POLICY read_lms ON public.lms_content FOR SELECT USING (true);',
        ].join('\n');

        // Check which required columns are missing
        const requiredColumns = [
            'marks_10_questions', 'marks_5_questions',
            'marks_3_reasoning', 'marks_2_case_mcqs', 'marks_1_mcqs',
            'flashcards', 'version', 'course', 'subject', 'topic',
        ];

        const missingColumns: string[] = [];
        for (const col of requiredColumns) {
            const { error } = await supabase.from('lms_content').select(col).limit(1);
            if (error?.message?.includes('column') || error?.message?.includes('does not exist')) {
                missingColumns.push(col);
            }
        }

        // Check if old (wrong-named) columns still exist
        const oldColumns: string[] = [];
        for (const col of ['marks_3_questions', 'marks_2_questions', 'marks_1_questions', 'ppt_content']) {
            const { error } = await supabase.from('lms_content').select(col).limit(1);
            if (!error) oldColumns.push(col);
        }

        if (missingColumns.length === 0 && oldColumns.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'lms_content schema is up to date. No migration needed.',
                status: 'ALREADY_COMPLETE',
            });
        }

        const issues: string[] = [];
        if (missingColumns.length > 0) issues.push('Missing columns: ' + missingColumns.join(', '));
        if (oldColumns.length > 0) issues.push('Old columns to rename/drop: ' + oldColumns.join(', '));

        return NextResponse.json({
            success: false,
            status: 'MIGRATION_REQUIRED',
            missingColumns,
            oldColumns,
            message: issues.join(' | ') + '. Run the SQL below in your Supabase SQL Editor.',
            sqlToRun: migrationSQL,
            supabaseSqlEditorUrl: 'https://supabase.com/dashboard/project/yrelfdwkjtaidtoulwrj/sql/new',
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
