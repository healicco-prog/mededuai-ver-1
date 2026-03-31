"use client";
import { useState, useRef } from 'react';
import { BookOpen, Download, Upload, Plus, Trash2, Save, Edit3, X } from 'lucide-react';
import type { Elective } from '@/store/electiveStore';

function parseCSV(text: string): string[][] {
    return text.trim().split('\n').map(line => line.split(/[;,\t]/).map(c => c.trim()));
}

function downloadTemplate() {
    const header = 'Faculty Name;Faculty Designation;Faculty Email ID;Elective Name;Elective Topic Details;Total Student Uptake';
    const sample = 'Dr. John Doe;Professor;john@example.com;Cardiology Basics;Advanced cardiac physiology;30';
    const blob = new Blob([header + '\n' + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'electives_template.csv'; a.click();
    URL.revokeObjectURL(url);
}

export default function Step2Electives({ store, instId }: { store: any; instId: string }) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Elective>>({});
    const [addMode, setAddMode] = useState<1 | 2 | null>(null);
    const [newRow, setNewRow] = useState({ facultyName: '', facultyDesignation: '', facultyEmail: '', electiveName: '', topicDetails: '', totalUptake: 30 });
    const fileRef1 = useRef<HTMLInputElement>(null);
    const fileRef2 = useRef<HTMLInputElement>(null);

    const allElectives: Elective[] = store.electives.filter((e: Elective) => e.institutionId === instId);
    const block1 = allElectives.filter(e => e.block === 1);
    const block2 = allElectives.filter(e => e.block === 2);

    const handleUpload = (block: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const rows = parseCSV(reader.result as string);
            const header = rows[0];
            const dataRows = rows.slice(1).filter(r => r.length >= 4 && r[0]);
            const items = dataRows.map(r => ({
                institutionId: instId,
                block,
                facultyName: r[0] || '',
                facultyDesignation: r[1] || '',
                facultyEmail: r[2] || '',
                electiveName: r[3] || '',
                topicDetails: r[4] || '',
                totalUptake: parseInt(r[5]) || 30,
            }));
            store.addElectives(items);
            alert(`${items.length} electives uploaded for Block ${block}`);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAdd = (block: 1 | 2) => {
        if (!newRow.electiveName.trim()) return alert('Elective name is required');
        store.addElective({ institutionId: instId, block, ...newRow });
        setNewRow({ facultyName: '', facultyDesignation: '', facultyEmail: '', electiveName: '', topicDetails: '', totalUptake: 30 });
        setAddMode(null);
    };

    const handleEditSave = () => {
        if (editingId) { store.updateElective(editingId, editData); setEditingId(null); }
    };

    const renderTable = (items: Elective[], block: 1 | 2) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h4 className="text-lg font-bold text-slate-800">Block {block} Electives ({items.length})</h4>
                <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"><Download className="w-4 h-4" /> Download Template</button>
                    <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                        <Upload className="w-4 h-4" /> Upload List
                        <input type="file" accept=".csv,.txt" ref={block === 1 ? fileRef1 : fileRef2} onChange={handleUpload(block)} className="hidden" />
                    </label>
                    <button onClick={() => { setAddMode(block); setNewRow({ facultyName: '', facultyDesignation: '', facultyEmail: '', electiveName: '', topicDetails: '', totalUptake: 30 }); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"><Plus className="w-4 h-4" /> Add</button>
                </div>
            </div>

            {/* Add Row */}
            {addMode === block && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input value={newRow.facultyName} onChange={e => setNewRow({ ...newRow, facultyName: e.target.value })} placeholder="Faculty Name" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <input value={newRow.facultyDesignation} onChange={e => setNewRow({ ...newRow, facultyDesignation: e.target.value })} placeholder="Designation" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <input value={newRow.facultyEmail} onChange={e => setNewRow({ ...newRow, facultyEmail: e.target.value })} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <input value={newRow.electiveName} onChange={e => setNewRow({ ...newRow, electiveName: e.target.value })} placeholder="Elective Name *" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-bold outline-none focus:border-blue-500" />
                    <input value={newRow.topicDetails} onChange={e => setNewRow({ ...newRow, topicDetails: e.target.value })} placeholder="Topic Details" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <div className="flex gap-2">
                        <input type="number" value={newRow.totalUptake} onChange={e => setNewRow({ ...newRow, totalUptake: parseInt(e.target.value) || 1 })} placeholder="Seats" className="flex-1 px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-bold outline-none focus:border-blue-500 w-20" />
                        <button onClick={() => handleAdd(block)} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setAddMode(null)} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-300"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            {items.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr><th className="p-3">#</th><th className="p-3">Faculty</th><th className="p-3">Designation</th><th className="p-3">Email</th><th className="p-3">Elective</th><th className="p-3">Topic</th><th className="p-3 text-center">Seats</th><th className="p-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody>
                            {items.map((el, i) => (
                                <tr key={el.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    {editingId === el.id ? (
                                        <>
                                            <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                            <td className="p-3"><input value={editData.facultyName || ''} onChange={e => setEditData({ ...editData, facultyName: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm font-medium" /></td>
                                            <td className="p-3"><input value={editData.facultyDesignation || ''} onChange={e => setEditData({ ...editData, facultyDesignation: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm font-medium" /></td>
                                            <td className="p-3"><input value={editData.facultyEmail || ''} onChange={e => setEditData({ ...editData, facultyEmail: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm font-medium" /></td>
                                            <td className="p-3"><input value={editData.electiveName || ''} onChange={e => setEditData({ ...editData, electiveName: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm font-bold" /></td>
                                            <td className="p-3"><input value={editData.topicDetails || ''} onChange={e => setEditData({ ...editData, topicDetails: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm font-medium" /></td>
                                            <td className="p-3 text-center"><input type="number" value={editData.totalUptake || 1} onChange={e => setEditData({ ...editData, totalUptake: parseInt(e.target.value) || 1 })} className="px-2 py-1 border rounded-lg w-16 text-center text-sm font-bold" /></td>
                                            <td className="p-3 text-right flex gap-1 justify-end"><button onClick={handleEditSave} className="text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Save</button><button onClick={() => setEditingId(null)} className="text-slate-500 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg">Cancel</button></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                            <td className="p-3 font-bold text-slate-800">{el.facultyName}</td>
                                            <td className="p-3 text-slate-600">{el.facultyDesignation}</td>
                                            <td className="p-3 text-slate-500 text-xs">{el.facultyEmail}</td>
                                            <td className="p-3 font-bold text-emerald-700">{el.electiveName}</td>
                                            <td className="p-3 text-slate-600 max-w-[200px] truncate">{el.topicDetails}</td>
                                            <td className="p-3 text-center"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">{el.totalUptake}</span></td>
                                            <td className="p-3 text-right flex gap-1 justify-end">
                                                <button onClick={() => { setEditingId(el.id); setEditData(el); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => confirm('Delete this elective?') && store.deleteElective(el.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-bold">No electives uploaded for Block {block} yet.</div>
            )}
        </div>
    );

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><BookOpen className="w-5 h-5 text-blue-600" /></div>
                <div><h3 className="text-xl font-bold text-slate-900">Upload Electives</h3><p className="text-sm text-slate-500">Upload or manually add electives for Block 1 and Block 2.</p></div>
            </div>
            {renderTable(block1, 1)}
            <hr className="border-slate-200" />
            {renderTable(block2, 2)}
        </div>
    );
}
