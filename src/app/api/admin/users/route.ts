import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — Fetch ALL users from Supabase Auth, merged with public.users data
export async function GET(_req: NextRequest) {
  try {
    // 1. List ALL auth users (handles pagination)
    const allAuthUsers: any[] = [];
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data: { users: batch }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) {
        console.error('[AdminUsers] auth list error:', error.message);
        break;
      }
      if (!batch || batch.length === 0) break;
      allAuthUsers.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    // 2. Get public.users rows for extra metadata
    const { data: publicUsers } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, created_at');

    const publicMap = Object.fromEntries(
      (publicUsers || []).map(u => [u.id, u])
    );

    // 3. Merge: auth user is the source of truth; public.users adds name/role
    const result = allAuthUsers.map(authUser => {
      const pub = publicMap[authUser.id];
      return {
        id: authUser.id,
        email: authUser.email || pub?.email || '',
        full_name: pub?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        role: pub?.role || authUser.user_metadata?.role || 'student',
        created_at: authUser.created_at,
        last_sign_in: authUser.last_sign_in_at || null,
        has_profile: !!pub,
      };
    });

    // Sort by created_at descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[AdminUsers] GET error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Update user role
export async function PATCH(req: NextRequest) {
  try {
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    }

    // Update auth metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    // Update public.users
    await supabaseAdmin.from('users').update({ role }).eq('id', userId);

    // Update public.profiles
    await supabaseAdmin.from('profiles').update({ role }).eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[AdminUsers] PATCH error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — Change user password
export async function PUT(req: NextRequest) {
  try {
    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'userId and newPassword required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[AdminUsers] PUT error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
