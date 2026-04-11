'use client';

import { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      // Check if it is an API request to our backend
      if (typeof resource === 'string' && resource.startsWith('/api/') && !resource.startsWith('/api/auth')) {
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
