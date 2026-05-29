"use client";

import { useState, useEffect } from 'react';
import { FileText, Loader2, Save, Send, CheckCircle, BrainCircuit, ShieldAlert, History, Calendar, ChevronDown, ChevronUp, Share2, Download, Sparkles, PenLine, Search } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { tokenService } from '@/lib/tokenService';

interface GeneratedReflection {
    id: string;
    created_at: string;
    subject: string;
    topic: string;
    competency: string;
    content: {
        description: string;
        feelings: string;
        evaluation: string;
        analysis: string;
        learningPoints: string;
        actionPlan: string;
    };
}

export default function ReflectionGeneratorPage() {
    const currentUser = useUserStore(state => state.users[0]);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [competency, setCompetency] = useState('');
    const [instruction, setInstruction] = useState('');
    const [wordCount, setWordCount] = useState('500');

    const [loading, setLoading] = useState(false);
    
    const [currentReflectionDraft, setCurrentReflectionDraft] = useState<GeneratedReflection | null>(null);

    const [savedReflections, setSavedReflections] = useState<GeneratedReflection[]>([]);
    const [savedSearchQuery, setSavedSearchQuery] = useState('');
    const [isFetchingSaved, setIsFetchingSaved] = useState(true);

    const fetchSavedReflections = async () => {
        setIsFetchingSaved(true);
        try {
            const res = await fetch('/api/reflection-generator/saved/all');
            const data = await res.json();
            if (data.success && data.savedRecords) {
                setSavedReflections(data.savedRecords);
            }
        } catch (e) {
            console.error('Error fetching saved reflections:', e);
        } finally {
            setIsFetchingSaved(false);
        }
    };

    useEffect(() => {
        fetchSavedReflections();
    }, []);

    const handleGenerate = async () => {
        if (!subject.trim() || !topic.trim()) {
            alert("Subject and Topic are compulsory fields.");
            return;
        }
        if (!currentUser) return;
        const check = tokenService.checkAvailability(currentUser.id, 'Reflection Generator');
        if (!check.allowed) {
            alert(`${check.reason || 'Insufficient tokens'}! Cost: ${check.required}, Balance: ${check.remaining}`);
            return;
        }

        setLoading(true);
        setCurrentReflectionDraft(null);

        try {
            const res = await fetch('/api/reflection-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    topic,
                    competency,
                    instruction,
                    wordCount: parseInt(wordCount) || 500
                })
            });
            const data = await res.json();
            
            if (data.success && data.reflection) {
                setCurrentReflectionDraft({
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                    subject: subject.trim(),
                    topic: topic.trim(),
                    competency: competency,
                    content: data.reflection
                });
                if (data.geminiTokens) {
                    tokenService.processTransaction(currentUser.id, 'Reflection Generator', 'gemini-2.0-flash', data.geminiTokens * 2);
                } else {
                    tokenService.processTransaction(currentUser.id, 'Reflection Generator', 'gemini-2.0-flash');
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReflection = async () => {
        if (!currentReflectionDraft) return;

        try {
            const res = await fetch('/api/reflection-generator/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: currentReflectionDraft.subject,
                    topic: currentReflectionDraft.topic,
                    competency: currentReflectionDraft.competency || competency,
                    content: currentReflectionDraft.content
                })
            });
            const data = await res.json();
            if (data.success && data.savedRecord) {
                setSavedReflections(prev => [data.savedRecord, ...prev]);
                alert("Reflection saved successfully!");
                setCurrentReflectionDraft(null);
            } else {
                alert('Failed to save: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error saving reflection:', err);
            alert('An error occurred while saving.');
        }
    };

    const handleExportPDF = async (elementId: string, title: string, share: boolean = false) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) return;

            const htmlToImage = await import('html-to-image');
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;

            const dataUrl = await htmlToImage.toPng(element, { 
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: '#ffffff'
            });
            
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            if (share) {
                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], `${title}.pdf`, { type: 'application/pdf' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: title,
                            text: 'Check out this clinical reflection!',
                            files: [file]
                        });
                    } catch (shareErr: any) {
                        if (shareErr.name !== 'AbortError') {
                            alert("Native sharing blocked by browser. Downloading PDF instead.");
                            pdf.save(`${title}.pdf`);
                        }
                    }
                } else {
                    alert("Sharing files is not supported on this device/browser. Downloading PDF instead.");
                    pdf.save(`${title}.pdf`);
                }
            } else {
                pdf.save(`${title}.pdf`);
            }
        } catch(err: any) {
            console.error("Failed to generate PDF", err);
            alert("Failed to export PDF/Share. " + (err.message || "Unknown error"));
        }
    };

    const SectionBlock = ({ title, num, content, isLast, color }: { title: string, num: number, content: string, isLast?: boolean, color: string }) => (
        <div className={`py-5 ${!isLast ? 'border-b border-slate-100' : ''}`}>
            <h4 className="font-bold text-slate-800 text-[15px] mb-3 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>{num}</span>
                {title}
            </h4>
            <p className="text-slate-600 leading-relaxed pl-11 whitespace-pre-wrap text-[14.5px]">{content}</p>
        </div>
    );

    const sectionColors = [
        'bg-emerald-100 text-emerald-700',
        'bg-blue-100 text-blue-700',
        'bg-violet-100 text-violet-700',
        'bg-amber-100 text-amber-700',
        'bg-rose-100 text-rose-700',
        'bg-teal-100 text-teal-700',
    ];

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-green-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <PenLine className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Reflection Generator</h2>
                            <p className="text-emerald-300/80 text-sm font-medium">Generate structured clinical and academic reflections</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Inputs Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-emerald-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-emerald-600" /> Reflection Context
                        </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Enter the Subject <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Internal Medicine"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Enter the Topic <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Diabetic Foot Complications"
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Competency with No.
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., IM 2.4"
                                    value={competency}
                                    onChange={e => setCompetency(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                    Number of Words
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g., 500"
                                    value={wordCount}
                                    onChange={e => setWordCount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Special Instruction
                            </label>
                            <textarea
                                placeholder="e.g., Please focus heavily on communication challenges with the patient."
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 text-sm font-medium min-h-[80px] transition-all"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !subject.trim() || !topic.trim()}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {loading ? 'Generating...' : 'Generate Reflection'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Draft Reflection */}
                {currentReflectionDraft && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Generated Reflection Draft</h3>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">Ready for review</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleExportPDF('draft-reflection-content', `Reflection_${currentReflectionDraft.subject.replace(/\s+/g, '_')}`, false)}
                                            className="bg-white text-slate-700 font-bold h-10 px-4 rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow"
                                        >
                                            <Download className="w-4 h-4" /> Save PDF
                                        </button>
                                        <button
                                            onClick={() => handleExportPDF('draft-reflection-content', `Reflection_${currentReflectionDraft.subject.replace(/\s+/g, '_')}`, true)}
                                            className="bg-emerald-100 text-emerald-700 font-bold h-10 px-4 rounded-xl hover:bg-emerald-200 transition-all flex items-center gap-2 text-sm shadow-sm"
                                        >
                                            <Share2 className="w-4 h-4" /> Share
                                        </button>
                                        <button
                                            onClick={handleSaveReflection}
                                            className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold h-10 px-5 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                                        >
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                    <button onClick={() => window.print()} className="font-bold h-10 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 print:hidden ml-2" title="Share as PDF">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                                        Share as PDF
                                    </button>

                                    </div>
                                </div>
                            </div>
                            
                            <div id="draft-reflection-content" className="p-6">
                                <SectionBlock title="Description of the Experience" num={1} content={currentReflectionDraft.content.description} color={sectionColors[0]} />
                                <SectionBlock title="Feelings and Initial Reactions" num={2} content={currentReflectionDraft.content.feelings} color={sectionColors[1]} />
                                <SectionBlock title="Evaluation of the Experience" num={3} content={currentReflectionDraft.content.evaluation} color={sectionColors[2]} />
                                <SectionBlock title="Analysis (Critical Thinking)" num={4} content={currentReflectionDraft.content.analysis} color={sectionColors[3]} />
                                <SectionBlock title="Learning Points" num={5} content={currentReflectionDraft.content.learningPoints} color={sectionColors[4]} />
                                <SectionBlock title="Action Plan (Future Improvement)" num={6} content={currentReflectionDraft.content.actionPlan} isLast color={sectionColors[5]} />
                            </div>
                        </div>
                    </div>
                )}

                {/* History */}
                <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                <History className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Saved Reflections</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your previously generated reflections</p>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search saved reflections..."
                                value={savedSearchQuery}
                                onChange={(e) => setSavedSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {isFetchingSaved ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                    ) : savedReflections.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                <History className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="text-slate-500 font-bold text-lg mb-1">Yet to save anything</h4>
                            <p className="text-slate-400 text-sm">Your saved reflections will appear here.</p>
                        </div>
                    ) : (() => {
                            const filtered = savedReflections.filter(r => {
                                if (!savedSearchQuery) return true;
                                const q = savedSearchQuery.toLowerCase();
                                return (r.subject || '').toLowerCase().includes(q) || (r.topic || '').toLowerCase().includes(q) || (r.competency || '').toLowerCase().includes(q);
                            });
                            
                            if (filtered.length === 0) {
                                return (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-slate-500 font-medium text-sm">No saved reflections found matching your search.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-6">
                                    {filtered.map(ref => (
                                        <div key={ref.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg sm:text-xl">{ref.subject} — {ref.topic}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {ref.created_at ? new Date(ref.created_at).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    {ref.competency && (
                                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                                            {ref.competency}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleExportPDF(`saved-reflection-${ref.id}`, `Reflection_${ref.subject?.replace(/\s+/g, '_')}`, false)}
                                                    className="bg-white text-slate-700 font-bold h-9 px-4 rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-2 text-sm shadow-sm"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> PDF
                                                </button>
                                                <button
                                                    onClick={() => handleExportPDF(`saved-reflection-${ref.id}`, `Reflection_${ref.subject?.replace(/\s+/g, '_')}`, true)}
                                                    className="bg-emerald-100 text-emerald-700 font-bold h-9 px-4 rounded-xl hover:bg-emerald-200 transition-all flex items-center gap-2 text-sm"
                                                >
                                                    <Share2 className="w-3.5 h-3.5" /> Share
                                                </button>
                                            </div>
                                        </div>

                                        <div className="px-4 sm:px-6 pb-6 bg-white">
                                            <div id={`saved-reflection-${ref.id}`} className="mt-6">
                                                <SectionBlock title="Description of the Experience" num={1} content={ref.content.description} color={sectionColors[0]} />
                                                <SectionBlock title="Feelings and Initial Reactions" num={2} content={ref.content.feelings} color={sectionColors[1]} />
                                                <SectionBlock title="Evaluation of the Experience" num={3} content={ref.content.evaluation} color={sectionColors[2]} />
                                                <SectionBlock title="Analysis (Critical Thinking)" num={4} content={ref.content.analysis} color={sectionColors[3]} />
                                                <SectionBlock title="Learning Points" num={5} content={ref.content.learningPoints} color={sectionColors[4]} />
                                                <SectionBlock title="Action Plan (Future Improvement)" num={6} content={ref.content.actionPlan} isLast color={sectionColors[5]} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                        })()}
                </div>
            </div>
        </div>
    );
}
