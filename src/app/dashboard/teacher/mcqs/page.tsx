"use client";

import { useState } from 'react';
import { ClipboardCheck, Loader2, Save, Send, CheckCircle, XCircle, Trash2, History, Calendar, ChevronDown, ChevronUp, Sparkles, BrainCircuit } from 'lucide-react';

export default function McqGeneratorPage() {
    const [subject, setSubject] = useState('');
    const [numPapers, setNumPapers] = useState(1);
    const [paperConfigs, setPaperConfigs] = useState<{ id: string; name: string; topics: string }[]>([{ id: '0', name: 'Paper 1', topics: '' }]);
    const [isConfigSaved, setIsConfigSaved] = useState(false);
    const [selectedPaperId, setSelectedPaperId] = useState('all');
    const [numMcqs, setNumMcqs] = useState(10);
    const [loading, setLoading] = useState(false);
    const [generatedPapers, setGeneratedPapers] = useState<{ id: string; name: string; mcqs: any[] }[]>([]);
    const [savedExams, setSavedExams] = useState<{ id: string; subject: string; date: string; numMcqs: number; papers: { id: string; name: string; mcqs: any[] }[] }[]>([]);
    const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleNumPapersChange = (val: number) => {
        setNumPapers(val);
        setPaperConfigs(prev => {
            const newConfigs = [...prev];
            if (val > prev.length) { for (let i = prev.length; i < val; i++) newConfigs.push({ id: `${Date.now()}-${i}`, name: `Paper ${i+1}`, topics: '' }); }
            else if (val < prev.length) newConfigs.splice(val);
            return newConfigs;
        });
        setIsConfigSaved(false);
    };

    const deletePaper = (idToDelete: string) => {
        if (paperConfigs.length <= 1) return;
        setPaperConfigs(prev => prev.filter(p => p.id !== idToDelete).map((p, i) => ({ ...p, name: `Paper ${i + 1}` })));
        setNumPapers(prev => prev - 1);
        setIsConfigSaved(false);
    };

    const updatePaperTopic = (index: number, topics: string) => {
        const newConfigs = [...paperConfigs]; newConfigs[index].topics = topics; setPaperConfigs(newConfigs);
    };

    const saveConfig = () => { if (!subject) { alert("Please type a subject."); return; } setIsConfigSaved(true); setSelectedPaperId('all'); };

    const handleGenerate = async () => {
        const papersToGenerate = selectedPaperId === 'all' ? paperConfigs.filter(p => p.topics) : paperConfigs.filter(p => p.id === selectedPaperId && p.topics);
        if (papersToGenerate.length === 0) { alert("Please ensure selected paper(s) have topics."); return; }
        setLoading(true); setAnswers({});
        try {
            const results = await Promise.all(papersToGenerate.map(async (paper) => {
                const res = await fetch('/api/mcq-generator', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, topics: paper.topics, numMcqs }) });
                const data = await res.json();
                return { id: paper.id, name: paper.name, mcqs: data.success && data.mcqs ? data.mcqs : [] };
            }));
            setGeneratedPapers(results.filter(r => r.mcqs.length > 0));
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleAnswerItem = (paperId: string, mcqIndex: number, option: string) => {
        const key = `${paperId}-${mcqIndex}`;
        if (answers[key] !== undefined) return;
        setAnswers(prev => ({ ...prev, [key]: option }));
    };

    const handleSaveAllToDb = () => {
        if (generatedPapers.length === 0) return;
        let totalMcqs = 0; generatedPapers.forEach(p => totalMcqs += p.mcqs.length);
        setSavedExams(prev => [{ id: Date.now().toString(), subject: subject || 'Unnamed', date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), numMcqs: totalMcqs, papers: [...generatedPapers] }, ...prev]);
        setGeneratedPapers([]);
        alert("MCQs saved successfully!");
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-fuchsia-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                            <ClipboardCheck className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">MCQs Generator</h2>
                            <p className="text-rose-300/80 text-sm font-medium">Generate high-yield MCQs for summative examinations</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 space-y-6">
                {/* Configuration Section */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-rose-50/50 to-white p-5 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-rose-600" /> 1. Setup Exam Paper Configuration
                        </h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Type Subject</label>
                                <input type="text" placeholder="e.g., Anatomy, Physiology" value={subject}
                                    onChange={e => { setSubject(e.target.value); setIsConfigSaved(false); }}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">No. of Papers</label>
                                <select value={numPapers} onChange={e => e.target.value === 'more' ? handleNumPapersChange(numPapers + 1) : handleNumPapersChange(Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium transition-all">
                                    {Array.from({ length: Math.max(numPapers, 2) }, (_, i) => i + 1).map(n => <option key={n} value={n}>Paper {n}</option>)}
                                    <option value="more">+ Add More</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {paperConfigs.map((paper, idx) => (
                                <div key={paper.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Topics for {paper.name}</label>
                                        {paperConfigs.length > 1 && (
                                            <button onClick={() => deletePaper(paper.id)} className="text-red-400 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                                                <Trash2 className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <textarea placeholder="Enter Topics/Systems (e.g., Cardiovascular, CNS)" value={paper.topics}
                                        onChange={e => { updatePaperTopic(idx, e.target.value); setIsConfigSaved(false); }}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium min-h-[80px] transition-all" />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button onClick={saveConfig} disabled={isConfigSaved}
                                className={`font-bold h-11 px-6 rounded-xl transition-all flex items-center gap-2 text-sm ${isConfigSaved ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg hover:shadow-rose-500/25'}`}>
                                <Save className="w-4 h-4" /> {isConfigSaved ? 'Configuration Saved' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generator Section */}
                {isConfigSaved && (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-gradient-to-b from-pink-50/50 to-white p-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-pink-600" /> 2. Generate Questions
                            </h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Paper</label>
                                    <select value={selectedPaperId} onChange={e => setSelectedPaperId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium transition-all">
                                        <option value="all">All Papers (Entire Exam)</option>
                                        {paperConfigs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.topics.substring(0, 20)}{p.topics.length > 20 ? '...' : ''})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">No. of MCQs</label>
                                    <input type="number" min="1" max="50" value={numMcqs} onChange={e => setNumMcqs(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-pink-500 text-sm font-medium transition-all" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button onClick={handleGenerate} disabled={loading}
                                    className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50 flex items-center gap-2 text-sm">
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {loading ? 'Generating MCQs...' : 'Generate MCQs'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MCQs */}
                {generatedPapers.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Final Generated Examination</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review and interact with questions</p>
                            </div>
                            <button onClick={handleSaveAllToDb}
                                className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 text-sm">
                                <Save className="w-4 h-4" /> Save Entire Exam
                            </button>
                        </div>
                        
                        {generatedPapers.map(paper => (
                            <div key={paper.id} className="space-y-4">
                                <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold px-5 py-3 rounded-xl inline-block text-xs uppercase tracking-widest shadow-md">
                                    {paper.name} ({paper.mcqs.length} MCQs)
                                </div>
                                {paper.mcqs.map((mcq: any, idx: number) => {
                                    const ansKey = `${paper.id}-${idx}`;
                                    return (
                                        <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                            <h4 className="font-bold text-slate-900 mb-5 flex gap-3 leading-relaxed">
                                                <span className="text-white bg-gradient-to-br from-rose-500 to-pink-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm shadow-sm">{idx + 1}</span>
                                                <span className="mt-1">{mcq.question}</span>
                                            </h4>
                                            <div className="space-y-3 mb-5 pl-11">
                                                {mcq.options.map((opt: string, optIdx: number) => {
                                                    const isAnswered = answers[ansKey] !== undefined;
                                                    const isSelected = answers[ansKey] === opt;
                                                    const isCorrectOpt = opt === mcq.correctAnswer;
                                                    let btnClass = "w-full text-left px-5 py-3.5 rounded-xl border font-medium transition-all duration-200 ";
                                                    if (!isAnswered) btnClass += "border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-800 shadow-sm hover:shadow";
                                                    else if (isCorrectOpt) btnClass += "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 ring-offset-1";
                                                    else if (isSelected && !isCorrectOpt) btnClass += "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500 ring-offset-1";
                                                    else btnClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                                                    return (
                                                        <button key={optIdx} onClick={() => handleAnswerItem(paper.id, idx, opt)} disabled={isAnswered} className={btnClass}>
                                                            <div className="flex items-center justify-between">
                                                                <span>{opt}</span>
                                                                {isAnswered && isCorrectOpt && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                                                                {isAnswered && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {answers[ansKey] !== undefined && (
                                                <div className={`ml-11 p-5 rounded-2xl border ${answers[ansKey] === mcq.correctAnswer ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'} animate-in fade-in slide-in-from-top-2`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {answers[ansKey] === mcq.correctAnswer ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                                                        <h5 className={`font-bold text-xs uppercase tracking-widest ${answers[ansKey] === mcq.correctAnswer ? 'text-emerald-800' : 'text-red-800'}`}>
                                                            {answers[ansKey] === mcq.correctAnswer ? 'Correct' : 'Incorrect'}
                                                        </h5>
                                                    </div>
                                                    <p className="text-slate-700 text-sm leading-relaxed font-medium">{mcq.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div className="flex justify-center mt-8 pb-6">
                            <button onClick={handleSaveAllToDb}
                                className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold h-14 px-10 rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all flex items-center gap-3 hover:scale-[1.01] active:scale-[0.99]">
                                <Save className="w-6 h-6" /> Save All MCQs
                            </button>
                        </div>
                    </div>
                )}

                {/* History */}
                {savedExams.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-8 border-t-2 border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                                <History className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Saved Examinations History</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your previously generated MCQs</p>
                            </div>
                        </div>

                        {savedExams.map(exam => (
                            <div key={exam.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => setExpandedExamId(expandedExamId === exam.id ? null : exam.id)}>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{exam.subject} Examination</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1.5 rounded-lg"><Calendar className="w-3 h-3" /> {exam.date}</span>
                                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">{exam.papers.length} Paper{exam.papers.length !== 1 && 's'} | {exam.numMcqs} MCQs</span>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        {expandedExamId === exam.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>
                                {expandedExamId === exam.id && (
                                    <div className="p-6 pt-2 border-t border-slate-100 bg-slate-50 space-y-6">
                                        {exam.papers.map(paper => (
                                            <div key={paper.id} className="space-y-4">
                                                <div className="bg-white text-rose-800 font-bold px-5 py-3 rounded-xl border border-rose-100 inline-block mb-1 text-xs uppercase tracking-widest shadow-sm">
                                                    {paper.name} ({paper.mcqs.length} MCQs)
                                                </div>
                                                <div className="grid grid-cols-1 gap-4 text-sm">
                                                    {paper.mcqs.map((mcq: any, idx: number) => (
                                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                            <h5 className="font-bold text-slate-800 mb-3 flex gap-3 text-[15px]">
                                                                <span className="text-slate-500 bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">{idx + 1}</span>
                                                                <span className="mt-0.5">{mcq.question}</span>
                                                            </h5>
                                                            <div className="pl-9 space-y-2">
                                                                {mcq.options.map((opt: string, optIdx: number) => (
                                                                    <div key={optIdx} className={`px-4 py-2 rounded-xl border ${opt === mcq.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                                                        <div className="flex items-center justify-between"><span>{opt}</span>{opt === mcq.correctAnswer && <CheckCircle className="w-4 h-4 text-emerald-500" />}</div>
                                                                    </div>
                                                                ))}
                                                                <div className="mt-3 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                                                                    <h6 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Explanation</h6>
                                                                    <p className="text-slate-700 leading-relaxed font-medium">{mcq.explanation}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
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
