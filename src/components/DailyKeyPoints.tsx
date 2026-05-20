"use client";

import React, { useEffect, useState } from 'react';
import { Sparkles, Target, Zap, BrainCircuit, Activity, BookOpen, ClipboardCheck, CalendarCheck, ClipboardList, FileQuestion, PenLine, Users, NotebookPen, Presentation } from 'lucide-react';
import { useCurriculumStore } from '../store/curriculumStore';

type KeyPoint = {
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    source: string;
};

interface DailyKeyPointsProps {
    /** Drives which tool set the daily prompts rotate through. Defaults to the
     *  student-facing prompts. */
    role?: 'student' | 'teacher' | 'deptadmin' | 'instadmin' | 'superadmin' | 'masteradmin';
}

export default function DailyKeyPoints({ role = 'student' }: DailyKeyPointsProps) {
    const { coursesList } = useCurriculumStore();
    const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);

    useEffect(() => {
        // Pseudo-random generation based on today's date so it changes daily
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const course = coursesList[0]?.name || 'Medical Exams';
        const subject = coursesList[0]?.subjects?.[0]?.name || 'General Anatomy';

        // ── Student-facing prompts (default) ─────────────────────────────────
        const studentPoints: KeyPoint[] = [
            {
                title: "LMS Notes Revision",
                desc: `Since you recently reviewed General Anatomy in ${course}, focus on the Brachial Plexus today.`,
                icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
                color: "emerald",
                source: "Based on LMS Notes viewing"
            },
            {
                title: "AI Mentor Insights",
                desc: "Your recent queries indicate a need to brush up on cardiovascular physiology.",
                icon: <BrainCircuit className="w-5 h-5 text-indigo-600" />,
                color: "indigo",
                source: "Based on AI Mentor usage"
            },
            {
                title: "Self-Evaluation Target",
                desc: "Your last evaluation scores suggest reviewing Biochemistry metabolism pathways.",
                icon: <Target className="w-5 h-5 text-amber-600" />,
                color: "amber",
                source: "Based on Self-Evaluation"
            },
            {
                title: "MCQ Practice",
                desc: "Practice more MCQs on Pathology to improve your diagnostic accuracy.",
                icon: <ClipboardCheck className="w-5 h-5 text-rose-600" />,
                color: "rose",
                source: "Based on MCQs Generator"
            },
            {
                title: "Viva Preparation",
                desc: "Try a new Viva Simulator session on Cranial Nerves to boost confidence.",
                icon: <Activity className="w-5 h-5 text-purple-600" />,
                color: "purple",
                source: "Based on Viva Simulator"
            },
            {
                title: "Notes Creator Tips",
                desc: "Consider generating Flashcards for Microbiology spotters.",
                icon: <Zap className="w-5 h-5 text-blue-600" />,
                color: "blue",
                source: "Based on Notes Creator"
            }
        ];

        // ── Faculty/Dept-admin-facing prompts ────────────────────────────────
        // Each entry references one of the 11 tools the dept admin uses, so the
        // daily rotation surfaces a different lever for them to act on.
        const facultyPoints: KeyPoint[] = [
            {
                title: "LMS Notes Coverage",
                desc: `Your faculty have been opening ${subject} notes most this week. Identify the 2 topics with lowest engagement and queue them in Notes Creator for richer coverage.`,
                icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
                color: "emerald",
                source: "Based on LMS Notes activity"
            },
            {
                title: "Notes Creator Backlog",
                desc: `Several ${course} topics still don't have full LMS notes. Trigger a batch generation in Content Creator before the next teaching block starts.`,
                icon: <NotebookPen className="w-5 h-5 text-blue-600" />,
                color: "blue",
                source: "Based on Notes Creator usage"
            },
            {
                title: "Lesson Plan Refresh",
                desc: "Your last Lesson Plan was generated more than a week ago. Refresh it for this week's classes so AI suggestions reflect your current syllabus position.",
                icon: <Presentation className="w-5 h-5 text-indigo-600" />,
                color: "indigo",
                source: "Based on Lesson Plan usage"
            },
            {
                title: "Rubrics Standardization",
                desc: "Two of your teachers are evaluating without an approved rubric. Generate department-standard rubrics in Rubrics Generator and share with them.",
                icon: <ClipboardCheck className="w-5 h-5 text-amber-600" />,
                color: "amber",
                source: "Based on Rubrics Generator"
            },
            {
                title: "Classroom Templates",
                desc: "Reuse last week's Classroom Generator template for the next batch — small-group case-based discussions had the highest student feedback scores.",
                icon: <Users className="w-5 h-5 text-purple-600" />,
                color: "purple",
                source: "Based on Classroom Generator"
            },
            {
                title: "Time Table Conflicts",
                desc: "Time Table MS shows two overlapping faculty slots for this Friday. Resolve them before the daily schedule export goes out to students.",
                icon: <CalendarCheck className="w-5 h-5 text-rose-600" />,
                color: "rose",
                source: "Based on Time Table MS"
            },
            {
                title: "Attendance Gaps",
                desc: "Attendance MS flags 3 students below the 75% threshold in the current month. Pull the report and trigger mentor follow-ups before semester end.",
                icon: <ClipboardList className="w-5 h-5 text-rose-600" />,
                color: "rose",
                source: "Based on Attendance MS"
            },
            {
                title: "Q-Paper Calibration",
                desc: `Use Q-Paper Dev to draft a balanced internal assessment for ${subject} — last paper was top-heavy on recall, light on application-level questions.`,
                icon: <FileQuestion className="w-5 h-5 text-emerald-600" />,
                color: "emerald",
                source: "Based on Q-Paper Dev"
            },
            {
                title: "Essay Evaluation (EMS)",
                desc: "Pending essay scripts in EMS - Essay are piling up. Batch-evaluate them today so students get feedback before the next formative.",
                icon: <PenLine className="w-5 h-5 text-indigo-600" />,
                color: "indigo",
                source: "Based on EMS - Essay"
            },
            {
                title: "MCQ Bank Audit (EMR)",
                desc: `EMR - MCQs has flagged item-difficulty drift in ${subject}. Review the outlier questions before they enter the next assessment cycle.`,
                icon: <BrainCircuit className="w-5 h-5 text-blue-600" />,
                color: "blue",
                source: "Based on EMR - MCQs"
            },
            {
                title: "Curriculum Coverage",
                desc: `${course} curriculum tree shows untouched sections. Switch the Curriculum Setup tab and assign those topics to faculty owners today.`,
                icon: <Target className="w-5 h-5 text-amber-600" />,
                color: "amber",
                source: "Based on Curriculum selection"
            }
        ];

        const pool = role === 'student' ? studentPoints : facultyPoints;

        // Pick 3 unique points based on the date hash so the same card doesn't appear twice.
        const selected: KeyPoint[] = [];
        const used = new Set<number>();
        for (let i = 0; selected.length < 3 && i < pool.length * 2; i++) {
            const index = (hash + i * 17) % pool.length;
            if (used.has(index)) continue;
            used.add(index);
            selected.push(pool[index]);
        }

        setKeyPoints(selected);
    }, [coursesList, role]);

    if (keyPoints.length === 0) return null;

    return (
        <div className="mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Key points to focus today</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {keyPoints.map((point, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-${point.color}-500/20 border border-${point.color}-500/30`}>
                                    {point.icon}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base mb-1">{point.title}</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-3">{point.desc}</p>
                                    <div className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {point.source}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
