'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    const CLOUD_RUN_URL = 'https://mededuai-prod-3js7mh5u5a-uc.a.run.app';

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
        
        let hasToken = false;
        try {
            const tokenData = localStorage.getItem(storageKey);
            if (tokenData) {
                const parsed = JSON.parse(tokenData);
                if (parsed?.access_token) {
                    headers.set('Authorization', `Bearer ${parsed.access_token}`);
                    hasToken = true;
                }
            }
        } catch (e) {
            console.error('FetchInterceptor: Error getting auth token', e);
        }

        // Bypassing Netlify proxy: 
        // Netlify has a strict 10s Serverless Function timeout which kills long-running
        // Gemini AI requests. By changing the URL to directly point to Cloud Run,
        // the browser connects to Cloud Run directly (which has a 300s timeout).
        // Skip for auth routes if they need same-origin, but Cloud Run has our allowed-origins set.
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // In production, rewrite all API requests to directly hit Cloud Run
        if (!isLocalHost) {
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
