"use client";
import { useState } from 'react';
import { CalendarDays, Plus, Trash2, Save } from 'lucide-react';
import type { ElectiveDate } from '@/store/electiveStore';

export default function Step4Dates({ store, instId }: { store: any; instId: string }) {
    const dates: ElectiveDate[] = store.dates.filter((d: ElectiveDate) => d.institutionId === instId);
    const [form, setForm] = useState({ block: 1 as 1 | 2, group: null as 1 | 2 | null, fromDate: '', toDate: '' });

    const handleAdd = () => {
        if (!form.fromDate || !form.toDate) return alert('Both dates are required');
        store.addDate({ institutionId: instId, ...form, studentsManual: [] });
        setForm({ block: 1, group: null, fromDate: '', toDate: '' });
    };

    if (!instId) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 font-bold">⚠️ Please complete Institution Onboarding first.</div>;

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><CalendarDays className="w-5 h-5 text-orange-600" /></div>
                <div><h3 className="text-xl font-bold text-slate-900">Elective Dates</h3><p className="text-sm text-slate-500">Assign date ranges for each Block and Group combination.</p></div>
            </div>

            {/* Add Row */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Block</label>
                    <select value={form.block} onChange={e => setForm({ ...form, block: parseInt(e.target.value) as 1 | 2 })} className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-white text-sm font-bold outline-none focus:border-orange-500">
                        <option value={1}>Block 1</option><option value={2}>Block 2</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Group</label>
                    <select value={form.group ?? ''} onChange={e => setForm({ ...form, group: e.target.value ? parseInt(e.target.value) as 1 | 2 : null })} className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-white text-sm font-bold outline-none focus:border-orange-500">
                        <option value="">All / No Division</option><option value={1}>Group 1</option><option value={2}>Group 2</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From Date</label>
                    <input type="date" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-white text-sm font-medium outline-none focus:border-orange-500" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To Date</label>
                    <input type="date" value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-white text-sm font-medium outline-none focus:border-orange-500" />
                </div>
                <button onClick={handleAdd} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                    <Plus className="w-4 h-4" /> Add Row
                </button>
            </div>

            {/* Dates Table */}
            {dates.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <tr><th className="p-3">#</th><th className="p-3">Block</th><th className="p-3">Group</th><th className="p-3">From</th><th className="p-3">To</th><th className="p-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody>
                            {dates.map((d, i) => (
                                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                                    <td className="p-3"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-200">Block {d.block}</span></td>
                                    <td className="p-3 font-bold text-slate-700">{d.group ? `Group ${d.group}` : 'All Students'}</td>
                                    <td className="p-3 font-medium text-slate-700">{new Date(d.fromDate).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium text-slate-700">{new Date(d.toDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-right"><button onClick={() => confirm('Delete?') && store.deleteDate(d.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 font-bold">No date entries added yet.</div>
            )}

            {dates.length > 0 && (
                <button onClick={() => alert('Dates saved!')} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"><Save className="w-5 h-5" /> Save Dates</button>
            )}
        </div>
    );
}
