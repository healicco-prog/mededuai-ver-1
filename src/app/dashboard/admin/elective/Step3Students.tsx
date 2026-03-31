"use client";
import { useState, useRef } from 'react';
import { Users, Download, Upload, Plus, Trash2, Save, Edit3, X } from 'lucide-react';
import type { ElectiveStudent } from '@/store/electiveStore';

function parseCSV(text: string): string[][] {
    return text.trim().split('\n').map(line => line.split(/[;,\t]/).map(c => c.trim()));
}

function downloadTemplate() {
    const header = 'Name;Registration No;Mobile No;Email;Address';
    const sample = 'John Doe;REG001;9876543210;john@example.com;123 Main St';
    const blob = new Blob([header + '\n' + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students_template.csv'; a.click();
    URL.revokeObjectURL(url);
}

export default function Step3Students({ store, instId }: { store: any; instId: string }) {
    const [groupMode, setGroupMode] = useState<'manual' | 'none'>('none');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<ElectiveStudent>>({});
    const [addMode, setAddMode] = useState(false);
    const [newRow, setNewRow] = useState({ name: '', regNo: '', mobileNo: '', email: '', address: '' });
    const fileRef = useRef<HTMLInputElement>(null);

    const students: ElectiveStudent[] = store.students.filter((s: ElectiveStudent) => s.institutionId === instId);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const rows = parseCSV(reader.result as string);
            const dataRows = rows.slice(1).filter(r => r.length >= 2 && r[0]);
            const items = dataRows.map(r => ({
                institutionId: instId,
                name: r[0] || '', regNo: r[1] || '', mobileNo: r[2] || '', email: r[3] || '', address: r[4] || '',
                group: null as (1 | 2 | null), meritRank: null as (number | null),
            }));
            store.addStudents(items);
            alert(`${items.length} students uploaded`);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleAdd = () => {
        if (!newRow.name.trim()) return alert('Student name is required');
        store.addStudent({ institutionId: instId, ...newRow, group: null, meritRank: null });
        setNewRow({ name: '', regNo: '', mobileNo: '', email: '', address: '' });
        setAddMode(false);
    };

    const handleGroupSelect = (mode: 'manual' | 'none') => {
        setGroupMode(mode);
        if (mode === 'none') store.setStudentGroups('none');
    };

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-violet-600" /></div>
                <div><h3 className="text-xl font-bold text-slate-900">Upload Students</h3><p className="text-sm text-slate-500">Upload student list and optionally divide into groups.</p></div>
            </div>

            {/* Upload & Controls */}
            <div className="flex flex-wrap gap-3">
                <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200"><Download className="w-4 h-4" /> Download Template</button>
                <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100">
                    <Upload className="w-4 h-4" /> Upload List
                    <input type="file" accept=".csv,.txt" ref={fileRef} onChange={handleUpload} className="hidden" />
                </label>
                <button onClick={() => setAddMode(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100"><Plus className="w-4 h-4" /> Add Student</button>
            </div>

            {/* Group Division */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Student Division</label>
                <div className="flex gap-3">
                    <button onClick={() => handleGroupSelect('manual')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${groupMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}>Divide into Groups (1 & 2)</button>
                    <button onClick={() => handleGroupSelect('none')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${groupMode === 'none' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}>No Division</button>
                </div>
            </div>

            {/* Add Row */}
            {addMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input value={newRow.name} onChange={e => setNewRow({ ...newRow, name: e.target.value })} placeholder="Name *" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-bold outline-none focus:border-blue-500" />
                    <input value={newRow.regNo} onChange={e => setNewRow({ ...newRow, regNo: e.target.value })} placeholder="Reg No" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <input value={newRow.mobileNo} onChange={e => setNewRow({ ...newRow, mobileNo: e.target.value })} placeholder="Mobile" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <input value={newRow.email} onChange={e => setNewRow({ ...newRow, email: e.target.value })} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <input value={newRow.address} onChange={e => setNewRow({ ...newRow, address: e.target.value })} placeholder="Address" className="px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium outline-none focus:border-blue-500" />
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setAddMode(false)} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-sm font-bold"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            {/* Students Table */}
            {students.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr><th className="p-3">#</th><th className="p-3">Name</th><th className="p-3">Reg No</th><th className="p-3">Mobile</th><th className="p-3">Email</th>{groupMode === 'manual' && <th className="p-3 text-center">Group</th>}<th className="p-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody>
                            {students.map((st, i) => (
                                <tr key={st.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    {editingId === st.id ? (
                                        <>
                                            <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                            <td className="p-3"><input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm font-bold" /></td>
                                            <td className="p-3"><input value={editData.regNo || ''} onChange={e => setEditData({ ...editData, regNo: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm" /></td>
                                            <td className="p-3"><input value={editData.mobileNo || ''} onChange={e => setEditData({ ...editData, mobileNo: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm" /></td>
                                            <td className="p-3"><input value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} className="px-2 py-1 border rounded-lg w-full text-sm" /></td>
                                            {groupMode === 'manual' && <td className="p-3 text-center">—</td>}
                                            <td className="p-3 text-right flex gap-1 justify-end">
                                                <button onClick={() => { store.updateStudent(st.id, editData); setEditingId(null); }} className="text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-500 font-bold text-xs bg-slate-100 px-3 py-1.5 rounded-lg">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                            <td className="p-3 font-bold text-slate-800">{st.name}</td>
                                            <td className="p-3 text-slate-600 font-mono">{st.regNo}</td>
                                            <td className="p-3 text-slate-500">{st.mobileNo}</td>
                                            <td className="p-3 text-slate-500 text-xs">{st.email}</td>
                                            {groupMode === 'manual' && (
                                                <td className="p-3 text-center">
                                                    <select value={st.group ?? ''} onChange={e => store.assignStudentGroup(st.id, e.target.value ? parseInt(e.target.value) as 1 | 2 : null)} className="px-2 py-1 border rounded-lg text-sm font-bold bg-white">
                                                        <option value="">—</option><option value="1">Group 1</option><option value="2">Group 2</option>
                                                    </select>
                                                </td>
                                            )}
                                            <td className="p-3 text-right flex gap-1 justify-end">
                                                <button onClick={() => { setEditingId(st.id); setEditData(st); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => confirm('Delete?') && store.deleteStudent(st.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-bold">No students uploaded yet.</div>
            )}
        </div>
    );
}
