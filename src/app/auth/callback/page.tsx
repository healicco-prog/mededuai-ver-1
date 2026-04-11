'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Handle Supabase magic link / OAuth callbacks.
        // The token arrives in the URL fragment: #access_token=...&refresh_token=...
        // We parse it manually and exchange it via our server-side API to avoid
        // ISP-blocked client Supabase calls.
        const handleSession = async () => {
            try {
                // Parse the URL fragment for tokens
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');

                if (!access_token || !refresh_token) {
                    // No fragment tokens — possibly an email OTP callback handled by Supabase.
                    // In this case, redirect to login and let the user log in manually.
                    throw new Error('No session token found in callback URL. Please log in manually.');
                }

                // Exchange the tokens via our server-side API (bypasses ISP blocks)
                const res = await fetch('/api/auth/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token, refresh_token }),
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Authentication failed.');
                }

                // Store session tokens in localStorage (same pattern as login page)
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
                const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
                const storageKey = `sb-${projectRef}-auth-token`;
                try {
                    localStorage.setItem(storageKey, JSON.stringify({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                        token_type: 'bearer',
                        expires_at: data.session.expires_at,
                        expires_in: data.session.expires_in,
                        user: data.session.user,
                    }));
                } catch (_) { /* localStorage unavailable */ }

                router.push(data.redirectUrl || '/dashboard/student');

            } catch (err: any) {
                console.error('Auth callback error:', err);
                setError(err.message);
                setTimeout(() => {
                    router.push(`/login`);
                }, 3000);
            }
        };

        handleSession();
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center max-w-sm w-full">
                {error ? (
                    <>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                            <span className="text-xl font-bold">!</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Authentication Failed</h2>
                        <p className="text-sm text-center text-slate-500 mb-6">{error}</p>
                        <p className="text-xs text-slate-400 animate-pulse">Redirecting back to login...</p>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Logging you in...</h2>
                        <p className="text-sm text-center text-slate-500">Please wait while we securely authenticate your session.</p>
                    </>
                )}
            </div>
        </div>
    );
}
