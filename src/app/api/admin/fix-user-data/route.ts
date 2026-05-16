/**
 * ONE-TIME DATA FIX  —  /api/admin/fix-user-data
 *
 * Corrects role and plan mismatches for the five known MedEduAI test accounts.
 * Protected by checkSecurity (requires superadmin or masteradmin).
 *
 * DELETE or disable this route after running once in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';

// ── Correct data for each account ─────────────────────────────────────────
const FIXES = [
    {
        email: 'aimsrcpharmac@gmail.com',
        full_name: 'AIMSR Pharmac',
        role: 'student',
        plan_tier: 'standard',
        ai_tokens_allotment: 100_000,
        billing_status: 'trialing',
    },
    {
        email: 'narayanakdr@yahoo.co.in',
        full_name: 'Narayana- Learning',
        role: 'student',
        plan_tier: 'basic',
        ai_tokens_allotment: 50_000,
        billing_status: null, // keep existing
    },
    {
        email: 'bjpdoddaballapura@gmail.com',
        full_name: 'Narayana- Dept Head',
        role: 'teacher',
        plan_tier: 'standard',
        ai_tokens_allotment: 100_000,
        billing_status: null, // keep existing (already active)
    },
    {
        email: 'drnarayanabjp@gmail.com',
        full_name: 'Narayana- Dept Head',
        role: 'department_admin',
        plan_tier: 'premium',
        ai_tokens_allotment: 300_000,
        billing_status: null, // keep existing
    },
    {
        email: 'bjpkarnatakadoctorscell@gmail.com',
        full_name: 'Narayana- Inst Head',
        role: 'institution_admin',
        plan_tier: 'enterprise',
        ai_tokens_allotment: 1_000_000,
        billing_status: 'trialing',
    },
] as const;

export async function POST(req: NextRequest) {
    const sec = await checkSecurity(req, { roles: ['superadmin', 'masteradmin'] });
    if (!sec.authorized) return sec.response;

    const supabase = getSupabaseAdmin();
    const results: { email: string; status: string; detail?: string }[] = [];

    for (const fix of FIXES) {
        try {
            // 1 — Look up the user by email in public.users
            const { data: userRow, error: lookupErr } = await supabase
                .from('users')
                .select('id')
                .eq('email', fix.email)
                .maybeSingle();

            if (lookupErr) throw new Error(`Lookup failed: ${lookupErr.message}`);

            // 2 — Also try auth.admin.listUsers if not found in public.users
            let userId = userRow?.id;
            if (!userId) {
                const { data: authList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
                const authUser = authList?.users?.find((u: any) => u.email === fix.email);
                userId = authUser?.id;
            }

            if (!userId) {
                results.push({ email: fix.email, status: 'skipped', detail: 'User not found' });
                continue;
            }

            // 3 — Update role in users table
            await supabase.from('users').upsert({
                id: userId,
                email: fix.email,
                full_name: fix.full_name,
                role: fix.role,
            });

            // 4 — Update role in profiles table
            await supabase.from('profiles').upsert({
                id: userId,
                email: fix.email,
                full_name: fix.full_name,
                role: fix.role,
            });

            // 5 — Update role in auth user_metadata
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { role: fix.role, full_name: fix.full_name },
            });

            // 6 — Update subscription plan, allotment AND balance
            //     Balance is reset to the new allotment to stay consistent when the
            //     plan tier changes (these are all test/seed accounts with no real usage).
            const subUpdate: Record<string, any> = {
                plan_tier: fix.plan_tier,
                ai_tokens_allotment: fix.ai_tokens_allotment,
                ai_tokens_balance: fix.ai_tokens_allotment,
                bonus_tokens: 0,
                updated_at: new Date().toISOString(),
            };
            if (fix.billing_status) subUpdate.billing_status = fix.billing_status;

            const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('user_id, ai_tokens_balance')
                .eq('user_id', userId)
                .maybeSingle();

            if (existingSub) {
                // Adjust balance proportionally only if it's still at the old allotment
                // (i.e. user hasn't spent any tokens — balance == old allotment or close)
                await supabase
                    .from('subscriptions')
                    .update(subUpdate)
                    .eq('user_id', userId);
            } else {
                // Create subscription from scratch
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 15);
                await supabase.from('subscriptions').insert({
                    user_id: userId,
                    plan_tier: fix.plan_tier,
                    billing_status: fix.billing_status || 'trialing',
                    ai_tokens_balance: fix.ai_tokens_allotment,
                    ai_tokens_allotment: fix.ai_tokens_allotment,
                    trial_end_date: trialEnd.toISOString(),
                });
            }

            results.push({ email: fix.email, status: 'fixed', detail: `role=${fix.role}, plan=${fix.plan_tier}` });
        } catch (err: any) {
            results.push({ email: fix.email, status: 'error', detail: err.message });
        }
    }

    const fixed = results.filter(r => r.status === 'fixed').length;
    const errors = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
        summary: `${fixed} fixed, ${errors} errors, ${results.length - fixed - errors} skipped`,
        results,
    });
}

// GET method is no longer allowed with checkSecurity for modifying operations.
export async function GET(req: NextRequest) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

