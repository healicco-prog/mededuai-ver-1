"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed Server Actions import to prevent Next.js cache 404s
import {
    BrainCircuit, LayoutDashboard, BookOpen, MessageSquare, Mic,
    Settings, Users, FileText, GraduationCap, ClipboardCheck,
    AlertCircle, ClipboardList, ClipboardType, CalendarDays,
    LogOut, Lock, Eye, EyeOff, Shield, ChevronRight, ExternalLink,
    Menu, X, Home, Activity, Cpu, BarChart3, Server, UserPlus, Clock,
    FilePenLine as FileEdit, PenTool, Building2
} from "lucide-react";
import MededuLogo from "@/components/MededuLogo";

/* ── role → sections mapping ── */
type SectionKey = "superadmin" | "masteradmin" | "instadmin" | "deptadmin" | "teaching" | "learning";

interface ModuleLink {
    label: string;
    href: string;
    icon: any;
    badge?: string;
}

interface Section {
    key: SectionKey;
    title: string;
    color: string;
    bgGradient: string;
    icon: any;
    modules: ModuleLink[];
}

const ALL_SECTIONS: Section[] = [
    {
        key: "superadmin",
        title: "Super Admin",
        color: "rose",
        bgGradient: "from-rose-600 to-rose-800",
        icon: Shield,
        modules: [
            { label: "Super Admin Dashboard", href: "/dashboard/superadmin", icon: LayoutDashboard },
            { label: "LMS Auto-Gen", href: "/dashboard/admin/creator", icon: Settings },
            { label: "Blog Publications", href: "/dashboard/admin/blog", icon: FileText },
            { label: "User Management", href: "/dashboard/admin/users", icon: Users },
            { label: "Token Economy", href: "/dashboard/admin/tokens", icon: BrainCircuit },
            { label: "Create Institution", href: "/dashboard/admin/create-institution", icon: Building2 },
        ],
    },
    {
        key: "masteradmin",
        title: "Master Admin",
        color: "purple",
        bgGradient: "from-emerald-600 to-emerald-800",
        icon: BrainCircuit,
        modules: [
            { label: "Master Admin Dashboard", href: "/dashboard/masteradmin", icon: LayoutDashboard },
            { label: "LMS Database", href: "/dashboard/admin/lms-db", icon: BookOpen },
        ],
    },
    {
        key: "instadmin",
        title: "Institution Admin",
        color: "amber",
        bgGradient: "from-amber-500 to-amber-700",
        icon: GraduationCap,
        modules: [
            { label: "Institution Admin Dashboard", href: "/dashboard/instadmin", icon: LayoutDashboard },
            { label: "Mentoring MS", href: "/dashboard/admin/mentoring", icon: Users },
            { label: "Elective MS", href: "/dashboard/admin/elective", icon: BookOpen },
            { label: "LogBook MS", href: "/dashboard/admin/logbook", icon: ClipboardList },
        ],
    },
    {
        key: "deptadmin",
        title: "Department Admin",
        color: "teal",
        bgGradient: "from-teal-600 to-teal-800",
        icon: ClipboardCheck,
        modules: [
            { label: "Dept Admin Dashboard", href: "/dashboard/deptadmin", icon: LayoutDashboard },
            { label: "LMS Notes", href: "/dashboard/admin/notes", icon: BookOpen },
            { label: "Notes Creator", href: "/dashboard/admin/notes-creator", icon: FileEdit },
            { label: "Mentorship MS", href: "/dashboard/admin/mentorship", icon: Users },
            { label: "Lesson Plan", href: "/dashboard/admin/lesson-plan", icon: FileText },
            { label: "Rubrics Generator", href: "/dashboard/admin/rubrics-generator", icon: ClipboardList },
            { label: "Classroom Generator", href: "/dashboard/admin/classroom-generator", icon: GraduationCap },
            { label: "Time Table MS", href: "/dashboard/admin/timetable", icon: CalendarDays },
            { label: "Attendance MS", href: "/dashboard/admin/attendance", icon: Users },
            { label: "Essay Answer Gen", href: "/dashboard/admin/essay-answer", icon: PenTool },
            { label: "Q-Paper Dev", href: "/dashboard/admin/q-paper", icon: AlertCircle },
            { label: "EMS - Essay", href: "/dashboard/admin/ems", icon: ClipboardCheck },
            { label: "EMR - MCQs", href: "/dashboard/admin/emr-mcq", icon: ClipboardType },
        ],
    },
    {
        key: "teaching",
        title: "Teaching",
        color: "blue",
        bgGradient: "from-blue-600 to-blue-800",
        icon: FileText,
        modules: [
            { label: "Teaching Dashboard", href: "/dashboard/teacher", icon: LayoutDashboard },
            { label: "LMS Notes", href: "/dashboard/teacher/notes", icon: BookOpen },
            { label: "Notes Creator", href: "/dashboard/teacher/notes-creator", icon: FileEdit },
            { label: "Mentorship MS", href: "/dashboard/teacher/mentorship", icon: Users },
            { label: "Lesson Plan", href: "/dashboard/teacher/lesson-plan", icon: FileText },
            { label: "Rubrics Generator", href: "/dashboard/teacher/rubrics-generator", icon: ClipboardList },
            { label: "Essay Qs Generator", href: "/dashboard/teacher/essays", icon: ClipboardType },
            { label: "Essay Answer Gen", href: "/dashboard/teacher/essay-answer", icon: PenTool },
            { label: "MCQs Generator", href: "/dashboard/teacher/mcqs", icon: ClipboardCheck },
        ],
    },
    {
        key: "learning",
        title: "Learning",
        color: "emerald",
        bgGradient: "from-emerald-600 to-emerald-800",
        icon: GraduationCap,
        modules: [
            { label: "Learning Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
            { label: "LMS Notes", href: "/dashboard/student/notes", icon: BookOpen },
            { label: "Notes Creator", href: "/dashboard/student/notes-creator", icon: FileEdit },
            { label: "Mentorship MS", href: "/dashboard/student/mentorship", icon: Users },
            { label: "AI Mentor", href: "/dashboard/student/mentor", icon: MessageSquare, badge: "Pro" },
            { label: "Viva Simulator", href: "/dashboard/student/viva", icon: Mic },
            { label: "Vocabulary", href: "/dashboard/student/vocab", icon: GraduationCap },
            { label: "Reflection Generator", href: "/dashboard/student/reflection", icon: FileText },
            { label: "Essay Qs Generator", href: "/dashboard/student/essays", icon: ClipboardType },
            { label: "Essay Answer Gen", href: "/dashboard/student/essay-answer", icon: PenTool },
            { label: "MCQs Generator", href: "/dashboard/student/mcqs", icon: ClipboardCheck },
        ],
    },
];

/* which sections each credential-role may see */
const ROLE_VISIBILITY: Record<string, SectionKey[]> = {
    superadmin: ["superadmin", "masteradmin", "instadmin", "deptadmin", "teaching", "learning"],
    admin: ["masteradmin", "instadmin", "deptadmin", "teaching", "learning"],
};

/* ═════════════════  Safe Icon Wrapper  ═════════════════ */
function SafeIcon({ icon: Icon, className }: { icon: any; className?: string }) {
    if (!Icon || typeof Icon !== 'function' && typeof Icon !== 'object') return <div className={className} />;
    return <Icon className={className} />;
}

/* ═════════════════  Sidebar Item Component  ═════════════════ */
function SidebarItem({ icon: Icon, label, href, badge }: { icon: any; label: string; href: string; badge?: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            title={label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
            <div className={`transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                {Icon ? <Icon className="w-5 h-5" aria-hidden="true" /> : <div className="w-5 h-5" />}
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

/* ═════════════════  COMPONENT  ═════════════════ */
export default function ControlPanelPage() {
    const ADMIN_ROLES = ['superadmin', 'masteradmin', 'instadmin', 'deptadmin'];
    const [authRole, setAuthRole] = useState<string | null>(null);
    const [authLabel, setAuthLabel] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSectionKey, setActiveSectionKey] = useState<SectionKey | null>(null);
    const [mounted, setMounted] = useState(false);

    const getLabel = (role: string): string => ({
        superadmin: 'Super Admin',
        masteradmin: 'Master Admin',
        instadmin: 'Institution Admin',
        deptadmin: 'Department Admin',
    } as Record<string,string>)[role] ?? role;

    /* On mount: if valid admin cookie AND cp_auth session exist, skip login form */
    useEffect(() => {
        setMounted(true);
        const match = document.cookie.match(/(^| )role=([^;]+)/);
        const hasCpAuth = sessionStorage.getItem('cp_auth') === 'true';
        if (hasCpAuth && match && match[2] && ADMIN_ROLES.includes(match[2])) {
            setAuthRole(match[2]);
            setAuthLabel(getLabel(match[2]));
        }
        // No cookie + cp_auth → stay on login form; do NOT redirect to /login
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            // AUTHORITATIVE AUTOFILL FALLBACK: Capture visual autofill values directly from DOM elements via FormData
            const formData = new FormData(e.currentTarget);
            const formEmail = (formData.get("email") as string || "").trim();
            const formPassword = formData.get("password") as string || "";
            
            const submitEmail = formEmail || email.trim();
            const submitPassword = formPassword || password;

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: submitEmail, password: submitPassword }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error || 'Login failed. Please check your credentials.');
                return;
            }
            // Use the role returned by the API — cookie may not be readable yet
            const grantedRole: string = data.role ?? '';
            if (!ADMIN_ROLES.includes(grantedRole)) {
                setError('Access denied. This panel requires administrator privileges.');
                document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
                return;
            }

            if (data.session) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
                const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'yrelfdwkjtaidtoulwrj';
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
                    // Also write to standard fallback key just in case
                    if (projectRef !== 'yrelfdwkjtaidtoulwrj') {
                        localStorage.setItem('sb-yrelfdwkjtaidtoulwrj-auth-token', JSON.stringify({
                            access_token: data.session.access_token,
                            refresh_token: data.session.refresh_token,
                            token_type: 'bearer',
                            expires_at: data.session.expires_at,
                            expires_in: data.session.expires_in,
                            user: data.session.user,
                        }));
                    }
                    sessionStorage.setItem('cp_auth', 'true');
                } catch (_) { }
            }

            setAuthRole(grantedRole);
            setAuthLabel(getLabel(grantedRole));
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? 'yrelfdwkjtaidtoulwrj';
        const storageKey = `sb-${projectRef}-auth-token`;
        try { 
            localStorage.removeItem(storageKey); 
            localStorage.removeItem('sb-yrelfdwkjtaidtoulwrj-auth-token'); 
            sessionStorage.removeItem('cp_auth'); 
        } catch(_) {}
        setAuthRole(null);
        setAuthLabel('');
        setEmail('');
        setPassword('');
    };

    /* ── LOGIN SCREEN ── */
    if (!authRole) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
                </div>
                <div className="relative w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-5">
                            <MededuLogo size={64} className="shadow-xl shadow-emerald-600/20" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Control Panel</h1>
                        <p className="text-slate-500 mt-2 text-sm">MedEduAI · Restricted Access</p>
                    </div>
                    <form onSubmit={handleLogin} autoComplete="off" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                                <Lock className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Administrator Sign In</h2>
                                <p className="text-xs text-slate-500">Enter your admin credentials to continue</p>
                            </div>
                        </div>
                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
                                <input
                                    id="cp-email-field"
                                    name="email"
                                    type="email"
                                    autoComplete="one-time-code"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
                                    placeholder="admin@mededuai.com"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
                                <div className="relative">
                                    <input
                                        id="cp-password-field"
                                        name="password"
                                        type={showPw ? 'text' : 'password'}
                                        autoComplete="one-time-code"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm pr-12"
                                        placeholder="••••••••••"
                                        suppressHydrationWarning
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" suppressHydrationWarning aria-label={showPw ? 'Hide password' : 'Show password'}>
                                        {showPw ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            id="cp-login-btn"
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full mt-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                            suppressHydrationWarning
                        >
                            {isLoggingIn ? (
                                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating…</>
                            ) : (
                                <><Shield className="w-5 h-5" /> Access Control Panel</>
                            )}
                        </button>
                    </form>
                    <p className="text-center text-slate-400 text-xs mt-8">© 2026 MedEduAI · All rights reserved</p>
                </div>
            </div>
        );
    }


/* ── DASHBOARD SCREEN (with sidebar like the main dashboard) ── */
    const visibleKeys = ROLE_VISIBILITY[authRole] ?? [];
    const sections = ALL_SECTIONS.filter((s) => visibleKeys.includes(s.key));
    const activeSection = sections.find(s => s.key === activeSectionKey);

    // Flatten all modules for the sidebar
    const sidebarSections = sections;

    // System logs are loaded from the real dashboard — no mock data in production
    const systemLogs: { icon: React.ReactNode; title: string; time: string; color: string }[] = [];

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden w-full">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── SIDEBAR ── */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-3">
                        <MededuLogo size={40} />
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
                    <SidebarItem href="/" icon={Home} label="Home Page" />

                    {sidebarSections.map((section) => (
                        <React.Fragment key={section.key}>
                            <div className="pt-4 pb-2 px-3">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                    section.key === 'superadmin' ? 'text-rose-500' :
                                    section.key === 'masteradmin' ? 'text-emerald-400' :
                                    section.key === 'instadmin' ? 'text-amber-500' :
                                    section.key === 'deptadmin' ? 'text-teal-500' :
                                    section.key === 'teaching' ? 'text-blue-500' :
                                    'text-emerald-500'
                                }`}>{section.title}</p>
                            </div>
                            {section.modules.map((mod) => (
                                <SidebarItem
                                    key={mod.href}
                                    href={mod.href}
                                    icon={mod.icon}
                                    label={mod.label}
                                    badge={mod.badge}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                        <span className="font-bold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full max-w-full">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-6 h-6" aria-hidden="true" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 capitalize hidden sm:block">
                                {authRole === 'superadmin' ? 'Super Admin Dashboard' : 'Master Admin Dashboard'}
                            </h2>
                            <p className="text-sm text-slate-500 font-medium hidden sm:block">Platform running in {authLabel} mode</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-l border-slate-100 pl-4 sm:border-none sm:pl-0">
                        <div className="text-right hidden sm:flex sm:flex-col sm:justify-center">
                            <div className="text-sm font-bold text-slate-900 capitalize leading-tight mb-0.5">
                                {mounted ? `${authLabel} User` : <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />}
                            </div>
                            <div className="flex items-center gap-1.5 justify-end mb-0.5">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none">{authLabel}</p>
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none bg-emerald-100 text-emerald-600">PREMIUM</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <Users className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 w-full">
                    {/* Overview Title */}
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">
                        {authRole === 'superadmin' ? 'Super Admin Overview' : 'Master Admin Overview'}
                    </h3>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Activity className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">System Health</p>
                                <p className="text-3xl font-extrabold text-slate-900">—</p>
                                <p className="text-xs text-slate-500 mt-1">View in dashboard</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Cpu className="w-6 h-6 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">AI Generation Stats</p>
                                <p className="text-3xl font-extrabold text-slate-900">—</p>
                                <p className="text-xs text-slate-500 mt-1">View in dashboard</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-emerald-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Active Users</p>
                                <p className="text-3xl font-extrabold text-slate-900">—</p>
                                <p className="text-xs text-slate-500 mt-1">View in dashboard</p>
                            </div>
                        </div>
                    </div>

                    {/* System Logs + Admin Console */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                        {/* System Logs */}
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-5">
                                <AlertCircle className="w-5 h-5 text-slate-400" aria-hidden="true" />
                                <h4 className="text-lg font-bold text-slate-900">System Logs</h4>
                            </div>
                            <div className="space-y-4">
                                {systemLogs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                        <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
                                        <p className="text-sm font-medium">Live logs available in the main dashboard</p>
                                        <Link href={authRole === 'superadmin' ? '/dashboard/superadmin' : '/dashboard/masteradmin'} className="text-xs text-emerald-600 hover:underline mt-1">Open Dashboard &rarr;</Link>
                                    </div>
                                ) : systemLogs.map((log, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${log.color}`}>
                                            {log.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">{log.title}</p>
                                            <p className="text-xs text-slate-400">{log.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Admin Console */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
                            <div className="relative z-10">
                                <h4 className="text-xl font-bold mb-2">Admin Console</h4>
                                <p className="text-sm text-slate-300 mb-6 leading-relaxed">Monitor AI token usage and manage system-wide LMS generation queues.</p>
                                <Link
                                    href={authRole === 'superadmin' ? '/dashboard/superadmin' : '/dashboard/masteradmin'}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm"
                                >
                                    View Analytics
                                </Link>
                            </div>
                            <div className="flex items-center gap-2 mt-6 relative z-10">
                                <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                                    <Home className="w-4 h-4" aria-hidden="true" />
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* Feature Cards for all sections */}
                    {sections
                        .filter(s => s.key !== 'superadmin') // Super Admin is separate
                        .map((section) => (
                        <div key={section.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <div className={`bg-gradient-to-r ${section.bgGradient} px-5 py-3.5 flex items-center gap-3`}>
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
                                    {section.icon ? <section.icon className="w-5 h-5" aria-hidden="true" /> : <div className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{section.title}</h4>
                                    <p className="text-[10px] text-white/70">{section.modules.length} modules</p>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                {section.modules.map((mod) => (
                                    <Link
                                        key={mod.href}
                                        href={mod.href}
                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                                    >
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                            {mod.icon ? <mod.icon className="w-5 h-5" aria-hidden="true" /> : <div className="w-5 h-5" />}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors truncate">
                                            {mod.label}
                                        </span>
                                        {mod.badge && (
                                            <span className="text-[8px] font-bold bg-emerald-100 text-emerald-600 px-1 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                                                {mod.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* footer */}
                    <p className="text-center text-slate-400 text-xs py-8">© 2026 MedEduAI Control Panel · Restricted Access</p>
                </div>
            </main>
        </div>
    );
}
