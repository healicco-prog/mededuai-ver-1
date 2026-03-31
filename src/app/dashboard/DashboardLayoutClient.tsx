"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, BookOpen, MessageSquare, Mic,
    Settings, LogOut, Users, FileText, BrainCircuit,
    GraduationCap, ClipboardCheck, AlertCircle, Home, ClipboardList, Menu, X, ClipboardType, CalendarDays, Lock, ArrowLeft, Shield, FileEdit
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isEmailApproved } from '@/app/dashboard/admin/mentoring/mentorshipAccess';

export default function DashboardLayoutClient({ children, role, handleLogout }: any) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPlan, setUserPlan] = useState<string>('basic');
    const [hasControlPanelSession, setHasControlPanelSession] = useState(false);
    const [hasMentorshipAccess, setHasMentorshipAccess] = useState(false);
    const pathname = usePathname();

    // Check if user has a Control Panel session
    useEffect(() => {
        try {
            const cpAuth = sessionStorage.getItem('cp_auth');
            if (cpAuth) setHasControlPanelSession(true);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (user.email) setUserEmail(user.email);
                const { data } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();
                    
                if (data && data.full_name) {
                    setUserName(data.full_name);
                } else if (user.user_metadata?.full_name) {
                    setUserName(user.user_metadata.full_name);
                }

                // Fetch user plan from usage_limits
                const { data: planData } = await supabase
                    .from('usage_limits')
                    .select('plan_type')
                    .eq('user_id', user.id)
                    .single();
                
                if (planData?.plan_type) {
                    setUserPlan(planData.plan_type);
                }
            }
        };
        fetchUser();
    }, []);

    // Check mentorship access whenever email loads or pathname changes (re-check after admin updates)
    useEffect(() => {
        if (userEmail) {
            setHasMentorshipAccess(isEmailApproved(userEmail));
        }
    }, [userEmail, pathname]);

    // Plan-based feature gating: Basic plan only gets LMS Notes + Mentorship MS
    const isPremiumPlan = userPlan === 'premium' || userPlan === 'pro' || userPlan === 'enterprise';
    // Admins and teachers always have premium-level sidebar access
    const hasFullFeatureAccess = isPremiumPlan || role !== 'student';

    const isStudent = role === 'student' || role === 'masteradmin' || role === 'superadmin';
    const isTeacher = role === 'teacher' || role === 'masteradmin' || role === 'superadmin';
    const isDeptAdmin = role === 'deptadmin' || role === 'masteradmin' || role === 'superadmin';
    const isInstAdmin = role === 'instadmin' || role === 'masteradmin' || role === 'superadmin';
    const isMasterOrSuperAdmin = role === 'masteradmin' || role === 'superadmin';
    const showControlPanelButton = isMasterOrSuperAdmin || hasControlPanelSession;
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

    // close sidebar on navigation
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden w-full">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="text-white w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">MedEduAI</span>
                    </Link>
                    <button
                        className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto w-full">
                    {showControlPanelButton && (
                        <Link
                            href="/contrl-panl"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 mb-3"
                        >
                            <ArrowLeft size={20} />
                            <span className="flex-1 text-left truncate">Back to Control Panel</span>
                        </Link>
                    )}
                    <SidebarItem href="/" icon={<Home />} label="Home Page" />

                    {isStudent && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learning</p>
                            </div>
                            <SidebarItem href={`/dashboard/student`} icon={<LayoutDashboard />} label="Learning Dashboard" />
                            <SidebarItem href={`/dashboard/student/notes`} icon={<BookOpen />} label="LMS Notes" />
                            <SidebarItem href={`/dashboard/student/notes-creator`} icon={<FileEdit />} label="Notes Creator" />
                            {(hasMentorshipAccess || isMasterOrSuperAdmin) && (
                                <SidebarItem href={`/dashboard/student/mentorship`} icon={<Users />} label="Mentorship MS" />
                            )}
                            <SidebarItem href={`/dashboard/student/elective`} icon={<BookOpen />} label="Elective MS" />
                            {hasFullFeatureAccess ? (
                                <>
                                    <SidebarItem href={`/dashboard/student/mentor`} icon={<MessageSquare />} label="AI Mentor" badge="Standard" />
                                    <SidebarItem href={`/dashboard/student/viva`} icon={<Mic />} label="Viva Simulator" />
                                    <SidebarItem href={`/dashboard/student/vocab`} icon={<GraduationCap />} label="Vocabulary" />
                                    <SidebarItem href={`/dashboard/student/reflection`} icon={<FileText />} label="Reflection Generator" />
                                    <SidebarItem href={`/dashboard/student/essays`} icon={<ClipboardType />} label="Essay Qs Generator" />
                                    <SidebarItem href={`/dashboard/student/mcqs`} icon={<ClipboardCheck />} label="MCQs Generator" />
                                </>
                            ) : (
                                <a href="https://pages.razorpay.com/medieduai-standard" target="_blank" rel="noopener noreferrer" className="block mt-3 mx-3 p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Lock className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Basic Plan</span>
                                    </div>
                                    <p className="text-[11px] text-amber-600 leading-snug mb-2">Upgrade to MediEduAI Standard to unlock AI Mentor, Viva Simulator, Vocabulary, and more.</p>
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-1 rounded inline-block">Upgrade via Razorpay →</span>
                                </a>
                            )}
                        </>
                    )}

                    {isTeacher && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teaching</p>
                            </div>
                            <SidebarItem href={`/dashboard/teacher`} icon={<LayoutDashboard />} label="Teaching Dashboard" />
                            <SidebarItem href={`/dashboard/teacher/notes`} icon={<BookOpen />} label="LMS Notes" />
                            <SidebarItem href={`/dashboard/teacher/notes-creator`} icon={<FileEdit />} label="Notes Creator" />
                            {(hasMentorshipAccess || isMasterOrSuperAdmin) && (
                                <SidebarItem href={`/dashboard/teacher/mentorship`} icon={<Users />} label="Mentorship MS" />
                            )}
                            <SidebarItem href={`/dashboard/teacher/elective`} icon={<BookOpen />} label="Elective MS" />
                            <SidebarItem href={`/dashboard/teacher/lesson-plan`} icon={<FileText />} label="Lesson Plan" />
                            <SidebarItem href={`/dashboard/teacher/rubrics-generator`} icon={<ClipboardList />} label="Rubrics Generator" />
                            <SidebarItem href={`/dashboard/teacher/essays`} icon={<ClipboardType />} label="Essay Qs Generator" />
                            <SidebarItem href={`/dashboard/teacher/mcqs`} icon={<ClipboardCheck />} label="MCQs Generator" />
                        </>
                    )}

                    {isDeptAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/deptadmin`} icon={<LayoutDashboard />} label="Department Admin Dashboard" />
                            <SidebarItem href={`/dashboard/admin/notes`} icon={<BookOpen />} label="LMS Notes" />
                            <SidebarItem href={`/dashboard/admin/notes-creator`} icon={<FileEdit />} label="Notes Creator" />
                            {(hasMentorshipAccess || isMasterOrSuperAdmin) && (
                                <SidebarItem href={`/dashboard/admin/mentorship`} icon={<Users />} label="Mentorship MS" />
                            )}
                            <SidebarItem href={`/dashboard/admin/dept-elective`} icon={<BookOpen />} label="Elective MS" />
                            <SidebarItem href={`/dashboard/admin/lesson-plan`} icon={<FileText />} label="Lesson Plan" />
                            <SidebarItem href={`/dashboard/admin/rubrics-generator`} icon={<ClipboardList />} label="Rubrics Generator" />
                            <SidebarItem href={`/dashboard/admin/classroom-generator`} icon={<GraduationCap />} label="Classroom Generator" />
                            <SidebarItem href={`/dashboard/admin/timetable`} icon={<CalendarDays />} label="Time Table MS" />
                            <SidebarItem href={`/dashboard/admin/attendance`} icon={<Users />} label="Attendance MS" />
                            <SidebarItem href={`/dashboard/admin/q-paper`} icon={<AlertCircle />} label="Q-Paper Dev" />
                            <SidebarItem href={`/dashboard/admin/ems`} icon={<ClipboardCheck />} label="EMS - Essay" />
                            <SidebarItem href={`/dashboard/admin/emr-mcq`} icon={<ClipboardType />} label="EMR - MCQs" />
                        </>
                    )}

                    {isInstAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 mt-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/instadmin`} icon={<LayoutDashboard />} label="Institution Admin Dashboard" />
                            <SidebarItem href={`/dashboard/admin/mentoring`} icon={<Users />} label="Mentoring MS" />
                            <SidebarItem href={`/dashboard/admin/elective`} icon={<BookOpen />} label="Elective MS" />
                            <SidebarItem href={`/dashboard/admin/logbook`} icon={<ClipboardList />} label="LogBook MS" />
                        </>
                    )}

                    {isMasterOrSuperAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 mt-2">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Master Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/masteradmin`} icon={<LayoutDashboard />} label="Master Admin Dashboard" />
                            <SidebarItem href={`/dashboard/admin/lms-db`} icon={<BookOpen />} label="LMS Database" />
                        </>
                    )}

                    {isSuperAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 mt-2">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Super Admin</p>
                            </div>
                            <SidebarItem href={`/dashboard/admin/creator`} icon={<Settings />} label="LMS Auto-Gen" />
                            <SidebarItem href={`/dashboard/admin/blog`} icon={<FileText />} label="Blog Publications" />
                            <SidebarItem href={`/dashboard/admin/users`} icon={<Users />} label="User Management" />
                            <SidebarItem href={`/dashboard/admin/tokens`} icon={<BrainCircuit />} label="Token Economy" />
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <form action={handleLogout}>
                        <button
                            type="submit"
                            suppressHydrationWarning
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold">Logout</span>
                        </button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full max-w-full">
                <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 capitalize hidden sm:block">{dashboardTitle}</h2>
                            <p className="text-sm text-slate-500 font-medium hidden sm:block">Platform running in {role} mode</p>
                        </div>
                        {showControlPanelButton && (
                            <Link
                                href="/contrl-panl"
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition-all font-bold text-sm"
                            >
                                <Shield className="w-4 h-4" />
                                Control Panel
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-4 border-l border-slate-100 pl-4 sm:border-none sm:pl-0">
                        <div className="text-right hidden sm:flex sm:flex-col sm:justify-center">
                            <p className="text-sm font-bold text-slate-900 capitalize leading-tight mb-0.5">{userName || `${roleDisplayLabel} User`}</p>
                            <div className="flex items-center gap-1.5 justify-end mb-0.5">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none">{roleDisplayLabel}</p>
                                <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none ${
                                    isPremiumPlan ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                                }`}>{userPlan}</span>
                            </div>
                            {userEmail && <p className="text-[10px] text-slate-400 font-medium leading-none">{userEmail}</p>}
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <Users className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, href, badge }: any) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            title={label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
            <div className={`transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                {React.cloneElement(icon, { size: 20 })}
            </div>
            <span className="flex-1 text-left truncate">{label}</span>
            {badge && (
                <span className="text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {badge}
                </span>
            )}
        </Link>
    );
}
