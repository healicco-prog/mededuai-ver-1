"use client";

import { useState } from 'react';
import { FileText, Loader2, Save, Send, CheckCircle, BrainCircuit, ShieldAlert, History, Calendar, ChevronDown, ChevronUp, Share2, Download, Sparkles, PenLine } from 'lucide-react';

interface GeneratedReflection {
    id: string;
    date: string;
    subject: string;
    topic: string;
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
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [competency, setCompetency] = useState('');
    const [instruction, setInstruction] = useState('');
    const [wordCount, setWordCount] = useState('500');

    const [loading, setLoading] = useState(false);
    
    const [currentReflectionDraft, setCurrentReflectionDraft] = useState<GeneratedReflection | null>(null);

    const [savedReflections, setSavedReflections] = useState<GeneratedReflection[]>([]);
    const [expandedRefId, setExpandedRefId] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!subject.trim() || !topic.trim()) {
            alert("Subject and Topic are compulsory fields.");
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
                    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    subject: subject.trim(),
                    topic: topic.trim(),
                    content: data.reflection
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReflection = () => {
        if (!currentReflectionDraft) return;

        setSavedReflections(prev => [currentReflectionDraft, ...prev]);
        setCurrentReflectionDraft(null);

        alert("Reflection saved successfully!");
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
                {savedReflections.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                                <History className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Saved Reflections</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Your previously generated reflections</p>
                            </div>
                        </div>

                        {savedReflections.map(ref => (
                            <div key={ref.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                <div 
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedRefId(expandedRefId === ref.id ? null : ref.id)}
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{ref.subject} — {ref.topic}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {ref.date}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                6 Sections
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 transition-transform">
                                        {expandedRefId === ref.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {expandedRefId === ref.id && (
                                    <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50">
                                        <div className="flex gap-2 mt-4 mb-3 justify-end">
                                            <button
                                                onClick={() => handleExportPDF(`saved-reflection-${ref.id}`, `Reflection_${ref.subject.replace(/\s+/g, '_')}`, false)}
                                                className="bg-white text-slate-700 font-bold h-9 px-4 rounded-xl hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-2 text-sm shadow-sm"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Save PDF
                                            </button>
                                            <button
                                                onClick={() => handleExportPDF(`saved-reflection-${ref.id}`, `Reflection_${ref.subject.replace(/\s+/g, '_')}`, true)}
                                                className="bg-emerald-100 text-emerald-700 font-bold h-9 px-4 rounded-xl hover:bg-emerald-200 transition-all flex items-center gap-2 text-sm"
                                            >
                                                <Share2 className="w-3.5 h-3.5" /> Share
                                            </button>
                                        </div>
                                        <div id={`saved-reflection-${ref.id}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                            <SectionBlock title="Description of the Experience" num={1} content={ref.content.description} color={sectionColors[0]} />
                                            <SectionBlock title="Feelings and Initial Reactions" num={2} content={ref.content.feelings} color={sectionColors[1]} />
                                            <SectionBlock title="Evaluation of the Experience" num={3} content={ref.content.evaluation} color={sectionColors[2]} />
                                            <SectionBlock title="Analysis (Critical Thinking)" num={4} content={ref.content.analysis} color={sectionColors[3]} />
                                            <SectionBlock title="Learning Points" num={5} content={ref.content.learningPoints} color={sectionColors[4]} />
                                            <SectionBlock title="Action Plan (Future Improvement)" num={6} content={ref.content.actionPlan} isLast color={sectionColors[5]} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
