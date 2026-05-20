"use client";

import { BrainCircuit, GraduationCap, ClipboardCheck, FileText, CheckCircle2, AlertCircle, Users, Settings, Lock, HelpCircle, Mail, PhoneCall } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import ReferralCard from './ReferralCard';
import { supabase } from '@/lib/supabase';
import { type PlanTier, type BillingStatus } from '@/lib/subscription';
import { isEmailApproved } from '@/app/dashboard/admin/mentoring/mentorshipAccess';
import Link from 'next/link';

interface SubscriptionData {
    plan_tier: PlanTier;
    billing_status: BillingStatus;
    trial_end_date: string;
}

export function Overview({ role }: { role: 'student' | 'teacher' | 'admin' | 'superadmin' | 'masteradmin' | 'deptadmin' | 'instadmin' }) {
    const isStudent = role === 'student' || role === 'superadmin' || role === 'admin' || role === 'masteradmin';
    const isTeacher = role === 'teacher' || role === 'superadmin' || role === 'admin' || role === 'masteradmin';
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'masteradmin' || role === 'deptadmin' || role === 'instadmin';

    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [isApprovedEmail, setIsApprovedEmail] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'learning' | 'teaching' | 'dept' | 'enterprise'>('learning');

    useEffect(() => {
        const fetchSubscriptionAndUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                const emailStr = user.email || '';
                setUserEmail(emailStr);
                setIsApprovedEmail(isEmailApproved(emailStr));

                const { data: subData } = await supabase
                    .from('user_subscriptions')
                    .select('plan_tier, billing_status, trial_end_date')
                    .eq('user_id', user.id)
                    .single();

                if (subData) {
                    setSubscription(subData);
                } else {
                    setSubscription({
                        plan_tier: 'free',
                        billing_status: 'trialing',
                        trial_end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                    });
                }
            } catch (err) {}
        };
        fetchSubscriptionAndUser();
    }, []);

    // Helper to refresh approval state on tab interaction
    useEffect(() => {
        if (userEmail) {
            setIsApprovedEmail(isEmailApproved(userEmail));
        }
    }, [userEmail, activeTab]);

    const planTier = subscription?.plan_tier || 'free';
    const billingStatus = subscription?.billing_status || 'trialing';
    const trialEndDate = subscription?.trial_end_date || '2000-01-01T00:00:00.000Z';

    const isTrialActive = billingStatus === 'trialing' && new Date(trialEndDate) > new Date();

    // Standard plan features
    const isStandardOrHigher = planTier === 'standard' || planTier === 'premium' || planTier === 'enterprise' || isTrialActive;
    
    // Premium plan features
    const isPremiumOrHigher = planTier === 'premium' || planTier === 'enterprise';

    // Enterprise / Institutional Approved Access
    const hasEnterpriseAccess = planTier === 'enterprise' || isApprovedEmail;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isStudent && (
                    <>
                        <StatCard
                            title="Learning Progress"
                            value="78%"
                            trend="+12% from last week"
                            icon={<GraduationCap className="text-emerald-600" />}
                            color="emerald"
                        />
                        <StatCard
                            title="Active Courses"
                            value="4"
                            trend="2 exams upcoming"
                            icon={<FileText className="text-blue-600" />}
                            color="blue"
                        />
                        <StatCard
                            title="AI Interactions"
                            value="124"
                            trend="32 questions today"
                            icon={<BrainCircuit className="text-purple-600" />}
                            color="purple"
                            isLocked={!isStandardOrHigher}
                            requiredPlan="Standard"
                        />
                    </>
                )}
                {isTeacher && (
                    <>
                        <StatCard
                            title="Classes Today"
                            value="3"
                            trend="Next: Anatomy @ 2 PM"
                            icon={<Users className="text-emerald-600" />}
                            color="emerald"
                        />
                        <StatCard
                            title="Pending Evaluations"
                            value="42"
                            trend="12 new scripts uploaded"
                            icon={<ClipboardCheck className="text-blue-600" />}
                            color="blue"
                            isLocked={!isStandardOrHigher}
                            requiredPlan="Standard"
                        />
                        <StatCard
                            title="Lesson Plans"
                            value="8"
                            trend="3 generated this week"
                            icon={<FileText className="text-purple-600" />}
                            color="purple"
                            isLocked={!isStandardOrHigher}
                            requiredPlan="Standard"
                        />
                    </>
                )}
                {isAdmin && (
                    <>
                        <StatCard
                            title="System Health"
                            value="99.9%"
                            trend="All AI nodes active"
                            icon={<CheckCircle2 className="text-emerald-600" />}
                            color="emerald"
                        />
                        <StatCard
                            title="AI Generation Stats"
                            value="1.2k"
                            trend="+450 today"
                            icon={<BrainCircuit className="text-blue-600" />}
                            color="blue"
                            isLocked={!isPremiumOrHigher}
                            requiredPlan="Premium"
                        />
                        <StatCard
                            title="Active Users"
                            value="842"
                            trend="Current session peak"
                            icon={<Users className="text-purple-600" />}
                            color="purple"
                            isLocked={!isPremiumOrHigher}
                            requiredPlan="Premium"
                        />
                    </>
                )}
            </div>

            {/* Premium Package Features Tracker Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2.5 py-1 rounded-lg">PLAN GATING SYSTEM</span>
                            <span className="text-xs font-medium text-slate-400">• Dynamic Access Controls</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Package Features Tracker</h3>
                        <p className="text-sm text-slate-500 font-medium">Verify which modules are part of your package and check institutional approved emails status.</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 min-w-[240px]">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
                            {planTier[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">ACTIVE TIER</p>
                            <p className="text-sm font-extrabold text-slate-800 capitalize leading-none mb-1">{planTier === 'free' ? 'Free Trial' : planTier}</p>
                            <p className="text-[11px] font-medium text-slate-500 leading-none">
                                {isTrialActive ? '15-Day Trial Features Active' : 'Paid Subscription Active'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="space-y-2 lg:col-span-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Modules By Package</p>
                        <button
                            onClick={() => setActiveTab('learning')}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'learning' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <span>Learning (Student)</span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-slate-200/60 text-slate-500 font-extrabold">BASIC+</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('teaching')}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'teaching' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <span>Teaching (Teacher)</span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-blue-100 text-blue-600 font-extrabold">STANDARD</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('dept')}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'dept' ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <span>Department Head</span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-purple-100 text-purple-600 font-extrabold">PREMIUM</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('enterprise')}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'enterprise' ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <span>Institutional Systems</span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-600 font-extrabold">ENTERPRISE</span>
                        </button>

                        <div className="pt-6 border-t border-slate-100 mt-6 px-3">
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Need to upgrade your plan or extend permissions?
                            </p>
                            <Link href="/dashboard/student/upgrade" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2.5">
                                Visit Upgrade Portal →
                            </Link>
                        </div>
                    </div>

                    {/* Features Display List */}
                    <div className="lg:col-span-3 bg-slate-50/50 rounded-3xl border border-slate-200/80 p-6 sm:p-8">
                        {activeTab === 'learning' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-extrabold text-slate-900">Learning & Student Modules</h4>
                                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Available for Student role</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FeatureItem label="LMS Notes" included={true} tier="Basic" />
                                    <FeatureItem label="Notes Creator" included={true} tier="Basic" />
                                    <FeatureItem label="AI Mentor" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Viva Simulator" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Vocabulary Builder" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Reflection Generator" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Essay Qs Generator" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="MCQs Generator" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Self-Evaluation System" included={isStandardOrHigher} tier="Standard" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'teaching' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-extrabold text-slate-900">Teaching & Course Design Modules</h4>
                                    <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">Available for Teacher role</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FeatureItem label="Lesson Plan Builder" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Rubrics Design Suite" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Essay/MCQ Evaluator" included={isStandardOrHigher} tier="Standard" />
                                    <FeatureItem label="Digital Evaluation Assistant" included={isStandardOrHigher} tier="Standard" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'dept' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-extrabold text-slate-900">Department Administration</h4>
                                    <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-md">Available for Department Head role</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FeatureItem label="Classroom Generator" included={isPremiumOrHigher} tier="Premium" />
                                    <FeatureItem label="Time Table Management" included={isPremiumOrHigher} tier="Premium" />
                                    <FeatureItem label="Attendance Management" included={isPremiumOrHigher} tier="Premium" />
                                    <FeatureItem label="Question Paper Developer" included={isPremiumOrHigher} tier="Premium" />
                                    <FeatureItem label="EMS - Essay Grading" included={isPremiumOrHigher} tier="Premium" />
                                    <FeatureItem label="EMR - MCQ Automation" included={isPremiumOrHigher} tier="Premium" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'enterprise' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-base font-extrabold text-slate-900">Institutional Enterprise Suites</h4>
                                    <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Enterprise Subscription Needed</span>
                                </div>
                                
                                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed space-y-1 mb-2">
                                    <p className="font-bold flex items-center gap-1.5 text-[13px] mb-1">
                                        <HelpCircle className="w-4 h-4 text-amber-600" />
                                        Institutional Mail Approval Rules
                                    </p>
                                    <p>• Mentoring MS, Elective MS, and LogBook MS are activated system-wide once subscribed by your Institution Head.</p>
                                    <p>• Department Heads, Mentors, and Mentees receive instant access as soon as their email addresses are approved and entered by the Institution Admin.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FeatureItem 
                                        label="Mentoring MS" 
                                        included={hasEnterpriseAccess} 
                                        tier="Enterprise" 
                                        customSubText={isApprovedEmail ? "Email approved by Inst Admin" : undefined}
                                    />
                                    <FeatureItem 
                                        label="Elective MS" 
                                        included={hasEnterpriseAccess} 
                                        tier="Enterprise" 
                                        customSubText={isApprovedEmail ? "Email approved by Inst Admin" : undefined}
                                    />
                                    <FeatureItem 
                                        label="Log Book MS" 
                                        included={hasEnterpriseAccess} 
                                        tier="Enterprise" 
                                        customSubText={isApprovedEmail ? "Email approved by Inst Admin" : undefined}
                                    />
                                </div>

                                <div className="mt-8 flex flex-col sm:flex-row gap-4 border-t border-slate-200 pt-6">
                                    <a
                                        href="mailto:sales@mededuai.com?subject=Institution%20Enterprise%20Subscription%20Inquiry"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Email Enterprise Team
                                    </a>
                                    <a
                                        href="tel:+910000000000"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors"
                                    >
                                        <PhoneCall className="w-4 h-4" />
                                        Call Us to Activate
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        {isAdmin ? 'System Logs' : 'Recent Activity'}
                    </h3>
                    <div className="space-y-6">
                        {(isAdmin ? ['LMS Queue: Anatomy Notes (3/10)', 'Server Backup Completed', 'New Teacher Registered'] :
                            ['Anatomy Notes Generated', 'Viva Session Completed', 'New Vocabulary Term Added']).map((text, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{text}</p>
                                        <p className="text-xs text-slate-500">{i + 1} hour{i !== 0 ? 's' : ''} ago</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {isStudent && (
                    <div className="flex flex-col gap-8">
                        <div className="bg-emerald-900 p-8 rounded-3xl text-white relative overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">MediEduAI Standard</h3>
                                <p className="text-emerald-100/80 mb-6 max-w-xs">Unlock unlimited AI Mentor questions and advanced case simulators.</p>
                                <a href="https://pages.razorpay.com/medieduai-standard" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-emerald-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-center font-sans">
                                    Upgrade to Standard
                                </a>
                            </div>
                            <BrainCircuit className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                        </div>
                    </div>
                )}

                {isTeacher && !isStudent && (
                    <div className="flex flex-col gap-8">
                        <div className="bg-blue-900 p-8 rounded-3xl text-white relative overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Teacher Portal</h3>
                                <p className="text-blue-100/80 mb-6 max-w-xs">Access advanced AI grading rubrics and curriculum mapping tools.</p>
                                <button className="bg-white text-blue-900 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors font-sans">
                                    Open EMS Portal
                                </button>
                            </div>
                            <GraduationCap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Admin Console</h3>
                            <p className="text-slate-100/80 mb-6 max-w-xs">Monitor AI token usage and manage system-wide LMS generation queues.</p>
                            <button className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors font-sans">
                                View Analytics
                            </button>
                        </div>
                        <Settings className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                    </div>
                )}
            </div>

            {/* Referral / Support Card */}
            <ReferralCard />
        </div>
    );
}

function StatCard({ title, value, trend, icon, color, isLocked, requiredPlan }: any) {
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    const cardContent = (
        <div className={`relative bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all overflow-hidden ${isLocked ? 'cursor-pointer hover:border-amber-300' : 'hover:-translate-y-1'}`}>
            <div className={`transition-all duration-300 ${isLocked ? 'blur-[3px] select-none opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                        {icon}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
                        <p className="text-xs text-slate-500 mt-1">{trend}</p>
                    </div>
                </div>
            </div>

            {isLocked && (
                <div className="absolute inset-0 bg-slate-50/10 flex flex-col items-center justify-center p-4 text-center z-10 transition-colors hover:bg-amber-50/20">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl flex items-center justify-center shadow-sm mb-2 animate-bounce">
                        <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 tracking-wide uppercase">Unlock {requiredPlan}</span>
                    <span className="text-[10px] font-medium text-slate-400 mt-0.5">Click to upgrade</span>
                </div>
            )}
        </div>
    );

    if (isLocked) {
        return (
            <Link href="/dashboard/student/upgrade" className="block w-full">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
}

function FeatureItem({ label, included, tier, customSubText }: { label: string; included: boolean; tier: string; customSubText?: string }) {
    const isEnterprise = tier.toLowerCase() === 'enterprise';
    
    return (
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${included ? 'bg-white border-slate-200 hover:border-emerald-200' : 'bg-slate-100/50 border-slate-200/50 opacity-70'}`}>
            <div className="flex items-center gap-3">
                {included ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-3 h-3" />
                    </div>
                )}
                <div>
                    <p className={`text-sm font-bold ${included ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {customSubText ? customSubText : included ? 'Activated & Ready' : `Requires ${tier}`}
                    </p>
                </div>
            </div>
            
            {!included && (
                <Link
                    href={isEnterprise ? "mailto:sales@mededuai.com?subject=Institution%20Enterprise%20Subscription%20Inquiry" : "/dashboard/student/upgrade"}
                    className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 tracking-wider transition-colors"
                >
                    {isEnterprise ? 'Call Us' : 'Upgrade'}
                </Link>
            )}
        </div>
    );
}
