"use client";

import React, { useState } from 'react';
import { Building2, UploadCloud, BookOpen, ArrowRight } from 'lucide-react';

type InstitutionData = { name: string; course: string; logoUrl: string | null };

export default function InstitutionSetup({ onComplete }: { onComplete: (data: InstitutionData) => void }) {
    const [name, setName] = useState('');
    const [course, setCourse] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete({ name, course, logoUrl: previewUrl });
    };

    return (
        <div className="max-w-3xl mx-auto w-full pt-8 pb-12">
            <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Institution Onboarding</h2>
                <p className="text-slate-500 text-lg">Set up your institution's core profile to initialize the Mentorship Management System.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 md:p-10">
                <div className="space-y-8">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Name of the Institution</label>
                        <div className="relative">
                            <Building2 className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                            <input 
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. MedEduAI Institute of Medical Sciences"
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Institution Logo</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {previewUrl ? (
                                <div className="flex flex-col items-center">
                                    <img src={previewUrl} alt="Logo Preview" className="h-24 w-auto object-contain rounded-lg mb-4 shadow-sm border border-slate-100" />
                                    <p className="text-sm font-semibold text-blue-600">Click to change logo</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center pointer-events-none">
                                    <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                                    <p className="text-sm font-bold text-slate-700 mb-1">Click or drag image to upload block</p>
                                    <p className="text-xs text-slate-500">PNG, JPG, SVG up to 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Course Name</label>
                        <div className="relative">
                            <BookOpen className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                            <input 
                                type="text"
                                required
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                placeholder="e.g. MBBS, BDS, BSc Nursing"
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button 
                            type="submit"
                            disabled={!name || !course}
                            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:hover:shadow-none"
                        >
                            Complete Setup <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
