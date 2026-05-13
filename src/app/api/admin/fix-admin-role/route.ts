import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkSecurity } from '@/lib/apiSecurity';

/**
 * POST /api/admin/fix-admin-role
 * One-time utility: sets drnarayanak@gmail.com as superadmin
 * in both auth.users (user_metadata) and the public.profiles table.
 * Requires superadmin or masteradmin JWT.
 */
export async function POST(req: Request) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummyurl.supabase.co';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummykey';

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const targetEmail = 'drnarayanak@gmail.com';

        // 1. Find the user by email from auth.users
        const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
        if (listErr) {
            return NextResponse.json({ error: listErr.message }, { status: 500 });
        }

        const user = listData.users.find(u => u.email === targetEmail);
        if (!user) {
            return NextResponse.json({ error: `User ${targetEmail} not found in auth.users` }, { status: 404 });
        }

        // 2. Update user_metadata to include role: superadmin
        const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, role: 'superadmin' },
        });
        if (updateErr) {
            return NextResponse.json({ error: `Failed to update user_metadata: ${updateErr.message}` }, { status: 500 });
        }

        // 3. Upsert the profiles table
        const { error: profileErr } = await supabase
            .from('profiles')
            .upsert({ id: user.id, role: 'superadmin', email: targetEmail }, { onConflict: 'id' });

        if (profileErr) {
            console.warn('[fix-admin-role] profiles upsert warning:', profileErr.message);
        }

        return NextResponse.json({
            success: true,
            message: `${targetEmail} is now superadmin (user_metadata updated${profileErr ? '; profiles upsert had a warning' : ' and profiles table updated'})`,
            userId: user.id,
        });

    } catch (error: any) {
        console.error('[fix-admin-role] error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
