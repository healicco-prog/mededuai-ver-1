"use client";

import React, { useEffect, useState } from 'react';
import { 
    Sparkles, Target, Zap, BrainCircuit, Activity, BookOpen, 
    ClipboardCheck, CalendarCheck, ClipboardList, FileQuestion, 
    PenLine, Users, NotebookPen, Presentation, FileText, 
    CheckSquare, Edit3, PenTool 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type KeyPoint = {
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
    source: string;
};

interface DailyKeyPointsProps {
    role?: 'student' | 'teacher' | 'deptadmin' | 'instadmin' | 'superadmin' | 'masteradmin';
}

export default function DailyKeyPoints({ role = 'student' }: DailyKeyPointsProps) {
    const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
    const [planTier, setPlanTier] = useState<string>('free');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');

    useEffect(() => {
        // 1. Fetch selected course & subject names from localStorage
        const cachedCourse = localStorage.getItem('mededuai_selected_course');
        const cachedSubject = localStorage.getItem('mededuai_selected_subject');
        if (cachedCourse) setSelectedCourse(cachedCourse);
        if (cachedSubject) setSelectedSubject(cachedSubject);

        // 2. Fetch user plan tier to customize features shown
        const getSub = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const res = await fetch(`/api/subscription?userId=${session.user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.plan_tier) {
                            setPlanTier(data.plan_tier);
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching plan tier for key points:", err);
            }
        };
        getSub();
    }, []);

    useEffect(() => {
        // Pseudo-random generation based on today's local date so it changes daily
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`; // Local YYYY-MM-DD
        const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const course = selectedCourse || 'MBBS';
        const subject = selectedSubject || 'General Anatomy';

        const isFeatureAllowed = (feature: string) => {
            const tierOrder = ['free', 'basic', 'standard', 'premium', 'enterprise'];
            const currentIdx = tierOrder.indexOf(planTier.toLowerCase());
            // Treat free/trial users as 'standard' so they can see intermediate features to encourage upgrading
            const effectiveIdx = planTier.toLowerCase() === 'free' ? 2 : currentIdx;

            let required = 'free';
            if (['lms-notes'].includes(feature)) required = 'free';
            else if (['notes-creator'].includes(feature)) required = 'basic';
            else if ([
                'ai-mentor', 'viva-simulator', 'vocabulary', 'reflection-generator', 
                'essay-qs-generator', 'mcqs-generator', 'self-evaluation', 
                'lesson-plan', 'rubrics-generator', 'dig-eval-assist'
            ].includes(feature)) required = 'standard';
            else if ([
                'classroom-generator', 'timetable-ms', 'attendance-ms', 
                'q-paper-dev', 'ems-essay', 'emr-mcqs'
            ].includes(feature)) required = 'premium';
            else if (['mentorship-ms', 'mentoring-ms', 'elective-ms', 'logbook-ms'].includes(feature)) required = 'enterprise';

            const requiredIdx = tierOrder.indexOf(required);
            return effectiveIdx >= requiredIdx;
        };

        // Build list of points only for features allowed by tier
        const studentPool: { feature: string; point: KeyPoint }[] = [
            {
                feature: "lms-notes",
                point: {
                    title: "LMS Notes Revision",
                    desc: `Review the high-yield study topics for ${subject} in ${course} to keep your memory sharp.`,
                    icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
                    color: "emerald",
                    source: "Based on LMS Notes viewing"
                }
            },
            {
                feature: "notes-creator",
                point: {
                    title: "Notes Creator Tips",
                    desc: `Generate a custom set of revision summaries or flashcards for complex topics in ${subject}.`,
                    icon: <Zap className="w-5 h-5 text-blue-600" />,
                    color: "blue",
                    source: "Based on Notes Creator"
                }
            },
            {
                feature: "ai-mentor",
                point: {
                    title: "AI Mentor Insights",
                    desc: `Discuss clinical applications and mock cases in ${subject} with MentorPro today.`,
                    icon: <BrainCircuit className="w-5 h-5 text-indigo-600" />,
                    color: "indigo",
                    source: "Based on AI Mentor usage"
                }
            },
            {
                feature: "viva-simulator",
                point: {
                    title: "Viva Preparation",
                    desc: `Test your quick recall on ${subject} by initiating an interactive voice viva session.`,
                    icon: <Activity className="w-5 h-5 text-purple-600" />,
                    color: "purple",
                    source: "Based on Viva Simulator"
                }
            },
            {
                feature: "vocabulary",
                point: {
                    title: "Medical Vocabulary",
                    desc: `Brush up on root words, prefixes, and suffixes for specialized terminology in ${subject}.`,
                    icon: <FileText className="w-5 h-5 text-teal-600" />,
                    color: "teal",
                    source: "Based on Vocabulary"
                }
            },
            {
                feature: "reflection-generator",
                point: {
                    title: "Reflective Journals",
                    desc: `Reflect on your clinical postings or classroom sessions for ${subject} with guided reflection.`,
                    icon: <Edit3 className="w-5 h-5 text-amber-600" />,
                    color: "amber",
                    source: "Based on Reflection Generator"
                }
            },
            {
                feature: "essay-qs-generator",
                point: {
                    title: "Essay Practice",
                    desc: `Review structure templates and model answers for long-form essay questions in ${subject}.`,
                    icon: <PenTool className="w-5 h-5 text-purple-600" />,
                    color: "purple",
                    source: "Based on Essay Qs Generator"
                }
            },
            {
                feature: "mcqs-generator",
                point: {
                    title: "MCQ Challenge",
                    desc: `Solve 10 random case-based MCQs in ${subject} to check your conceptual understanding.`,
                    icon: <ClipboardCheck className="w-5 h-5 text-rose-600" />,
                    color: "rose",
                    source: "Based on MCQs Generator"
                }
            },
            {
                feature: "self-evaluation",
                point: {
                    title: "Self-Evaluation Test",
                    desc: `Benchmark your retention and speed for ${subject} syllabus units today.`,
                    icon: <Target className="w-5 h-5 text-amber-600" />,
                    color: "amber",
                    source: "Based on Self-Evaluation"
                }
            },
            {
                feature: "mentorship-ms",
                point: {
                    title: "Mentorship Portfolio",
                    desc: "Update your academic progression goals and share recent milestones with your faculty mentor.",
                    icon: <Users className="w-5 h-5 text-emerald-600" />,
                    color: "emerald",
                    source: "Based on Mentorship MS"
                }
            },
            {
                feature: "elective-ms",
                point: {
                    title: "Elective Postings",
                    desc: "Review your elective selection guidelines and hospital ward slots for clinical experience.",
                    icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
                    color: "indigo",
                    source: "Based on Elective MS"
                }
            },
            {
                feature: "logbook-ms",
                point: {
                    title: "Clinical Logbook",
                    desc: "Verify your logged clinical procedures and bedside assessments are ready for coordinator approval.",
                    icon: <ClipboardList className="w-5 h-5 text-rose-600" />,
                    color: "rose",
                    source: "Based on Logbook MS"
                }
            }
        ];

        const facultyPool: { feature: string; point: KeyPoint }[] = [
            {
                feature: "lms-notes",
                point: {
                    title: "LMS Notes Coverage",
                    desc: `Review which student cohorts are actively reading ${subject} notes under the ${course} track.`,
                    icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
                    color: "emerald",
                    source: "Based on LMS Notes activity"
                }
            },
            {
                feature: "notes-creator",
                point: {
                    title: "Notes Creator Backlog",
                    desc: `Generate detailed, curriculum-aligned study booklets for upcoming ${subject} lectures.`,
                    icon: <NotebookPen className="w-5 h-5 text-blue-600" />,
                    color: "blue",
                    source: "Based on Notes Creator usage"
                }
            },
            {
                feature: "lesson-plan",
                point: {
                    title: "Lesson Plan Calibration",
                    desc: `Design highly structured active-learning lecture outlines for tomorrow's ${subject} class.`,
                    icon: <Presentation className="w-5 h-5 text-indigo-600" />,
                    color: "indigo",
                    source: "Based on Lesson Plan usage"
                }
            },
            {
                feature: "rubrics-generator",
                point: {
                    title: "Rubric Standardization",
                    desc: `Create clear, objective criteria for assessing student clinical presentations on ${subject}.`,
                    icon: <ClipboardCheck className="w-5 h-5 text-amber-600" />,
                    color: "amber",
                    source: "Based on Rubrics Generator"
                }
            },
            {
                feature: "dig-eval-assist",
                point: {
                    title: "Digital Grading Assist",
                    desc: `Batch-assess student exam submissions on ${subject} with digital grading assistance.`,
                    icon: <Edit3 className="w-5 h-5 text-teal-600" />,
                    color: "teal",
                    source: "Based on Dig Evaluation Assist"
                }
            },
            {
                feature: "classroom-generator",
                point: {
                    title: "Active Classroom Prep",
                    desc: `Structure dynamic small-group discussions and case simulations for ${subject}.`,
                    icon: <Users className="w-5 h-5 text-purple-600" />,
                    color: "purple",
                    source: "Based on Classroom Generator"
                }
            },
            {
                feature: "timetable-ms",
                point: {
                    title: "Time Table Conflicts",
                    desc: `Check for lecture overlaps or schedule updates for the ${course} cohort.`,
                    icon: <CalendarCheck className="w-5 h-5 text-rose-600" />,
                    color: "rose",
                    source: "Based on Time Table MS"
                }
            },
            {
                feature: "attendance-ms",
                point: {
                    title: "Attendance Gaps",
                    desc: `Identify students failing to meet mandatory lecture attendance percentages in ${subject}.`,
                    icon: <ClipboardList className="w-5 h-5 text-rose-600" />,
                    color: "rose",
                    source: "Based on Attendance MS"
                }
            },
            {
                feature: "q-paper-dev",
                point: {
                    title: "Q-Paper Calibration",
                    desc: `Draft a balanced term-end question paper targeting key domains in ${subject}.`,
                    icon: <FileQuestion className="w-5 h-5 text-emerald-600" />,
                    color: "emerald",
                    source: "Based on Q-Paper Dev"
                }
            },
            {
                feature: "ems-essay",
                point: {
                    title: "Essay Evaluation (EMS)",
                    desc: `Review AI evaluation reports and suggested grading breakdowns for essay assessments.`,
                    icon: <PenLine className="w-5 h-5 text-indigo-600" />,
                    color: "indigo",
                    source: "Based on EMS - Essay"
                }
            },
            {
                feature: "emr-mcqs",
                point: {
                    title: "MCQ Bank Audit",
                    desc: `Run quality diagnostics on the test database questions for ${subject}.`,
                    icon: <BrainCircuit className="w-5 h-5 text-blue-600" />,
                    color: "blue",
                    source: "Based on EMR - MCQs"
                }
            },
            {
                feature: "mentorship-ms",
                point: {
                    title: "Mentor Actions Needed",
                    desc: "Several mentees have pending progress reports. View and approve them today.",
                    icon: <Users className="w-5 h-5 text-emerald-600" />,
                    color: "emerald",
                    source: "Based on Mentorship MS"
                }
            }
        ];

        const rawPool = role === 'student' ? studentPool : facultyPool;
        const pool = rawPool.filter(item => isFeatureAllowed(item.feature)).map(item => item.point);

        // Pick 3 unique points based on the date hash so the same cards don't always appear twice
        const selected: KeyPoint[] = [];
        const used = new Set<number>();
        
        if (pool.length > 0) {
            for (let i = 0; selected.length < Math.min(3, pool.length) && i < pool.length * 4; i++) {
                const index = (hash + i * 17) % pool.length;
                if (used.has(index)) continue;
                used.add(index);
                selected.push(pool[index]);
            }
        }

        setKeyPoints(selected);
    }, [selectedCourse, selectedSubject, planTier, role]);

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
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight">Key points to focus today</h2>
                        <p className="text-slate-400 text-xs mt-0.5 capitalize">Tailored context for {planTier} Plan</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {keyPoints.map((point, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-${point.color}-500/20 border border-${point.color}-500/30`}>
                                    {point.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-base mb-1 truncate">{point.title}</h3>
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
