import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { checkSecurity } from '@/lib/apiSecurity';
import crypto from 'crypto';

// Razorpay credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const PLAN_PRICES: Record<string, number> = {
  basic: 20000,     // Rs 200 in paise
  standard: 50000,  // Rs 500 in paise
  premium: 100000,  // Rs 1000 in paise
  topup_100k: 10000, // Rs 100 in paise
};

const PLAN_TOKENS: Record<string, number> = {
  basic: 50000,
  standard: 100000,
  premium: 300000,
  topup_100k: 100000,
};

// ── POST: Create Razorpay Order ────────────────────────────
export async function POST(req: NextRequest) {
  const sec = await checkSecurity(req);
  if (!sec.authorized) return sec.response;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { planTier } = await req.json();
    const userId = sec.user.id;

    if (!userId || !planTier || !PLAN_PRICES[planTier]) {
      return NextResponse.json({ error: 'Invalid plan or user' }, { status: 400 });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay not configured. Please contact admin.' }, { status: 503 });
    }

    const amount = PLAN_PRICES[planTier];

    // Create Razorpay Order
    const orderPayload = {
      amount,
      currency: 'INR',
      receipt: `mededuai_${planTier}_${Date.now()}`,
      notes: {
        userId,
        planTier,
      },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[Razorpay] Order creation failed:', err);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    const order = await response.json();

    // Log the pending payment
    await supabaseAdmin.from('payment_history').insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount_paise: amount,
      plan_tier: planTier,
      status: 'pending',
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('[Razorpay] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT: Verify Payment & Activate Subscription ────────────
export async function PUT(req: NextRequest) {
  const sec = await checkSecurity(req);
  if (!sec.authorized) return sec.response;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planTier } = await req.json();
    const userId = sec.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Update payment as failed
      await supabaseAdmin.from('payment_history').update({ status: 'failed', failure_reason: 'Signature mismatch' })
        .eq('razorpay_order_id', razorpay_order_id);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Mark payment as captured
    await supabaseAdmin.from('payment_history').update({
      status: 'captured',
      razorpay_payment_id,
      razorpay_signature,
    }).eq('razorpay_order_id', razorpay_order_id);

    // Activate subscription or Top-up tokens
    if (planTier.startsWith('topup_')) {
      const extraTokens = PLAN_TOKENS[planTier] || 100000;
      
      // Fetch current subscription
      const { data: currentSub } = await supabaseAdmin.from('subscriptions').select('ai_tokens_balance, bonus_tokens').eq('user_id', userId).single();
      const currentBalance = currentSub?.ai_tokens_balance || 0;
      const currentBonus = currentSub?.bonus_tokens || 0;
      
      await supabaseAdmin.from('subscriptions').update({
        ai_tokens_balance: currentBalance + extraTokens,
        bonus_tokens: currentBonus + extraTokens, // Track bonus tokens as well
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
      
      // Log adjustment
      await supabaseAdmin.from('admin_token_adjustments').insert({
        admin_id: 'system_purchase',
        target_user_id: userId,
        adjustment_type: 'bonus_tokens',
        amount: extraTokens,
        reason: `Purchased top-up ${planTier}`,
      });

      return NextResponse.json({ success: true, plan: planTier, tokens: extraTokens, isTopup: true });
    }

    const tokensAllotment = PLAN_TOKENS[planTier] || 10000;
    const nextResetDate = new Date();
    nextResetDate.setDate(nextResetDate.getDate() + 30);

    await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      plan_tier: planTier,
      billing_status: 'active',
      ai_tokens_balance: tokensAllotment,
      ai_tokens_allotment: tokensAllotment,
      tokens_reset_date: nextResetDate.toISOString().split('T')[0],
      razorpay_subscription_id: razorpay_payment_id,
      last_payment_date: new Date().toISOString(),
      next_billing_date: nextResetDate.toISOString(),
      payment_failure_count: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Also update the legacy usage_limits table for backward compatibility
    await supabaseAdmin.from('usage_limits').upsert({
      user_id: userId,
      plan_type: planTier,
    }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true, plan: planTier, tokens: tokensAllotment });
  } catch (error: any) {
    console.error('[Razorpay] Verification error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

