"use client";

import { BrainCircuit, GraduationCap, ClipboardCheck, FileText, CheckCircle2, AlertCircle, Users, Settings } from 'lucide-react';
import React from 'react';
import ReferralCard from './ReferralCard';

export function Overview({ role }: { role: 'student' | 'teacher' | 'admin' | 'superadmin' | 'masteradmin' | 'deptadmin' | 'instadmin' }) {
    const isStudent = role === 'student' || role === 'superadmin' || role === 'admin' || role === 'masteradmin';
    const isTeacher = role === 'teacher' || role === 'superadmin' || role === 'admin' || role === 'masteradmin';
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'masteradmin' || role === 'deptadmin' || role === 'instadmin';


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isStudent && (
                    <>
                        <StatCard
                            title="Learning Progress"
                            value="78%"
                            trend="+12% from last week"
                            icon={<GraduationCap className="text-emerald-600" />}
                            color="emerald"
                        />
                        <StatCard
                            title="Active Courses"
                            value="4"
                            trend="2 exams upcoming"
                            icon={<FileText className="text-blue-600" />}
                            color="blue"
                        />
                        <StatCard
                            title="AI Interactions"
                            value="124"
                            trend="32 questions today"
                            icon={<BrainCircuit className="text-purple-600" />}
                            color="purple"
                        />
                    </>
                )}
                {isTeacher && (
                    <>
                        <StatCard
                            title="Classes Today"
                            value="3"
                            trend="Next: Anatomy @ 2 PM"
                            icon={<Users className="text-emerald-600" />}
                            color="emerald"
                        />
                        <StatCard
                            title="Pending Evaluations"
                            value="42"
                            trend="12 new scripts uploaded"
                            icon={<ClipboardCheck className="text-blue-600" />}
                            color="blue"
                        />
                        <StatCard
                            title="Lesson Plans"
                            value="8"
                            trend="3 generated this week"
                            icon={<FileText className="text-purple-600" />}
                            color="purple"
                        />
                    </>
                )}
                {isAdmin && (
                    <>
                        <StatCard
                            title="System Health"
                            value="99.9%"
                            trend="All AI nodes active"
                            icon={<CheckCircle2 className="text-emerald-600" />}
                            color="emerald"
                        />
                        <StatCard
                            title="AI Generation Stats"
                            value="1.2k"
                            trend="+450 today"
                            icon={<BrainCircuit className="text-blue-600" />}
                            color="blue"
                        />
                        <StatCard
                            title="Active Users"
                            value="842"
                            trend="Current session peak"
                            icon={<Users className="text-purple-600" />}
                            color="purple"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        {isAdmin ? 'System Logs' : 'Recent Activity'}
                    </h3>
                    <div className="space-y-6">
                        {(isAdmin ? ['LMS Queue: Anatomy Notes (3/10)', 'Server Backup Completed', 'New Teacher Registered'] :
                            ['Anatomy Notes Generated', 'Viva Session Completed', 'New Vocabulary Term Added']).map((text, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{text}</p>
                                        <p className="text-xs text-slate-500">{i + 1} hour{i !== 0 ? 's' : ''} ago</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {isStudent && (
                    <div className="flex flex-col gap-8">
                        <div className="bg-emerald-900 p-8 rounded-3xl text-white relative overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">MediEduAI Standard</h3>
                                <p className="text-emerald-100/80 mb-6 max-w-xs">Unlock unlimited AI Mentor questions and advanced case simulators.</p>
                                <a href="https://pages.razorpay.com/medieduai-standard" target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-emerald-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-center">
                                    Upgrade to Standard
                                </a>
                            </div>
                            <BrainCircuit className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                        </div>
                    </div>
                )}

                {isTeacher && !isStudent && (
                    <div className="flex flex-col gap-8">
                        <div className="bg-blue-900 p-8 rounded-3xl text-white relative overflow-hidden flex-1 flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Teacher Portal</h3>
                                <p className="text-blue-100/80 mb-6 max-w-xs">Access advanced AI grading rubrics and curriculum mapping tools.</p>
                                <button className="bg-white text-blue-900 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
                                    Open EMS Portal
                                </button>
                            </div>
                            <GraduationCap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4">Admin Console</h3>
                            <p className="text-slate-100/80 mb-6 max-w-xs">Monitor AI token usage and manage system-wide LMS generation queues.</p>
                            <button className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                                View Analytics
                            </button>
                        </div>
                        <Settings className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
                    </div>
                )}
            </div>

            {/* Referral / Support Card */}
            <ReferralCard />
        </div>
    );
}

function StatCard({ title, value, trend, icon, color }: any) {
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600'
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                    {icon}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
                    <p className="text-xs text-slate-500 mt-1">{trend}</p>
                </div>
            </div>
        </div>
    );
}
