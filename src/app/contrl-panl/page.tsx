"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { setControlPanelRole, clearControlPanelRole } from "./actions";
import {
    BrainCircuit, LayoutDashboard, BookOpen, MessageSquare, Mic,
    Settings, Users, FileText, GraduationCap, ClipboardCheck,
    AlertCircle, ClipboardList, ClipboardType, CalendarDays,
    LogOut, Lock, Eye, EyeOff, Shield, ChevronRight, ExternalLink,
    Menu, X, Home, Activity, Cpu, BarChart3, Server, UserPlus, Clock,
    FileEdit, PenTool
} from "lucide-react";
import MededuLogo from "@/components/MededuLogo";

/* ── hardcoded credentials ── */
const CREDENTIALS = [
    {
        email: "drnarayanak@gmail.com",
        password: "Tata@#viDhya#2026",
        role: "superadmin" as const,
        label: "Super Admin",
    },
    {
        email: "narayanapharmac@gmail.com",
        password: "DeVanaHalli-#@Pradeep#2026",
        role: "admin" as const,
        label: "Admin",
    },
];

/* ── role → sections mapping ── */
type SectionKey = "superadmin" | "masteradmin" | "instadmin" | "deptadmin" | "teaching" | "learning";

interface ModuleLink {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
}

interface Section {
    key: SectionKey;
    title: string;
    color: string;
    bgGradient: string;
    icon: React.ReactNode;
    modules: ModuleLink[];
}

const ALL_SECTIONS: Section[] = [
    {
        key: "superadmin",
        title: "Super Admin",
        color: "rose",
        bgGradient: "from-rose-600 to-rose-800",
        icon: <Shield className="w-6 h-6" />,
        modules: [
            { label: "Super Admin Dashboard", href: "/dashboard/superadmin", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "LMS Auto-Gen", href: "/dashboard/admin/creator", icon: <Settings className="w-5 h-5" /> },
            { label: "Blog Publications", href: "/dashboard/admin/blog", icon: <FileText className="w-5 h-5" /> },
            { label: "User Management", href: "/dashboard/admin/users", icon: <Users className="w-5 h-5" /> },
            { label: "Token Economy", href: "/dashboard/admin/tokens", icon: <BrainCircuit className="w-5 h-5" /> },
        ],
    },
    {
        key: "masteradmin",
        title: "Master Admin",
        color: "purple",
        bgGradient: "from-purple-600 to-purple-800",
        icon: <BrainCircuit className="w-6 h-6" />,
        modules: [
            { label: "Master Admin Dashboard", href: "/dashboard/masteradmin", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "LMS Database", href: "/dashboard/admin/lms-db", icon: <BookOpen className="w-5 h-5" /> },
        ],
    },
    {
        key: "instadmin",
        title: "Institution Admin",
        color: "amber",
        bgGradient: "from-amber-500 to-amber-700",
        icon: <GraduationCap className="w-6 h-6" />,
        modules: [
            { label: "Institution Admin Dashboard", href: "/dashboard/instadmin", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Mentoring MS", href: "/dashboard/admin/mentoring", icon: <Users className="w-5 h-5" /> },
            { label: "Elective MS", href: "/dashboard/admin/elective", icon: <BookOpen className="w-5 h-5" /> },
            { label: "LogBook MS", href: "/dashboard/admin/logbook", icon: <ClipboardList className="w-5 h-5" /> },
        ],
    },
    {
        key: "deptadmin",
        title: "Department Admin",
        color: "teal",
        bgGradient: "from-teal-600 to-teal-800",
        icon: <ClipboardCheck className="w-6 h-6" />,
        modules: [
            { label: "Dept Admin Dashboard", href: "/dashboard/deptadmin", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "LMS Notes", href: "/dashboard/admin/notes", icon: <BookOpen className="w-5 h-5" /> },
            { label: "Notes Creator", href: "/dashboard/admin/notes-creator", icon: <FileEdit className="w-5 h-5" /> },
            { label: "Mentorship MS", href: "/dashboard/admin/mentorship", icon: <Users className="w-5 h-5" /> },
            { label: "Lesson Plan", href: "/dashboard/admin/lesson-plan", icon: <FileText className="w-5 h-5" /> },
            { label: "Rubrics Generator", href: "/dashboard/admin/rubrics-generator", icon: <ClipboardList className="w-5 h-5" /> },
            { label: "Classroom Generator", href: "/dashboard/admin/classroom-generator", icon: <GraduationCap className="w-5 h-5" /> },
            { label: "Time Table MS", href: "/dashboard/admin/timetable", icon: <CalendarDays className="w-5 h-5" /> },
            { label: "Attendance MS", href: "/dashboard/admin/attendance", icon: <Users className="w-5 h-5" /> },
            { label: "Essay Answer Gen", href: "/dashboard/admin/essay-answer", icon: <PenTool className="w-5 h-5" /> },
            { label: "Q-Paper Dev", href: "/dashboard/admin/q-paper", icon: <AlertCircle className="w-5 h-5" /> },
            { label: "EMS - Essay", href: "/dashboard/admin/ems", icon: <ClipboardCheck className="w-5 h-5" /> },
            { label: "EMR - MCQs", href: "/dashboard/admin/emr-mcq", icon: <ClipboardType className="w-5 h-5" /> },
        ],
    },
    {
        key: "teaching",
        title: "Teaching",
        color: "blue",
        bgGradient: "from-blue-600 to-blue-800",
        icon: <FileText className="w-6 h-6" />,
        modules: [
            { label: "Teaching Dashboard", href: "/dashboard/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "LMS Notes", href: "/dashboard/teacher/notes", icon: <BookOpen className="w-5 h-5" /> },
            { label: "Notes Creator", href: "/dashboard/teacher/notes-creator", icon: <FileEdit className="w-5 h-5" /> },
            { label: "Mentorship MS", href: "/dashboard/teacher/mentorship", icon: <Users className="w-5 h-5" /> },
            { label: "Lesson Plan", href: "/dashboard/teacher/lesson-plan", icon: <FileText className="w-5 h-5" /> },
            { label: "Rubrics Generator", href: "/dashboard/teacher/rubrics-generator", icon: <ClipboardList className="w-5 h-5" /> },
            { label: "Essay Qs Generator", href: "/dashboard/teacher/essays", icon: <ClipboardType className="w-5 h-5" /> },
            { label: "Essay Answer Gen", href: "/dashboard/teacher/essay-answer", icon: <PenTool className="w-5 h-5" /> },
            { label: "MCQs Generator", href: "/dashboard/teacher/mcqs", icon: <ClipboardCheck className="w-5 h-5" /> },
        ],
    },
    {
        key: "learning",
        title: "Learning",
        color: "emerald",
        bgGradient: "from-emerald-600 to-emerald-800",
        icon: <GraduationCap className="w-6 h-6" />,
        modules: [
            { label: "Learning Dashboard", href: "/dashboard/student", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "LMS Notes", href: "/dashboard/student/notes", icon: <BookOpen className="w-5 h-5" /> },
            { label: "Notes Creator", href: "/dashboard/student/notes-creator", icon: <FileEdit className="w-5 h-5" /> },
            { label: "Mentorship MS", href: "/dashboard/student/mentorship", icon: <Users className="w-5 h-5" /> },
            { label: "AI Mentor", href: "/dashboard/student/mentor", icon: <MessageSquare className="w-5 h-5" />, badge: "Pro" },
            { label: "Viva Simulator", href: "/dashboard/student/viva", icon: <Mic className="w-5 h-5" /> },
            { label: "Vocabulary", href: "/dashboard/student/vocab", icon: <GraduationCap className="w-5 h-5" /> },
            { label: "Reflection Generator", href: "/dashboard/student/reflection", icon: <FileText className="w-5 h-5" /> },
            { label: "Essay Qs Generator", href: "/dashboard/student/essays", icon: <ClipboardType className="w-5 h-5" /> },
            { label: "Essay Answer Gen", href: "/dashboard/student/essay-answer", icon: <PenTool className="w-5 h-5" /> },
            { label: "MCQs Generator", href: "/dashboard/student/mcqs", icon: <ClipboardCheck className="w-5 h-5" /> },
        ],
    },
];

/* which sections each credential-role may see */
const ROLE_VISIBILITY: Record<string, SectionKey[]> = {
    superadmin: ["superadmin", "masteradmin", "instadmin", "deptadmin", "teaching", "learning"],
    admin: ["masteradmin", "instadmin", "deptadmin", "teaching", "learning"],
};

/* ═════════════════  Sidebar Item Component  ═════════════════ */
function SidebarItem({ icon, label, href, badge, isActive }: { icon: React.ReactNode; label: string; href: string; badge?: string; isActive?: boolean }) {
    return (
        <Link
            href={href}
            title={label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
        >
            <div className={`transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`}>
                {icon}
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

/* ═════════════════  COMPONENT  ═════════════════ */
export default function ControlPanelPage() {
    const [authRole, setAuthRole] = useState<string | null>(null);
    const [authLabel, setAuthLabel] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeSectionKey, setActiveSectionKey] = useState<SectionKey | null>(null);

    /* persist lightweight session in sessionStorage */
    useEffect(() => {
        const saved = sessionStorage.getItem("cp_auth");
        if (saved) {
            try {
                const { role, label } = JSON.parse(saved);
                setAuthRole(role);
                setAuthLabel(label);
                // Re-sync role cookie silently — errors are non-blocking
                setControlPanelRole(role === 'admin' ? 'superadmin' : role).catch(() => {});
            } catch { /* ignore */ }
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoggingIn(true);

        try {
            const match = CREDENTIALS.find(
                (c) => c.email === email.trim() && c.password === password
            );

            if (match) {
                // Race the server action against a 8-second timeout to prevent infinite spinner
                const timeout = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out. Please try again.")), 8000)
                );
                await Promise.race([
                    setControlPanelRole(match.role === 'admin' ? 'superadmin' : match.role),
                    timeout,
                ]);

                setAuthRole(match.role);
                setAuthLabel(match.label);
                sessionStorage.setItem("cp_auth", JSON.stringify({ role: match.role, label: match.label }));
            } else {
                setError("Invalid email or password. Please try again.");
            }
        } catch (err: any) {
            console.error("Control panel login error:", err);
            setError(err.message || "Authentication failed. Please try again.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await clearControlPanelRole();
        setAuthRole(null);
        setAuthLabel("");
        setEmail("");
        setPassword("");
        setActiveSectionKey(null);
        sessionStorage.removeItem("cp_auth");
    };

    /* ── LOGIN SCREEN ── */
    if (!authRole) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
                {/* ambient glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
                </div>

                <div className="relative w-full max-w-md">
                    {/* logo */}
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-5">
                            <MededuLogo size={64} className="shadow-xl shadow-emerald-600/20" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Control Panel</h1>
                        <p className="text-slate-500 mt-2 text-sm">MedEduAI · Restricted Access</p>
                    </div>

                    {/* card */}
                    <form
                        onSubmit={handleLogin}
                        className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                                <Lock className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Sign In</h2>
                                <p className="text-xs text-slate-500">Enter your credentials to continue</p>
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
                                    id="cp-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Password</label>
                                <div className="relative">
                                    <input
                                        id="cp-password"
                                        type={showPw ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-sm pr-12"
                                        placeholder="••••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            id="cp-login-btn"
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full mt-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            {isLoggingIn ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Access Control Panel
                                </>
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

    // Mock system logs
    const systemLogs = [
        { icon: <Server className="w-4 h-4" />, title: "LMS Queue: Anatomy Notes (3/10)", time: "1 hour ago", color: "text-blue-600 bg-blue-50" },
        { icon: <Activity className="w-4 h-4" />, title: "Server Backup Completed", time: "2 hours ago", color: "text-emerald-600 bg-emerald-50" },
        { icon: <UserPlus className="w-4 h-4" />, title: "New Teacher Registered", time: "3 hours ago", color: "text-purple-600 bg-purple-50" },
    ];

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
                    <SidebarItem href="/" icon={<Home className="w-5 h-5" />} label="Home Page" />

                    {sidebarSections.map((section) => (
                        <React.Fragment key={section.key}>
                            <div className="pt-4 pb-2 px-3">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                    section.key === 'superadmin' ? 'text-rose-500' :
                                    section.key === 'masteradmin' ? 'text-purple-400' :
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
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
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
                        >
                            <Menu className="w-6 h-6" />
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
                            <p className="text-sm font-bold text-slate-900 capitalize leading-tight mb-0.5">{authLabel} User</p>
                            <div className="flex items-center gap-1.5 justify-end mb-0.5">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider leading-none">{authLabel}</p>
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none bg-purple-100 text-purple-600">PREMIUM</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <Users className="w-5 h-5 text-slate-400" />
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
                                <Activity className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">System Health</p>
                                <p className="text-3xl font-extrabold text-slate-900">99.9%</p>
                                <p className="text-xs text-slate-500 mt-1">All AI nodes active</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Cpu className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">AI Generation Stats</p>
                                <p className="text-3xl font-extrabold text-slate-900">1.2k</p>
                                <p className="text-xs text-slate-500 mt-1">+450 today</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1">Active Users</p>
                                <p className="text-3xl font-extrabold text-slate-900">842</p>
                                <p className="text-xs text-slate-500 mt-1">Current session peak</p>
                            </div>
                        </div>
                    </div>

                    {/* System Logs + Admin Console */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                        {/* System Logs */}
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-5">
                                <AlertCircle className="w-5 h-5 text-slate-400" />
                                <h4 className="text-lg font-bold text-slate-900">System Logs</h4>
                            </div>
                            <div className="space-y-4">
                                {systemLogs.map((log, idx) => (
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
                                    <Home className="w-4 h-4" />
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
                                    {section.icon}
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
                                        <div className="text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0">
                                            {mod.icon}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors truncate">
                                            {mod.label}
                                        </span>
                                        {mod.badge && (
                                            <span className="text-[8px] font-bold bg-purple-100 text-purple-600 px-1 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
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
