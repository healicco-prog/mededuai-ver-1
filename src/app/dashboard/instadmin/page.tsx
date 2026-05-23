"use client";

import React from 'react';
import { 
    Users, UserCheck, BookOpen, Activity, ClipboardList, 
    Building2, TrendingUp, Calendar, Clock, Star,
    CheckCircle2, AlertCircle, BarChart3, Presentation
} from 'lucide-react';
import WhatsHappeningToday from '@/components/WhatsHappeningToday';
import DailyKeyPoints from '@/components/DailyKeyPoints';

export default function InstAdminDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <WhatsHappeningToday />
            <DailyKeyPoints role="deptadmin" />
            
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.25),transparent_50%)]" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <Building2 className="w-6 h-6 text-indigo-300" />
                        </div>
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">
                            Institution Admin
                        </span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
                        Institution Performance Overview
                    </h2>
                    <p className="text-slate-400 mt-3 font-medium max-w-2xl text-[15px] leading-relaxed">
                        Monitor the utilization and performance metrics across Mentoring, Electives, and LogBook management systems within your institution.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Mentoring MS Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Mentoring MS</h3>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 flex-1 bg-slate-50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Total Mentors</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800">124</span>
                                    <span className="text-xs font-medium text-emerald-500 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/>+4%</span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Total Mentees</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800">856</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Meeting Activity
                                </p>
                                <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">This Month</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 font-medium">Scheduled</span>
                                        <span className="font-bold text-slate-700">342</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 font-medium">Completed</span>
                                        <span className="font-bold text-slate-700">298</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                <div>
                                    <p className="text-sm font-bold text-orange-900">12 Mentees</p>
                                    <p className="text-xs text-orange-700">No meeting in 30 days</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-white bg-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors">Review</button>
                        </div>
                    </div>
                </div>

                {/* Elective MS Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Elective MS</h3>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 flex-1 bg-slate-50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Active Electives</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800">48</span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Enrollment</p>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800">92%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Presentation className="w-4 h-4 text-purple-500" />
                                Progression Status
                            </p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-purple-600">65%</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Avg Completion</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-2xl font-black text-emerald-600">18</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Concluding Soon</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Star className="w-4 h-4 text-amber-500" />
                                Top Performing Electives
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-700 truncate pr-2">Advanced Cardiology</span>
                                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">98% Avg</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-700 truncate pr-2">Surgical Techniques</span>
                                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">95% Avg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LogBook MS Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white">LogBook MS</h3>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 flex-1 bg-slate-50">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Active Departments</p>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800">14</span>
                                    <span className="text-sm font-medium text-slate-400">/ 18</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-emerald-500" />
                                Department Performance
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-700 font-bold">General Medicine</span>
                                        <span className="font-bold text-emerald-600">92% Logged</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-700 font-bold">Pediatrics</span>
                                        <span className="font-bold text-emerald-600">88% Logged</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-700 font-bold">Orthopedics</span>
                                        <span className="font-bold text-amber-500">64% Logged</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '64%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
                                <span className="text-2xl font-black text-slate-800">4,285</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Logs Approved</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <Clock className="w-6 h-6 text-blue-500 mb-2" />
                                <span className="text-2xl font-black text-slate-800">312</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Pending Review</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
