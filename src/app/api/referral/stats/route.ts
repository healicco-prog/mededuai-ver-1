import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user's referral code
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ referral_code: '', total_referred: 0, total_subscribed: 0 });
    }

    // Count referrals
    const { data: referrals, error: refError } = await supabaseAdmin
      .from('referrals')
      .select('id, status')
      .eq('referrer_id', userId);

    const totalReferred = referrals?.length || 0;
    const totalSubscribed = referrals?.filter(r => r.status === 'subscribed').length || 0;

    return NextResponse.json({
      referral_code: userData.referral_code || '',
      total_referred: totalReferred,
      total_subscribed: totalSubscribed,
    });
  } catch (err: any) {
    console.error('Referral stats error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
