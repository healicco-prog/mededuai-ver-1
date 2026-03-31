"use client";

import React, { useState } from 'react';
import { Send, Users, ShieldAlert, BookOpen, MessageSquare } from 'lucide-react';

export default function BulkMessaging() {
    const [recipientGroup, setRecipientGroup] = useState('department_heads');
    const [message, setMessage] = useState('');
    const [channels, setChannels] = useState({
        inApp: true,
        email: false,
        whatsapp: false
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        // action trigger...
        alert('Messages dispatched via selected channels!');
        setMessage('');
    };

    return (
        <div className="w-full text-left max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Bulk Messaging</h2>
                <p className="text-slate-500">Send direct communications to specific structural groups within the institution.</p>
            </div>

            <form onSubmit={handleSend} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-4">1. Select Recipient Group</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <RecipientCard 
                            id="department_heads"
                            title="Department Heads"
                            icon={<ShieldAlert className="w-5 h-5" />}
                            active={recipientGroup === 'department_heads'}
                            onClick={() => setRecipientGroup('department_heads')}
                        />
                        <RecipientCard 
                            id="mentors"
                            title="All Mentors"
                            icon={<BookOpen className="w-5 h-5" />}
                            active={recipientGroup === 'mentors'}
                            onClick={() => setRecipientGroup('mentors')}
                        />
                        <RecipientCard 
                            id="mentees"
                            title="All Mentees"
                            icon={<Users className="w-5 h-5" />}
                            active={recipientGroup === 'mentees'}
                            onClick={() => setRecipientGroup('mentees')}
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-2">2. Type your message</label>
                    <textarea 
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write your broadcast message here..."
                        className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                    />
                    <div className="mt-2 text-right">
                        <span className="text-xs font-semibold text-slate-400">{message.length} characters</span>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-3">3. Delivery Channels</label>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={channels.inApp}
                                onChange={(e) => setChannels({...channels, inApp: e.target.checked})}
                                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span className="font-semibold text-slate-700">In-App Notification</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={channels.email}
                                onChange={(e) => setChannels({...channels, email: e.target.checked})}
                                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span className="font-semibold text-slate-700">Email Broadcast</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer opacity-60">
                            <input 
                                type="checkbox" 
                                disabled
                                checked={channels.whatsapp}
                                onChange={(e) => setChannels({...channels, whatsapp: e.target.checked})}
                                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span className="font-semibold text-slate-700">WhatsApp API (Coming Soon)</span>
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={!message}
                        className="flex items-center gap-2 px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" /> Send Broadcast
                    </button>
                </div>
            </form>
        </div>
    );
}

function RecipientCard({ id, title, icon, active, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2 ${active ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white hover:border-rose-200'}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-rose-200 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                {icon}
            </div>
            <span className={`font-bold text-sm ${active ? 'text-rose-900' : 'text-slate-600'}`}>{title}</span>
        </div>
    );
}
