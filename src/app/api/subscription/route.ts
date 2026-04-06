import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GET: Fetch subscription for a user ─────────────────────
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Subscription] Fetch error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no subscription exists, create a trial one
  if (!data) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 15);
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + 30);

    // Fetch user role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    let defaultPlanTier = 'free';
    let isUnlimitedAdmin = false;
    const normalizedRole = (profile?.role || '').toLowerCase().replace(/_/g, '');
    if (normalizedRole === 'masteradmin' || normalizedRole === 'superadmin') {
      defaultPlanTier = 'enterprise';
      isUnlimitedAdmin = true;
    } else if (normalizedRole === 'student' || normalizedRole === 'teacher') {
      defaultPlanTier = 'standard';
    } else if (normalizedRole === 'deptadmin' || normalizedRole === 'departmentadmin') {
      defaultPlanTier = 'premium';
    } else if (normalizedRole === 'instadmin' || normalizedRole === 'institutionadmin') {
      defaultPlanTier = 'premium';
    }

    let defaultTokens = 50000; // Free / Basic 
    if (isUnlimitedAdmin) {
      defaultTokens = 999999999; // Unlimited for admins
    } else if (defaultPlanTier === 'premium') {
      defaultTokens = 300000;
    } else if (defaultPlanTier === 'standard') {
      defaultTokens = 100000;
    } else if (defaultPlanTier === 'enterprise') {
      defaultTokens = 1000000;
    }

    const { data: newSub, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_tier: defaultPlanTier,
        billing_status: 'trialing',
        ai_tokens_balance: defaultTokens,
        ai_tokens_allotment: defaultTokens,
        trial_end_date: trialEnd.toISOString(),
        tokens_reset_date: resetDate.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Subscription] Insert error:', insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json(newSub);
  }

  return NextResponse.json(data);
}

// ── PUT: Admin actions (extend trial, add bonus tokens) ────
export async function PUT(req: NextRequest) {
  try {
    const { action, targetUserId, adminId, amount, reason } = await req.json();

    if (!targetUserId || !adminId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'extend_trial') {
      const days = amount || 7;
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('trial_end_date')
        .eq('user_id', targetUserId)
        .single();

      if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

      const currentEnd = new Date(sub.trial_end_date);
      currentEnd.setDate(currentEnd.getDate() + days);

      await supabaseAdmin.from('subscriptions').update({
        trial_end_date: currentEnd.toISOString(),
        trial_extended_by: adminId,
        trial_extension_days: days,
        updated_at: new Date().toISOString(),
      }).eq('user_id', targetUserId);

      await supabaseAdmin.from('admin_token_adjustments').insert({
        admin_id: adminId,
        target_user_id: targetUserId,
        adjustment_type: 'trial_extension',
        amount: days,
        reason: reason || `Trial extended by ${days} days`,
      });

      return NextResponse.json({ success: true, newTrialEnd: currentEnd.toISOString() });
    }

    if (action === 'add_bonus_tokens') {
      const tokens = amount || 5000;
      await supabaseAdmin.from('subscriptions').update({
        bonus_tokens: tokens,
        updated_at: new Date().toISOString(),
      }).eq('user_id', targetUserId);

      await supabaseAdmin.from('admin_token_adjustments').insert({
        admin_id: adminId,
        target_user_id: targetUserId,
        adjustment_type: 'bonus_tokens',
        amount: tokens,
        reason: reason || `Bonus tokens: ${tokens}`,
      });

      return NextResponse.json({ success: true, bonusTokens: tokens });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Subscription] Admin action error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
