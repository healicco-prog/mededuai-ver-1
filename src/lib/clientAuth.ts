
import { supabase } from './supabase';

/**
 * PROJECT_ID constant for direct localStorage access.
 * Matches NEXT_PUBLIC_SUPABASE_URL prefix.
 */
const PROJECT_REF = 'yrelfdwkjtaidtoulwrj';

/**
 * Retrieves a valid Supabase access token (JWT) for use in API headers.
 * 
 * Multi-layer Strategy:
 * 1. Try refreshing session via Supabase Client (Standard)
 * 2. Try getting session from Supabase Client memory/cookie (Standard)
 * 3. Scan localStorage for MedEduAI-1 specific keys (Bypasses project mismatches)
 * 4. Scan all localStorage keys for pattern (Last resort)
 */
export async function getAccessToken(forceRefresh = false): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
        // 1. Try standard Supabase Client
        if (forceRefresh) {
            const { data } = await supabase.auth.refreshSession();
            if (data?.session?.access_token) return data.session.access_token;
        } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) return session.access_token;
        }
    } catch (_) { /* fall through to manual discovery */ }

    try {
        // 2. Direct localStorage discovery
        const knownKeys = [
            `sb-${PROJECT_REF}-auth-token`,
            `supabase.auth.token`,
        ];
        
        for (const key of knownKeys) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                // Handle different Supabase versions/formats
                const token = parsed?.access_token 
                    || parsed?.currentSession?.access_token 
                    || parsed?.session?.access_token;
                if (token) return token;
            } catch (_) { continue; }
        }

        // 3. Pattern scan (for when project ref changes or is unknown)
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) || '';
            if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
                const raw = localStorage.getItem(k);
                if (!raw) continue;
                try {
                    const parsed = JSON.parse(raw);
                    const token = parsed?.access_token 
                        || parsed?.currentSession?.access_token 
                        || parsed?.session?.access_token;
                    if (token) return token;
                } catch (_) { continue; }
            }
        }
    } catch (_) { /* Storage unavailable */ }

    console.warn('[clientAuth] No valid authentication token found in storage.');
    return null;
}

/**
 * Helper to fetch headers with Authorization and Content-Type.
 */
export async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const token = await getAccessToken(forceRefresh);
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

