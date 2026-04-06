"use client";

import { useState, useEffect } from 'react';
import { Coins, Zap, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface TokenUsageMeterProps {
  balance: number;
  allotment: number;
  bonusTokens: number;
  planTier: string;
}

export default function TokenUsageMeter({ balance, allotment, bonusTokens, planTier }: TokenUsageMeterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const totalAvailable = balance + bonusTokens;
  const maxTokens = Math.max(allotment, totalAvailable);
  const usagePercent = maxTokens > 0 ? Math.min(100, (totalAvailable / maxTokens) * 100) : 0;
  const isLow = totalAvailable < (allotment * 0.15); // less than 15%
  const isCritical = totalAvailable < (allotment * 0.05); // less than 5%

  const formatTokens = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className={`mx-3 mt-2 p-3 rounded-xl border transition-all ${
      isCritical ? 'bg-red-50 border-red-200' : 
      isLow ? 'bg-amber-50 border-amber-200' : 
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isCritical ? 'bg-red-100 text-red-600' : 
            isLow ? 'bg-amber-100 text-amber-600' : 
            'bg-emerald-50 text-emerald-600'
          }`}>
            <Coins className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">AI Tokens</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
          planTier === 'premium' ? 'bg-purple-100 text-purple-600' :
          planTier === 'standard' ? 'bg-emerald-100 text-emerald-600' :
          planTier === 'basic' ? 'bg-blue-100 text-blue-600' :
          'bg-slate-100 text-slate-500'
        }`}>{planTier}</span>
      </div>

      <div className="flex items-baseline gap-1 mb-1.5">
        <span className={`text-xl font-extrabold tracking-tight ${
          isCritical ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-slate-900'
        }`}>{formatTokens(totalAvailable)}</span>
        <span className="text-[10px] text-slate-400 font-medium">/ {formatTokens(allotment)}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isCritical ? 'bg-gradient-to-r from-red-400 to-red-600' : 
            isLow ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
            'bg-gradient-to-r from-emerald-400 to-cyan-500'
          }`}
          style={{ width: `${Math.max(2, usagePercent)}%` }}
        />
      </div>

      {bonusTokens > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3 h-3 text-purple-500" />
          <span className="text-[10px] font-bold text-purple-600">+{formatTokens(bonusTokens)} bonus</span>
        </div>
      )}

      {(isLow || isCritical) && (
        <div className={`flex items-center gap-1.5 mb-2 text-[10px] font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
          <TrendingDown className="w-3 h-3" />
          {isCritical ? 'Critically low! AI features may stop working.' : 'Running low on tokens.'}
        </div>
      )}

      {planTier === 'free' && (
        <Link
          href="/dashboard/student/upgrade"
          className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 rounded-lg hover:shadow-md hover:shadow-cyan-500/20 transition-all"
        >
          <Zap className="w-3 h-3" />
          Get More Tokens
        </Link>
      )}
    </div>
  );
}
