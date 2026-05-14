'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;

    // ── Production Console Silencer ──
    // Prevents leaking debug info, object dumps, or sensitive internal state to browser logs.
    if (process.env.NODE_ENV === 'production') {
      const noop = () => {};
      (console as any).log = noop;
      (console as any).debug = noop;
      (console as any).info = noop;
      // Keep console.warn and console.error for critical observability
    }

    window.fetch = async function(...args) {
      let [resource, config] = args;

      // Check if it is an API request to our backend
      const isApiRoute = typeof resource === 'string' && (resource.startsWith('/api/') || resource.includes('/api/'));
      if (isApiRoute) {
        config = config || {};
        const headers = new Headers(config.headers || {});

        try {
            // ── 1. Robust Supabase token lookup ──
            // First try the Supabase client (auto-refreshes expired tokens)
            let tokenSet = false;

            // Only skip expensive getSession if headers already have Authorization
            if (!headers.has('Authorization')) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        headers.set('Authorization', `Bearer ${session.access_token}`);
                        tokenSet = true;
                    }
                } catch(_) {
                    // Supabase client may not be available in all contexts
                }
            }

            // Fallback: direct localStorage lookup (handles v1 and v2 Supabase formats)
            if (!tokenSet && !headers.has('Authorization')) {
                const PROJECT_REF = 'yrelfdwkjtaidtoulwrj';
                const keysToTry: string[] = [
                    `sb-${PROJECT_REF}-auth-token`,
                    'supabase.auth.token',
                ];

                // Also scan all keys matching the sb-*-auth-token pattern
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('sb-') && k.endsWith('-auth-token') && !keysToTry.includes(k)) {
                        keysToTry.push(k);
                    }
                }

                for (const key of keysToTry) {
                    const raw = localStorage.getItem(key);
                    if (!raw) continue;
                    try {
                        const parsed = JSON.parse(raw);
                        const token = parsed?.access_token
                            || parsed?.currentSession?.access_token
                            || parsed?.session?.access_token;
                        if (token) {
                            headers.set('Authorization', `Bearer ${token}`);
                            tokenSet = true;
                            break;
                        }
                    } catch (_) { continue; }
                }
            }
        } catch (e) {
            console.error('FetchInterceptor: Error getting auth context', e);
        }

        // Always keep requests same-origin to ensure native cookie transport
        // and eliminate mobile browser third-party tracking/fetch restrictions.
        config.credentials = config.credentials || 'include';
        config.headers = headers;
        args = [resource, config];
      }

      // ── Auto-retry on 401 (token expired) — refresh session and retry once ──
      const response = await originalFetch.apply(window, args);
      if (response.status === 401 && typeof resource === 'string' && resource.includes('/api/') && !resource.includes('/api/auth/')) {
        try {
          console.warn('[FetchInterceptor] 401 detected — attempting session refresh and retry…');
          const { data: { session } } = await supabase.auth.refreshSession();
          if (session?.access_token) {
            const retryConfig = { ...config };
            const retryHeaders = new Headers(retryConfig?.headers || {});
            retryHeaders.set('Authorization', `Bearer ${session.access_token}`);
            retryConfig.headers = retryHeaders;
            return originalFetch.apply(window, [resource, retryConfig]);
          }
        } catch (refreshErr) {
          console.error('[FetchInterceptor] Session refresh failed:', refreshErr);
        }
      }

      return response;
    };

    // ── Sync auth token to httpOnly cookies on every session event ──────────
    // When Supabase silently refreshes the JWT (~every 55 min), this listener
    // fires and posts the new token to /api/auth/refresh-token which writes it
    // to httpOnly cookies. This keeps server-side cookie auth perpetually valid
    // for API routes that don't receive an explicit Authorization header.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.access_token) {
          try {
            await originalFetch('/api/auth/refresh-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                access_token: session.access_token,
                expires_in: session.expires_in,
              }),
            });
          } catch (_) {
            // Non-critical — API routes will fall back to Authorization header path
          }
        }
      }
    );

    return () => {
      window.fetch = originalFetch;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
