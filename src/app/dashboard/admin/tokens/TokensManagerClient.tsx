"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Users, Activity, RefreshCw, Pencil, X, Save, Loader2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

// ── Token allotments per plan ──────────────────────────────────────────
const PLAN_ALLOTMENTS: Record<string, number> = {
    basic: 50_000,
    standard: 100_000,
    premium: 300_000,
    enterprise: 1_000_000,
    free: 10_000,
};

const PLAN_COLORS: Record<string, string> = {
    basic: 'bg-blue-100 text-blue-700',
    standard: 'bg-emerald-100 text-emerald-700',
    premium: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
    free: 'bg-slate-100 text-slate-600',
};

const ROLE_LABELS: Record<string, string> = {
    student: 'Student',
    teacher: 'Teacher',
    deptadmin: 'Department Head',
    instadmin: 'Institution Head',
    masteradmin: 'Master Admin',
    superadmin: 'Super Admin',
};

type UserRow = {
    id: string;
    full_name: string;
    email: string;
    role: string;
    plan_tier: string;
    billing_status: string;
    ai_tokens_balance: number;
    ai_tokens_allotment: number;
    bonus_tokens: number;
    trial_end_date: string;
};

type EditDraft = {
    role: string;
    plan_tier: string;
    billing_status: string;
    ai_tokens_balance: number;
    ai_tokens_allotment: number;
};

// ── AI Feature Cost Reference ──────────────────────────────────────────
const FEATURE_COSTS = [
    { feature: 'AI Mentor Chat', role: 'Student', tokensPerQuery: 500 },
    { feature: 'Viva Simulator', role: 'Student', tokensPerQuery: 800 },
    { feature: 'Vocabulary AI', role: 'Student', tokensPerQuery: 200 },
    { feature: 'Reflection Generator', role: 'Student', tokensPerQuery: 1000 },
    { feature: 'Essay Qs Generator', role: 'Student / Teacher', tokensPerQuery: 1500 },
    { feature: 'MCQs Generator', role: 'Student / Teacher', tokensPerQuery: 1200 },
    { feature: 'Notes Creator (AI)', role: 'All', tokensPerQuery: 2000 },
    { feature: 'Lesson Plan Generator', role: 'Teacher', tokensPerQuery: 2500 },
    { feature: 'Rubrics Generator', role: 'Teacher', tokensPerQuery: 1500 },
    { feature: 'Dig Evaluation Assist', role: 'Teacher', tokensPerQuery: 3000 },
    { feature: 'Self-Evaluation', role: 'Student', tokensPerQuery: 800 },
];

export default function TokensManagerClient() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'plans' | 'costs'>('users');

    // Edit modal state
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [editIndex, setEditIndex] = useState<number>(-1);
    const [draft, setDraft] = useState<EditDraft | null>(null);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const filteredRef = useRef<UserRow[]>([]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/token-users');
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('[TokenEconomy] fetchUsers error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const openEdit = (u: UserRow, idx: number) => {
        setEditUser(u);
        setEditIndex(idx);
        setDraft({
            role: u.role,
            plan_tier: u.plan_tier,
            billing_status: u.billing_status,
            ai_tokens_balance: u.ai_tokens_balance,
            ai_tokens_allotment: u.ai_tokens_allotment,
        });
        setErrorMsg('');
    };

    const closeEdit = () => { setEditUser(null); setEditIndex(-1); setDraft(null); setErrorMsg(''); };

    const navigateEdit = (direction: 'prev' | 'next') => {
        const list = filteredRef.current;
        if (!list.length) return;
        const newIdx = direction === 'next'
            ? (editIndex + 1) % list.length
            : (editIndex - 1 + list.length) % list.length;
        openEdit(list[newIdx], newIdx);
    };

    // Auto-fill allotment when plan changes
    const handlePlanChange = (plan: string) => {
        setDraft(d => d ? { ...d, plan_tier: plan, ai_tokens_allotment: PLAN_ALLOTMENTS[plan] ?? d.ai_tokens_allotment } : d);
    };

    const handleSave = async () => {
        if (!editUser || !draft) return;
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/admin/token-users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editUser.id,
                    role: draft.role,
                    plan_tier: draft.plan_tier,
                    billing_status: draft.billing_status,
                    ai_tokens_balance: draft.ai_tokens_balance,
                    ai_tokens_allotment: draft.ai_tokens_allotment,
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Save failed'); }

            setSuccessMsg(`✓ Saved changes for ${editUser.full_name}`);
            setTimeout(() => setSuccessMsg(''), 4000);
            closeEdit();
            fetchUsers();
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filtered = users.filter(u => {
        const matchSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        const matchPlan = planFilter === 'all' || u.plan_tier === planFilter;
        return matchSearch && matchRole && matchPlan;
    });
    // always keep ref in sync so navigateEdit works
    filteredRef.current = filtered;

    const getUsagePct = (u: UserRow) => {
        const allotment = u.ai_tokens_allotment || PLAN_ALLOTMENTS[u.plan_tier] || 10000;
        if (allotment === 0) return 0;
        return Math.round(((allotment - u.ai_tokens_balance) / allotment) * 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Token Economy</h1>
                    <p className="text-slate-500 mt-1 text-sm">Monitor and manage AI token balances across all user subscriptions.</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl font-semibold text-sm">
                    {successMsg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-slate-200">
                <button onClick={() => setActiveTab('users')} className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'users' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                    <Users className="w-4 h-4 inline mr-2" />User Wallets
                </button>
                <button onClick={() => setActiveTab('plans')} className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'plans' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                    <Settings className="w-4 h-4 inline mr-2" />Plan Allotments
                </button>
                <button onClick={() => setActiveTab('costs')} className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'costs' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                    <Activity className="w-4 h-4 inline mr-2" />Feature Costs
                </button>
            </div>

            {/* ── Tab: User Wallets ─────────────────────────────────── */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <input
                            placeholder="Search by name or email…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                        />
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none">
                            <option value="all">All Roles</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="deptadmin">Dept Head</option>
                            <option value="instadmin">Inst Head</option>
                            <option value="masteradmin">Master Admin</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none">
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 animate-pulse">Loading users from database…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">No users found.</div>
                        ) : (
                            <div className="overflow-auto max-h-[65vh]" style={{ scrollbarGutter: 'stable' }}>
                                <table className="w-full text-left table-fixed" style={{ minWidth: '850px' }}>
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 font-bold w-[22%]">User</th>
                                            <th className="px-3 py-3 font-bold w-[14%]">Role</th>
                                            <th className="px-3 py-3 font-bold w-[14%]">Plan</th>
                                            <th className="px-3 py-3 font-bold w-[13%] text-right">Balance</th>
                                            <th className="px-3 py-3 font-bold w-[13%] text-right">Allotment</th>
                                            <th className="px-3 py-3 font-bold w-[12%]">Usage</th>
                                            <th className="px-3 py-3 font-bold w-[12%] text-right">Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filtered.map(u => {
                                            const pct = getUsagePct(u);
                                            const isLow = u.ai_tokens_balance < u.ai_tokens_allotment * 0.1;
                                            const isUnlimited = (() => { const r = u.role.toLowerCase().replace(/_/g, ''); return r === 'masteradmin' || r === 'superadmin'; })();
                                            return (
                                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-900 text-sm truncate">{u.full_name}</div>
                                                        <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                                                            {ROLE_LABELS[u.role] || u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${PLAN_COLORS[u.plan_tier] || PLAN_COLORS.free}`}>
                                                            {u.plan_tier}
                                                        </span>
                                                        {u.billing_status === 'trialing' && !isUnlimited && (
                                                            <span className="ml-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-bold uppercase">Trial</span>
                                                        )}
                                                    </td>
                                                    {isUnlimited ? (
                                                        <>
                                                            <td className="px-3 py-3 text-right text-sm font-extrabold text-emerald-600">∞</td>
                                                            <td className="px-3 py-3 text-right text-sm font-extrabold text-emerald-600">∞</td>
                                                            <td className="px-3 py-3">
                                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase">Unlimited</span>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className={`px-3 py-3 font-extrabold tabular-nums text-right text-sm ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                                                                {u.ai_tokens_balance.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-3 text-slate-500 font-semibold tabular-nums text-right text-sm">
                                                                {u.ai_tokens_allotment.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{pct}%</span>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-3 py-3 text-right">
                                                        <button
                                                            onClick={() => openEdit(u, filtered.indexOf(u))}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white hover:bg-emerald-600 font-bold text-[11px] rounded-lg transition-all shadow-sm group-hover:shadow-md"
                                                        >
                                                            <Pencil className="w-3 h-3" /> Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Tab: Plan Allotments ──────────────────────────────── */}
            {activeTab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[
                        { tier: 'basic', label: 'Basic', tokens: 50_000, roles: 'Learning – Student only (LMS Notes & Mentorship)', period: 'per month' },
                        { tier: 'standard', label: 'Standard', tokens: 100_000, roles: 'Learning (all) – Student & Teaching – Teacher', period: 'per month' },
                        { tier: 'premium', label: 'Premium', tokens: 300_000, roles: 'Department Head (all Dept Admin features)', period: 'per month' },
                        { tier: 'enterprise', label: 'Enterprise', tokens: 1_000_000, roles: 'Institution Head – Mentoring, Elective, LogBook MS', period: 'per month' },
                        { tier: 'free', label: 'Free Trial', tokens: 10_000, roles: '15-day trial – limited features', period: 'trial period' },
                    ].map(plan => (
                        <div key={plan.tier} className={`bg-white p-6 rounded-3xl border-2 shadow-sm ${plan.tier === 'premium' ? 'border-purple-200' : plan.tier === 'standard' ? 'border-emerald-200' : 'border-slate-200'}`}>
                            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-4 ${PLAN_COLORS[plan.tier]}`}>{plan.label}</div>
                            <div className="text-3xl font-extrabold text-slate-900 mb-1">
                                {plan.tokens >= 100_000 ? `${(plan.tokens / 100_000).toFixed(0)} Lakh` : `${(plan.tokens / 1000).toFixed(0)}K`}
                            </div>
                            <div className="text-sm text-slate-500 font-semibold mb-1">AI Tokens <span className="text-slate-400">{plan.period}</span></div>
                            <div className="text-xs text-slate-500 mt-3 leading-relaxed">{plan.roles}</div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="text-xs text-slate-400">
                                    Current users: <span className="font-bold text-slate-700">{users.filter(u => u.plan_tier === plan.tier).length}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tab: Feature Costs ────────────────────────────────── */}
            {activeTab === 'costs' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="font-bold text-slate-800 text-lg">AI Feature Token Costs (per query)</h2>
                        <p className="text-xs text-slate-500 mt-1">Reference costs deducted from user balances per AI generation request.</p>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-bold">Feature</th>
                                <th className="px-6 py-4 font-bold">Available For</th>
                                <th className="px-6 py-4 font-bold text-right">Tokens / Query</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {FEATURE_COSTS.map(f => (
                                <tr key={f.feature} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-slate-900">{f.feature}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{f.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-extrabold text-indigo-600">{f.tokensPerQuery.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Full Edit Modal ───────────────────────────────────── */}
            {editUser && draft && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
                        {/* Modal header with nav arrows */}
                        <div className="flex items-start justify-between p-7 pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                {/* Up/Down navigation */}
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => navigateEdit('prev')}
                                        title="Previous user (↑)"
                                        className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-500 rounded-lg transition-colors"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => navigateEdit('next')}
                                        title="Next user (↓)"
                                        className="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-500 rounded-lg transition-colors"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-extrabold text-slate-900">{editUser.full_name}</h3>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                                            {editIndex + 1} / {filteredRef.current.length}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-0.5">{editUser.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Left/Right navigation */}
                                <button
                                    onClick={() => navigateEdit('prev')}
                                    title="Previous user (←)"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                </button>
                                <button
                                    onClick={() => navigateEdit('next')}
                                    title="Next user (→)"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={closeEdit} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Form body */}
                        <div className="p-7 space-y-5">
                            {/* Role */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role</label>
                                <select
                                    value={draft.role}
                                    onChange={e => setDraft(d => d ? { ...d, role: e.target.value } : d)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="deptadmin">Department Head</option>
                                    <option value="instadmin">Institution Head</option>
                                    <option value="masteradmin">Master Admin</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>

                            {/* Plan + Billing row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subscription Plan</label>
                                    <select
                                        value={draft.plan_tier}
                                        onChange={e => handlePlanChange(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                        <option value="free">Free</option>
                                        <option value="basic">Basic</option>
                                        <option value="standard">Standard</option>
                                        <option value="premium">Premium</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Billing Status</label>
                                    <select
                                        value={draft.billing_status}
                                        onChange={e => setDraft(d => d ? { ...d, billing_status: e.target.value } : d)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                        <option value="trialing">Trialing</option>
                                        <option value="active">Active</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tokens row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Balance</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={draft.ai_tokens_balance}
                                        onChange={e => setDraft(d => d ? { ...d, ai_tokens_balance: parseInt(e.target.value) || 0 } : d)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Monthly Allotment</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={draft.ai_tokens_allotment}
                                        onChange={e => setDraft(d => d ? { ...d, ai_tokens_allotment: parseInt(e.target.value) || 0 } : d)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 tabular-nums focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>

                            {/* Quick-fill buttons */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quick-fill tokens by plan</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(PLAN_ALLOTMENTS).map(([tier, tokens]) => (
                                        <button
                                            key={tier}
                                            onClick={() => setDraft(d => d ? { ...d, ai_tokens_balance: tokens, ai_tokens_allotment: tokens } : d)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all hover:scale-105 ${PLAN_COLORS[tier] || 'bg-slate-100 text-slate-600'} border-transparent`}
                                        >
                                            {tier}: {tokens >= 100_000 ? `${tokens / 100_000}L` : `${tokens / 1000}K`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                                    ⚠ {errorMsg}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-7 pb-7">
                            <button
                                onClick={closeEdit}
                                disabled={saving}
                                className="px-5 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
