"use client";

import { X, Lock, Zap, Crown, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PLAN_CONFIG, PlanTier } from '@/lib/subscription';

interface UpgradePromptOverlayProps {
  featureName: string;
  requiredPlan: PlanTier;
  currentPlan: PlanTier;
  onClose?: () => void;
}

export default function UpgradePromptOverlay({ featureName, requiredPlan, currentPlan, onClose }: UpgradePromptOverlayProps) {
  const planConfig = PLAN_CONFIG[requiredPlan];
  const isEnterprise = requiredPlan === 'enterprise';

  const planBenefits: Record<string, string[]> = {
    basic: [
      'LMS Notes access',
      'Mentorship Management',
      '50,000 AI tokens/month',
    ],
    standard: [
      'Everything in Basic',
      'AI MentorPro, Viva Simulator',
      'Vocabulary, Reflection Generator',
      'Essay Qs & MCQs Generator',
      'Self-Evaluation System',
      'Full Teaching suite',
      '1,00,000 AI tokens/month',
    ],
    premium: [
      'Everything in Standard',
      'Classroom Generator',
      'Time Table & Attendance MS',
      'Q-Paper Dev, EMS, EMR',
      '3,00,000 AI tokens/month',
    ],
    enterprise: [
      'Mentoring Management System',
      'Elective Management System',
      'Log Book Management',
      'Custom token allocation',
      'Dedicated support',
    ],
  };

  const benefits = planBenefits[requiredPlan] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-8">
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8 text-slate-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2">
            {featureName} is Locked
          </h3>
          <p className="text-sm text-slate-500 text-center mb-6 max-w-xs mx-auto">
            {isEnterprise
              ? 'This feature is available exclusively for institutional plans.'
              : `Upgrade to ${planConfig.name} to unlock this feature and much more.`
            }
          </p>

          {/* Plan card */}
          <div className="bg-gradient-to-br from-slate-50 to-cyan-50/30 border border-slate-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-500" />
                <span className="font-bold text-slate-900">{planConfig.name}</span>
              </div>
              {!isEnterprise ? (
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-slate-900">₹{planConfig.priceINR}</span>
                  <span className="text-xs text-slate-500 font-medium">/mo</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Custom</span>
              )}
            </div>

            <div className="space-y-2">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            {isEnterprise ? (
              <a
                href="#contact"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href="/dashboard/student/upgrade"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5"
              >
                Upgrade to {planConfig.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <p className="text-[11px] text-slate-400 text-center">
              You&apos;re currently on the <span className="font-bold capitalize">{currentPlan}</span> plan.
              {currentPlan === 'free' && ' 15-day trial features are available.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
