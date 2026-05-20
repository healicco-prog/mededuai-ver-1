"use client";

import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Activity, HeartPulse, Stethoscope } from 'lucide-react';

// External URLs route through Google News search for each headline's topic.
// Guarantees a working, relevant link every time without us having to hand-curate
// (and re-validate) deep links into FDA/NEJM/NIH pages that move or rot.
const newsSearchUrl = (query: string) =>
    `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en`;

export default function WhatsHappeningToday() {
    const [news, setNews] = useState<any[]>([]);

    useEffect(() => {
        // Pseudo-random generation based on today's date so it changes daily
        const today = new Date().toISOString().split('T')[0];
        const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const allNews = [
            {
                title: "FDA Approves Novel Targeted Therapy for Advanced NSCLC",
                category: "New Drugs",
                time: "2 hours ago",
                icon: <Activity className="w-5 h-5 text-rose-500" />,
                description: "A first-in-class targeted agent has cleared FDA review for previously-treated non-small cell lung cancer patients carrying a specific oncogenic driver mutation. Phase 3 data showed a meaningful progression-free survival benefit over standard chemotherapy with a manageable safety profile. Clinicians can now offer a precision-medicine option to a patient cohort that has historically had limited choices after first-line failure.",
                searchQuery: "FDA approval targeted therapy non-small cell lung cancer 2026"
            },
            {
                title: "Recent Trial Shows AI-Assisted Diagnosis Cuts Errors by 30%",
                category: "Medical Tech",
                time: "5 hours ago",
                icon: <HeartPulse className="w-5 h-5 text-blue-500" />,
                description: "A multi-center prospective trial across teaching hospitals reports a 30% reduction in diagnostic discordance when clinicians use an AI decision-support layer alongside routine workup. Gains were largest in imaging-heavy specialties — radiology, dermatology, and pathology — and held up across junior and senior practitioners. The authors stress that the AI augmented rather than replaced human reasoning, with the best outcomes in true human-in-the-loop workflows.",
                searchQuery: "AI assisted diagnosis trial diagnostic accuracy clinical study"
            },
            {
                title: "Revised Guidelines Released for Type 2 Diabetes Management",
                category: "Patient Care",
                time: "8 hours ago",
                icon: <Stethoscope className="w-5 h-5 text-emerald-500" />,
                description: "Updated consensus guidelines reposition GLP-1 receptor agonists and SGLT2 inhibitors earlier in the treatment algorithm, particularly for patients with established cardiovascular or renal disease. The recommendations also formalize continuous glucose monitoring as standard care for any patient on insulin and emphasize structured lifestyle programs as foundational. Primary care teams will need to update their protocols and patient-education resources to reflect the cardio-renal-metabolic framing.",
                searchQuery: "type 2 diabetes guidelines GLP-1 SGLT2 update"
            },
            {
                title: "Breakthrough in Alzheimer's Research: Plaque-clearing Antibody",
                category: "New Research",
                time: "12 hours ago",
                icon: <Activity className="w-5 h-5 text-purple-500" />,
                description: "Follow-on data from a late-stage trial of an anti-amyloid monoclonal antibody shows sustained removal of cerebral plaques accompanied by a modest but statistically significant slowing of cognitive decline in early Alzheimer's disease. Imaging biomarkers, including amyloid PET and plasma p-tau, moved in concert with clinical scores. The result strengthens the amyloid hypothesis for early disease and is expected to influence both regulatory labels and dementia screening pathways.",
                searchQuery: "Alzheimer anti-amyloid antibody phase 3 trial results"
            },
            {
                title: "Virtual Reality in Anatomy: Shaping Future Medical Education",
                category: "Medical Ed",
                time: "1 day ago",
                icon: <Stethoscope className="w-5 h-5 text-amber-500" />,
                description: "Several medical schools have reported significant improvements in spatial-reasoning and structural-recall assessments after switching first-year anatomy modules to VR-supplemented curricula. Students retain anatomical relationships better when they can rotate, dissect, and re-assemble structures interactively versus working from 2D atlases alone. Faculty caution that VR complements but does not replace cadaveric dissection, and that headset cost and motion-sickness remain practical barriers.",
                searchQuery: "virtual reality medical education anatomy curriculum"
            },
            {
                title: "Global Healthcare Report: Post-Pandemic Patient Care Strategies",
                category: "Patient Care",
                time: "1 day ago",
                icon: <HeartPulse className="w-5 h-5 text-indigo-500" />,
                description: "A new global health policy report catalogs the structural shifts in patient care that have stuck in the post-pandemic period. Hybrid telehealth-plus-in-person models, decentralized clinical trials, and home-based monitoring for chronic disease have all moved from pilot phase into routine workflows. The report flags a widening digital-access gap and urges health systems to treat connectivity and digital literacy as social determinants of health rather than nice-to-haves.",
                searchQuery: "post pandemic healthcare report telehealth chronic disease 2026"
            }
        ];

        // Pick 3 random news based on the date hash
        const selected = [];
        for (let i = 0; i < 3; i++) {
            const index = (hash + i * 13) % allNews.length;
            selected.push(allNews[index]);
        }

        setNews(selected);
    }, []);

    if (news.length === 0) return null;

    return (
        <div className="mb-6 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                        <Newspaper className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">What's Happening Today</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {news.map((item, idx) => (
                        <a
                            key={idx}
                            href={newsSearchUrl(item.searchQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:bg-slate-100 hover:border-blue-200 transition-colors group relative"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                                    {item.category}
                                </span>
                                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <div className="flex items-start gap-3 mb-3">
                                <div className="mt-1 flex-shrink-0">
                                    {item.icon}
                                </div>
                                <h3 className="text-slate-800 font-bold text-sm leading-snug group-hover:text-blue-700 transition-colors">
                                    {item.title}
                                </h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-[7]">
                                {item.description}
                            </p>
                            <p className="text-xs font-medium text-slate-400 mt-auto">{item.time}</p>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
