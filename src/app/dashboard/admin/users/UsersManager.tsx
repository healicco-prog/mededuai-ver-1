"use client";

import { useState, useEffect } from 'react';
import { Users, Edit2, CheckCircle2, X, Search, Loader2 } from 'lucide-react';
import { getAllUsers, updateUserRole } from './actions';

type UserRole = 'student' | 'teacher' | 'deptadmin' | 'instadmin' | 'masteradmin' | 'superadmin' | string;

export default function UsersManager({ currentUserRole }: { currentUserRole: 'masteradmin' | 'superadmin' }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ role: UserRole }>({ role: 'student' });
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Determine which users to display based on currentUserRole
    const visibleRoles: UserRole[] = [];
    if (currentUserRole === 'superadmin') {
        visibleRoles.push('student', 'teacher', 'department_admin', 'institution_admin', 'master_admin', 'super_admin', 'deptadmin', 'instadmin', 'masteradmin', 'superadmin');
    } else if (currentUserRole === 'masteradmin') {
        visibleRoles.push('student', 'teacher', 'department_admin', 'institution_admin', 'master_admin', 'deptadmin', 'instadmin', 'masteradmin');
    } else if (currentUserRole === 'instadmin' || currentUserRole === 'deptadmin') {
        visibleRoles.push('student', 'teacher');
    }

    const filteredUsers = users.filter((user: { id: string, name: string, email: string, role: string }) => {
        if (!user.role || !visibleRoles.includes(user.role)) return false;

        const q = searchQuery.toLowerCase();
        return user.name.toLowerCase().includes(q) ||
            user.email.toLowerCase().includes(q) ||
            user.role.toLowerCase().includes(q);
    });

    const handleEditClick = (user: { id: string, name: string, email: string, role: string }) => {
        setEditingUserId(user.id);
        setEditForm({ role: user.role });
    };

    const handleSaveClick = async (id: string) => {
        setSaving(true);
        const result = await updateUserRole(id, editForm.role);
        if (result.success) {
            setUsers(users.map(u => u.id === id ? { ...u, role: editForm.role } : u));
        } else {
            alert('Failed to update user role');
        }
        setSaving(false);
        setEditingUserId(null);
    };

    if (visibleRoles.length === 0) {
        return <div className="p-8 text-center text-slate-500">You do not have permission to view this page.</div>;
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-sm flex-1">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Managed Users</h3>
                        <p className="text-xs text-slate-500">Update system access details</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white w-full sm:w-64"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-12 flex justify-center items-center gap-3 text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Loading database users...
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200">
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Name</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Role</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Email</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user: { id: string, name: string, email: string, role: string }) => {
                                const isEditing = editingUserId === user.id;

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800">{user.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isEditing && (currentUserRole === 'superadmin' || currentUserRole === 'masteradmin') ? (
                                                <select
                                                    value={editForm.role}
                                                    onChange={e => setEditForm({ role: e.target.value as UserRole })}
                                                    className="w-full px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                                    disabled={saving}
                                                >
                                                    <option value="student">STUDENT</option>
                                                    <option value="teacher">TEACHER</option>
                                                    <option value="department_admin">DEPT ADMIN</option>
                                                    <option value="institution_admin">INST ADMIN</option>
                                                    {currentUserRole === 'superadmin' && (
                                                        <option value="master_admin">MASTER ADMIN</option>
                                                    )}
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider 
                                                    ${(user.role === 'superadmin' || user.role === 'masteradmin' || user.role === 'super_admin' || user.role === 'master_admin') ? 'bg-purple-100 text-purple-700' :
                                                        (user.role === 'deptadmin' || user.role === 'instadmin' || user.role === 'department_admin' || user.role === 'institution_admin') ? 'bg-blue-100 text-blue-700' :
                                                            'bg-emerald-100 text-emerald-700'}`}>
                                                    {user.role?.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600">{user.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isEditing ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setEditingUserId(null)} disabled={saving} className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleSaveClick(user.id)} disabled={saving} className="p-1.5 text-white bg-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 font-semibold text-xs px-3 disabled:opacity-50">
                                                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} 
                                                        Save
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Prevent non-superadmins from editing superadmins or master admins from editing master admins */
                                                (!['superadmin', 'super_admin'].includes(user.role) && !(currentUserRole === 'masteradmin' && ['masteradmin', 'master_admin'].includes(user.role))) && (
                                                    <button onClick={() => handleEditClick(user)} suppressHydrationWarning className="p-1.5 text-slate-400 hover:text-blue-600 border border-transparent rounded-lg hover:bg-blue-50 transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            {!loading && filteredUsers.length === 0 && (
                <div className="p-8 text-center text-slate-500">No users found.</div>
            )}
        </div>
    );
}
