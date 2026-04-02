"use client";

import React, { useState, useEffect } from 'react';
import { Gift, Award, Trophy, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ReferralCard() {
    const [referralCode, setReferralCode] = useState('');
    const [totalReferred, setTotalReferred] = useState(0);
    const [totalSubscribed, setTotalSubscribed] = useState(0);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReferralStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.id) return;

                const res = await fetch(`/api/referral/stats?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setReferralCode(data.referral_code || '');
                    setTotalReferred(data.total_referred || 0);
                    setTotalSubscribed(data.total_subscribed || 0);
                }
            } catch (err) {
                console.error('Failed to fetch referral stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReferralStats();
    }, []);

    const referralLink = referralCode
        ? (typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : '')
        : '';

    const shareText = `🩺 Check out MedEduAI — an AI-powered platform for medical education! Get your FREE account and explore AI-driven learning tools. Sign up here: ${referralLink}`;

    const handleCopy = async () => {
        if (!referralLink) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(referralLink);
            } else {
                // Fallback for non-HTTPS or older browsers
                const textArea = document.createElement('textarea');
                textArea.value = referralLink;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleShare = (platform: string) => {
        const encodedText = encodeURIComponent(shareText);
        const encodedLink = encodeURIComponent(referralLink);
        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${encodedText}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
            telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodeURIComponent('🩺 AI-powered medical education platform — MedEduAI')}`,
        };
        window.open(urls[platform], '_blank', 'noopener,noreferrer');
    };

    const progress = Math.min((totalSubscribed / 100) * 100, 100);
    const nextMilestone = totalSubscribed < 100 ? 100 : 1000;

    if (loading) return null;

    return (
        <div className="mt-10 rounded-3xl overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 shadow-sm">
            <div className="p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Gift size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Want to Support MedEduAI?</h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Share on social media & earn <span className="text-amber-600 font-bold">FREE Premium Access!</span>
                        </p>
                    </div>
                </div>

                {/* Referral Link */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                        YOUR REFERRAL LINK
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={referralLink}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-sm font-mono focus:outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                copied
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                        >
                            {copied ? (
                                <><Check size={16} /> Copied!</>
                            ) : (
                                <><Copy size={16} /> Copy</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button
                        onClick={() => handleShare('whatsapp')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] rounded-xl hover:bg-[#25D366]/20 transition-colors text-sm font-bold"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                    </button>
                    <button
                        onClick={() => handleShare('linkedin')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] rounded-xl hover:bg-[#0A66C2]/20 transition-colors text-sm font-bold"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                    </button>
                    <button
                        onClick={() => handleShare('twitter')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-500/5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-500/10 transition-colors text-sm font-bold"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        X / Twitter
                    </button>
                    <button
                        onClick={() => handleShare('telegram')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0088CC]/10 border border-[#0088CC]/30 text-[#0088CC] rounded-xl hover:bg-[#0088CC]/20 transition-colors text-sm font-bold"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        Telegram
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                        <div className="text-3xl font-black text-emerald-500">{totalReferred}</div>
                        <div className="text-sm text-slate-500 font-medium mt-1">Users Joined</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                        <div className="text-3xl font-black text-slate-800">{totalSubscribed}</div>
                        <div className="text-sm text-slate-500 font-medium mt-1">Subscribed</div>
                    </div>
                </div>

                {/* Progress */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-800">Progress to Next Reward</span>
                        <span className="text-xs font-bold text-amber-600">
                            {totalSubscribed} / {nextMilestone} subscribers
                        </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-1000"
                            style={{ width: `${Math.min((totalSubscribed / nextMilestone) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Reward Tiers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`rounded-2xl border p-5 ${
                        totalSubscribed >= 100
                            ? 'border-emerald-400/40 bg-emerald-50'
                            : 'border-slate-200 bg-white'
                    } shadow-sm`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={18} className={totalSubscribed >= 100 ? 'text-emerald-500' : 'text-amber-500'} />
                            <span className="font-bold text-slate-800 text-sm">100 Paid Subscribers</span>
                            {totalSubscribed >= 100 && (
                                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md font-bold">UNLOCKED</span>
                            )}
                        </div>
                        <p className="text-slate-500 text-xs">
                            Get <strong className="text-amber-600">FREE Premium for 1 Month</strong>
                        </p>
                    </div>
                    <div className={`rounded-2xl border p-5 ${
                        totalSubscribed >= 1000
                            ? 'border-emerald-400/40 bg-emerald-50'
                            : 'border-slate-200 bg-white'
                    } shadow-sm`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy size={18} className={totalSubscribed >= 1000 ? 'text-emerald-500' : 'text-amber-500'} />
                            <span className="font-bold text-slate-800 text-sm">1,000 Paid Subscribers</span>
                            {totalSubscribed >= 1000 && (
                                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md font-bold">UNLOCKED</span>
                            )}
                        </div>
                        <p className="text-slate-500 text-xs">
                            Get <strong className="text-amber-600">FREE Premium for 1 Year</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
