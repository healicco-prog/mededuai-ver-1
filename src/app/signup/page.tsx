'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BrainCircuit, Home, Loader2, Mail, Lock, CheckCircle2,
    UserCircle, ChevronDown, Eye, EyeOff, Phone, BookOpen, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ROLES = [
    { id: 'student', label: 'Student' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'department_admin', label: 'Department Head' },
    { id: 'institution_admin', label: 'Institution Head' },
];

const COURSES = [
    { id: '', label: '-- Select Course --' },
    { id: 'MBBS', label: 'MBBS' },
    { id: 'BSc Nursing', label: 'BSc Nursing' },
    { id: 'BDS', label: 'BDS' },
];

export default function SignUpPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState('student');
    const [course, setCourse] = useState('');
    const [disclaimer, setDisclaimer] = useState(false);

    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async (e: React.FormEvent) => {
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

        if (!course) {
            setError("Please select a course");
            return;
        }

        if (!disclaimer) {
            setError("You must accept the AI content disclaimer to continue");
            return;
        }

        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    mobile_number: mobile,
                    role: role,
                    course: course,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            if (data.user && data.session === null) {
                setStep('success');
            } else {
                router.push('/auth/callback');
            }
        }

        setLoading(false);
    };

    /* shared input classes */
    const inputCls = "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm";
    const labelCls = "block text-sm font-bold text-slate-700 mb-1.5 ml-1";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4 py-10">
            {/* ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-md w-full">

                {/* Logo */}
                <div className="flex items-center gap-3 justify-center mb-5">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-600/20">
                        <BrainCircuit className="text-white w-7 h-7" />
                    </div>
                    <span className="font-bold text-2xl text-slate-900 tracking-tight">MedEduAI</span>
                </div>

                <h2 className="text-center text-xl font-bold text-slate-900 mb-1">
                    {step === 'form' ? 'Create an Account' : 'Check Your Inbox'}
                </h2>
                <p className="text-center text-sm text-slate-500 mb-7">
                    {step === 'form'
                        ? 'Join thousands of medical professionals'
                        : 'We sent a verification link to your email address.'}
                </p>

                {error && (
                    <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center flex items-center justify-center gap-2 font-medium">
                        <span className="font-bold">!</span> {error}
                    </div>
                )}

                {step === 'form' ? (
                    <form onSubmit={handleSignUp} className="space-y-4">

                        {/* Full Name */}
                        <div>
                            <label className={labelCls}>Full Name</label>
                            <div className="relative">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="Dr. First Last"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Mobile Number */}
                        <div>
                            <label className={labelCls}>Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                    placeholder="+91 9876543210"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className={labelCls}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="doctor@hospital.com"
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelCls}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="8–16 chars, Aa, 1, !@#"
                                    className={`${inputCls} !pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className={labelCls}>Retype Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm your password"
                                    className={`${inputCls} !pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className={labelCls}>I am a</label>
                            <div className="relative">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all cursor-pointer text-sm"
                                >
                                    {ROLES.map((r) => (
                                        <option key={r.id} value={r.id}>{r.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Course Selection */}
                        <div>
                            <label className={labelCls}>Select Course</label>
                            <div className="relative">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <select
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-10 py-3 appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all cursor-pointer text-sm"
                                >
                                    {COURSES.map((c) => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Disclaimer Checkbox */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={disclaimer}
                                    onChange={(e) => setDisclaimer(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                />
                                <span className="text-xs text-slate-700 leading-relaxed">
                                    <ShieldCheck className="inline w-4 h-4 text-amber-600 mr-1 -mt-0.5" />
                                    I understand that AI-generated content is for <strong>educational purposes only</strong> and should not replace classroom and clinical skill training.
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Account
                        </button>

                        <div className="text-center pt-1">
                            <p className="text-sm text-slate-500">
                                Already have an account?{' '}
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
                            <p className="text-lg font-bold text-slate-900">
                                Registration Successful!
                            </p>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    We sent a secure verification link to:<br />
                                    <span className="font-bold text-slate-900 block mt-1">{email}</span>
                                </p>
                            </div>
                            <p className="text-sm text-slate-500">
                                Please check your inbox and click the link to activate your account and log in.
                            </p>
                        </div>

                        <div className="pt-4">
                            <Link href="/login">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                                >
                                    Return to Login
                                </button>
                            </Link>
                        </div>
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
