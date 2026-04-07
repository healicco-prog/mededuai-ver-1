import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

// GET — Fetch ALL users from Supabase Auth, merged with public.users data
export async function GET(_req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Run auth list + public.users query in PARALLEL for speed
    const [authResult, publicResult] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin
        .from('users')
        .select('id, full_name, email, role, created_at, admin_set_password'),
    ]);

    if (authResult.error) {
      console.error('[AdminUsers] auth list error:', authResult.error.message);
      return NextResponse.json({ error: authResult.error.message }, { status: 500 });
    }

    const allAuthUsers = authResult.data?.users ?? [];
    const publicMap = Object.fromEntries(
      (publicResult.data || []).map((u: any) => [u.id, u])
    );

    const users = allAuthUsers
      .map((authUser: any) => {
        const pub = (publicMap as any)[authUser.id];
        return {
          id: authUser.id,
          email: authUser.email || pub?.email || '',
          full_name: pub?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
          role: pub?.role || authUser.user_metadata?.role || 'student',
          created_at: authUser.created_at,
          last_sign_in: authUser.last_sign_in_at || null,
          has_profile: !!pub,
          admin_set_password: pub?.admin_set_password || null,
        };
      })
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(users);
  } catch (err: any) {
    console.error('[AdminUsers] GET error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Update user role
export async function PATCH(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    }

    await Promise.all([
      supabaseAdmin.from('users').update({ role }).eq('id', userId),
      supabaseAdmin.from('profiles').update({ role }).eq('id', userId),
      supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { role } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[AdminUsers] PATCH error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — Set user password + save reference in public.users
export async function PUT(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword required' }, { status: 400 });
    }

    // 1. Update the actual auth password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Save the password reference to public.users for admin control panel visibility
    await supabaseAdmin
      .from('users')
      .update({ admin_set_password: newPassword })
      .eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[AdminUsers] PUT error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Send password reset email to a user
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const redirectTo = `${siteUrl}/auth/callback`;

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Password reset email sent to ${email}` });
  } catch (err: any) {
    console.error('[AdminUsers] POST reset error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
