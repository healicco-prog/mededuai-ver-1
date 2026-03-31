"use client";

import { useTokenStore, TokenSetting } from '../../../../store/tokenStore';
import { useUserStore } from '../../../../store/userStore';
import { useState, useEffect } from 'react';
import { Settings, Users, Activity, Save, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react';
import { tokenService } from '../../../../lib/tokenService';

export default function TokensManagerClient() {
    const { settings, wallets, transactions, updateSetting } = useTokenStore();
    const { users } = useUserStore();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'logs'>('users');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [adjustAmount, setAdjustAmount] = useState(100);
    const [adjustType, setAdjustType] = useState<'free' | 'paid'>('paid');

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Token Economy Data...</div>;

    const handleMultiplierChange = (id: string, newMultiplier: number) => {
        updateSetting(id, { multiplier: newMultiplier });
    };

    const handleAdjustTokens = (action: 'add' | 'remove') => {
        if (!selectedUser) return;
        tokenService.adjustTokens('admin-script', selectedUser, adjustAmount, adjustType, action, 'Manual Admin Adjustment');
        setSelectedUser(null);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Token Economy</h1>
                    <p className="text-slate-500 mt-2">Manage AI feature multipliers, user wallets, and system economics.</p>
                </div>
            </div>

            <div className="flex space-x-2 border-b border-slate-200">
                <button onClick={() => setActiveTab('users')} className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'users' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Users className="w-4 h-4 inline mr-2" /> User Wallets</button>
                <button onClick={() => setActiveTab('settings')} className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Settings className="w-4 h-4 inline mr-2" /> Multipliers & Costs</button>
                <button onClick={() => setActiveTab('logs')} className={`px-5 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'logs' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Activity className="w-4 h-4 inline mr-2" /> Global Ledger</button>
            </div>

            {activeTab === 'users' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 text-lg">User Token Balances</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-bold">User</th>
                                    <th className="px-6 py-4 font-bold">Role</th>
                                    <th className="px-6 py-4 font-bold">Free Tokens</th>
                                    <th className="px-6 py-4 font-bold">Paid Tokens</th>
                                    <th className="px-6 py-4 font-bold">Total</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(user => {
                                    const wallet = wallets.find(w => w.userId === user.id) || { freeTokens: 0, paidTokens: 0, totalTokens: 0 };
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">{user.role}</span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-600">{wallet.freeTokens.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-semibold text-indigo-600">{wallet.paidTokens.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-extrabold text-slate-900">{wallet.totalTokens.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedUser(user.id)}
                                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-colors"
                                                >
                                                    Adjust Balance
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.map((setting) => (
                        <div key={setting.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{setting.featureName}</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Status: <span className="text-emerald-500 uppercase tracking-widest">{setting.status}</span></p>
                                </div>
                                <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                                    Base Cost: {setting.baseTokenCost}
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                                    <span>Current Multiplier</span>
                                    <span className="text-indigo-600">{setting.multiplier}x</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0.5" max="5.0" step="0.1"
                                        value={setting.multiplier}
                                        onChange={(e) => handleMultiplierChange(setting.id, parseFloat(e.target.value))}
                                        className="w-full accent-indigo-500"
                                    />
                                    <span className="font-extrabold text-slate-800 min-w-12 text-right">
                                        = {Math.ceil(setting.baseTokenCost * setting.multiplier)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="font-bold text-slate-800 text-lg">System AI Inference Ledger</h2>
                        <p className="text-xs text-slate-500 mt-1">Immutable log of token consumption across the platform.</p>
                    </div>
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic">No AI transactions recorded yet.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {transactions.map(tx => {
                                const user = users.find(u => u.id === tx.userId);
                                return (
                                    <li key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{tx.featureUsed}</p>
                                                <p className="text-xs text-slate-500">{user?.name} &bull; {tx.aiModel}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-extrabold text-red-500">-{tx.tokensDeducted}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{new Date(tx.timestamp).toLocaleString()}</div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {/* Adjustment Modal Overlay */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20">
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Adjust Token Balance</h3>
                        <p className="text-sm text-slate-500 mb-8">Modify the wallet manually for {users.find(u => u.id === selectedUser)?.name}.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Token Type</label>
                                <div className="flex gap-2">
                                    <button onClick={() => setAdjustType('paid')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${adjustType === 'paid' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} border`}>Paid Tokens</button>
                                    <button onClick={() => setAdjustType('free')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${adjustType === 'free' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'} border`}>Free Tokens</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount</label>
                                <input type="number" min="1" value={adjustAmount} onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setSelectedUser(null)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button onClick={() => handleAdjustTokens('add')} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2"><PlusCircle className="w-4 h-4" /> Add</button>
                                <button onClick={() => handleAdjustTokens('remove')} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2"><MinusCircle className="w-4 h-4" /> Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

