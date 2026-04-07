'use server';

import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function getAllUsers() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  
  return users.map(u => ({
    id: u.id,
    name: u.full_name || 'Unknown',
    email: u.email,
    role: u.role,
    password: '' // We don't expose passwords
  }));
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabaseAdmin = getSupabaseAdmin();
  // Update public.users
  const { error: userErr } = await supabaseAdmin
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);
    
  // Update public.profiles
  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  // Update auth.users metadata
  const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role: newRole } }
  );

  if (userErr || profileErr || authErr) {
    console.error("Error updating user role:", { userErr, profileErr, authErr });
    return { success: false, error: 'Failed to update user' };
  }

  return { success: true };
}
