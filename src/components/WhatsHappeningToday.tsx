"use client";

import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Activity, HeartPulse, Stethoscope } from 'lucide-react';

const getCategoryDetails = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('drug')) {
        return {
            icon: <Activity className="w-5 h-5 text-rose-500" />,
            badge: 'bg-rose-50 border-rose-100 text-rose-600',
        };
    } else if (cat.includes('research')) {
        return {
            icon: <Activity className="w-5 h-5 text-emerald-500" />,
            badge: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        };
    } else if (cat.includes('care')) {
        return {
            icon: <Stethoscope className="w-5 h-5 text-emerald-500" />,
            badge: 'bg-emerald-50 border-emerald-100 text-emerald-600',
        };
    } else if (cat.includes('education') || cat.includes('ed')) {
        return {
            icon: <Stethoscope className="w-5 h-5 text-amber-500" />,
            badge: 'bg-amber-50 border-amber-100 text-amber-600',
        };
    } else {
        return {
            icon: <HeartPulse className="w-5 h-5 text-blue-500" />,
            badge: 'bg-blue-50 border-blue-100 text-blue-600',
        };
    }
};

const SkeletonCard = () => (
    <div className="flex flex-col bg-slate-50/50 border border-slate-100 rounded-2xl p-5 animate-pulse">
        <div className="flex items-start justify-between mb-3">
            <div className="h-5 w-24 bg-slate-200 rounded-full" />
            <div className="h-4 w-4 bg-slate-200 rounded" />
        </div>
        <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0" />
            <div className="h-5 bg-slate-200 rounded w-3/4 mt-1" />
        </div>
        <div className="space-y-2 mb-3">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
        </div>
        <div className="h-3 bg-slate-200 rounded w-16 mt-auto" />
    </div>
);

export default function WhatsHappeningToday() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDate = `${year}-${month}-${day}`;

        fetch(`/api/dashboard/news?date=${localDate}`)
            .then(res => res.json())
            .then(data => {
                if (isMounted && data.success && Array.isArray(data.news)) {
                    setNews(data.news);
                }
            })
            .catch(err => {
                console.error("Error fetching news:", err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="mb-6 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                        <Newspaper className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">What's Happening Today</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Fresh global healthcare news and research updates</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : news.length > 0 ? (
                        news.map((item, idx) => {
                            const details = getCategoryDetails(item.category);
                            return (
                                <a
                                    key={idx}
                                    href={item.url || "https://news.google.com"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-slate-100 hover:border-blue-200 transition-colors group relative"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${details.badge}`}>
                                            {item.category}
                                        </span>
                                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="mt-1 flex-shrink-0">
                                            {details.icon}
                                        </div>
                                        <h3 className="text-slate-800 font-bold text-sm leading-snug group-hover:text-blue-700 transition-colors">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-[6]">
                                        {item.summary || item.description}
                                    </p>
                                    <p className="text-xs font-medium text-slate-400 mt-auto">Today</p>
                                </a>
                            );
                        })
                    ) : (
                        <div className="col-span-3 text-center py-8 text-slate-400 font-medium">
                            No health news updates available at the moment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
