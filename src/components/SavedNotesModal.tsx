import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Trash2, Clock, CheckCircle, Copy, Download, Share2, FileDown, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SavedNote {
    id: number;
    course: string;
    subject: string;
    topics: string;
    style: string;
    depth: string;
    content: string;
    createdAt: string;
}

interface SavedNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SavedNotesModal({ isOpen, onClose }: SavedNotesModalProps) {
    const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewNote, setViewNote] = useState<SavedNote | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            try {
                const notes = JSON.parse(localStorage.getItem('mededuai_saved_notes') || '[]');
                // Sort by newest first
                setSavedNotes(notes.sort((a: SavedNote, b: SavedNote) => b.id - a.id));
            } catch (err) {
                console.error('Error loading saved notes', err);
            }
        } else {
            setViewNote(null);
            setSearchQuery('');
        }
    }, [isOpen]);

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete these saved notes?')) return;
        
        try {
            const updated = savedNotes.filter(n => n.id !== id);
            localStorage.setItem('mededuai_saved_notes', JSON.stringify(updated));
            setSavedNotes(updated);
            if (viewNote?.id === id) setViewNote(null);
        } catch (err) {
            console.error('Error deleting note', err);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async (note: SavedNote) => {
        try {
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || (jspdfModule as any).default?.jsPDF || jspdfModule.default;
            const pdf = new (jsPDF as any)('p', 'mm', 'a4');

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text(`Notes: ${note.topics}`, 15, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`${note.course} | ${note.subject} | ${note.depth}`, 15, 28);

            pdf.setFontSize(11);
            const lines = pdf.splitTextToSize(note.content, 180);
            let y = 38;
            const pageHeight = 280;

            for (let i = 0; i < lines.length; i++) {
                if (y > pageHeight) {
                    pdf.addPage();
                    y = 15;
                }
                pdf.text(lines[i], 15, y);
                y += 5.5;
            }

            pdf.save(`Notes_${note.topics.replace(/\s+/g, '_') || 'Saved'}.pdf`);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredNotes = savedNotes.filter(note => {
        const query = searchQuery.toLowerCase();
        return (
            (note.topics || '').toLowerCase().includes(query) ||
            (note.course || '').toLowerCase().includes(query) ||
            (note.subject || '').toLowerCase().includes(query) ||
            (note.content || '').toLowerCase().includes(query)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Saved Notes Library</h2>
                            <p className="text-sm text-slate-500 font-medium">Topic-wise generated notes repository</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-50">
                    {/* Left pane: List of notes */}
                    <div className={`${viewNote ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 flex-col border-r border-slate-200 bg-white`}>
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text"
                                    placeholder="Search by keywords, topics..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all font-medium"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filteredNotes.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FileText className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium text-sm">No saved notes found.</p>
                                </div>
                            ) : (
                                filteredNotes.map(note => (
                                    <div 
                                        key={note.id}
                                        onClick={() => setViewNote(note)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                            viewNote?.id === note.id 
                                                ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                                                : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 text-sm line-clamp-2 pr-2">{note.topics || 'Untitled Note'}</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-emerald-600 bg-emerald-100/50">{note.subject}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-500 bg-slate-100">{note.depth}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right pane: Note details */}
                    <div className={`${!viewNote ? 'hidden md:flex flex-col items-center justify-center' : 'flex flex-col'} w-full md:w-2/3 h-full bg-slate-50`}>
                        {!viewNote ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-slate-200/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Eye className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">Select a note to view</h3>
                                <p className="text-sm text-slate-500 mt-1">Or search for specific keywords in your library</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Details Header */}
                                <div className="p-6 bg-white border-b border-slate-200 flex-shrink-0">
                                    <div className="flex items-center justify-between mb-4">
                                        <button 
                                            onClick={() => setViewNote(null)}
                                            className="md:hidden text-sm font-bold text-emerald-600 flex items-center gap-1"
                                        >
                                            <X className="w-4 h-4" /> Back to list
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{viewNote.topics}</h3>
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                        <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg">{viewNote.course}</span>
                                        <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-lg">{viewNote.subject}</span>
                                        <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-lg">{viewNote.style.split('_').join(' ').toUpperCase()}</span>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                                        <button onClick={() => handleCopy(viewNote.content)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
                                            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied' : 'Copy Text'}
                                        </button>
                                        <button onClick={() => handleDownloadPDF(viewNote)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-colors">
                                            <Download className="w-4 h-4" /> Download PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                                    <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-sm border border-slate-200 prose prose-slate max-w-none prose-sm lg:prose-base">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewNote.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
