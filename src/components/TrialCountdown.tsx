"use client";

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import Link from 'next/link';

interface TrialCountdownProps {
  trialEndDate: string;
  billingStatus: string;
  planTier: string;
}

export default function TrialCountdown({ trialEndDate, billingStatus, planTier }: TrialCountdownProps) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const end = new Date(trialEndDate);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      setDaysLeft(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
      setHoursLeft(Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))));
    };
    update();
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [trialEndDate]);

  if (!mounted) return null;

  // Don't show for active paid plans or enterprise
  if (billingStatus === 'active' && planTier !== 'free') return null;
  if (planTier === 'enterprise') return null;

  const isExpired = daysLeft <= 0 && hoursLeft <= 0;
  const isUrgent = daysLeft <= 3;

  if (billingStatus === 'expired' || isExpired) {
    return (
      <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Trial Expired</span>
        </div>
        <p className="text-[11px] text-red-600 leading-snug mb-2">Your free trial has ended. Upgrade to continue using AI features.</p>
        <Link
          href="/dashboard/student/upgrade"
          className="block text-center text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 px-3 py-2 rounded-lg hover:shadow-md hover:shadow-red-500/20 transition-all"
        >
          Upgrade Now →
        </Link>
      </div>
    );
  }

  return (
    <div className={`mx-3 mt-3 p-3 rounded-xl border transition-all ${isUrgent ? 'bg-amber-50 border-amber-200' : 'bg-cyan-50 border-cyan-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-amber-100' : 'bg-cyan-100'}`}>
          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600' : 'text-cyan-600'}`} />
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${isUrgent ? 'text-amber-700' : 'text-cyan-700'}`}>
          Free Trial
        </span>
      </div>
      
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-extrabold tracking-tight ${isUrgent ? 'text-amber-700' : 'text-cyan-700'}`}>{daysLeft}</span>
        <span className={`text-[11px] font-bold ${isUrgent ? 'text-amber-600' : 'text-cyan-600'}`}>days</span>
        <span className={`text-lg font-bold ${isUrgent ? 'text-amber-500' : 'text-cyan-500'}`}>{hoursLeft}</span>
        <span className={`text-[11px] font-bold ${isUrgent ? 'text-amber-600' : 'text-cyan-600'}`}>hrs left</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isUrgent ? 'bg-gradient-to-r from-amber-400 to-red-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
          style={{ width: `${Math.max(5, (daysLeft / 15) * 100)}%` }}
        />
      </div>

      <Link
        href="/dashboard/student/upgrade"
        className={`flex items-center justify-center gap-1.5 text-[10px] font-bold px-3 py-2 rounded-lg transition-all ${
          isUrgent 
            ? 'text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-md hover:shadow-amber-500/20' 
            : 'text-cyan-700 bg-white/60 hover:bg-white border border-cyan-200'
        }`}
      >
        <Zap className="w-3 h-3" />
        {isUrgent ? 'Upgrade Now' : 'View Plans'}
      </Link>
    </div>
  );
}
