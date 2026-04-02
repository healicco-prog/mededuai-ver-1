import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Fetch shared elective data (used by student/teacher/admin pages)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('elective_shared_store')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error) {
      console.error('[elective-sync] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      codes: data?.codes || [],
      students: data?.students || [],
      electives: data?.electives || [],
      allotments: data?.allotments || [],
      sessions: data?.sessions || [],
      preferences: data?.preferences || [],
      allotmentMethod: data?.allotment_method || 'merit',
      dates: data?.dates || [],
      institutions: data?.institutions || [],
      logbookApprovals: data?.logbook_approvals || [],
    });
  } catch (err: any) {
    console.error('[elective-sync] GET exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Sync elective data (called by admin OR student after submitting preferences)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codes, students, electives, allotments, sessions, allotmentMethod, preferences, dates, institutions, logbookApprovals } = body;

    // Build the upsert payload — only include fields that are provided
    // This allows partial updates (e.g. student only sending preferences)
    const payload: any = {
      id: 'global',
      updated_at: new Date().toISOString(),
    };

    if (codes !== undefined) payload.codes = codes;
    if (students !== undefined) payload.students = students;
    if (electives !== undefined) payload.electives = electives;
    if (allotments !== undefined) payload.allotments = allotments;
    if (sessions !== undefined) payload.sessions = sessions;
    if (preferences !== undefined) payload.preferences = preferences;
    if (allotmentMethod !== undefined) payload.allotment_method = allotmentMethod;
    if (dates !== undefined) payload.dates = dates;
    if (institutions !== undefined) payload.institutions = institutions;
    if (logbookApprovals !== undefined) payload.logbook_approvals = logbookApprovals;

    // For partial updates, we need to first fetch existing data and merge
    if (Object.keys(payload).length < 9) {
      const { data: existing } = await supabase
        .from('elective_shared_store')
        .select('*')
        .eq('id', 'global')
        .single();

      if (existing) {
        if (!payload.codes) payload.codes = existing.codes || [];
        if (!payload.students) payload.students = existing.students || [];
        if (!payload.electives) payload.electives = existing.electives || [];
        if (!payload.allotments) payload.allotments = existing.allotments || [];
        if (!payload.sessions) payload.sessions = existing.sessions || [];
        if (!payload.preferences) payload.preferences = existing.preferences || [];
        if (!payload.allotment_method) payload.allotment_method = existing.allotment_method || 'merit';
        if (!payload.dates) payload.dates = existing.dates || [];
        if (!payload.institutions) payload.institutions = existing.institutions || [];
        if (!payload.logbook_approvals) payload.logbook_approvals = existing.logbook_approvals || [];
      }
    }

    const { error } = await supabase
      .from('elective_shared_store')
      .upsert(payload);

    if (error) {
      console.error('[elective-sync] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[elective-sync] POST exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
