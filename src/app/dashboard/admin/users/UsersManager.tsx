"use client";

import { useState, useCallback, useEffect } from 'react';
import { Users, Edit2, CheckCircle2, X, Search, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

type UserRow = {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    last_sign_in: string | null;
    has_profile: boolean;
    admin_set_password: string | null;
};

const ROLE_LABELS: Record<string, string> = {
    student: 'Student', teacher: 'Teacher',
    deptadmin: 'Dept Admin', department_admin: 'Dept Admin',
    instadmin: 'Inst Admin', institution_admin: 'Inst Admin',
    masteradmin: 'Master Admin', master_admin: 'Master Admin',
    superadmin: 'Super Admin', super_admin: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
    student: 'bg-emerald-100 text-emerald-700',
    teacher: 'bg-emerald-100 text-emerald-700',
    deptadmin: 'bg-blue-100 text-blue-700', department_admin: 'bg-blue-100 text-blue-700',
    instadmin: 'bg-blue-100 text-blue-700', institution_admin: 'bg-blue-100 text-blue-700',
    masteradmin: 'bg-purple-100 text-purple-700', master_admin: 'bg-purple-100 text-purple-700',
    superadmin: 'bg-rose-100 text-rose-700', super_admin: 'bg-rose-100 text-rose-700',
};

/* ── Per-row component — inline PGMentor-style password reset ── */
function UserRow_({
    u, isEditing, editable, editRole, saving,
    onEditRole, onStartEdit, onCancelEdit, onSaveRole,
    onPasswordSet, // callback(userId, newPassword) → updates parent state
    formatDate, currentUserRole,
}: {
    u: UserRow;
    isEditing: boolean;
    editable: boolean;
    editRole: string;
    saving: boolean;
    onEditRole: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveRole: () => void;
    onPasswordSet: (userId: string, newPw: string) => Promise<void>;
    formatDate: (d: string | null) => string;
    currentUserRole: string;
}) {
    // Displayed password show/hide
    const [showPw, setShowPw] = useState(false);

    // Inline reset state (PGMentor style)
    const [resetMode, setResetMode] = useState(false);
    const [resetPw, setResetPw] = useState('');
    const [showResetPw, setShowResetPw] = useState(false);
    const [setting, setSetting] = useState(false);
    const [setDone, setSetDone] = useState(false);

    const handleSet = async () => {
        if (resetPw.length < 6) return;
        setSetting(true);
        await onPasswordSet(u.id, resetPw);
        setSetting(false);
        setSetDone(true);
        setResetMode(false);
        setResetPw('');
        setTimeout(() => setSetDone(false), 3000);
    };

    const cancelReset = () => {
        setResetMode(false);
        setResetPw('');
        setShowResetPw(false);
    };

    return (
        <tr className="hover:bg-slate-50/40 transition-colors">
            {/* Name */}
            <td className="px-4 py-3">
                <span className="font-bold text-slate-900 text-sm truncate block">
                    {u.full_name || 'Unknown'}
                </span>
            </td>

            {/* Email */}
            <td className="px-3 py-3">
                <span className="text-slate-600 text-xs truncate block">{u.email}</span>
            </td>

            {/* Role */}
            <td className="px-3 py-3">
                {isEditing ? (
                    <select
                        value={editRole}
                        onChange={onEditRole}
                        disabled={saving}
                        className="w-full px-2 py-1 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="department_admin">Dept Admin</option>
                        <option value="institution_admin">Inst Admin</option>
                        {currentUserRole === 'superadmin' && (
                            <option value="master_admin">Master Admin</option>
                        )}
                    </select>
                ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                    </span>
                )}
            </td>

            {/* Joined */}
            <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                {formatDate(u.created_at)}
            </td>

            {/* Last Login */}
            <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                {formatDate(u.last_sign_in)}
            </td>

            {/* Admin-Set Password (display only) */}
            <td className="px-3 py-3">
                {u.admin_set_password ? (
                    <div className="flex items-center gap-1">
                        <span className={`font-mono text-xs text-slate-700 truncate max-w-[100px] ${showPw ? '' : 'tracking-widest'}`}>
                            {showPw ? u.admin_set_password : '••••••••'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowPw(v => !v)}
                            className="flex-shrink-0 p-1 text-slate-300 hover:text-slate-600 rounded transition-colors"
                        >
                            {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-400 italic">Not set</span>
                )}
            </td>

            {/* ── Password Reset — inline PGMentor style ── */}
            <td className="px-3 py-2">
                {resetMode ? (
                    /* Active: input + Set + Cancel */
                    <div className="flex items-center gap-1.5">
                        <div className="relative flex-1 min-w-0">
                            <input
                                type={showResetPw ? 'text' : 'password'}
                                value={resetPw}
                                onChange={e => setResetPw(e.target.value)}
                                placeholder="New password…"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSet(); if (e.key === 'Escape') cancelReset(); }}
                                className="w-full bg-white border border-violet-300 rounded-lg pl-2.5 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowResetPw(v => !v)}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showResetPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                        </div>
                        {/* Set button */}
                        <button
                            type="button"
                            onClick={handleSet}
                            disabled={setting || resetPw.length < 6}
                            title="Set new password"
                            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {setting ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                            Set
                        </button>
                        {/* Cancel */}
                        <button
                            type="button"
                            onClick={cancelReset}
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    /* Default: Reset button (or ✓ after set) */
                    <button
                        type="button"
                        onClick={() => setResetMode(true)}
                        disabled={setDone}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            setDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                        }`}
                    >
                        {setDone ? (
                            <><CheckCircle2 className="w-3 h-3" /> Done</>
                        ) : (
                            <><KeyRound className="w-3 h-3" /> Reset</>
                        )}
                    </button>
                )}
            </td>

            {/* Profile dot */}
            <td className="px-3 py-3 text-center">
                {u.has_profile ? (
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" title="Has profile row" />
                ) : (
                    <span className="inline-block w-2 h-2 bg-amber-400 rounded-full" title="Auth only" />
                )}
            </td>

            {/* Actions (role edit only) */}
            <td className="px-3 py-3 text-right">
                {isEditing ? (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={onCancelEdit}
                            disabled={saving}
                            className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onSaveRole}
                            disabled={saving}
                            className="p-1.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 font-bold text-[11px] px-3 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Save
                        </button>
                    </div>
                ) : editable ? (
                    <button
                        onClick={onStartEdit}
                        title="Edit role"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Protected</span>
                )}
            </td>
        </tr>
    );
}

/* ── Main Component ── */
export default function UsersManager({
    currentUserRole,
    initialUsers = [],
}: {
    currentUserRole: 'masteradmin' | 'superadmin';
    initialUsers?: UserRow[];
}) {
    const [users, setUsers] = useState<UserRow[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    /* Retry fetch (for error state only) */
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch('/api/admin/users', { signal: controller.signal });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            setUsers(await res.json());
        } catch (err: any) {
            setErrorMsg(err.name === 'AbortError' ? 'Timed out — click Retry' : err.message);
        } finally {
            clearTimeout(timer);
            setLoading(false);
        }
    }, []);

    // Automatically fetch users on mount since server-side fetch was removed
    useEffect(() => {
        if (users.length === 0 && !loading && !errorMsg) {
            fetchUsers();
        }
    }, [users.length, loading, errorMsg, fetchUsers]);

    const filtered = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return u.full_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q);
    });

    /* Role edit */
    const handleStartEdit = (u: UserRow) => { setEditingUserId(u.id); setEditRole(u.role); };

    const handleSaveRole = async (userId: string) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: editRole }),
            });
            if (!res.ok) throw new Error('Failed');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editRole } : u));
            setSuccessMsg('Role updated');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Failed to update role');
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setSaving(false);
            setEditingUserId(null);
        }
    };

    /* Inline password set (PGMentor style) */
    const handlePasswordSet = async (userId: string, newPw: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPassword: newPw }),
            });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || 'Failed');
            }
            // Update displayed password column immediately
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, admin_set_password: newPw } : u
            ));
            setSuccessMsg('Password updated successfully');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            setErrorMsg(err.message);
            setTimeout(() => setErrorMsg(''), 4000);
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const canEditUser = (u: UserRow) => {
        const r = u.role.toLowerCase().replace(/_/g, '');
        if (r === 'superadmin') return false;
        if (currentUserRole === 'masteradmin' && r === 'masteradmin') return false;
        return true;
    };

    return (
        <div className="space-y-4 flex-1 flex flex-col">
            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl font-semibold text-sm">
                    ✓ {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl font-semibold text-sm">
                    ⚠ {errorMsg}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">All Platform Users</h3>
                            <p className="text-xs text-slate-500">{users.length} total users</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search name, email, role…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white w-full sm:w-72"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1" style={{ maxHeight: '65vh' }}>
                    {loading ? (
                        <div className="p-12 flex justify-center items-center gap-3 text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin" /> Loading users…
                        </div>
                    ) : errorMsg && users.length === 0 ? (
                        <div className="p-12 flex flex-col items-center gap-4">
                            <p className="text-sm text-red-600 font-medium">⚠ {errorMsg}</p>
                            <button onClick={fetchUsers} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left table-fixed" style={{ minWidth: '1200px' }}>
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-bold w-[13%]">Name</th>
                                    <th className="px-3 py-3 font-bold w-[15%]">Email</th>
                                    <th className="px-3 py-3 font-bold w-[9%]">Role</th>
                                    <th className="px-3 py-3 font-bold w-[8%]">Joined</th>
                                    <th className="px-3 py-3 font-bold w-[8%]">Last Login</th>
                                    <th className="px-3 py-3 font-bold w-[15%]">
                                        <span className="flex items-center gap-1.5">
                                            <KeyRound className="w-3 h-3 text-amber-500" />
                                            Password (Set)
                                        </span>
                                    </th>
                                    <th className="px-3 py-3 font-bold w-[22%]">
                                        <span className="flex items-center gap-1.5">
                                            <KeyRound className="w-3 h-3 text-violet-500" />
                                            Password Reset
                                        </span>
                                    </th>
                                    <th className="px-3 py-3 font-bold w-[4%] text-center">●</th>
                                    <th className="px-3 py-3 font-bold w-[6%] text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(u => (
                                    <UserRow_
                                        key={u.id}
                                        u={u}
                                        isEditing={editingUserId === u.id}
                                        editable={canEditUser(u)}
                                        editRole={editRole}
                                        saving={saving}
                                        onEditRole={e => setEditRole(e.target.value)}
                                        onStartEdit={() => handleStartEdit(u)}
                                        onCancelEdit={() => setEditingUserId(null)}
                                        onSaveRole={() => handleSaveRole(u.id)}
                                        onPasswordSet={handlePasswordSet}
                                        formatDate={formatDate}
                                        currentUserRole={currentUserRole}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filtered.length === 0 && !errorMsg && (
                    <div className="p-8 text-center text-slate-500">No users found.</div>
                )}
            </div>
        </div>
    );
}
