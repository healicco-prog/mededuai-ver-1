import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(_req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  // Fetch all users with their subscription data
  const { data: users, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, role')
    .order('created_at', { ascending: true });

  if (uErr) {
    console.error('[TokenAdmin] users fetch error:', uErr.message);
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  const userIds = (users || []).map(u => u.id);

  const { data: subs, error: sErr } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, plan_tier, billing_status, ai_tokens_balance, ai_tokens_allotment, bonus_tokens, trial_end_date')
    .in('user_id', userIds);

  if (sErr) {
    console.error('[TokenAdmin] subscriptions fetch error:', sErr.message);
  }

  const subMap = Object.fromEntries((subs || []).map(s => [s.user_id, s]));

  const result = (users || []).map(u => {
    const sub = subMap[u.id] || {};
    return {
      id: u.id,
      full_name: u.full_name || 'Unknown',
      email: u.email || '',
      role: u.role || 'student',
      plan_tier: sub.plan_tier || 'free',
      billing_status: sub.billing_status || 'trialing',
      ai_tokens_balance: sub.ai_tokens_balance ?? 0,
      ai_tokens_allotment: sub.ai_tokens_allotment ?? 10000,
      bonus_tokens: sub.bonus_tokens ?? 0,
      trial_end_date: sub.trial_end_date || '',
    };
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, newBalance, reason, adminId } = await req.json();
    if (!userId || newBalance === undefined) {
      return NextResponse.json({ error: 'userId and newBalance required' }, { status: 400 });
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({
        ai_tokens_balance: Math.max(0, newBalance),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Log it
    await supabaseAdmin.from('admin_token_adjustments').insert({
      admin_id: adminId || 'super_admin',
      target_user_id: userId,
      adjustment_type: 'manual_set',
      amount: newBalance,
      reason: reason || 'Manual admin adjustment',
    }).maybeSingle();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, plan_tier, billing_status, ai_tokens_balance, ai_tokens_allotment, role } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // Update subscription fields
    const subUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
    if (plan_tier !== undefined) subUpdate.plan_tier = plan_tier;
    if (billing_status !== undefined) subUpdate.billing_status = billing_status;
    if (ai_tokens_balance !== undefined) subUpdate.ai_tokens_balance = Math.max(0, ai_tokens_balance);
    if (ai_tokens_allotment !== undefined) subUpdate.ai_tokens_allotment = Math.max(0, ai_tokens_allotment);

    if (Object.keys(subUpdate).length > 1) {
      await supabaseAdmin.from('subscriptions').update(subUpdate).eq('user_id', userId);
    }

    // Update role everywhere
    if (role !== undefined) {
      await supabaseAdmin.from('users').update({ role }).eq('id', userId);
      await supabaseAdmin.from('profiles').update({ role }).eq('id', userId);
      await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: { role } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[TokenAdmin] PUT error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
