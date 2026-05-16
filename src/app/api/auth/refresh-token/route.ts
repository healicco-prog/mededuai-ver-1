import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/refresh-token
 *
 * Two modes:
 *
 * 1. refresh_token in body  →  Exchange refresh token for new session (server-side,
 *    bypasses ISP-level blocks on the Supabase API endpoint), then write fresh
 *    access token to httpOnly cookies.
 *
 * 2. access_token in body   →  Client already has a fresh token (from SDK
 *    onAuthStateChange). Just sync it to the httpOnly cookies so server-side
 *    API routes can read it without an Authorization header.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { refresh_token, access_token: incomingToken, expires_in } = body;

        // ── Mode 2: token-sync (no Supabase round-trip needed) ──────────────────
        if (incomingToken && !refresh_token) {
            if (incomingToken.split('.').length !== 3) {
                return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
            }
            const maxAge = typeof expires_in === 'number' ? expires_in : 3600;
            const cookieStore = await cookies();
            const opts = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                sameSite: 'lax' as const,
                maxAge,
            };
            cookieStore.set('sb-access-token', incomingToken, opts);
            cookieStore.set('sb-yrelfdwkjtaidtoulwrj-auth-token', incomingToken, opts);
            return NextResponse.json({ success: true, mode: 'sync' });
        }

        // ── Mode 1: refresh_token exchange ───────────────────────────────────────
        if (!refresh_token) {
            return NextResponse.json({ error: 'refresh_token or access_token is required' }, { status: 400 });
        }

        const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dummyurl.supabase.co';
        const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'dummykey';

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

        // Write fresh token to httpOnly cookies
        const cookieStore = await cookies();
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax' as const,
            maxAge: data.session.expires_in ?? 3600,
        };
        cookieStore.set('sb-access-token', data.session.access_token, cookieOpts);
        cookieStore.set('sb-yrelfdwkjtaidtoulwrj-auth-token', data.session.access_token, cookieOpts);

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

