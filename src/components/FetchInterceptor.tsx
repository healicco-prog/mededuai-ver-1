'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    // Use env var for Cloud Run URL to avoid hardcoding
    const CLOUD_RUN_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mededuai-backend-3js7mh5u5a-uc.a.run.app';

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
      if (typeof resource === 'string' && resource.startsWith('/api/')) {
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

            // Fallback: direct localStorage lookup
            if (!tokenSet && !headers.has('Authorization')) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
                const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
                const explicitKey = projectRefMatch ? `sb-${projectRefMatch[1]}-auth-token` : null;

                let tokenData = explicitKey ? localStorage.getItem(explicitKey) : null;

                if (!tokenData) {
                  for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
                      tokenData = localStorage.getItem(k);
                      break;
                    }
                  }
                }

                if (tokenData) {
                    const parsed = JSON.parse(tokenData);
                    if (parsed?.access_token) {
                        headers.set('Authorization', `Bearer ${parsed.access_token}`);
                    }
                }
            }
        } catch (e) {
            console.error('FetchInterceptor: Error getting auth context', e);
        }

        // Bypass Netlify proxy for AI-heavy routes only.
        // Netlify has a strict 10s Serverless Function timeout which kills long-running
        // Gemini AI requests. By rewriting the URL to directly target Cloud Run,
        // the browser gets a 300s timeout instead.
        //
        // Auth routes MUST stay same-origin (via Netlify proxy) to avoid CORS errors.
        // Cloud Run's ALLOWED_ORIGINS is restricted to mededuai.com only.
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isAuthRoute = resource.startsWith('/api/auth/');

        // In production, rewrite non-auth API requests to directly hit Cloud Run
        if (!isLocalHost && !isAuthRoute) {
            resource = `${CLOUD_RUN_URL}${resource}`;
        }

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

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
