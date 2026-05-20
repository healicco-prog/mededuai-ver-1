import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration from environment variables.
// Hardcode the MedEduAI-1 production project ref fallback so client-side builds
// remain fully operational and target the correct database even if Next.js
// build-time environment variable injection fails or carries stale defaults.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yrelfdwkjtaidtoulwrj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWxmZHdranRhaWR0b3Vsd3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDU3ODQsImV4cCI6MjA4ODY4MTc4NH0.FpFw_TINjRTeSRK54PFa-NoLa5R9ctx8y5h4_wmoBfk';

// Disable mock mode for production
export const isMockMode = false;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


