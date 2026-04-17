import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TokenWallet {
    id: string;
    userId: string;
    freeTokens: number;
    paidTokens: number;
    totalTokens: number;
    lastUpdated: string;
}

export interface TokenTransaction {
    id: string;
    userId: string;
    featureUsed: string;
    aiModel: string;
    baseTokens: number;
    multiplier: number;
    tokensDeducted: number;
    timestamp: string;
    status: 'success' | 'failed';
}

export interface TokenSetting {
    id: string;
    featureName: string;
    baseTokenCost: number;
    multiplier: number;
    status: 'active' | 'inactive';
    updatedAt: string;
}

export interface TokenAdjustment {
    id: string;
    adminId: string;
    userId: string;
    tokensAdded: number;
    tokensRemoved: number;
    reason: string;
    timestamp: string;
}

interface TokenState {
    wallets: TokenWallet[];
    transactions: TokenTransaction[];
    settings: TokenSetting[];
    adjustments: TokenAdjustment[];

    // Wallet Actions
    getWallet: (userId: string) => TokenWallet | undefined;
    createWallet: (userId: string, initialBalances?: Partial<TokenWallet>) => void;
    updateWallet: (userId: string, updates: Partial<TokenWallet>) => void;
    deductTokens: (userId: string, amount: number) => { success: boolean; remaining: number };

    // Setting Actions
    updateSetting: (id: string, updates: Partial<TokenSetting>) => void;

    // Log Actions
    logTransaction: (tx: Omit<TokenTransaction, 'id' | 'timestamp'>) => void;
    logAdjustment: (adj: Omit<TokenAdjustment, 'id' | 'timestamp'>) => void;
}

const defaultSettings: TokenSetting[] = [
    { id: '1', featureName: 'AI Mentor', baseTokenCost: 10, multiplier: 1, status: 'active', updatedAt: new Date().toISOString() },
    { id: '2', featureName: 'Notes Generator', baseTokenCost: 50, multiplier: 2, status: 'active', updatedAt: new Date().toISOString() },
    { id: '3', featureName: 'MCQ Generator', baseTokenCost: 30, multiplier: 1.5, status: 'active', updatedAt: new Date().toISOString() },
    { id: '4', featureName: 'Flashcard Generator', baseTokenCost: 20, multiplier: 1, status: 'active', updatedAt: new Date().toISOString() },
    { id: '5', featureName: 'Case Generator', baseTokenCost: 100, multiplier: 2, status: 'active', updatedAt: new Date().toISOString() },
    { id: '6', featureName: 'OSCE Generator', baseTokenCost: 150, multiplier: 3, status: 'active', updatedAt: new Date().toISOString() },
    { id: '7', featureName: 'Blog Generator', baseTokenCost: 500, multiplier: 2, status: 'active', updatedAt: new Date().toISOString() }
];

const defaultWallets: TokenWallet[] = [
    { id: 'w1', userId: '1', freeTokens: 500, paidTokens: 0, totalTokens: 500, lastUpdated: new Date().toISOString() },
    { id: 'w2', userId: '2', freeTokens: 200, paidTokens: 1000, totalTokens: 1200, lastUpdated: new Date().toISOString() },
    { id: 'w3', userId: '3', freeTokens: 1000, paidTokens: 5000, totalTokens: 6000, lastUpdated: new Date().toISOString() },
    // Superadmin has practically infinite
    { id: 'w6', userId: '6', freeTokens: 999999, paidTokens: 999999, totalTokens: 1999998, lastUpdated: new Date().toISOString() }
];

export const useTokenStore = create<TokenState>()(
    persist(
        (set, get) => ({
            wallets: defaultWallets,
            transactions: [],
            settings: defaultSettings,
            adjustments: [],

            getWallet: (userId) => get().wallets.find(w => w.userId === userId),

            createWallet: (userId, initialBalances) => set((state) => {
                if (state.wallets.some(w => w.userId === userId)) return state;
                const newWallet: TokenWallet = {
                    id: Math.random().toString(36).substr(2, 9),
                    userId,
                    freeTokens: 300, // Initial free limit
                    paidTokens: 0,
                    ...initialBalances,
                    totalTokens: 0, // Recalculated below
                    lastUpdated: new Date().toISOString()
                };
                newWallet.totalTokens = newWallet.freeTokens + newWallet.paidTokens;
                return { wallets: [...state.wallets, newWallet] };
            }),

            updateWallet: (userId, updates) => set((state) => ({
                wallets: state.wallets.map(w => {
                    if (w.userId === userId) {
                        const newW = { ...w, ...updates, lastUpdated: new Date().toISOString() };
                        newW.totalTokens = newW.freeTokens + newW.paidTokens;
                        return newW;
                    }
                    return w;
                })
            })),

            deductTokens: (userId, amount) => {
                const state = get();
                const wallet = state.wallets.find(w => w.userId === userId);

                if (!wallet) return { success: false, remaining: 0 };
                if (wallet.totalTokens < amount) return { success: false, remaining: wallet.totalTokens };

                let remainingAmountToDeduct = amount;
                let newFree = wallet.freeTokens;
                let newPaid = wallet.paidTokens;

                if (newFree >= remainingAmountToDeduct) {
                    newFree -= remainingAmountToDeduct;
                } else {
                    remainingAmountToDeduct -= newFree;
                    newFree = 0;
                    newPaid -= remainingAmountToDeduct;
                }

                set((s) => ({
                    wallets: s.wallets.map(w => w.userId === userId ? {
                        ...w,
                        freeTokens: newFree,
                        paidTokens: newPaid,
                        totalTokens: newFree + newPaid,
                        lastUpdated: new Date().toISOString()
                    } : w)
                }));

                return { success: true, remaining: newFree + newPaid };
            },

            updateSetting: (id, updates) => set((state) => ({
                settings: state.settings.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
            })),

            logTransaction: (tx) => set((state) => ({
                transactions: [
                    { ...tx, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() },
                    ...state.transactions
                ]
            })),

            logAdjustment: (adj) => set((state) => ({
                adjustments: [
                    { ...adj, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() },
                    ...state.adjustments
                ]
            }))
        }),
        {
            name: 'token-economy-storage',
            version: 1,
        }
    )
);
