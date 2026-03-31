"use client";
import { useState } from 'react';
import { Building2, Upload, Save } from 'lucide-react';

export default function Step1Institution({ store }: { store: any }) {
    const existing = store.institutions[0];
    const [name, setName] = useState(existing?.name || '');
    const [address, setAddress] = useState(existing?.address || '');
    const [logoUrl, setLogoUrl] = useState(existing?.logoUrl || '');

    const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLogoUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!name.trim()) return alert('Institution name is required');
        if (existing) {
            store.updateInstitution(existing.id, { name, address, logoUrl });
        } else {
            store.addInstitution({ name, address, logoUrl });
        }
        alert('Institution saved!');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Institution Onboarding</h3>
                    <p className="text-sm text-slate-500">Set up the institution details for this Elective module.</p>
                </div>
            </div>

            {/* Logo */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Institution Logo</label>
                <div className="flex items-center gap-4">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-xl border border-slate-200" />}
                    <label className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-colors text-sm font-bold text-slate-600">
                        <Upload className="w-4 h-4" /> Upload Logo
                        <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Name */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name of the Institution *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ABC Medical College" className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-emerald-500 font-bold text-slate-800 text-lg" />
            </div>

            {/* Address */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="Full postal address..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-emerald-500 font-medium text-slate-700 resize-none" />
            </div>

            {/* Allotment Option */}
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Allotment Option</label>
                <p className="text-xs text-slate-500 mb-4 font-medium">Choose how students will be allotted to electives. This affects the student portal and allotment engine.</p>
                <select 
                    value={store.allotmentMethod} 
                    onChange={e => store.setAllotmentMethod(e.target.value as 'merit' | 'points')} 
                    className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-slate-300 outline-none focus:border-emerald-500 font-bold text-slate-800 cursor-pointer hover:border-slate-400 transition-colors"
                >
                    <option value="merit">Merit-Weighted Preference</option>
                    <option value="points">Point-Based Bidding</option>
                </select>

                {/* Selected method description */}
                {store.allotmentMethod === 'merit' ? (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-bold text-blue-800 flex items-center gap-2">📊 Merit-Weighted Preference</p>
                        <ul className="text-xs text-blue-700 space-y-1.5 ml-1 list-disc list-inside leading-relaxed">
                            <li>Students <strong>rank</strong> electives in order of preference (1 = most preferred).</li>
                            <li>Allotment is done based on the student&apos;s <strong>merit rank</strong> — higher-ranked students get first pick.</li>
                            <li>If a seat is full, the student&apos;s next preference is considered.</li>
                            <li>Tie-breaker: Student with the lower merit rank number (i.e. higher merit) wins.</li>
                        </ul>
                    </div>
                ) : (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-bold text-amber-800 flex items-center gap-2">🎯 Point-Based Bidding</p>
                        <ul className="text-xs text-amber-700 space-y-1.5 ml-1 list-disc list-inside leading-relaxed">
                            <li>Each student gets <strong>1000 points</strong> to distribute across all electives.</li>
                            <li>Students bid more points on electives they prefer more.</li>
                            <li>Each elective must receive a <strong>unique</strong> point value — no two electives can have the same bid.</li>
                            <li>Allotment is done by awarding seats to the <strong>highest bidder</strong> first.</li>
                            <li>Tie-breaker: If two students bid equal points, the student with the higher merit rank wins.</li>
                        </ul>
                    </div>
                )}
            </div>

            <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                <Save className="w-5 h-5" /> {existing ? 'Update Institution' : 'Save Institution'}
            </button>
        </div>
    );
}
