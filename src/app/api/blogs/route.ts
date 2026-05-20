import { checkSecurity } from '@/lib/apiSecurity';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

// GET - Retrieve blogs.
//   /api/blogs              → only status='published' (public homepage + reader)
//   /api/blogs?admin=true   → ALL blogs (drafts + published) when caller is admin
// "admin" is confirmed by checkSecurity which already chains JWT → signed admin
// session cookie → role cookie. If admin=true is requested but no admin signal
// verifies, we return 403 instead of silently degrading to the public list — so
// the dashboard surfaces an auth problem instead of looking like a sync bug.
export async function GET(req: NextRequest) {
  try {
    const wantsAdminView = req.nextUrl.searchParams.get('admin') === 'true';
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'], requireAuth: false });
    const isAdmin = sec.authorized && (sec.role === 'superadmin' || sec.role === 'masteradmin');

    if (wantsAdminView && !isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required to list drafts. Log out and back in to refresh your session.' },
        { status: 403 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from('blogs').select('*');

    if (!wantsAdminView) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[Blogs API GET] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[Blogs API GET] Internal Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create a new blog post
export async function POST(req: NextRequest) {
  const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
  if (!sec.authorized) return sec.response;

  try {
    const body = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    // Ensure slug is unique/filled
    if (!body.slug) {
      body.slug = body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `post-${Date.now()}`;
    }

    // Explicitly strip ID if it is a temporary or generated frontend UUID, letting Supabase generate the primary key
    if (body.id && (body.id.startsWith('post-') || !body.id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/))) {
      delete body.id;
    }

    const { data, error } = await supabaseAdmin
      .from('blogs')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('[Blogs API POST] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Blogs API POST] Internal Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Update an existing blog post
export async function PUT(req: NextRequest) {
  const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
  if (!sec.authorized) return sec.response;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('blogs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Blogs API PUT] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[Blogs API PUT] Internal Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Delete a blog post
export async function DELETE(req: NextRequest) {
  const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
  if (!sec.authorized) return sec.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing query parameter: id' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Blogs API DELETE] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Blogs API DELETE] Internal Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
