'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { setRoleCookieAndGetRedirectUrl } from '@/app/login/actions';

export default function AuthCallback() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Supabase Auth sends the token in the URL fragment (e.g. #access_token=...) 
        // We need to let the Supabase client parse it and establish the session.
        const handleSession = async () => {
            try {
                // Get the session that Supabase automatically parsed from the URL
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError || !session) {
                    throw new Error(sessionError?.message || 'Failed to establish session or link expired.');
                }

                // Get the user's role from the profiles table
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                let role = 'student'; // Default role
                if (session.user.user_metadata?.role) {
                    role = session.user.user_metadata.role;
                } else if (profileData && profileData.role) {
                    role = profileData.role;
                }

                // Use our server action to set the cookie and get redirect URL
                const redirectUrl = await setRoleCookieAndGetRedirectUrl(role);
                router.push(redirectUrl);
                
            } catch (err: any) {
                console.error("Auth callback error:", err);
                setError(err.message);
                // Redirect to login page with error after 3 seconds
                setTimeout(() => {
                    router.push(`/login?error=${encodeURIComponent(err.message)}`);
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
