// ─────────────────────────────────────────────────────────────
// MedEduAI – Subscription & Feature Gating Utility
// ─────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

export interface SubscriptionInfo {
  plan_tier: PlanTier;
  billing_status: BillingStatus;
  trial_start_date: string;
  trial_end_date: string;
  ai_tokens_balance: number;
  ai_tokens_allotment: number;
  bonus_tokens: number;
  tokens_reset_date: string;
  razorpay_subscription_id?: string;
  payment_failure_count: number;
}

import { isEmailApproved } from '@/app/dashboard/admin/mentoring/mentorshipAccess';
import { isEnterpriseApproved } from '@/lib/enterpriseAccess';

// ── Plan pricing (in paise for Razorpay) ─────────────────
export const PLAN_CONFIG = {
  free: {
    name: 'Free Package',
    priceINR: 0,
    pricePaise: 0,
    tokensPerMonth: 0,
    trialDays: 0,
    description: 'Mentorship MS, Elective MS, Logbook MS (If Institution Subscribed)',
    audience: 'All Users',
    color: 'slate',
  },
  basic: {
    name: 'Basic',
    priceINR: 200,
    pricePaise: 20000,
    tokensPerMonth: 50000,
    trialDays: 0,
    description: 'Free package + LMS Notes (Rs 200)',
    audience: 'Student only',
    color: 'blue',
  },
  standard: {
    name: 'Standard',
    priceINR: 500,
    pricePaise: 50000,
    tokensPerMonth: 100000,
    trialDays: 0,
    description: 'Free package + All features of Learning / Teaching',
    audience: 'Student / Teacher',
    color: 'emerald',
  },
  premium: {
    name: 'Premium',
    priceINR: 1000,
    pricePaise: 100000,
    tokensPerMonth: 300000,
    trialDays: 0,
    description: 'Free package + All features of Department Head',
    audience: 'Department Head',
    color: 'purple',
  },
  enterprise: {
    name: 'Enterprise',
    priceINR: -1, // Custom
    pricePaise: -1,
    tokensPerMonth: 1000000,
    trialDays: 0,
    description: 'Mentoring MS, Elective MS, Log Book MS (if approved by Super Admin)',
    audience: 'Institutions',
    color: 'amber',
  },
} as const;

// ── Feature access matrix ────────────────────────────────
// Each key is a module slug; the value is the minimum plan_tier required.
export const FEATURE_ACCESS: Record<string, PlanTier[]> = {
  // LEARNING features
  'lms-notes':             ['basic', 'standard', 'premium', 'enterprise'],
  'notes-creator':         ['standard', 'premium', 'enterprise'],
  'ai-mentor':             ['standard', 'premium', 'enterprise'],
  'viva-simulator':        ['standard', 'premium', 'enterprise'],
  'vocabulary':            ['standard', 'premium', 'enterprise'],
  'reflection-generator':  ['standard', 'premium', 'enterprise'],
  'essay-qs-generator':    ['standard', 'premium', 'enterprise'],
  'mcqs-generator':        ['standard', 'premium', 'enterprise'],
  'self-evaluation':       ['standard', 'premium', 'enterprise'],

  // TEACHING features
  'lesson-plan':           ['standard', 'premium', 'enterprise'],
  'rubrics-generator':     ['standard', 'premium', 'enterprise'],
  'assignments':           ['standard', 'premium', 'enterprise'],
  'dig-eval-assist':       ['standard', 'premium', 'enterprise'],

  // DEPARTMENT ADMIN features
  'classroom-generator':   ['premium', 'enterprise'],
  'timetable-ms':          ['premium', 'enterprise'],
  'attendance-ms':         ['premium', 'enterprise'],
  'q-paper-dev':           ['premium', 'enterprise'],
  'ems-essay':             ['premium', 'enterprise'],
  'emr-mcqs':              ['premium', 'enterprise'],

  // ENTERPRISE
  'mentoring-ms':          ['enterprise'],
  'mentorship-ms':         ['enterprise'],
  'elective-ms':           ['enterprise'],
  'logbook-ms':            ['enterprise'],
};

/**
 * Check if a user's plan allows access to a specific feature.
 * During trial period, all Learning features are unlocked.
 */
export function canAccessFeature(
  featureSlug: string,
  planTier: PlanTier,
  billingStatus: BillingStatus,
  trialEndDate: string,
  email?: string
): { allowed: boolean; requiredPlan: PlanTier | null } {
  // 1. Enterprise/Mentorship features logic
  if (['mentorship-ms', 'mentoring-ms', 'elective-ms', 'logbook-ms'].includes(featureSlug)) {
    // Strict approval: enterprise tier no longer grants auto access.
    // Must be explicitly approved by Super Admin (Enterprise) OR Department Admin (Mentorship).
    if (email && isEnterpriseApproved(email)) {
      return { allowed: true, requiredPlan: null };
    }
    if (email && isEmailApproved(email)) {
      return { allowed: true, requiredPlan: null };
    }
    return { allowed: false, requiredPlan: 'enterprise' };
  }

  const allowedPlans = FEATURE_ACCESS[featureSlug];

  // If feature isn't mapped, allow by default (safe fallback)
  if (!allowedPlans) return { allowed: true, requiredPlan: null };

  // Note: Free trial logic removed as Free is now a perpetual package for MS only

  // Check if current plan is in the allowed list
  if (allowedPlans.includes(planTier)) {
    return { allowed: true, requiredPlan: null };
  }

  // Find the cheapest plan that allows this feature
  const planHierarchy: PlanTier[] = ['free', 'basic', 'standard', 'premium', 'enterprise'];
  const cheapestRequired = planHierarchy.find(p => allowedPlans.includes(p)) || 'enterprise';
  return { allowed: false, requiredPlan: cheapestRequired };
}

/**
 * Calculate remaining trial days.
 */
export function getTrialDaysRemaining(trialEndDate: string): number {
  const end = new Date(trialEndDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if trial has expired.
 */
export function isTrialExpired(trialEndDate: string): boolean {
  return new Date(trialEndDate) <= new Date();
}

/**
 * Get the human-readable upgrade prompt for a locked feature.
 */
export function getUpgradeMessage(requiredPlan: PlanTier): string {
  const config = PLAN_CONFIG[requiredPlan];
  if (requiredPlan === 'enterprise') {
    return `Your institution has not subscribed to this module. Please ask them to contact us.`;
  }
  return `Upgrade to ${config.name} (₹${config.priceINR}/month) to unlock this feature.`;
}

/**
 * Map a feature slug from a dashboard pathname.
 */
export function getFeatureSlugFromPath(pathname: string): string | null {
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];

  const pathToSlug: Record<string, string> = {
    'notes': 'lms-notes',
    'notes-creator': 'notes-creator',
    'mentorship': 'mentorship-ms',
    'elective': 'elective-ms',
    'mentor': 'ai-mentor',
    'viva': 'viva-simulator',
    'vocab': 'vocabulary',
    'reflection': 'reflection-generator',
    'essays': 'essay-qs-generator',
    'mcqs': 'mcqs-generator',
    'self-eval-system': 'self-evaluation',
    'lesson-plan': 'lesson-plan',
    'rubrics-generator': 'rubrics-generator',
    'assignments': 'assignments',
    'dig-eval-assist': 'dig-eval-assist',
    'classroom-generator': 'classroom-generator',
    'timetable': 'timetable-ms',
    'attendance': 'attendance-ms',
    'q-paper': 'q-paper-dev',
    'ems': 'ems-essay',
    'emr-mcq': 'emr-mcqs',
    'mentoring': 'mentoring-ms',
    'logbook': 'logbook-ms',
    'dept-elective': 'elective-ms',
  };

  return pathToSlug[lastSegment] || null;
}

