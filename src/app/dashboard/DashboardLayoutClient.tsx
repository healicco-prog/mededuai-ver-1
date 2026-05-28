"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import {
    LayoutDashboard, BookOpen, MessageSquare, Mic,
    Settings, LogOut, Users, FileText,
    GraduationCap, ClipboardCheck, AlertCircle, Home, ClipboardList, Menu, X, ClipboardType, CalendarDays, Lock, ArrowLeft, Shield, FilePenLine as FileEdit, ScanLine, Zap, Building2, Crown, Check, ArrowRight, UserCheck
} from 'lucide-react';
import MededuLogo from '@/components/MededuLogo';
import TrialCountdown from '@/components/TrialCountdown';
import TokenUsageMeter from '@/components/TokenUsageMeter';
import { usePathname } from 'next/navigation';
import { getRoleRedirect } from '@/lib/auth';
import { isEnterpriseApproved } from '@/lib/enterpriseAccess';
import { supabase } from '@/lib/supabase';
import { isEmailApproved } from '@/app/dashboard/admin/mentoring/mentorshipAccess';
import { type PlanTier, type BillingStatus, canAccessFeature, getFeatureSlugFromPath } from '@/lib/subscription';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';

interface SubscriptionData {
    plan_tier: PlanTier;
    billing_status: BillingStatus;
    trial_end_date: string;
    ai_tokens_balance: number;
    ai_tokens_allotment: number;
    bonus_tokens: number;
}

/* ── Hoisted Components to avoid hydration issues ── */

function SidebarItem({ icon: Icon, label, href, badge }: any) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            title={label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
            <div className={`transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                {Icon ? <Icon size={20} aria-hidden="true" /> : <div className="w-5 h-5" />}
            </div>
            <span className="flex-1 text-left truncate">{label}</span>
            {badge && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {badge}
                </span>
            )}
        </Link>
    );
}

function LockedSidebarItem({ label, requiredPlan, originalHref }: { label: string; requiredPlan: string; originalHref?: string }) {
    const isEnterprise = requiredPlan.toLowerCase() === 'enterprise';
    const targetHref = isEnterprise ? (originalHref || "/dashboard/student/upgrade") : "/dashboard/student/upgrade";
    
    return (
        <Link
            href={targetHref}
            title={isEnterprise ? `Call Us to unlock ${label}` : `Upgrade to ${requiredPlan} to unlock ${label}`}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group font-semibold text-slate-400 hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
        >
            <div className="text-slate-300 group-hover:text-amber-500 transition-colors">
                <Lock size={20} aria-hidden="true" />
            </div>
            <span className="flex-1 text-left truncate">{label}</span>
            <span className="text-[8px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider opacity-70 group-hover:opacity-100">
                {isEnterprise ? 'CALL US' : requiredPlan}
            </span>
        </Link>
    );
}

function LockedFeatureView({ featureSlug, requiredPlan, currentPlan }: { featureSlug: string; requiredPlan: PlanTier; currentPlan: PlanTier }) {
    const isEnterprise = requiredPlan === 'enterprise';
    
    // Map feature slug back to user-friendly name
    const slugToName: Record<string, string> = {
        'lms-notes': 'LMS Notes',
        'notes-creator': 'Notes Creator',
        'mentorship-ms': 'Mentorship Management System',
        'elective-ms': 'Elective Management System',
        'ai-mentor': 'AI Mentor',
        'viva-simulator': 'Viva Simulator',
        'vocabulary': 'Vocabulary',
        'reflection-generator': 'Reflection Generator',
        'essay-qs-generator': 'Essay Questions Generator',
        'mcqs-generator': 'MCQs Generator',
        'self-evaluation': 'Self-Evaluation System',
        'lesson-plan': 'Lesson Plan Generator',
        'rubrics-generator': 'Rubrics Generator',
        'dig-eval-assist': 'Digital Evaluation Assistant',
        'classroom-generator': 'Classroom Generator',
        'timetable-ms': 'Timetable Management System',
        'attendance-ms': 'Attendance Management System',
        'q-paper-dev': 'Question Paper Developer',
        'ems-essay': 'EMS Essay Evaluator',
        'emr-mcqs': 'EMS MCQs Evaluator',
        'mentoring-ms': 'Mentoring Management System',
        'logbook-ms': 'LogBook Management System',
    };
    
    const featureName = slugToName[featureSlug] || 'Premium Feature';

    const planBenefits: Record<string, string[]> = {
        basic: [
            'LMS Notes access',
            'Notes Creator suite',
            '50,000 AI tokens/month',
        ],
        standard: [
            'Everything in Basic',
            'AI Mentor & Viva Simulator access',
            'Vocabulary & Reflection Generators',
            'Essay & MCQs Generators',
            'Self-Evaluation System',
            'Full Teaching suite (Lesson Plans, Rubrics, Digital Eval)',
            '10,000 AI tokens/month',
        ],
        premium: [
            'Everything in Standard',
            'Classroom Generator',
            'Timetable & Attendance management',
            'Question Paper Developer',
            'EMS Essay & MCQ evaluators',
            '300,000 AI tokens/month',
        ],
        enterprise: [
            'Mentoring Management System',
            'Elective Management System',
            'Log Book Management',
            'Custom token allocation',
            'Dedicated 24/7 priority support',
        ],
    };

    const benefits = planBenefits[requiredPlan] || [];

    return (
        <div className="flex items-center justify-center p-4 min-h-[70vh] w-full">
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100 overflow-hidden relative p-8 sm:p-10">
                {/* Accent top bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600" />
                
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl flex items-center justify-center shadow-inner border border-slate-100">
                            <Lock className="w-8 h-8 text-slate-400 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Crown className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
                    {featureName} is Locked
                </h3>
                <p className="text-sm text-slate-500 text-center mb-8 max-w-sm mx-auto">
                    {isEnterprise
                        ? 'Your Institution has not subscribed to these features from MedEduAI, ask them to contact us'
                        : `Upgrade to the ${requiredPlan.toUpperCase()} tier to unlock this advanced module and boost your workflow.`
                    }
                </p>

                <div className="bg-gradient-to-br from-slate-50 to-amber-50/20 border border-slate-200/80 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-slate-900 capitalize">{requiredPlan} Plan Benefits</span>
                        </div>
                        {isEnterprise ? (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50 font-sans">CALL US</span>
                        ) : (
                            <div className="text-right">
                                <span className="text-xl font-extrabold text-slate-900">₹{requiredPlan === 'basic' ? '200' : requiredPlan === 'standard' ? '500' : '1000'}</span>
                                <span className="text-xs text-slate-500 font-medium">/mo</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {benefits.map((benefit, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-slate-600 font-medium leading-normal">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {isEnterprise ? (
                        <div className="space-y-3">
                            <a
                                href="mailto:sales@mededuai.com?subject=Institution%20Enterprise%20Subscription%20Inquiry"
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
                            >
                                Contact Sales (Call Us)
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <div className="text-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    If your Institution Admin has already approved your access, make sure you are logged in with the registered email.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/dashboard/student/upgrade"
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
                        >
                            Upgrade to {requiredPlan.toUpperCase()}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}

                    <p className="text-xs text-slate-400 text-center font-medium">
                        You are currently on the <span className="font-bold text-slate-600 capitalize">{currentPlan === 'free' ? 'Free Package' : currentPlan}</span> plan.
                        {currentPlan === 'free' && ' Core modules available if subscribed by your institution.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayoutClient({ children, role, handleLogout }: any) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [hasControlPanelSession, setHasControlPanelSession] = useState(false);
    const [hasMentorshipAccess, setHasMentorshipAccess] = useState(false);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [subscriptionLoading, setSubscriptionLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const hasFetched = useRef(false);
    const pathname = usePathname();

    // Check if user has a Control Panel session
    useEffect(() => {
        setMounted(true);
        try {
            const cpAuth = sessionStorage.getItem('cp_auth');
            if (cpAuth) setHasControlPanelSession(true);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    if (user.email) setUserEmail(user.email);
                    const { data } = await supabase
                        .from('users')
                        .select('full_name, role')
                        .eq('id', user.id)
                        .single();

                    if (data) {
                        if (data.full_name) {
                            setUserName(data.full_name);
                        }
                        
                        // Check for role mismatch and perform dynamic synchronization
                        if (data.role) {
                            const dbRoleRaw = (data.role || '').toLowerCase().replace(/[_\s]+/g, '');
                            const map: Record<string, string> = {
                                superadmin:       'superadmin',
                                admin:            'superadmin',
                                administrator:    'superadmin',
                                masteradmin:      'masteradmin',
                                institutionadmin: 'instadmin',
                                instadmin:        'instadmin',
                                departmentadmin:  'deptadmin',
                                deptadmin:        'deptadmin',
                                teacher:          'teacher',
                                student:          'student',
                            };
                            const mappedDbRole = map[dbRoleRaw] || 'student';

                            // Sync user to Zustand store for token verification in frontend tools
                            const userStore = useUserStore.getState();
                            userStore.setUsers([{
                                id: user.id,
                                role: mappedDbRole as any,
                                name: data.full_name || user.user_metadata?.full_name || 'User',
                                email: user.email || '',
                                password: '',
                                createdAt: new Date().toISOString()
                            }]);
                            
                            if (mappedDbRole !== role) {
                                console.log(`[DashboardLayoutClient] Role mismatch detected. Cookie: ${role}, DB: ${mappedDbRole}. Synchronizing...`);
                                try {
                                    const syncRes = await fetch('/api/auth/set-role', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    if (syncRes.ok) {
                                        const syncData = await syncRes.json();
                                        if (syncData.role && syncData.role !== role) {
                                            console.log(`[DashboardLayoutClient] Cookie successfully updated to ${syncData.role}. Reloading session...`);
                                            window.location.reload();
                                            return;
                                        }
                                    }
                                } catch (syncErr) {
                                    console.error('[DashboardLayoutClient] Failed to synchronize role cookie:', syncErr);
                                }
                            }
                        }
                    } else if (user.user_metadata?.full_name) {
                        setUserName(user.user_metadata.full_name);
                    }

                    // Fetch subscription
                    try {
                        const res = await fetch(`/api/subscription?userId=${user.id}`);
                        if (res.ok) {
                            const sub = await res.json();
                            setSubscription({
                                plan_tier: sub.plan_tier || 'free',
                                billing_status: sub.billing_status || 'trialing',
                                trial_end_date: sub.trial_end_date || new Date().toISOString(),
                                ai_tokens_balance: sub.ai_tokens_balance ?? 10000,
                                ai_tokens_allotment: sub.ai_tokens_allotment ?? 10000,
                                bonus_tokens: sub.bonus_tokens ?? 0,
                            });
                            
                            // Sync backend balance to local tokenStore
                            const balance = sub.ai_tokens_balance ?? 10000;
                            const state = useTokenStore.getState();
                            let w = state.getWallet(user.id);
                            if (!w) {
                                state.createWallet(user.id, { totalTokens: balance });
                            } else {
                                state.updateWallet(user.id, { totalTokens: balance });
                            }
                        } else {
                            throw new Error('Subscription fetch failed');
                        }
                    } catch {
                        // Fallback — show free package state
                        setSubscription({
                            plan_tier: 'free',
                            billing_status: 'active',
                            trial_end_date: new Date().toISOString(),
                            ai_tokens_balance: 0,
                            ai_tokens_allotment: 0,
                            bonus_tokens: 0,
                        });
                    }
                }
            } catch {
                // Auth error — set fallback subscription silently
                setSubscription({
                    plan_tier: 'free',
                    billing_status: 'active',
                    trial_end_date: new Date().toISOString(),
                    ai_tokens_balance: 0,
                    ai_tokens_allotment: 0,
                    bonus_tokens: 0,
                });
            } finally {
                setSubscriptionLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Check mentorship access whenever email loads or pathname changes (re-check after admin updates)
    // Check if the user's email has explicit enterprise approval from Super Admin
    const [hasEnterpriseAccess, setHasEnterpriseAccess] = useState(false);

    useEffect(() => {
        if (userEmail) {
            setHasMentorshipAccess(isEmailApproved(userEmail));
            setHasEnterpriseAccess(isEnterpriseApproved(userEmail));
        }
    }, [userEmail]);

    // Subscription-based feature gating
    const basePlanTier = subscription?.plan_tier || 'free';
    const billingStatus = subscription?.billing_status || 'trialing';
    const trialEndDate = subscription?.trial_end_date || '2000-01-01T00:00:00.000Z'; // Stable fallback for hydration

    // Calculate effective plan tier (immediately downgrade to free if trial expired, even if cron hasn't run)
    const isExpiredTrial = billingStatus === 'trialing' && new Date(trialEndDate) < new Date();
    const isExpiredSub = billingStatus === 'expired';
    const planTier = (isExpiredTrial || isExpiredSub) ? 'free' : basePlanTier;

    // Helper to check if a feature is accessible
    const isFeatureAccessible = (featureSlug: string): boolean => {
        // Master/Super Admins always have full access
        if (role === 'masteradmin' || role === 'superadmin') return true;

        // 1. Enterprise/Mentorship features logic
        if (['mentorship-ms', 'mentoring-ms', 'elective-ms', 'logbook-ms'].includes(featureSlug)) {
            // Enterprise Tier does NOT automatically grant access anymore.
            // Access is strictly granted ONLY through Super Admin Explicit Approval (hasEnterpriseAccess)
            // or Department Admin explicitly adding them to the mentorship group (hasMentorshipAccess).
            if (hasEnterpriseAccess) return true; 
            if (hasMentorshipAccess) return true; 
            return false;
        }

        const { allowed } = canAccessFeature(featureSlug, planTier, billingStatus, trialEndDate, userEmail);
        return allowed;
    };

    const isPaidPlan = planTier !== 'free';

    const isStudent = role === 'student' || role === 'masteradmin' || role === 'superadmin';
    const isTeacher = role === 'teacher' || role === 'masteradmin' || role === 'superadmin';
    const isDeptAdmin = role === 'deptadmin' || role === 'masteradmin' || role === 'superadmin';
    const isInstAdmin = role === 'instadmin' || role === 'masteradmin' || role === 'superadmin';
    const isMasterOrSuperAdmin = role === 'masteradmin' || role === 'superadmin';
    const showControlPanelButton = role === 'superadmin' || role === 'masteradmin';
    const isSuperAdmin = role === 'superadmin';

    const getDashboardTitle = (roleName: string) => {
        switch (roleName) {
            case 'student': return 'Learning Dashboard';
            case 'teacher': return 'Teaching Dashboard';
            case 'deptadmin': return 'Department Admin Dashboard';
            case 'instadmin': return 'Institution Admin Dashboard';
            case 'masteradmin': return 'Master Admin Dashboard';
            case 'superadmin': return 'Super Admin Dashboard';
            default: return 'Dashboard';
        }
    };
    const dashboardTitle = getDashboardTitle(role);

    const getRoleDisplayLabel = (roleName: string) => {
        switch (roleName) {
            case 'student': return 'Student';
            case 'teacher': return 'Teacher';
            case 'deptadmin': return 'Department Head';
            case 'instadmin': return 'Institution Head';
            case 'masteradmin': return 'Master Admin';
            case 'superadmin': return 'Super Admin';
            default: return roleName;
        }
    };
    const roleDisplayLabel = getRoleDisplayLabel(role);

    const getPlanBadgeColor = (tier: PlanTier) => {
        switch (tier) {
            case 'premium': return 'bg-emerald-100 text-emerald-600';
            case 'standard': return 'bg-emerald-100 text-emerald-600';
            case 'basic': return 'bg-blue-100 text-blue-600';
            case 'enterprise': return 'bg-amber-100 text-amber-600';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    // close sidebar on navigation
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden w-full">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 sm:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`fixed sm:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-3">
                        <MededuLogo size={40} className="shadow-md shadow-emerald-600/15" />
                        <span className="font-bold text-xl text-slate-900 tracking-tight">MedEduAI</span>
                    </Link>
                    <button
                        className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto w-full">
                    {/* User Profile in Sidebar */}
                    <div className="mb-6 px-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="text-sm font-bold text-slate-900 leading-tight mb-1.5 truncate" title={userName}>
                            {mounted ? (userName || <span className="text-slate-400 font-normal italic text-xs">Loading...</span>) : <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />}
                        </div>
                        <div className="text-xs text-slate-500 font-medium leading-tight mb-2 truncate" title={userEmail}>
                            {mounted ? (userEmail || <span className="text-slate-300">—</span>) : <div className="h-3 w-32 bg-slate-200 animate-pulse rounded inline-block" />}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none">{roleDisplayLabel}</p>
                            {mounted && <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none ${getPlanBadgeColor(planTier)}`}>{planTier}</span>}
                        </div>
                    </div>

                    {showControlPanelButton && (
                        <Link
                            href="/contrl-panl"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 mb-3"
                        >
                            <ArrowLeft size={20} aria-hidden="true" />
                            <span className="flex-1 text-left truncate">Back to Control Panel</span>
                        </Link>
                    )}
                    <SidebarItem href="/" icon={Home} label="Home Page" />

                    {/* Trial Countdown / Token Meter — stable skeleton while loading to prevent flicker */}
                    {subscriptionLoading ? (
                        <div className="mx-3 mt-2 p-3 rounded-xl border border-slate-100 bg-slate-50 animate-pulse">
                            <div className="h-2.5 bg-slate-200 rounded-full w-2/3 mb-2" />
                            <div className="h-2 bg-slate-200 rounded-full w-full mb-1.5" />
                            <div className="h-2 bg-slate-200 rounded-full w-4/5" />
                        </div>
                    ) : (
                        <>
                            {/* Trial Countdown */}
                            {subscription && (
                                <TrialCountdown 
                                    trialEndDate={subscription.trial_end_date} 
                                    billingStatus={subscription.billing_status} 
                                    planTier={subscription.plan_tier} 
                                />
                            )}

                            {/* Token Usage Meter — show unlimited badge for admins */}
                            {subscription && isMasterOrSuperAdmin ? (
                                <div className="mx-3 mt-2 p-3 rounded-xl border bg-gradient-to-br from-slate-50 to-emerald-50 border-emerald-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">AI Tokens</span>
                                    </div>
                                    <div className="text-lg font-extrabold text-emerald-700">∞ Unlimited</div>
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">Admin access — no token limits</div>
                                </div>
                            ) : subscription && (
                                <TokenUsageMeter
                                    balance={planTier === 'free' ? 0 : subscription.ai_tokens_balance}
                                    allotment={planTier === 'free' ? 0 : subscription.ai_tokens_allotment}
                                    bonusTokens={subscription.bonus_tokens}
                                    planTier={planTier}
                                />
                            )}
                        </>
                    )}

                    {isStudent && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learning</p>
                            </div>
                            <SidebarItem href={`/dashboard/student`} icon={LayoutDashboard} label="Learning Dashboard" />
                            {isFeatureAccessible('lms-notes') ? (
                                <SidebarItem href={`/dashboard/student/notes`} icon={BookOpen} label="LMS Notes" />
                            ) : (
                                <LockedSidebarItem label="LMS Notes" requiredPlan="Basic" />
                            )}
                            {isFeatureAccessible('notes-creator') ? (
                                <SidebarItem href={`/dashboard/student/notes-creator`} icon={FileEdit} label="Notes Creator" />
                            ) : (
                                <LockedSidebarItem label="Notes Creator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('mentorship-ms') ? (
                                <SidebarItem href={`/dashboard/student/mentorship`} icon={UserCheck} label="Mentorship MS" />
                            ) : (
                                <LockedSidebarItem label="Mentorship MS" requiredPlan="Enterprise" originalHref={`/dashboard/student/mentorship`} />
                            )}
                            {isFeatureAccessible('elective-ms') ? (
                                <SidebarItem href={`/dashboard/student/elective`} icon={BookOpen} label="Elective MS" />
                            ) : (
                                <LockedSidebarItem label="Elective MS" requiredPlan="Enterprise" originalHref={`/dashboard/student/elective`} />
                            )}
                            {isFeatureAccessible('logbook-ms') ? (
                                <SidebarItem href={`/dashboard/student/logbook`} icon={ClipboardList} label="Logbook MS" />
                            ) : (
                                <LockedSidebarItem label="Logbook MS" requiredPlan="Enterprise" originalHref={`/dashboard/student/logbook`} />
                            )}

                            {/* Standard+ features — shown with lock if not accessible */}
                            {isFeatureAccessible('ai-mentor') ? (
                                <SidebarItem href={`/dashboard/student/mentor`} icon={MessageSquare} label="AI Mentor" />
                            ) : (
                                <LockedSidebarItem label="AI Mentor" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('viva-simulator') ? (
                                <SidebarItem href={`/dashboard/student/viva`} icon={Mic} label="Viva Simulator" />
                            ) : (
                                <LockedSidebarItem label="Viva Simulator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('vocabulary') ? (
                                <SidebarItem href={`/dashboard/student/vocab`} icon={GraduationCap} label="Vocabulary" />
                            ) : (
                                <LockedSidebarItem label="Vocabulary" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('reflection-generator') ? (
                                <SidebarItem href={`/dashboard/student/reflection`} icon={FileText} label="Reflection Generator" />
                            ) : (
                                <LockedSidebarItem label="Reflection Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('essay-qs-generator') ? (
                                <SidebarItem href={`/dashboard/student/essays`} icon={ClipboardType} label="Essay Qs Generator" />
                            ) : (
                                <LockedSidebarItem label="Essay Qs Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('mcqs-generator') ? (
                                <SidebarItem href={`/dashboard/student/mcqs`} icon={ClipboardCheck} label="MCQs Generator" />
                            ) : (
                                <LockedSidebarItem label="MCQs Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('self-evaluation') ? (
                                <SidebarItem href={`/dashboard/student/self-eval-system`} icon={ClipboardList} label="Self-Evaluation" />
                            ) : (
                                <LockedSidebarItem label="Self-Evaluation" requiredPlan="Standard" />
                            )}

                        </>
                    )}

                    {isTeacher && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teaching</p>
                            </div>
                            <SidebarItem href={`/dashboard/teacher`} icon={LayoutDashboard} label="Teaching Dashboard" />
                            {isFeatureAccessible('lms-notes') ? (
                                <SidebarItem href={`/dashboard/teacher/notes`} icon={BookOpen} label="LMS Notes" />
                            ) : (
                                <LockedSidebarItem label="LMS Notes" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('notes-creator') ? (
                                <SidebarItem href={`/dashboard/teacher/notes-creator`} icon={FileEdit} label="Notes Creator" />
                            ) : (
                                <LockedSidebarItem label="Notes Creator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('mentorship-ms') ? (
                                <SidebarItem href={`/dashboard/teacher/mentorship`} icon={UserCheck} label="Mentorship MS" />
                            ) : (
                                <LockedSidebarItem label="Mentorship MS" requiredPlan="Enterprise" originalHref={`/dashboard/teacher/mentorship`} />
                            )}
                            {isFeatureAccessible('elective-ms') ? (
                                <SidebarItem href={`/dashboard/teacher/elective`} icon={BookOpen} label="Elective MS" />
                            ) : (
                                <LockedSidebarItem label="Elective MS" requiredPlan="Enterprise" originalHref={`/dashboard/teacher/elective`} />
                            )}
                            {isFeatureAccessible('logbook-ms') ? (
                                <SidebarItem href={`/dashboard/teacher/logbook`} icon={ClipboardList} label="Logbook MS" />
                            ) : (
                                <LockedSidebarItem label="Logbook MS" requiredPlan="Enterprise" originalHref={`/dashboard/teacher/logbook`} />
                            )}
                            {isFeatureAccessible('lesson-plan') ? (
                                <SidebarItem href={`/dashboard/teacher/lesson-plan`} icon={FileText} label="Lesson Plan" />
                            ) : (
                                <LockedSidebarItem label="Lesson Plan" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('rubrics-generator') ? (
                                <SidebarItem href={`/dashboard/teacher/rubrics-generator`} icon={ClipboardList} label="Rubrics Generator" />
                            ) : (
                                <LockedSidebarItem label="Rubrics Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('assignments') ? (
                                <SidebarItem href={`/dashboard/teacher/assignments`} icon={ClipboardType} label="Assignments" />
                            ) : (
                                <LockedSidebarItem label="Assignments" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('essay-qs-generator') ? (
                                <SidebarItem href={`/dashboard/teacher/essays`} icon={ClipboardType} label="Essay Qs Generator" />
                            ) : (
                                <LockedSidebarItem label="Essay Qs Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('mcqs-generator') ? (
                                <SidebarItem href={`/dashboard/teacher/mcqs`} icon={ClipboardCheck} label="MCQs Generator" />
                            ) : (
                                <LockedSidebarItem label="MCQs Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('dig-eval-assist') ? (
                                <SidebarItem href={`/dashboard/teacher/dig-eval-assist`} icon={ScanLine} label="Dig Evaluation Assist" />
                            ) : (
                                <LockedSidebarItem label="Dig Evaluation Assist" requiredPlan="Standard" />
                            )}
                        </>
                    )}

                    {isDeptAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/deptadmin`} icon={LayoutDashboard} label="Department Admin Dashboard" />
                            {isFeatureAccessible('lms-notes') ? (
                                <SidebarItem href={`/dashboard/admin/notes`} icon={BookOpen} label="LMS Notes" />
                            ) : (
                                <LockedSidebarItem label="LMS Notes" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('notes-creator') ? (
                                <SidebarItem href={`/dashboard/admin/notes-creator`} icon={FileEdit} label="Notes Creator" />
                            ) : (
                                <LockedSidebarItem label="Notes Creator" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('mentorship-ms') ? (
                                <SidebarItem href={`/dashboard/admin/mentorship`} icon={Users} label="Mentorship MS" />
                            ) : (
                                <LockedSidebarItem label="Mentorship MS" requiredPlan="Enterprise" />
                            )}
                            {isFeatureAccessible('elective-ms') ? (
                                <SidebarItem href={`/dashboard/admin/dept-elective`} icon={BookOpen} label="Elective MS" />
                            ) : (
                                <LockedSidebarItem label="Elective MS" requiredPlan="Enterprise" />
                            )}
                            {isFeatureAccessible('logbook-ms') ? (
                                <SidebarItem href={`/dashboard/admin/logbook`} icon={ClipboardList} label="Logbook MS" />
                            ) : (
                                <LockedSidebarItem label="Logbook MS" requiredPlan="Enterprise" />
                            )}
                            {isFeatureAccessible('lesson-plan') ? (
                                <SidebarItem href={`/dashboard/admin/lesson-plan`} icon={FileText} label="Lesson Plan" />
                            ) : (
                                <LockedSidebarItem label="Lesson Plan" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('rubrics-generator') ? (
                                <SidebarItem href={`/dashboard/admin/rubrics-generator`} icon={ClipboardList} label="Rubrics Generator" />
                            ) : (
                                <LockedSidebarItem label="Rubrics Generator" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('assignments') ? (
                                <SidebarItem href={`/dashboard/admin/assignments`} icon={ClipboardType} label="Assignments" />
                            ) : (
                                <LockedSidebarItem label="Assignments" requiredPlan="Standard" />
                            )}
                            {isFeatureAccessible('classroom-generator') ? (
                                <SidebarItem href={`/dashboard/admin/classroom-generator`} icon={GraduationCap} label="Classroom Generator" />
                            ) : (
                                <LockedSidebarItem label="Classroom Generator" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('timetable-ms') ? (
                                <SidebarItem href={`/dashboard/admin/timetable`} icon={CalendarDays} label="Time Table MS" />
                            ) : (
                                <LockedSidebarItem label="Time Table MS" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('attendance-ms') ? (
                                <SidebarItem href={`/dashboard/admin/attendance`} icon={Users} label="Attendance MS" />
                            ) : (
                                <LockedSidebarItem label="Attendance MS" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('q-paper-dev') ? (
                                <SidebarItem href={`/dashboard/admin/q-paper`} icon={AlertCircle} label="Q-Paper Dev" />
                            ) : (
                                <LockedSidebarItem label="Q-Paper Dev" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('ems-essay') ? (
                                <SidebarItem href={`/dashboard/admin/ems`} icon={ClipboardCheck} label="EMS - Essay" />
                            ) : (
                                <LockedSidebarItem label="EMS - Essay" requiredPlan="Premium" />
                            )}
                            {isFeatureAccessible('emr-mcqs') ? (
                                <SidebarItem href={`/dashboard/admin/emr-mcq`} icon={ClipboardType} label="EMR - MCQs" />
                            ) : (
                                <LockedSidebarItem label="EMR - MCQs" requiredPlan="Premium" />
                            )}
                        </>
                    )}

                    {isInstAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/instadmin`} icon={LayoutDashboard} label="Institution Admin Dashboard" />
                            {isFeatureAccessible('mentoring-ms') ? (
                                <SidebarItem href={`/dashboard/admin/mentoring`} icon={Users} label="Mentoring MS" />
                            ) : (
                                <LockedSidebarItem label="Mentoring MS" requiredPlan="Enterprise" originalHref={`/dashboard/admin/mentoring`} />
                            )}
                            {isFeatureAccessible('elective-ms') ? (
                                <SidebarItem href={`/dashboard/admin/elective`} icon={BookOpen} label="Elective MS" />
                            ) : (
                                <LockedSidebarItem label="Elective MS" requiredPlan="Enterprise" originalHref={`/dashboard/admin/elective`} />
                            )}
                            {isFeatureAccessible('logbook-ms') ? (
                                <SidebarItem href={`/dashboard/admin/logbook`} icon={ClipboardList} label="LogBook MS" />
                            ) : (
                                <LockedSidebarItem label="LogBook MS" requiredPlan="Enterprise" originalHref={`/dashboard/admin/logbook`} />
                            )}
                        </>
                    )}

                    {isMasterOrSuperAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 mt-2">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Master Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/masteradmin`} icon={LayoutDashboard} label="Master Admin Dashboard" />
                            <SidebarItem href={`/dashboard/admin/lms-db`} icon={BookOpen} label="LMS Database" />
                        </>
                    )}

                    {isSuperAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 mt-2">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Super Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/admin/creator`} icon={Settings} label="LMS Auto-Gen" />
                            <SidebarItem href={`/dashboard/admin/blog`} icon={FileText} label="Blog Publications" />
                            <SidebarItem href={`/dashboard/admin/users`} icon={Users} label="User Management" />
                            <SidebarItem href={`/dashboard/admin/tokens`} icon={Settings} label="Token Economy" />
                            <SidebarItem href={`/dashboard/admin/create-institution`} icon={Building2} label="Institution Onboarding" />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <form action={handleLogout} onSubmit={() => {
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
                        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';
                        const storageKey = `sb-${projectRef}-auth-token`;
                        try { 
                            localStorage.removeItem(storageKey); 
                            sessionStorage.removeItem('cp_auth'); 
                        } catch(_) {}
                    }}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                            <span className="font-bold">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full max-w-full">
                <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="sm:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-6 h-6" aria-hidden="true" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 capitalize hidden sm:block">{dashboardTitle}</h2>
                            <p className="text-sm text-slate-500 font-medium hidden sm:block">Platform running in {role} mode</p>
                        </div>
                        {showControlPanelButton && (
                            <Link
                                href="/contrl-panl"
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all font-bold text-sm"
                            >
                                <Shield className="w-4 h-4" aria-hidden="true" />
                                Control Panel
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-4 border-l border-slate-100 pl-4 sm:border-none sm:pl-0">
                        <div className="text-right hidden sm:flex sm:flex-col sm:justify-center">
                            <div className="text-sm font-bold text-slate-900 leading-tight mb-0.5">
                                {mounted ? (userName || <span className="text-slate-400 font-normal italic text-xs">Loading...</span>) : <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium leading-none mb-0.5">
                                {mounted ? (userEmail || <span className="text-slate-300">—</span>) : <div className="h-3 w-32 bg-slate-100 animate-pulse rounded inline-block" />}
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none">{roleDisplayLabel}</p>
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none ${getPlanBadgeColor(planTier)}`}>{planTier}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <Users className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 w-full">
                    <ErrorBoundary>
                        {(() => {
                            // Never gate content while subscription data is still loading —
                            // stale defaults (free/expired trial) would wrongly lock pages.
                            if (subscriptionLoading) return children;

                            const currentFeatureSlug = pathname ? getFeatureSlugFromPath(pathname) : null;
                            if (currentFeatureSlug !== null) {
                                const { allowed, requiredPlan } = canAccessFeature(currentFeatureSlug, planTier, billingStatus, trialEndDate, userEmail);
                                const isEnterpriseFeature = ['mentorship-ms', 'mentoring-ms', 'elective-ms', 'logbook-ms'].includes(currentFeatureSlug);
                                
                                // Super admin bypasses standard plan locks, EXCEPT for enterprise features which require explicit email approval for all users
                                const shouldBlock = !allowed && requiredPlan && (!isMasterOrSuperAdmin || isEnterpriseFeature);

                                if (shouldBlock) {
                                    return (
                                        <LockedFeatureView
                                            featureSlug={currentFeatureSlug}
                                            requiredPlan={requiredPlan}
                                            currentPlan={planTier}
                                        />
                                    );
                                }
                            }
                            return children;
                        })()}
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
}

