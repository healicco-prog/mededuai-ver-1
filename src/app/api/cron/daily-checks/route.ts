import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { Resend } from 'resend';

const PLAN_TOKENS: Record<string, number> = {
  free: 10000,
  basic: 50000,
  standard: 100000,
  premium: 300000,
};

/**
 * Daily cron job for subscription management:
 * 1. Send trial expiry reminders (3 days before, 1 day before)
 * 2. Auto-downgrade expired trials to free
 * 3. Reset monthly tokens for active subscribers
 * 4. Handle payment failures: downgrade after 3 failed retries
 */
export async function POST(req: NextRequest) {
  // Simple auth for cron security
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'mededuai-cron-2026';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const results: string[] = [];

  try {
    // ── 1. Trial Expiry Reminders ────────────────────────
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Users with trial expiring in ~3 days
    const { data: expiringTrials3d } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, trial_end_date')
      .eq('billing_status', 'trialing')
      .gte('trial_end_date', new Date().toISOString())
      .lte('trial_end_date', threeDaysFromNow.toISOString());

    if (expiringTrials3d && resend) {
      for (const sub of expiringTrials3d) {
        const { data: user } = await supabaseAdmin.from('users').select('email, full_name').eq('id', sub.user_id).single();
        if (user?.email) {
          const daysLeft = Math.ceil((new Date(sub.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          try {
            await resend.emails.send({
              from: 'MedEduAI <noreply@mededuai.com>',
              to: user.email,
              subject: `⏰ Your MedEduAI trial expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #0f172a;">Hi ${user.full_name || 'there'},</h2>
                  <p>Your free trial of MedEduAI is ending in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
                  <p>Upgrade to a paid plan to continue using all features without interruption:</p>
                  <ul>
                    <li><strong>Basic</strong> - ₹200/month (50k tokens)</li>
                    <li><strong>Standard</strong> - ₹500/month (1L tokens)</li>
                    <li><strong>Premium</strong> - ₹1,000/month (3L tokens)</li>
                  </ul>
                  <a href="https://mededuai.com/dashboard/student" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Upgrade Now</a>
                  <p style="color: #64748b; font-size: 14px; margin-top: 24px;">— The MedEduAI Team</p>
                </div>
              `,
            });
            results.push(`Sent trial reminder to ${user.email} (${daysLeft}d left)`);
          } catch (emailErr: any) {
            results.push(`Email failed for ${user.email}: ${emailErr.message}`);
          }
        }
      }
    }

    // ── 2. Auto-downgrade expired trials ─────────────────
    const { data: expiredTrials } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('billing_status', 'trialing')
      .lt('trial_end_date', new Date().toISOString());

    if (expiredTrials) {
      for (const sub of expiredTrials) {
        // Skip admins — they have unlimited tokens
        const { data: userProfile } = await supabaseAdmin.from('users').select('role').eq('id', sub.user_id).single();
        const normalizedRole = (userProfile?.role || '').toLowerCase().replace(/_/g, '');
        if (normalizedRole === 'masteradmin' || normalizedRole === 'superadmin') {
          results.push(`Skipped admin ${sub.user_id} (unlimited)`);
          continue;
        }

        await supabaseAdmin.from('subscriptions').update({
          billing_status: 'expired',
          plan_tier: 'free',
          ai_tokens_balance: 0,
          ai_tokens_allotment: 0,
          updated_at: new Date().toISOString(),
        }).eq('user_id', sub.user_id);

        // Update legacy table
        await supabaseAdmin.from('usage_limits').upsert({
          user_id: sub.user_id,
          plan_type: 'free',
        }, { onConflict: 'user_id' });

        results.push(`Downgraded expired trial: ${sub.user_id}`);
      }
    }

    // ── 3. Monthly token reset for active subscriptions ──
    const today = new Date().toISOString().split('T')[0];
    const { data: needsReset } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan_tier, ai_tokens_allotment')
      .eq('billing_status', 'active')
      .lte('tokens_reset_date', today);

    if (needsReset) {
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 30);

      for (const sub of needsReset) {
        // Skip admins — they keep unlimited tokens
        const { data: userProfile } = await supabaseAdmin.from('users').select('role').eq('id', sub.user_id).single();
        const normalizedRole = (userProfile?.role || '').toLowerCase().replace(/_/g, '');
        if (normalizedRole === 'masteradmin' || normalizedRole === 'superadmin') {
          results.push(`Skipped admin token reset ${sub.user_id} (unlimited)`);
          continue;
        }

        const allotment = PLAN_TOKENS[sub.plan_tier] || sub.ai_tokens_allotment;
        await supabaseAdmin.from('subscriptions').update({
          ai_tokens_balance: allotment,  // strict reset, no rollover
          ai_tokens_allotment: allotment,
          tokens_reset_date: nextReset.toISOString().split('T')[0],
          bonus_tokens: 0,  // bonus also resets
          updated_at: new Date().toISOString(),
        }).eq('user_id', sub.user_id);

        results.push(`Reset tokens for ${sub.user_id}: ${allotment} (${sub.plan_tier})`);
      }
    }

    // ── 4. Handle payment failures ───────────────────────
    const { data: failedPayments } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, payment_failure_count')
      .eq('billing_status', 'past_due');

    if (failedPayments) {
      for (const sub of failedPayments) {
        if (sub.payment_failure_count >= 3) {
          // Downgrade to free after 3 failures
          await supabaseAdmin.from('subscriptions').update({
            plan_tier: 'free',
            billing_status: 'canceled',
            ai_tokens_balance: 0,
            ai_tokens_allotment: 0,
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id);

          await supabaseAdmin.from('usage_limits').upsert({
            user_id: sub.user_id,
            plan_type: 'free',
          }, { onConflict: 'user_id' });

          // Send payment failure email
          const { data: user } = await supabaseAdmin.from('users').select('email, full_name').eq('id', sub.user_id).single();
          if (user?.email && resend) {
            try {
              await resend.emails.send({
                from: 'MedEduAI <noreply@mededuai.com>',
                to: user.email,
                subject: '⚠️ Your MedEduAI subscription has been canceled',
                html: `
                  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hi ${user.full_name || 'there'},</h2>
                    <p>We were unable to process your payment after multiple attempts. Your subscription has been downgraded to the Free tier.</p>
                    <p>Please update your payment method to restore your plan:</p>
                    <a href="https://mededuai.com/dashboard/student" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Update Payment</a>
                    <p style="color: #64748b; font-size: 14px; margin-top: 24px;">— The MedEduAI Team</p>
                  </div>
                `,
              });
            } catch { /* ignore email failures */ }
          }
          results.push(`Canceled subscription for ${sub.user_id} (3+ payment failures)`);
        }
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error('[Cron] Daily check error:', error.message);
    return NextResponse.json({ error: 'Internal server error', details: results }, { status: 500 });
  }
}
