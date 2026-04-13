import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/fix-admin-role
 * One-time utility: sets drnarayanak@gmail.com as superadmin
 * in both auth.users (user_metadata) and the public.profiles table.
 * Protected by a secret token in the request body.
 */
export async function POST(req: Request) {
    try {
        const { secret } = await req.json();

        // Simple guard – change this to something private if you need
        if (secret !== 'mededuai-fix-2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
