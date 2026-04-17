import { useTokenStore, TokenTransaction, TokenWallet } from '../store/tokenStore';

export const tokenService = {
    /**
     * Estimates cost and checks if user has enough tokens.
     */
    checkAvailability: (userId: string, featureName: string): { allowed: boolean, required: number, remaining: number, reason?: string } => {
        const state = useTokenStore.getState();
        const wallet = state.getWallet(userId);

        if (!wallet) {
            // Auto-create wallet for new users
            state.createWallet(userId);
            return tokenService.checkAvailability(userId, featureName);
        }

        let setting = state.settings.find(s => s.featureName === featureName);
        if (!setting) {
            // Hot-add fallbacks for newly created features seamlessly skipping 'Feature not configured' lockout
            setting = { id: `auto-${Date.now()}`, featureName, baseTokenCost: 30, multiplier: 1, status: 'active', updatedAt: new Date().toISOString() };
        }

        if (setting.status === 'inactive') {
            return { allowed: false, required: 0, remaining: wallet.totalTokens, reason: 'Feature is currently disabled' };
        }

        const requiredTokens = Math.ceil(setting.baseTokenCost * setting.multiplier);

        if (wallet.totalTokens < requiredTokens) {
            return { allowed: false, required: requiredTokens, remaining: wallet.totalTokens, reason: 'Insufficient tokens' };
        }

        return { allowed: true, required: requiredTokens, remaining: wallet.totalTokens };
    },

    /**
     * Deducts tokens and logs the transaction. 
     * Call this AFTER a successful AI generation.
     */
    processTransaction: (userId: string, featureName: string, aiModel: string = 'gemini-1.5-flash'): boolean => {
        const state = useTokenStore.getState();
        let setting = state.settings.find(s => s.featureName === featureName);

        if (!setting) {
             setting = { id: `auto-${Date.now()}`, featureName, baseTokenCost: 30, multiplier: 1, status: 'active', updatedAt: new Date().toISOString() };
        }

        const requiredTokens = Math.ceil(setting.baseTokenCost * setting.multiplier);
        const { success } = state.deductTokens(userId, requiredTokens);

        if (success) {
            state.logTransaction({
                userId,
                featureUsed: featureName,
                aiModel,
                baseTokens: setting.baseTokenCost,
                multiplier: setting.multiplier,
                tokensDeducted: requiredTokens,
                status: 'success'
            });
            return true;
        } else {
            state.logTransaction({
                userId,
                featureUsed: featureName,
                aiModel,
                baseTokens: setting.baseTokenCost,
                multiplier: setting.multiplier,
                tokensDeducted: 0,
                status: 'failed'
            });
            return false;
        }
    },

    /**
     * Admin function: Add/Remove tokens manually
     */
    adjustTokens: (adminId: string, targetUserId: string, amount: number, type: 'free' | 'paid', action: 'add' | 'remove', reason: string) => {
        const state = useTokenStore.getState();
        let wallet = state.getWallet(targetUserId);

        if (!wallet) {
            // Auto-create an empty wallet for the user so we can adjust it
            state.createWallet(targetUserId, { freeTokens: 0, paidTokens: 0 });
            wallet = state.getWallet(targetUserId);
        }

        if (!wallet) return false;

        let finalFree = wallet.freeTokens;
        let finalPaid = wallet.paidTokens;

        if (action === 'add') {
            if (type === 'free') finalFree += amount;
            if (type === 'paid') finalPaid += amount;
        } else {
            if (type === 'free') finalFree = Math.max(0, finalFree - amount);
            if (type === 'paid') finalPaid = Math.max(0, finalPaid - amount);
        }

        state.updateWallet(targetUserId, { freeTokens: finalFree, paidTokens: finalPaid });

        state.logAdjustment({
            adminId,
            userId: targetUserId,
            tokensAdded: action === 'add' ? amount : 0,
            tokensRemoved: action === 'remove' ? amount : 0,
            reason
        });

        return true;
    }
};
