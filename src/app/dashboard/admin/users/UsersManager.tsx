"use client";

import { useState, useEffect, useCallback } from 'react';
import { Users, Edit2, CheckCircle2, X, Search, Loader2, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

type UserRow = {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    last_sign_in: string | null;
    has_profile: boolean;
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

export default function UsersManager({ currentUserRole }: { currentUserRole: 'masteradmin' | 'superadmin' }) {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Inline edit state
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState('');

    // Password modal state
    const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
    const [passwordUserEmail, setPasswordUserEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('[UsersManager] fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return u.full_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q);
    });

    const handleStartEdit = (u: UserRow) => {
        setEditingUserId(u.id);
        setEditRole(u.role);
    };

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

    const openPasswordModal = (u: UserRow) => {
        setPasswordUserId(u.id);
        setPasswordUserEmail(u.email);
        setNewPassword('');
        setShowPassword(false);
        setErrorMsg('');
    };

    const handleChangePassword = async () => {
        if (!passwordUserId || !newPassword) return;
        if (newPassword.length < 6) {
            setErrorMsg('Password must be at least 6 characters');
            return;
        }
        setSaving(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: passwordUserId, newPassword }),
            });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || 'Failed');
            }
            setSuccessMsg(`Password changed for ${passwordUserEmail}`);
            setTimeout(() => setSuccessMsg(''), 4000);
            setPasswordUserId(null);
            setNewPassword('');
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const canEditUser = (u: UserRow) => {
        const r = u.role.toLowerCase().replace(/_/g, '');
        if (r === 'superadmin') return false; // nobody edits superadmin
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
            {errorMsg && !passwordUserId && (
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
                            <p className="text-xs text-slate-500">
                                {users.length} total users from Supabase Auth
                            </p>
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
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Loading all auth users…
                        </div>
                    ) : (
                        <table className="w-full text-left table-fixed" style={{ minWidth: '900px' }}>
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 font-bold w-[20%]">Name</th>
                                    <th className="px-3 py-3 font-bold w-[22%]">Email</th>
                                    <th className="px-3 py-3 font-bold w-[13%]">Role</th>
                                    <th className="px-3 py-3 font-bold w-[11%]">Joined</th>
                                    <th className="px-3 py-3 font-bold w-[11%]">Last Login</th>
                                    <th className="px-3 py-3 font-bold w-[6%] text-center">Profile</th>
                                    <th className="px-3 py-3 font-bold w-[17%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map(u => {
                                    const isEditing = editingUserId === u.id;
                                    const editable = canEditUser(u);

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-slate-900 text-sm truncate block">
                                                    {u.full_name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="text-slate-600 text-sm truncate block">{u.email}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                {isEditing ? (
                                                    <select
                                                        value={editRole}
                                                        onChange={e => setEditRole(e.target.value)}
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
                                            <td className="px-3 py-3 text-xs text-slate-500">
                                                {formatDate(u.created_at)}
                                            </td>
                                            <td className="px-3 py-3 text-xs text-slate-500">
                                                {formatDate(u.last_sign_in)}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {u.has_profile ? (
                                                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" title="Has profile in users table" />
                                                ) : (
                                                    <span className="inline-block w-2 h-2 bg-amber-400 rounded-full" title="Auth only — no profile row" />
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setEditingUserId(null)}
                                                            disabled={saving}
                                                            className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveRole(u.id)}
                                                            disabled={saving}
                                                            className="p-1.5 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 font-bold text-[11px] px-3 disabled:opacity-50"
                                                        >
                                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                            Save
                                                        </button>
                                                    </div>
                                                ) : editable ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleStartEdit(u)}
                                                            title="Edit role"
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openPasswordModal(u)}
                                                            title="Change password"
                                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        >
                                                            <KeyRound className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase">Protected</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filtered.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No users found.</div>
                )}
            </div>

            {/* Password Change Modal */}
            {passwordUserId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-7 pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-100 rounded-xl">
                                    <KeyRound className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Change Password</h3>
                                    <p className="text-sm text-slate-400">{passwordUserEmail}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setPasswordUserId(null); setErrorMsg(''); }}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-7 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min 6 chars)"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 font-medium text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {newPassword.length > 0 && newPassword.length < 6 && (
                                    <p className="text-xs text-red-500 mt-1.5 font-medium">Password must be at least 6 characters</p>
                                )}
                            </div>

                            {errorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                                    ⚠ {errorMsg}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 px-7 pb-7">
                            <button
                                onClick={() => { setPasswordUserId(null); setErrorMsg(''); }}
                                disabled={saving}
                                className="px-5 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={saving || newPassword.length < 6}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                {saving ? 'Changing…' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
