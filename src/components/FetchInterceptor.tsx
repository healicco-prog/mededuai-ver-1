'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    const CLOUD_RUN_URL = 'https://mededuai-3js7mh5u5a-uc.a.run.app';

    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      // Check if it is an API request to our backend
      if (typeof resource === 'string' && resource.startsWith('/api/')) {
        config = config || {};
        const headers = new Headers(config.headers || {});
        
        // Dynamically find the supabase auth token in localStorage
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
        const storageKey = `sb-${projectRef}-auth-token`;
        
        try {
            const tokenData = localStorage.getItem(storageKey);
            if (tokenData) {
                const parsed = JSON.parse(tokenData);
                if (parsed?.access_token) {
                    headers.set('Authorization', `Bearer ${parsed.access_token}`);
                }
            }
        } catch (e) {
            console.error('FetchInterceptor: Error getting auth token', e);
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
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
