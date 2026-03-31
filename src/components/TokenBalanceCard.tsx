"use client";

import { useTokenStore } from '../store/tokenStore';
import { useUserStore } from '../store/userStore';
import { Coins, Zap, ShieldAlert, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TokenBalanceCard() {
    const currentUser = useUserStore(state => state.users[0]); // Using the first user as the logged-in mock
    const storeWallets = useTokenStore(state => state.wallets);
    const [wallet, setWallet] = useState(storeWallets.find(w => w.userId === currentUser?.id));
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (currentUser) {
            const w = useTokenStore.getState().getWallet(currentUser.id);
            if (!w) {
                useTokenStore.getState().createWallet(currentUser.id);
                setWallet(useTokenStore.getState().getWallet(currentUser.id));
            } else {
                setWallet(w);
            }
        }
    }, [currentUser, storeWallets]);

    if (!mounted || !wallet) return null;

    const total = wallet.totalTokens;
    const isLow = total < 100;

    return (
        <div className={`p-5 rounded-2xl border transition-all shadow-sm ${isLow ? 'bg-red-50/50 border-red-200 shadow-red-500/10' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isLow ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <Coins className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Token Balance</h3>
                        <p className={`text-xs ${isLow ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                            {isLow ? 'Low Balance' : 'Active Account'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {total.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Credits</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-500 font-medium mb-1">Free</span>
                    <span className="font-bold text-slate-700">{wallet.freeTokens.toLocaleString()}</span>
                </div>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center justify-center">
                    <span className="text-xs text-indigo-500 font-medium mb-1">Paid</span>
                    <span className="font-bold text-indigo-700">{wallet.paidTokens.toLocaleString()}</span>
                </div>
            </div>

            {isLow && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100 text-red-700 text-xs font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>Your token balance is running critically low. AI features may become unavailable.</span>
                </div>
            )}

            <button className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${isLow ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20' : 'bg-slate-900 hover:bg-emerald-600 text-white'}`}>
                <Zap className="w-4 h-4" />
                Buy More Tokens <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}
