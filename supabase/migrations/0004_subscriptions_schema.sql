-- ==========================================
-- MedEduAI Subscription & Token Management
-- Migration: 0004_subscriptions_schema
-- ==========================================

-- 1. Plan Tier Enum
DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('free', 'basic', 'standard', 'premium', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Billing Status Enum
DO $$ BEGIN
    CREATE TYPE billing_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_tier plan_tier NOT NULL DEFAULT 'free',
    billing_status billing_status NOT NULL DEFAULT 'trialing',
    
    -- Trial fields
    trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
    
    -- Token fields
    ai_tokens_balance INT NOT NULL DEFAULT 10000,   -- starts with 10k trial tokens
    ai_tokens_allotment INT NOT NULL DEFAULT 10000,  -- monthly reset value
    tokens_reset_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    
    -- Razorpay fields
    razorpay_subscription_id TEXT,
    razorpay_customer_id TEXT,
    razorpay_plan_id TEXT,
    last_payment_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    payment_failure_count INT DEFAULT 0,
    
    -- Admin overrides
    bonus_tokens INT DEFAULT 0,
    trial_extended_by UUID,  -- admin who extended
    trial_extension_days INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Payment History
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    amount_paise INT NOT NULL,  -- stored in paise (Rs 200 = 20000)
    currency TEXT DEFAULT 'INR',
    plan_tier plan_tier NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, captured, failed, refunded
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Token Usage Log (for audit trail)
CREATE TABLE IF NOT EXISTS public.token_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    tokens_used INT NOT NULL,
    ai_model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Admin Token Adjustments Log
CREATE TABLE IF NOT EXISTS public.admin_token_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    target_user_id UUID NOT NULL REFERENCES auth.users(id),
    adjustment_type TEXT NOT NULL,  -- 'bonus_tokens', 'trial_extension'
    amount INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_token_adjustments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- Subscriptions: Users can read their own, admins can read/write all
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
    FOR ALL USING (true);

-- Payment history: Users can read their own
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
CREATE POLICY "Users can view own payments" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages payments" ON public.payment_history;
CREATE POLICY "Service role manages payments" ON public.payment_history
    FOR ALL USING (true);

-- Token usage: Users can read their own
DROP POLICY IF EXISTS "Users can view own token usage" ON public.token_usage_log;
CREATE POLICY "Users can view own token usage" ON public.token_usage_log
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages token usage" ON public.token_usage_log;
CREATE POLICY "Service role manages token usage" ON public.token_usage_log
    FOR ALL USING (true);

-- Admin adjustments: only service role
DROP POLICY IF EXISTS "Service role manages adjustments" ON public.admin_token_adjustments;
CREATE POLICY "Service role manages adjustments" ON public.admin_token_adjustments
    FOR ALL USING (true);

-- 9. Function: Initialize subscription for new user (called from handle_new_user trigger)
CREATE OR REPLACE FUNCTION public.initialize_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan_tier, billing_status, ai_tokens_balance, ai_tokens_allotment)
    VALUES (NEW.id, 'free', 'trialing', 10000, 10000)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Trigger: Auto-create subscription on new user
DROP TRIGGER IF EXISTS on_new_user_subscription ON auth.users;
CREATE TRIGGER on_new_user_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.initialize_subscription();

-- 11. Function: Deduct tokens atomically
CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id UUID, p_amount INT, p_feature TEXT, p_model TEXT DEFAULT 'gemini')
RETURNS JSON AS $$
DECLARE
    v_balance INT;
    v_bonus INT;
    v_total INT;
    v_remaining INT;
BEGIN
    SELECT ai_tokens_balance, bonus_tokens
    INTO v_balance, v_bonus
    FROM public.subscriptions
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No subscription found', 'remaining', 0);
    END IF;

    v_total := v_balance + COALESCE(v_bonus, 0);

    IF v_total < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient tokens', 'remaining', v_total);
    END IF;

    -- Deduct from bonus first, then from balance
    IF COALESCE(v_bonus, 0) >= p_amount THEN
        UPDATE public.subscriptions
        SET bonus_tokens = bonus_tokens - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSIF COALESCE(v_bonus, 0) > 0 THEN
        UPDATE public.subscriptions
        SET ai_tokens_balance = ai_tokens_balance - (p_amount - bonus_tokens),
            bonus_tokens = 0,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        UPDATE public.subscriptions
        SET ai_tokens_balance = ai_tokens_balance - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    v_remaining := v_total - p_amount;

    -- Log usage
    INSERT INTO public.token_usage_log (user_id, feature_name, tokens_used, ai_model)
    VALUES (p_user_id, p_feature, p_amount, p_model);

    RETURN json_build_object('success', true, 'remaining', v_remaining, 'deducted', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
