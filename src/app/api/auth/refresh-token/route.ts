import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/refresh-token
 * Receives a Supabase refresh_token from the browser and exchanges it for a
 * fresh access_token server-side — bypassing any ISP-level blocks on the
 * Supabase API endpoint that would prevent the browser from refreshing directly.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { refresh_token } = body;

        if (!refresh_token) {
            return NextResponse.json({ error: 'refresh_token is required' }, { status: 400 });
        }

        const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
        const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseAnon) {
            return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 });
        }

        // Server-side client — unaffected by browser ISP blocks on Supabase
        const supabase = createClient(supabaseUrl, supabaseAnon, {
            auth: { persistSession: false },
        });

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error || !data.session) {
            console.error('[refresh-token] Supabase refresh failed:', error?.message);
            return NextResponse.json(
                { error: error?.message || 'Session refresh failed — please log in again.' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            access_token:  data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at:    data.session.expires_at,
            expires_in:    data.session.expires_in,
        });
    } catch (err: any) {
        console.error('[refresh-token] Unexpected error:', err?.message);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}
