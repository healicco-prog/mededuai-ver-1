import React from 'react';
import { ClipboardList } from 'lucide-react';

export default function LogBookMSPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <ClipboardList className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">LogBook MS</h1>
            <p className="text-lg text-slate-600 max-w-md">
                This module is currently under development and will be coming shortly. Stay tuned!
            </p>
        </div>
    );
}
