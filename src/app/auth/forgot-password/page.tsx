'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, Home, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
        } else {
            setStep('success');
        }
        setLoading(false);
    };

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
                    {step === 'form' ? 'Reset Password' : 'Check Your Email'}
                </h2>
                <p className="text-center text-sm text-slate-500 mb-8">
                    {step === 'form' 
                        ? 'Enter your email address and we will send you a link to reset your password.' 
                        : 'We sent a password reset link to your email address.'}
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center flex items-center justify-center gap-2">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                {step === 'form' ? (
                    <form onSubmit={handleReset} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@institution.edu"
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Send Reset Link
                        </button>
                        
                        <div className="text-center pt-2">
                            <p className="text-sm text-slate-500">
                                Remember your password?{' '}
                                <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all">
                                    Log In
                                </Link>
                            </p>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-100">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Click the link in the email sent to <br/>
                                    <span className="font-bold text-slate-900 block mt-1">{email}</span>
                                </p>
                            </div>
                        </div>
                        
                        <Link href="/login" className="block w-full">
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                                Return to Login
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
