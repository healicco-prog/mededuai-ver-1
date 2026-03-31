"use client";

import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, FilePlus, Stethoscope, 
    Award, Target, Users, LayoutList, CheckCircle 
} from 'lucide-react';
import FormativeAssessments from './FormativeAssessments';
import InternalAssessments from './InternalAssessments';
import ClinicalAssessments from './ClinicalAssessments';
import SummativeAssessments from './SummativeAssessments';
import NonScholasticAchievements from './NonScholasticAchievements';

type AssessmentTab = 'formative' | 'internal' | 'clinical' | 'summative' | 'non-scholastic';

export default function DeptAssessmentsClient() {
    const [activeTab, setActiveTab] = useState<AssessmentTab>('formative');
    
    // We only want to show mentees allocated to this department, but for prototype purposes
    // we fetch all users here so child components can filter.
    const { users } = useUserStore();
    const students = users.filter(u => u.role === 'student');

    const tabs = [
        { id: 'formative', label: 'Formative', icon: <Target className="w-5 h-5" />, desc: '1st/2nd/3rd Formative' },
        { id: 'internal', label: 'Internal', icon: <BookOpen className="w-5 h-5" />, desc: 'Regular Internal' },
        { id: 'clinical', label: 'Clinical Posting', icon: <Stethoscope className="w-5 h-5" />, desc: 'End of Posting' },
        { id: 'summative', label: 'Summative', icon: <Award className="w-5 h-5" />, desc: 'Final Papers' },
        { id: 'non-scholastic', label: 'Non-Scholastic', icon: <CheckCircle className="w-5 h-5" />, desc: 'Achievements' },
    ] as const;

    return (
        <div className="w-full h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto pb-4 gap-2 mb-6 border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AssessmentTab)}
                        className={`flex flex-col items-start min-w-[160px] p-4 rounded-2xl transition-all border text-left ${
                            activeTab === tab.id
                                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                        <div className={`mb-3 p-2 rounded-xl inline-flex ${activeTab === tab.id ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            {tab.icon}
                        </div>
                        <span className="font-bold text-sm block mb-1">{tab.label}</span>
                        <span className={`text-[11px] font-medium ${activeTab === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>
                            {tab.desc}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full overflow-y-auto"
                    >
                        {activeTab === 'formative' && <FormativeAssessments students={students} />}
                        {activeTab === 'internal' && <InternalAssessments students={students} />}
                        {activeTab === 'clinical' && <ClinicalAssessments students={students} />}
                        {activeTab === 'summative' && <SummativeAssessments students={students} />}
                        {activeTab === 'non-scholastic' && <NonScholasticAchievements students={students} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
