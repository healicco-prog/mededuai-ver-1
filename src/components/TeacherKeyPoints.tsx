"use client";

import React, { useEffect, useState } from 'react';
import { Sparkles, FileText, CheckSquare, Edit3, ClipboardList, PenTool } from 'lucide-react';

export default function TeacherKeyPoints() {
    const [keyPoints, setKeyPoints] = useState<any[]>([]);

    useEffect(() => {
        // Pseudo-random generation based on today's date so it changes daily
        const today = new Date().toISOString().split('T')[0];
        const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const allPossiblePoints = [
            {
                title: "Lesson Plan Optimization",
                desc: "Your recent Anatomy lesson plan was well received. Consider generating one for Physiology today.",
                icon: <FileText className="w-5 h-5 text-emerald-600" />,
                color: "emerald",
                source: "Based on Lesson Plan usage"
            },
            {
                title: "Rubrics Generator Suggestion",
                desc: "Standardize your clinical skill assessments by creating a new Rubric for OSCEs.",
                icon: <CheckSquare className="w-5 h-5 text-indigo-600" />,
                color: "indigo",
                source: "Based on Rubrics Generator"
            },
            {
                title: "Essay Evaluation Pending",
                desc: "You have 12 ungraded essays. Use the Digital Evaluation Assist to speed up grading.",
                icon: <Edit3 className="w-5 h-5 text-amber-600" />,
                color: "amber",
                source: "Based on Dig Evaluation Assist"
            },
            {
                title: "MCQs Assessment",
                desc: "Generate a new batch of clinical scenario MCQs for the upcoming Pathology mid-term.",
                icon: <ClipboardList className="w-5 h-5 text-rose-600" />,
                color: "rose",
                source: "Based on MCQs Generator"
            },
            {
                title: "Essay Questions Expansion",
                desc: "Create 10-mark long essay questions for the Biochemistry module to challenge your students.",
                icon: <PenTool className="w-5 h-5 text-purple-600" />,
                color: "purple",
                source: "Based on Essay Qs Generator"
            }
        ];

        // Pick 3 random points based on the date hash
        const selected = [];
        for (let i = 0; i < 3; i++) {
            const index = (hash + i * 7) % allPossiblePoints.length;
            selected.push(allPossiblePoints[index]);
        }
        
        setKeyPoints(selected);
    }, []);

    if (keyPoints.length === 0) return null;

    return (
        <div className="mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-6 h-6 text-purple-400" />
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
