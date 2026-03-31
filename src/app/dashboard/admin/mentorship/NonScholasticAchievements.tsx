"use client";

import React, { useState } from 'react';
import { useAssessmentStore } from '@/store/assessmentStore';
import { User } from '@/store/userStore';
import { Trophy, Plus, Trash2 } from 'lucide-react';

interface Props {
    students: User[];
}

export default function NonScholasticAchievements({ students }: Props) {
    const { achievements, addAchievement, deleteAchievement } = useAssessmentStore();
    const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
    const [achievementText, setAchievementText] = useState('');

    const handleAdd = () => {
        if (!selectedStudentId || !achievementText.trim()) return;
        addAchievement({
            studentId: selectedStudentId,
            achievement: achievementText
        });
        setAchievementText('');
    };

    return (
        <div className="p-6 h-full flex flex-col md:flex-row gap-8">
            {/* Entry Form */}
            <div className="w-full md:w-1/3 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        Non-Scholastic
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Record key neo-scholastic achievements.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Select Student</label>
                        <select 
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        >
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.email.split('@')[0].toUpperCase()})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Achievement Details</label>
                        <textarea 
                            value={achievementText}
                            onChange={(e) => setAchievementText(e.target.value)}
                            placeholder="Type any key neo-scholastic achievements here..."
                            className="w-full px-3 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none h-32"
                        />
                    </div>

                    <button 
                        onClick={handleAdd}
                        disabled={!achievementText.trim()}
                        className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Record
                    </button>
                </div>
            </div>

            {/* Timeline Record View */}
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h4 className="font-bold text-slate-800">Achievement Records</h4>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {achievements.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Trophy className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium text-slate-500">No achievements recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Grouping by student */}
                            {students.map(student => {
                                const studentAchievements = achievements.filter(a => a.studentId === student.id);
                                if (studentAchievements.length === 0) return null;

                                return (
                                    <div key={student.id} className="mb-6 last:mb-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 text-sm leading-tight">{student.name}</h5>
                                                <div className="text-[10px] text-slate-500">{student.email.split('@')[0].toUpperCase()}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="ml-4 pl-4 border-l-2 border-amber-100 space-y-3">
                                            {studentAchievements.map(ac => (
                                                <div key={ac.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm text-slate-700 relative group pr-10">
                                                    <span className="text-[10px] font-bold text-amber-600 mb-1 block">
                                                        {new Date(ac.date).toLocaleDateString()}
                                                    </span>
                                                    {ac.achievement}
                                                    <button 
                                                        onClick={() => deleteAchievement(ac.id)}
                                                        className="absolute right-3 top-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
