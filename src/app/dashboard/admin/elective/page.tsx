"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Building2, Users, CalendarDays, Shuffle, KeyRound, ClipboardList, BarChart3, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useElectiveStore } from '@/store/electiveStore';
import Step1Institution from './Step1Institution';
import Step2Electives from './Step2Electives';
import Step3Students from './Step3Students';
import Step4Dates from './Step4Dates';
import Step5Allotment from './Step5Allotment';
import Step6Code from './Step6Code';
import Step7Logbook from './Step7Logbook';
import Step8Analytics from './Step8Analytics';
import Step_StudentPreferences from './Step_StudentPreferences';

const STEPS = [
    { key: 'institution', label: 'Institution Onboarding', icon: Building2, color: 'from-violet-500 to-purple-600', bgLight: 'bg-violet-50', textColor: 'text-violet-700', borderColor: 'border-violet-200', ringColor: 'ring-violet-400', badgeBg: 'bg-violet-100', iconBg: 'bg-violet-500' },
    { key: 'upload_data', label: 'Upload Electives MS Data', icon: BookOpen, color: 'from-blue-500 to-cyan-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', ringColor: 'ring-blue-400', badgeBg: 'bg-blue-100', iconBg: 'bg-blue-500' },
    { key: 'preferences', label: 'Students Preferences', icon: Users, color: 'from-teal-500 to-emerald-500', bgLight: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200', ringColor: 'ring-teal-400', badgeBg: 'bg-teal-100', iconBg: 'bg-teal-500' },
    { key: 'allotment', label: 'Allotment', icon: Shuffle, color: 'from-rose-500 to-pink-500', bgLight: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200', ringColor: 'ring-rose-400', badgeBg: 'bg-rose-100', iconBg: 'bg-rose-500' },
    { key: 'logbook', label: 'Elective Log', icon: ClipboardList, color: 'from-sky-500 to-cyan-600', bgLight: 'bg-sky-50', textColor: 'text-sky-700', borderColor: 'border-sky-200', ringColor: 'ring-sky-400', badgeBg: 'bg-sky-100', iconBg: 'bg-sky-500' },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-fuchsia-500 to-purple-600', bgLight: 'bg-fuchsia-50', textColor: 'text-fuchsia-700', borderColor: 'border-fuchsia-200', ringColor: 'ring-fuchsia-400', badgeBg: 'bg-fuchsia-100', iconBg: 'bg-fuchsia-500' },
] as const;

type StepKey = typeof STEPS[number]['key'];

export default function ElectiveMSPage() {
    const [activeStep, setActiveStep] = useState<StepKey>('institution');
    const store = useElectiveStore();
    const instId = store.institutions[0]?.id || '';

    // Auto-sync elective data to Supabase on page load
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const raw = localStorage.getItem('elective-storage');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const state = parsed?.state || {};
                    const codes = state.codes || [];
                    if (codes.length > 0) {
                        // First fetch existing server data (students may have submitted preferences)
                        let serverPrefs: any[] = [];
                        try {
                            const fetchRes = await fetch('/api/elective-sync');
                            if (fetchRes.ok) {
                                const serverData = await fetchRes.json();
                                serverPrefs = serverData.preferences || [];
                            }
                        } catch {}

                        // Push admin config data (codes, electives, students, etc.)
                        // but ALWAYS use server preferences as the source of truth
                        // (since students submit preferences directly to the server)
                        await fetch('/api/elective-sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                codes,
                                students: state.students || [],
                                electives: state.electives || [],
                                allotments: state.allotments || [],
                                sessions: state.sessions || [],
                                preferences: serverPrefs,  // Keep server prefs — don't overwrite with stale local
                                allotmentMethod: state.allotmentMethod || 'merit',
                                dates: state.dates || [],
                                institutions: state.institutions || [],
                                logbookApprovals: state.logbookApprovals || [],
                            }),
                        });

                        // Pull server preferences into local store so admin sees latest
                        if (serverPrefs.length > 0) {
                            store.setPreferences(serverPrefs);
                        }

                        console.log('[ElectiveMS] Admin page: auto-synced', codes.length, 'codes to server');
                    }
                }
            } catch (err) {
                console.error('[ElectiveMS] Admin auto-sync error:', err);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const activeIndex = STEPS.findIndex(s => s.key === activeStep);
    const activeConfig = STEPS[activeIndex];

    const goNext = () => { if (activeIndex < STEPS.length - 1) setActiveStep(STEPS[activeIndex + 1].key); };
    const goPrev = () => { if (activeIndex > 0) setActiveStep(STEPS[activeIndex - 1].key); };

    const renderStep = () => {
        switch (activeStep) {
            case 'institution': return <Step1Institution store={store} />;
            case 'upload_data': return (
                <div className="space-y-12">
                    <Step2Electives store={store} instId={instId} />
                    <div className="w-full h-px bg-slate-200" />
                    <Step3Students store={store} instId={instId} />
                    <div className="w-full h-px bg-slate-200" />
                    <Step4Dates store={store} instId={instId} />
                    <div className="w-full h-px bg-slate-200" />
                    <Step6Code store={store} instId={instId} />
                </div>
            );
            case 'preferences': return <Step_StudentPreferences store={store} instId={instId} />;
            case 'allotment': return <Step5Allotment store={store} instId={instId} />;
            case 'logbook': return <Step7Logbook store={store} instId={instId} />;
            case 'analytics': return <Step8Analytics store={store} instId={instId} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-6">

            {/* ── Palette Hero Header ── */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl">
                {/* Multi-layered gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.3),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.2),transparent_50%)]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />

                {/* Decorative palette swatches */}
                <div className="absolute top-6 right-8 flex gap-2 opacity-30">
                    {STEPS.map((s, i) => (
                        <div key={i} className={`w-4 h-16 rounded-full bg-gradient-to-b ${s.color}`} style={{ height: `${40 + (i % 3) * 16}px` }} />
                    ))}
                </div>

                <div className="relative z-10 px-10 py-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <BookOpen className="w-7 h-7 text-violet-300" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[10px] font-bold text-violet-300 uppercase tracking-[0.2em]">Institution Admin</span>
                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Elective Management<br /><span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">System</span></h2>
                        <p className="text-slate-400 mt-3 font-medium max-w-xl text-[15px] leading-relaxed">Configure institution, upload electives & students, run allotment algorithms, and generate logbooks — all in one streamlined workflow.</p>
                    </div>

                    {/* Slide counter */}
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 self-start md:self-end">
                        <span className="text-3xl font-black text-white">{String(activeIndex + 1).padStart(2, '0')}</span>
                        <div className="w-px h-8 bg-white/20" />
                        <span className="text-sm font-bold text-slate-500">{String(STEPS.length).padStart(2, '0')}</span>
                    </div>
                </div>
            </div>

            {/* ── Palette Step Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = activeStep === step.key;
                    const isPast = i < activeIndex;
                    return (
                        <button
                            key={step.key}
                            onClick={() => setActiveStep(step.key)}
                            className={`group relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300 border-2
                                ${isActive
                                    ? `${step.bgLight} ${step.borderColor} shadow-lg scale-[1.04] ring-2 ${step.ringColor} ring-offset-2`
                                    : isPast
                                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                                        : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
                                }`}
                        >
                            {/* Color swatch bar at top */}
                            <div className={`w-10 h-1.5 rounded-full bg-gradient-to-r ${step.color} transition-all duration-300 ${isActive ? 'w-12 h-2' : 'opacity-40 group-hover:opacity-70'}`} />

                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive
                                ? `bg-gradient-to-br ${step.color} text-white shadow-md`
                                : isPast
                                    ? `${step.badgeBg} ${step.textColor}`
                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
                                }`}>
                                <Icon className="w-4 h-4" />
                            </div>

                            {/* Step number */}
                            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${isActive ? step.textColor : isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                                Step {i + 1}
                            </span>

                            {/* Label */}
                            <span className={`text-[11px] font-bold text-center leading-tight transition-colors duration-300 ${isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600'}`}>
                                {step.label}
                            </span>

                            {/* Active indicator dot */}
                            {isActive && (
                                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${step.color} shadow-md`} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Palette Progress Bar ── */}
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${activeConfig.color} transition-all duration-700 ease-out`}
                    style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
                />
                {/* Shimmer effect */}
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
                    style={{ width: `${((activeIndex + 1) / STEPS.length) * 100}%` }}
                />
            </div>

            {/* ── Active Step Title Bar ── */}
            <div className={`flex items-center justify-between ${activeConfig.bgLight} ${activeConfig.borderColor} border-2 rounded-2xl px-6 py-4 transition-all duration-500`}>
                <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${activeConfig.color} flex items-center justify-center text-white shadow-lg`}>
                        <activeConfig.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${activeConfig.textColor} opacity-70`}>Step {activeIndex + 1} of {STEPS.length}</p>
                        <h3 className="text-lg font-extrabold text-slate-900 -mt-0.5">{activeConfig.label}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goPrev}
                        disabled={activeIndex === 0}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${activeIndex === 0 ? 'bg-white/50 text-slate-300 cursor-not-allowed' : `bg-white ${activeConfig.textColor} hover:shadow-md border ${activeConfig.borderColor}`}`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goNext}
                        disabled={activeIndex === STEPS.length - 1}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${activeIndex === STEPS.length - 1 ? 'bg-white/50 text-slate-300 cursor-not-allowed' : `bg-gradient-to-r ${activeConfig.color} text-white hover:shadow-lg hover:scale-105`}`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ── Step Content Area ── */}
            <div className="relative">
                {/* Decorative left palette accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-full bg-gradient-to-b ${activeConfig.color} opacity-30`} />
                <div className="pl-6">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
}
