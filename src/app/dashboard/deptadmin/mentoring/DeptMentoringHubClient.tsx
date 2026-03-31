"use client";

import React, { useState } from 'react';
import { ClipboardCheck, FileCheck2, Activity, Award, BarChart3, ChevronRight } from 'lucide-react';
import FormativeAssessments from './FormativeAssessments';

export default function DeptMentoringHubClient() {
    const [activeTab, setActiveTab] = useState('overview');

    const modules = [
        {
            id: 'formative',
            title: 'Formative Assessments',
            description: 'Enter theory, practical, or viva marks alongside attendance records.',
            icon: <ClipboardCheck className="w-6 h-6" />,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            id: 'internal',
            title: 'Internal Assessments',
            description: 'Structure and record standard internal evaluation scores.',
            icon: <FileCheck2 className="w-6 h-6" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            id: 'clinical',
            title: 'Clinical Postings',
            description: 'Log and digitally sign off on attendance and remarks for clinical rotations.',
            icon: <Activity className="w-6 h-6" />,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            id: 'summative',
            title: 'Summative Assessments',
            description: 'Add multi-paper year-end final university marks across different modes.',
            icon: <Award className="w-6 h-6" />,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            id: 'nonscholastic',
            title: 'Non-Scholastic',
            description: 'Record achievements in research, sports, cultural, leadership, etc.',
            icon: <Award className="w-6 h-6" />,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            id: 'analytics',
            title: 'Dept Analytics',
            description: 'View performance tracking and trends across your department.',
            icon: <BarChart3 className="w-6 h-6" />,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => (
                    <button
                        key={mod.id}
                        onClick={() => setActiveTab(mod.id)}
                        className={`p-6 bg-white border rounded-3xl text-left transition-all hover:shadow-md group ${activeTab === mod.id ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-50' : 'border-slate-200'}`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.bg} ${mod.color}`}>
                            {mod.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex justify-between items-center">
                            {mod.title}
                            <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-transform ${activeTab === mod.id ? 'translate-x-1 text-indigo-500' : ''}`} />
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{mod.description}</p>
                    </button>
                ))}
            </div>

            <div className={`bg-white border p-6 md:p-8 border-slate-200 rounded-3xl flex flex-col shadow-sm relative ${activeTab === 'overview' ? 'items-center justify-center text-center py-20' : ''}`}>
                {activeTab === 'overview' && (
                    <>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Assessment Type</h2>
                        <p className="text-slate-500">Choose a record type from above to begin entering department performance data.</p>
                    </>
                )}
                
                {activeTab === 'formative' && <FormativeAssessments />}

                {activeTab !== 'overview' && activeTab !== 'formative' && (
                    <>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Entry</h2>
                        <p className="text-slate-500 mt-4">The dynamic data grids and forms for this assessment type will be launched shortly.</p>
                    </>
                )}
            </div>
        </div>
    );
}
