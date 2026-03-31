'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Home, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // When the user clicks the recovery link in their email, 
        // Supabase sets the session in the URL fragment #access_token
        // We need to wait for the Supabase client to process this.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Invalid or expired reset link. Please request a new one.");
            }
            setVerifying(false);
        };
        
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        });

        if (updateError) {
            setError(updateError.message);
        } else {
            setStep('success');
            // Log them out so they can log in fresh with the new password,
            // or we could redirect them to the dashboard since they are technically authenticated now.
            // For security, asking them to log in again is often preferred.
            await supabase.auth.signOut();
        }
        
        setLoading(false);
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Verifying reset link...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full">
                <div className="flex items-center gap-3 justify-center mb-6">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BrainCircuit className="text-white w-7 h-7" />
                    </div>
                    <span className="font-bold text-2xl text-slate-900 tracking-tight">MedEduAI</span>
                </div>

                <h2 className="text-center text-xl font-bold text-slate-800 mb-2">
                    {step === 'form' ? 'Create New Password' : 'Password Updated'}
                </h2>
                <p className="text-center text-sm text-slate-500 mb-8">
                    {step === 'form' 
                        ? 'Please enter your new password below.' 
                        : 'Your password has been successfully reset.'}
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center flex items-center justify-center gap-2">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                {step === 'form' ? (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Create a new password"
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="pb-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Confirm New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm your new password"
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!error.includes("Invalid")} // Disable if token is invalid
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Reset Password
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-100">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                You can now log in using your new password.
                            </p>
                        </div>
                        
                        <Link href="/login" className="block w-full">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white border border-slate-800 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-sm"
                            >
                                Log In Now
                            </button>
                        </Link>
                    </div>
                )}

                <div className="mt-8 text-center pt-6 border-t border-slate-100">
                    <Link href="/" className="text-sm font-bold text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-2 transition-colors">
                        <Home className="w-4 h-4" /> Back to Home Page
                    </Link>
                </div>
            </div>
        </div>
    );
}
