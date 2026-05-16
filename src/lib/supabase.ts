import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration from environment variables.
// These must be defined in a .env.local file at the project root.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❗️ NEXT_PUBLIC_SUPABASE_URL is not set. Supabase client cannot be initialized.');
}
if (!supabaseAnonKey) {
  console.error('❗️ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Supabase client cannot be initialized.');
}

// If either variable is missing, create a client with dummy URL and key to avoid build crashes,
// but all requests will fail – the console errors above will guide the developer.
export const supabase = createClient(
  supabaseUrl || 'https://dummyurl.supabase.co',
  supabaseAnonKey || 'dummykey'
);

