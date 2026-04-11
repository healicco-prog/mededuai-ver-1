import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Fetch the user's role from the `profiles` table with a small exponential back‑off.
 * This mitigates race conditions where the `handle_new_user` trigger hasn't yet
 * created the profile row after login.
 */
export async function fetchUserRole(userId: string, supabaseClient: SupabaseClient = supabase) {
  const maxAttempts = 3;
  let attempt = 0;
  let delay = 200; // ms

  while (attempt < maxAttempts) {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.role ?? null;
    } catch (e) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2; // exponential back‑off
    }
  }
  return null;
}
