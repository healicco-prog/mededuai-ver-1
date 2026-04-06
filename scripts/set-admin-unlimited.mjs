// One-time migration: Set unlimited tokens for Super Admin and Master Admin accounts
// Run with: node scripts/set-admin-unlimited.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://yrelfdwkjtaidtoulwrj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEwNTc4NCwiZXhwIjoyMDg4NjgxNzg0fQ.YFqGcueb4VKoMUyIfpgiw7pXIKlYjeSp7ajdMp2NVlY'
);

const UNLIMITED = 999999999;

async function setUnlimited() {
  // Fetch ALL users to find admins (DB may store role in various formats)
  const { data: allUsers, error: err } = await supabaseAdmin
    .from('users')
    .select('id, email, role, full_name');

  if (err) {
    console.error('Error fetching users:', err.message);
    return;
  }

  const adminRoles = ['masteradmin', 'superadmin', 'master_admin', 'super_admin', 'MASTER_ADMIN', 'SUPER_ADMIN'];
  const admins = allUsers.filter(u => adminRoles.includes(u.role));

  console.log(`Found ${admins.length} admin(s) out of ${allUsers.length} total users:\n`);
  
  if (admins.length === 0) {
    console.log('All users and their roles:');
    allUsers.forEach(u => console.log(`  ${u.email} -> role: "${u.role}"`));
    return;
  }

  for (const admin of admins) {
    console.log(`Updating ${admin.full_name} (${admin.email}) [${admin.role}]...`);

    const { error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_tier: 'enterprise',
        billing_status: 'active',
        ai_tokens_balance: UNLIMITED,
        ai_tokens_allotment: UNLIMITED,
        bonus_tokens: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', admin.id);

    if (subErr) {
      console.error(`  ✗ Subscription update failed: ${subErr.message}`);
      // Try insert if no subscription exists
      const { error: insertErr } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: admin.id,
          plan_tier: 'enterprise',
          billing_status: 'active',
          ai_tokens_balance: UNLIMITED,
          ai_tokens_allotment: UNLIMITED,
          bonus_tokens: 0,
          trial_end_date: new Date('2099-12-31').toISOString(),
          tokens_reset_date: '2099-12-31',
        });
      if (insertErr) {
        console.error(`  ✗ Insert also failed: ${insertErr.message}`);
      } else {
        console.log(`  ✓ Created new subscription with unlimited tokens`);
      }
    } else {
      console.log(`  ✓ Set to unlimited (${UNLIMITED.toLocaleString()} tokens)`);
    }
  }

  console.log('\n✅ Done!');
}

setUnlimited();
