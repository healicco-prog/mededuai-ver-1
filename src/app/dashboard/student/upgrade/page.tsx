"use client";

import { useState, useEffect } from 'react';
import { Check, X, Zap, Crown, Star, Phone, Loader2, AlertCircle, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { PLAN_CONFIG, type PlanTier } from '@/lib/subscription';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  standard: boolean | string;
  premium: boolean | string;
  enterprise: boolean | string;
}

const PLAN_FEATURES: PlanFeature[] = [
  // LEARNING
  { name: 'LMS Notes', free: true, basic: true, standard: true, premium: true, enterprise: true },
  { name: 'Notes Creator', free: true, basic: true, standard: true, premium: true, enterprise: true },
  { name: 'Mentorship MS', free: true, basic: true, standard: true, premium: true, enterprise: true },
  { name: 'AI MentorPro', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Viva Simulator', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Vocabulary', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Reflection Generator', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Essay Qs Generator', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'MCQs Generator', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Self-Evaluation', free: '15-day trial', basic: false, standard: true, premium: true, enterprise: true },
  // TEACHING
  { name: 'Lesson Plan', free: false, basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Rubrics Generator', free: false, basic: false, standard: true, premium: true, enterprise: true },
  { name: 'Dig Evaluation Assist', free: false, basic: false, standard: true, premium: true, enterprise: true },
  // DEPARTMENT ADMIN
  { name: 'Classroom Generator', free: false, basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Time Table MS', free: false, basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Attendance MS', free: false, basic: false, standard: false, premium: true, enterprise: true },
  { name: 'Q-Paper Dev', free: false, basic: false, standard: false, premium: true, enterprise: true },
  { name: 'EMS – Essay', free: false, basic: false, standard: false, premium: true, enterprise: true },
  { name: 'EMR – MCQs', free: false, basic: false, standard: false, premium: true, enterprise: true },
  // ENTERPRISE
  { name: 'Mentoring MS', free: false, basic: false, standard: false, premium: false, enterprise: true },
  { name: 'Elective MS', free: false, basic: false, standard: false, premium: false, enterprise: true },
  { name: 'Log Book MS', free: false, basic: false, standard: false, premium: false, enterprise: true },
];

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email || '');
      setUserName(user.user_metadata?.full_name || '');

      try {
        const res = await fetch(`/api/subscription?userId=${user.id}`);
        if (res.ok) {
          const sub = await res.json();
          setCurrentPlan(sub.plan_tier || 'free');
        }
      } catch { /* fallback to free */ }
      setLoading(false);
    };
    fetchSubscription();

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleUpgrade = async (planTier: PlanTier) => {
    if (!userId) return;
    setPaymentLoading(planTier);
    setPaymentError('');
    setPaymentSuccess('');

    try {
      // 1. Create order
      const orderRes = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planTier }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const { orderId, amount, currency, keyId } = await orderRes.json();

      if (!keyId) {
        throw new Error('Razorpay is not configured yet. Please contact admin.');
      }

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'MedEduAI',
        description: `${PLAN_CONFIG[planTier].name} Plan - Monthly`,
        order_id: orderId,
        prefill: {
          email: userEmail,
          name: userName,
        },
        theme: {
          color: '#06b6d4',
        },
        handler: async (response: any) => {
          // 3. Verify payment
          try {
            const verifyRes = await fetch('/api/razorpay', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
                planTier,
              }),
            });

            if (verifyRes.ok) {
              setCurrentPlan(planTier);
              setPaymentSuccess(`Successfully upgraded to ${PLAN_CONFIG[planTier].name}! Your tokens have been activated.`);
            } else {
              const err = await verifyRes.json();
              setPaymentError(err.error || 'Payment verification failed. Please contact support.');
            }
          } catch {
            setPaymentError('Payment verification failed. Please contact support.');
          }
          setPaymentLoading(null);
        },
        modal: {
          ondismiss: () => setPaymentLoading(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      setPaymentError(error.message);
      setPaymentLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const plans: { key: PlanTier; icon: any; popular?: boolean }[] = [
    { key: 'basic', icon: Zap },
    { key: 'standard', icon: Star, popular: true },
    { key: 'premium', icon: Crown },
    { key: 'enterprise', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Choose Your Plan</h1>
        <p className="text-slate-500 max-w-xl">Unlock the full potential of AI-powered medical education. Select the plan that best fits your role and needs.</p>
      </div>

      {/* Status messages */}
      {paymentError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Payment Failed</p>
            <p className="text-sm">{paymentError}</p>
          </div>
        </div>
      )}
      {paymentSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Upgrade Successful!</p>
            <p className="text-sm">{paymentSuccess}</p>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {plans.map(({ key, icon: Icon, popular }) => {
          const config = PLAN_CONFIG[key];
          const isCurrent = currentPlan === key;
          const isEnterprise = key === 'enterprise';

          return (
            <div
              key={key}
              className={`relative bg-white border rounded-3xl p-6 transition-all hover:shadow-xl ${
                popular ? 'border-cyan-400 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-400/20' :
                isCurrent ? 'border-emerald-400 ring-2 ring-emerald-400/20' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className={`p-2.5 rounded-xl ${
                  key === 'basic' ? 'bg-blue-50 text-blue-600' :
                  key === 'standard' ? 'bg-emerald-50 text-emerald-600' :
                  key === 'premium' ? 'bg-purple-50 text-purple-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{config.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{config.audience}</p>
                </div>
              </div>

              <div className="mb-4">
                {isEnterprise ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-slate-900">Custom</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹{config.priceINR}</span>
                    <span className="text-sm text-slate-400 font-medium">/month</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-500 mb-4">{config.description}</p>

              {!isEnterprise && (
                <div className="flex items-center gap-2 mb-5 p-2 bg-slate-50 rounded-lg">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-bold text-slate-700">{(config.tokensPerMonth).toLocaleString()} AI tokens/month</span>
                </div>
              )}

              {isEnterprise ? (
                <a
                  href="/#contact"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Contact Us
                </a>
              ) : isCurrent ? (
                <button
                  disabled
                  className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-200 cursor-default"
                >
                  Current Plan ✓
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={!!paymentLoading}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  } disabled:opacity-50`}
                >
                  {paymentLoading === key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Upgrade to {config.name}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-900">Complete Feature Comparison</h2>
          <p className="text-sm text-slate-500 mt-1">See exactly what&apos;s included in each plan</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-4 px-6 text-sm font-bold text-slate-700">Feature</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-slate-400">Free Trial</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-blue-600">Basic ₹200</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-emerald-600">Standard ₹500</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-purple-600">Premium ₹1000</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-amber-600">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((feature, i) => (
                <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                  <td className="py-3 px-6 text-sm font-medium text-slate-700">{feature.name}</td>
                  {(['free', 'basic', 'standard', 'premium', 'enterprise'] as const).map(plan => (
                    <td key={plan} className="text-center py-3 px-4">
                      {typeof feature[plan] === 'string' ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{feature[plan]}</span>
                      ) : feature[plan] ? (
                        <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Token row */}
              <tr className="border-t-2 border-slate-200 bg-cyan-50/30">
                <td className="py-4 px-6 text-sm font-bold text-slate-900">AI Tokens / Month</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-slate-500">10,000</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-blue-600">50,000</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-emerald-600">1,00,000</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-purple-600">3,00,000</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-amber-600">Custom</td>
              </tr>
              <tr className="bg-cyan-50/30">
                <td className="py-4 px-6 text-sm font-bold text-slate-900">Price</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-slate-500">Free</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-blue-600">₹200/mo</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-emerald-600">₹500/mo</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-purple-600">₹1,000/mo</td>
                <td className="text-center py-4 px-4 text-sm font-bold text-amber-600">Call Us</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12 mb-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-6">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { q: 'What happens after my trial ends?', a: 'After 15 days, you\'ll be downgraded to the Free tier with no AI tokens. Upgrade anytime to restore access.' },
            { q: 'Can I change my plan later?', a: 'Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately with a new token allotment.' },
            { q: 'Do unused tokens roll over?', a: 'No. Tokens reset to your plan\'s allotment each month (strict SaaS billing). Use them before they reset!' },
            { q: 'What if my payment fails?', a: 'We\'ll retry up to 3 times. If payment continues to fail, your account will be downgraded to Free.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
