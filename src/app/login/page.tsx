'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import MededuLogo from '@/components/MededuLogo';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // FetchInterceptor will automatically rewrite this to hit Cloud Run directly
            // in production, attaching required headers and credentials: 'include'.
            const loginUrl = '/api/auth/login';

            const res = await fetch(loginUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                const raw = (data.error || '').toString();
                const cryptic = /^(fetch failed|failed to fetch|networkerror|typeerror|load failed)$/i.test(raw.trim())
                    || /enotfound|econnreset|etimedout|getaddrinfo|und_err/i.test(raw);
                const friendly = cryptic || !raw
                    ? 'Authentication service is temporarily unavailable. Please check your connection and try again in a moment.'
                    : raw;
                setError(friendly);
                return;
            }

            // ── Explicit First-Party Cookie Assignment ──
            // Mobile browsers block cross-site Set-Cookie headers. Writing them natively via first-party
            // document.cookie ensures Next.js middleware recognizes the authenticated session instantly.
            if (data.role) {
                document.cookie = `role=${encodeURIComponent(data.role)}; path=/; max-age=31536000; SameSite=Lax`;
            }

            // Persist session tokens directly into localStorage so the Supabase SDK
            // can pick them up on the next page WITHOUT making any extra network calls.
            if (data.session) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
                const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'yrelfdwkjtaidtoulwrj';
                const storageKey = `sb-${projectRef}-auth-token`;
                
                if (data.session.access_token) {
                    const tokenMaxAge = data.session.expires_in ?? 3600;
                    document.cookie = `sb-access-token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=${tokenMaxAge}; SameSite=Lax`;
                    document.cookie = `${storageKey}=${encodeURIComponent(data.session.access_token)}; path=/; max-age=${tokenMaxAge}; SameSite=Lax`;
                }

                try {
                    localStorage.setItem(storageKey, JSON.stringify({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                        token_type: 'bearer',
                        expires_at: data.session.expires_at,
                        expires_in: data.session.expires_in,
                        user: data.session.user,
                    }));
                } catch (_) {
                    // localStorage may be unavailable in some environments — not critical
                }
            }

            // Perform a clean native page redirect. This guarantees that Next.js Server Components and
            // Edge Middleware natively read the fresh cookies from the browser's Document storage.
            window.location.href = data.redirectUrl || '/dashboard/student';
        } catch (err: any) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
            {/* ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-md w-full">

                {/* Logo */}
                <div className="flex items-center gap-3 justify-center mb-6">
                    <MededuLogo size={48} className="shadow-lg shadow-emerald-600/20" />
                    <span className="font-bold text-2xl text-slate-900 tracking-tight">MedEduAI</span>
                </div>

                <h2 className="text-center text-xl font-bold text-slate-900 mb-1">
                    Welcome Back
                </h2>
                <p className="text-center text-sm text-slate-500 mb-8">
                    Sign in to MedEduAI using your email and password.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center flex items-center justify-center gap-2 font-medium">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="email"
                                id="login-email-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="one-time-code"
                                placeholder="name@institution.edu"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                            <label className="block text-sm font-bold text-slate-700">Password</label>
                            <Link href="/auth/forgot-password" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="login-password-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="one-time-code"
                                placeholder="Enter your password"
                                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
                                suppressHydrationWarning
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                suppressHydrationWarning
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 mt-6"
                        suppressHydrationWarning
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Log In
                    </button>
                    
                    <div className="text-center pt-2">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link href="/signup" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-slate-100">
                    <Link href="/" className="text-sm font-bold text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-2 transition-colors">
                        <Home className="w-4 h-4" /> Back to Home Page
                    </Link>
                </div>
            </div>
        </div>
    );
}
