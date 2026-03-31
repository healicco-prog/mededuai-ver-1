"use client";

import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useMentorshipStore } from '@/store/mentorshipStore';
import {
    User, Users, Calendar, MessageSquare, Save, ChevronRight,
    Send, AlertCircle, Clock, CheckCircle2, FileSignature, Heart, GraduationCap
} from 'lucide-react';

export default function StudentMentorshipClient() {
    const { users } = useUserStore();
    const { 
        mentees, meetings, chats, addMeeting, 
        markMeetingAttended, addMeetingFeedback, updateMenteeProfile, sendMessage, signMeeting
    } = useMentorshipStore();

    const currentUser = users.find(u => u.role === 'student' && u.name === 'Alice Smith') || users.find(u => u.role === 'student');
    const myMenteeRecord = mentees.find(m => m.studentId === currentUser?.id);
    
    const [profileForm, setProfileForm] = useState({
        regNo: myMenteeRecord?.regNo || '',
        mobileNumber: myMenteeRecord?.mobileNumber || '',
        emailId: myMenteeRecord?.emailId || currentUser?.email || '',
        permanentAddress: myMenteeRecord?.permanentAddress || '',
        parentName: myMenteeRecord?.parentName || '',
        parentContactNo: myMenteeRecord?.parentContactNo || '',
        parentContactMail: myMenteeRecord?.parentContactMail || ''
    });

    const myPeerMentees = mentees.filter(m => m.peerMentorId === currentUser?.id);
    const isPeerMentor = myPeerMentees.length > 0;

    const [activeTab, setActiveTab] = useState<'profile' | 'mentee' | 'peerMentor'>('profile');
    const [selectedPeerMenteeId, setSelectedPeerMenteeId] = useState<string | null>(null);

    const [peerMeetingForm, setPeerMeetingForm] = useState({
        date: '',
        academicNonAcademic: 'Academic',
        remarks: '',
        nextMeetingDate: '',
        sendFeedback: true
    });

    const selectedPeerMentee = myPeerMentees.find(m => m.id === selectedPeerMenteeId);
    const peerMenteeMeetings = meetings.filter(m => m.menteeId === selectedPeerMenteeId && m.isPeerMeeting);

    const tabConfig = [
        { id: 'profile' as const, label: 'My Profile', icon: User, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        { id: 'mentee' as const, label: 'As Mentee', icon: Calendar, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        { id: 'peerMentor' as const, label: 'As Peer Mentor', icon: Users, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    ];
    
    return (
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-purple-900 via-violet-900 to-indigo-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Mentorship Management System</h2>
                            <p className="text-purple-300/80 text-sm font-medium">Manage your profile, connect with mentors, and guide your peers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 pb-4 flex-shrink-0 overflow-x-auto scrollbar-none">
                {tabConfig.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                            activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md` : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-8">
                {/* ————— PROFILE TAB ————— */}
                {activeTab === 'profile' && (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden max-w-3xl">
                        <div className="bg-gradient-to-b from-purple-50/50 to-white p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-600" /> Mentorship Profile Setup
                            </h3>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Registration Number</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                        value={profileForm.regNo}
                                        onChange={e => setProfileForm({...profileForm, regNo: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mobile Number</label>
                                    <input 
                                        type="tel" 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                        value={profileForm.mobileNumber}
                                        onChange={e => setProfileForm({...profileForm, mobileNumber: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email ID</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                        value={profileForm.emailId}
                                        onChange={e => setProfileForm({...profileForm, emailId: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Permanent Address</label>
                                    <textarea 
                                        rows={3} 
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium resize-none transition-all"
                                        value={profileForm.permanentAddress}
                                        onChange={e => setProfileForm({...profileForm, permanentAddress: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-5">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-purple-500" /> Parent / Guardian Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                            value={profileForm.parentName}
                                            onChange={e => setProfileForm({...profileForm, parentName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact No</label>
                                        <input 
                                            type="tel" 
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                            value={profileForm.parentContactNo}
                                            onChange={e => setProfileForm({...profileForm, parentContactNo: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Email</label>
                                        <input 
                                            type="email" 
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                            value={profileForm.parentContactMail}
                                            onChange={e => setProfileForm({...profileForm, parentContactMail: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button 
                                    onClick={() => {
                                        if(myMenteeRecord) {
                                            updateMenteeProfile(myMenteeRecord.id, profileForm);
                                            alert("Profile successfully updated!");
                                        } else {
                                            alert("Mentee record not found.");
                                        }
                                    }}
                                    className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold h-12 px-8 rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    <Save className="w-5 h-5" /> Save Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                
                {/* ————— MENTEE TAB ————— */}
                {activeTab === 'mentee' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Meetings & Feedback */}
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-b from-emerald-50/50 to-white p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-emerald-600" /> My Mentorship Sessions
                                </h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {meetings.filter(m => m.menteeId === myMenteeRecord?.id).length === 0 ? (
                                    <div className="p-12 text-center bg-slate-50 rounded-2xl text-slate-400 flex flex-col items-center gap-3">
                                        <Calendar className="w-12 h-12 opacity-20" />
                                        <p className="font-medium">No sessions scheduled yet.</p>
                                    </div>
                                ) : (
                                    meetings
                                        .filter(m => m.menteeId === myMenteeRecord?.id)
                                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map(meeting => (
                                            <div key={meeting.id} className="border border-slate-200 p-5 rounded-2xl flex flex-col gap-3 hover:shadow-sm transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mb-2 inline-block ${meeting.isPeerMeeting ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {meeting.isPeerMeeting ? 'Peer Session' : 'Mentor Session'}
                                                        </span>
                                                        <h4 className="font-bold text-slate-800">{new Date(meeting.date).toLocaleDateString()}</h4>
                                                        {meeting.nextMeetingDate && (
                                                            <div className="text-xs text-slate-500 mt-1">Next scheduled: {new Date(meeting.nextMeetingDate).toLocaleDateString()}</div>
                                                        )}
                                                    </div>
                                                    
                                                    {meeting.isSigned && !meeting.attendedByMentee && (
                                                        <button 
                                                            onClick={() => markMeetingAttended(meeting.id)}
                                                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                                                        >
                                                            Mark Attended
                                                        </button>
                                                    )}
                                                </div>

                                                {meeting.attendedByMentee && !meeting.menteeFeedback && (
                                                    <div className="mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Provide Feedback for this session:</label>
                                                        <textarea 
                                                            id={`feedback-${meeting.id}`}
                                                            rows={2}
                                                            className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3 font-medium"
                                                            placeholder="How was the session? Was it helpful?"
                                                        />
                                                        <div className="flex justify-end">
                                                            <button 
                                                                onClick={() => {
                                                                    const input = document.getElementById(`feedback-${meeting.id}`) as HTMLTextAreaElement;
                                                                    if(input && input.value) {
                                                                        addMeetingFeedback(meeting.id, input.value);
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
                                                            >
                                                                Submit Feedback
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {meeting.menteeFeedback && (
                                                    <div className="text-sm text-slate-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                                        <span className="font-bold text-emerald-700 text-xs uppercase tracking-widest">Your Feedback:</span>
                                                        <p className="mt-1 italic">&quot;{meeting.menteeFeedback}&quot;</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* Communications & Notifications */}
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden min-h-[500px]">
                            <div className="bg-gradient-to-b from-blue-50/50 to-white p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-blue-600" /> Messages & Notifications
                                </h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {chats.filter(c => c.receiverId === 'group' || c.receiverId === currentUser?.id || c.senderId === currentUser?.id).length === 0 ? (
                                    <div className="text-center p-12 text-slate-400 flex flex-col items-center gap-3">
                                        <MessageSquare className="w-12 h-12 opacity-20" />
                                        <p className="font-medium">No messages or notifications.</p>
                                    </div>
                                ) : (
                                    chats
                                        .filter(c => c.receiverId === 'group' || c.receiverId === currentUser?.id || c.senderId === currentUser?.id)
                                        .map(chat => (
                                        <div key={chat.id} className={`flex ${chat.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-4 rounded-2xl ${
                                                chat.senderId === currentUser?.id 
                                                    ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-tr-sm shadow-md shadow-purple-500/15' 
                                                    : chat.receiverId === 'group' 
                                                        ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-sm'
                                                        : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm'
                                            }`}>
                                                <div className="text-[11px] opacity-75 mb-1 font-bold flex items-center justify-between gap-4 uppercase tracking-widest">
                                                    <span>{chat.senderName}</span>
                                                    <span>{new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                {chat.receiverId === 'group' && (
                                                    <div className="text-[10px] uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1 opacity-70">
                                                        <AlertCircle className="w-3 h-3" /> Broadcast
                                                    </div>
                                                )}
                                                <div className="text-sm whitespace-pre-wrap leading-relaxed">{chat.message}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-auto shrink-0 flex gap-3 p-4 border-t border-slate-100 bg-gradient-to-t from-slate-50 to-white">
                                <input 
                                    type="text"
                                    id="menteeMessageInput"
                                    placeholder="Message your mentor..."
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 text-sm font-medium transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const input = e.currentTarget;
                                            if (!input.value.trim() || !currentUser || !myMenteeRecord) return;
                                            sendMessage({
                                                senderId: currentUser.id,
                                                senderName: currentUser.name,
                                                receiverId: myMenteeRecord.mentorId,
                                                message: input.value.trim()
                                            });
                                            input.value = '';
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        const input = document.getElementById('menteeMessageInput') as HTMLInputElement;
                                        if (!input.value.trim() || !currentUser || !myMenteeRecord) return;
                                        sendMessage({
                                            senderId: currentUser.id,
                                            senderName: currentUser.name,
                                            receiverId: myMenteeRecord.mentorId,
                                            message: input.value.trim()
                                        });
                                        input.value = '';
                                    }}
                                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/25 transition-all shrink-0 hover:scale-105 active:scale-95"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* ————— PEER MENTOR TAB ————— */}
                {activeTab === 'peerMentor' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-b from-blue-50/50 to-white p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" /> My Mentees
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {myPeerMentees.map(mentee => (
                                    <button
                                        key={mentee.id}
                                        onClick={() => setSelectedPeerMenteeId(mentee.id)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                            selectedPeerMenteeId === mentee.id
                                                ? 'border-blue-400 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-900">{mentee.studentName}</div>
                                            <div className="text-sm text-slate-500">Year: {mentee.year}</div>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 ${selectedPeerMenteeId === mentee.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                    </button>
                                ))}
                                {myPeerMentees.length === 0 && (
                                    <div className="text-sm text-slate-400 italic text-center p-8">No mentees assigned.</div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden min-h-[400px]">
                            {!selectedPeerMentee ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                    <Users className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-medium">Select a peer mentee to manage sessions.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="bg-gradient-to-b from-blue-50/50 to-white p-6 border-b border-slate-100 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{selectedPeerMentee.studentName}</h2>
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Peer Mentorship Area</p>
                                        </div>
                                    </div>

                                    {/* Log Meeting Form */}
                                    <div className="p-6 border-b border-slate-100">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-blue-600" /> Log Session
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Date</label>
                                                    <input 
                                                        type="date" 
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                                                        value={peerMeetingForm.date}
                                                        onChange={e => setPeerMeetingForm({...peerMeetingForm, date: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Focus Area</label>
                                                    <select 
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                                                        value={peerMeetingForm.academicNonAcademic}
                                                        onChange={e => setPeerMeetingForm({...peerMeetingForm, academicNonAcademic: e.target.value})}
                                                    >
                                                        <option value="Academic">Academic</option>
                                                        <option value="Non-Academic">Non-Academic</option>
                                                        <option value="Both">Both</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Remarks</label>
                                                <textarea 
                                                    rows={2}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium resize-none transition-all"
                                                    value={peerMeetingForm.remarks}
                                                    onChange={e => setPeerMeetingForm({...peerMeetingForm, remarks: e.target.value})}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Next Meeting Date (Optional)</label>
                                                <input 
                                                    type="date" 
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                                                    value={peerMeetingForm.nextMeetingDate}
                                                    onChange={e => setPeerMeetingForm({...peerMeetingForm, nextMeetingDate: e.target.value})}
                                                />
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    id="peerSendFeedback"
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
                                                    checked={peerMeetingForm.sendFeedback}
                                                    onChange={e => setPeerMeetingForm({...peerMeetingForm, sendFeedback: e.target.checked})}
                                                />
                                                <label htmlFor="peerSendFeedback" className="text-xs font-bold text-slate-600 cursor-pointer">Request Mentee Feedback</label>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <button 
                                                    onClick={() => {
                                                        if(!currentUser || !selectedPeerMenteeId || !peerMeetingForm.date) return alert("Please fill at least the meeting date.");
                                                        addMeeting({
                                                            menteeId: selectedPeerMenteeId,
                                                            mentorId: currentUser.id,
                                                            isPeerMeeting: true,
                                                            date: peerMeetingForm.date,
                                                            academicNonAcademic: peerMeetingForm.academicNonAcademic,
                                                            remarks: peerMeetingForm.remarks,
                                                            nextMeetingDate: peerMeetingForm.nextMeetingDate,
                                                            feedbackSent: peerMeetingForm.sendFeedback,
                                                            isSigned: false
                                                        });
                                                        setPeerMeetingForm({ date: '', academicNonAcademic: 'Academic', remarks: '', nextMeetingDate: '', sendFeedback: true});
                                                        alert("Peer Mentor Meeting Saved! " + (peerMeetingForm.sendFeedback ? "Feedback form sent to student." : ""));
                                                    }}
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 text-sm hover:scale-[1.01] active:scale-[0.99]"
                                                >
                                                    <Save className="w-4 h-4" /> Save Record
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* History */}
                                    <div className="p-6">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-blue-600" /> Meeting History
                                        </h4>
                                        <div className="space-y-3">
                                            {peerMenteeMeetings.length === 0 ? (
                                                <div className="text-sm text-slate-400 italic text-center p-6">No meetings recorded yet.</div>
                                            ) : (
                                                peerMenteeMeetings.map(meeting => (
                                                    <div key={meeting.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-shadow">
                                                        <div className="flex-1 text-sm">
                                                            <div className="font-bold text-slate-800 mb-1">{new Date(meeting.date).toLocaleDateString()}</div>
                                                            <div className="text-slate-600 mb-1"><span className="font-semibold">Focus:</span> {meeting.academicNonAcademic}</div>
                                                            <div className="text-slate-600"><span className="font-semibold">Remarks:</span> {meeting.remarks || 'None'}</div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                                            {meeting.isSigned ? (
                                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest">
                                                                    <CheckCircle2 className="w-3 h-3" /> Signed
                                                                </span>
                                                            ) : (
                                                                <button onClick={() => { signMeeting(meeting.id); }} className="text-xs px-4 py-2 bg-slate-100 font-bold hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5">
                                                                    <FileSignature className="w-3 h-3 text-slate-600" /> Sign Off
                                                                </button>
                                                            )}
                                                            {meeting.attendedByMentee && (
                                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 uppercase tracking-widest">Mentee responded</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
