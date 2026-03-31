"use client";

import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useMentorshipStore } from '@/store/mentorshipStore';
import {
    Users, Calendar, MessageSquare, ClipboardCheck, Search,
    ChevronRight, FileSignature, CheckCircle2,
    Send, AlertCircle, Clock, BarChart, Save, GraduationCap, Shield
} from 'lucide-react';

export default function MentorDashboardClient() {
    const { users } = useUserStore();
    const { mentees, meetings, chats, assessments, addMeeting, signMeeting, approveMeeting, addAssessment, sendMessage } = useMentorshipStore();
    
    const currentMentor = users.find(u => u.role === 'teacher' && u.name === 'Dr. Gregory House') || users.find(u => u.role === 'teacher');
    const isCoordinator = currentMentor?.name === 'Dr. Lisa Cuddy' || true;
    const allMentors = users.filter(u => u.role === 'teacher' && u.id !== currentMentor?.id);
    
    const [viewMode, setViewMode] = useState<'mentor' | 'coordinator'>('mentor');
    const [activeTab, setActiveTab] = useState<'mentees' | 'meetings' | 'chats' | 'assessments'>('mentees');
    const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);

    const [meetingForm, setMeetingForm] = useState({
        date: '', issuesRaised: '', actionTaken: '', discussionPoints: '',
        goalSetting: '', nextMeetingDate: '', sendFeedback: true
    });

    const [chatInput, setChatInput] = useState('');
    const [assessmentForm, setAssessmentForm] = useState({
        attendanceRemarks: '', assessmentsRemarks: '', nonScholasticRemarks: ''
    });

    const currentMentees = mentees.filter(m => m.mentorId === currentMentor?.id);
    const selectedMentee = currentMentees.find(m => m.id === selectedMenteeId);
    const menteeMeetings = meetings.filter(m => m.menteeId === selectedMenteeId);
    const menteeAssessment = assessments.find(a => a.menteeId === selectedMenteeId && a.year === selectedMentee?.year);

    const mentorTabConfig = [
        { id: 'mentees' as const, label: 'My Mentees', icon: Users, gradient: 'from-purple-500 to-violet-600' },
        { id: 'meetings' as const, label: 'Meetings Log', icon: Calendar, gradient: 'from-emerald-500 to-teal-600' },
        { id: 'chats' as const, label: 'Chat & Broadcast', icon: MessageSquare, gradient: 'from-blue-500 to-indigo-600' },
        { id: 'assessments' as const, label: 'End-Year Assessment', icon: ClipboardCheck, gradient: 'from-amber-500 to-orange-600' },
    ];

    const renderMenteesTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-b from-purple-50/50 to-white p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" /> My Mentees
                    </h3>
                </div>
                <div className="p-4 space-y-3">
                    {currentMentees.map(mentee => (
                        <button key={mentee.id} onClick={() => setSelectedMenteeId(mentee.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                selectedMenteeId === mentee.id ? 'border-purple-400 bg-purple-50 shadow-sm' : 'border-slate-200 hover:border-purple-200 hover:bg-slate-50'
                            }`}>
                            <div>
                                <div className="font-bold text-slate-900">{mentee.studentName}</div>
                                <div className="text-sm text-slate-500">Year: {mentee.year}</div>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${selectedMenteeId === mentee.id ? 'text-purple-600' : 'text-slate-400'}`} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden min-h-[400px]">
                {selectedMentee ? (
                    <div>
                        <div className="bg-gradient-to-b from-purple-50/50 to-white p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{selectedMentee.studentName}</h2>
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-1">Academic Year: {selectedMentee.year}</p>
                            </div>
                            <button onClick={() => setActiveTab('meetings')}
                                className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                                Schedule Meeting
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Meetings</div>
                                    <div className="text-2xl font-black text-slate-800">{menteeMeetings.length}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Avg Score</div>
                                    <div className="text-2xl font-black text-slate-800">
                                        {Math.round(selectedMentee.progressData.reduce((a,b)=>a+b,0)/selectedMentee.progressData.length)}%
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                                    <BarChart className="w-4 h-4 text-purple-600" /> Progress Overview
                                </h3>
                                <div className="h-48 flex items-end justify-between px-4 pb-4 border-b border-l border-slate-200 bg-slate-50/50 rounded-bl-xl pt-8">
                                    {selectedMentee.progressData.map((val, idx) => (
                                        <div key={idx} className="flex flex-col items-center w-full">
                                            <div className="w-10 bg-gradient-to-t from-purple-500 to-violet-400 rounded-t-lg transition-all duration-1000 ease-out hover:from-purple-600 hover:to-violet-500 cursor-pointer relative group flex items-end justify-center pb-2 text-white text-xs font-bold"
                                                style={{ height: `${val}%` }}>
                                                {val}%
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-2 font-bold">A{idx + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                        <Users className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-medium">Select a mentee to view their progress.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderMeetingsTab = () => (
        <div className="space-y-6">
            {!selectedMentee ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-lg">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Mentee Selected</h3>
                    <p className="text-slate-600 mb-4">Please select a mentee from the "Mentees" tab first.</p>
                    <button onClick={() => setActiveTab('mentees')} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        Go to Mentees
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-b from-emerald-50/50 to-white p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-emerald-600" /> Log New Meeting
                                </h3>
                                <span className="text-xs font-bold px-3 py-1.5 bg-purple-100 text-purple-700 rounded-xl">{selectedMentee.studentName}</span>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Meeting Date</label>
                                <input type="date" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                                    value={meetingForm.date} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Issues Raised (by Student)</label>
                                <textarea rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium resize-none transition-all"
                                    value={meetingForm.issuesRaised} onChange={e => setMeetingForm({...meetingForm, issuesRaised: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Action Taken</label>
                                <textarea rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium resize-none transition-all"
                                    value={meetingForm.actionTaken} onChange={e => setMeetingForm({...meetingForm, actionTaken: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Discussion Points</label>
                                <textarea rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium resize-none transition-all"
                                    value={meetingForm.discussionPoints} onChange={e => setMeetingForm({...meetingForm, discussionPoints: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Goal Setting for Next Meeting</label>
                                <textarea rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium resize-none transition-all"
                                    value={meetingForm.goalSetting} onChange={e => setMeetingForm({...meetingForm, goalSetting: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Next Meeting Date</label>
                                <input type="date" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
                                    value={meetingForm.nextMeetingDate} onChange={e => setMeetingForm({...meetingForm, nextMeetingDate: e.target.value})} />
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="sendFeedback" className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                                    checked={meetingForm.sendFeedback} onChange={e => setMeetingForm({...meetingForm, sendFeedback: e.target.checked})} />
                                <label htmlFor="sendFeedback" className="text-xs font-bold text-slate-600 cursor-pointer">Request Mentee Feedback</label>
                            </div>
                            <div className="pt-4 flex justify-end border-t border-slate-100">
                                <button onClick={() => {
                                    if(!currentMentor || !selectedMenteeId || !meetingForm.date) return alert("Please fill at least the meeting date.");
                                    addMeeting({
                                        menteeId: selectedMenteeId, mentorId: currentMentor.id, isPeerMeeting: false,
                                        date: meetingForm.date, issuesRaised: meetingForm.issuesRaised, actionTaken: meetingForm.actionTaken,
                                        discussionPoints: meetingForm.discussionPoints, goalSetting: meetingForm.goalSetting,
                                        nextMeetingDate: meetingForm.nextMeetingDate, feedbackSent: meetingForm.sendFeedback, isSigned: false
                                    });
                                    setMeetingForm({ date: '', issuesRaised: '', actionTaken: '', discussionPoints: '', goalSetting: '', nextMeetingDate: '', sendFeedback: true });
                                    alert("Meeting Saved!");
                                }}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold h-11 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 text-sm hover:scale-[1.01] active:scale-[0.99]">
                                    <Save className="w-4 h-4" /> Save Record
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex flex-col max-h-[800px]">
                        <div className="bg-gradient-to-b from-slate-50 to-white p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Meeting History</h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{menteeMeetings.length} Records</span>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-4 flex-1">
                            {menteeMeetings.length === 0 ? (
                                <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-3">
                                    <Clock className="w-12 h-12 opacity-20" />
                                    <p className="font-medium">No meetings recorded yet.</p>
                                </div>
                            ) : (
                                menteeMeetings.map(meeting => (
                                    <div key={meeting.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="font-bold text-slate-800">{new Date(meeting.date).toLocaleDateString()}</div>
                                            <div className="flex items-center gap-2">
                                                {meeting.isSigned ? (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-widest">
                                                        <CheckCircle2 className="w-3 h-3" /> Signed
                                                    </span>
                                                ) : (
                                                    <button onClick={() => signMeeting(meeting.id)} className="text-xs font-bold text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5">
                                                        <FileSignature className="w-3 h-3" /> Sign Record
                                                    </button>
                                                )}
                                                {meeting.coordinatorApproved && (
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 uppercase tracking-widest">Co-ordin. ✅</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-sm text-slate-600">
                                            <div><span className="font-semibold text-slate-700">Discussion:</span> {meeting.discussionPoints || 'N/A'}</div>
                                            <div><span className="font-semibold text-slate-700">Goals:</span> {meeting.goalSetting || 'N/A'}</div>
                                            {meeting.nextMeetingDate && (
                                                <div className="mt-2 inline-block px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">
                                                    Next: {new Date(meeting.nextMeetingDate).toLocaleDateString()}
                                                </div>
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
    );

    const renderChatTab = () => (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex h-[600px]">
            <div className="w-1/3 border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white flex flex-col">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3 text-sm">Messages</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-2.5 text-sm border-slate-200 rounded-xl outline-none focus:border-purple-500 border bg-white font-medium" />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
                    <button onClick={() => setSelectedMenteeId(null)}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${!selectedMenteeId ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!selectedMenteeId ? 'bg-white/20' : 'bg-purple-100 text-purple-700'}`}><Users className="w-5 h-5"/></div>
                        <div>
                            <div className="text-sm font-bold">Group Broadcast</div>
                            <div className={`text-[11px] font-medium ${!selectedMenteeId ? 'text-white/70' : 'text-slate-500'}`}>Message all mentees</div>
                        </div>
                    </button>
                    
                    <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Messages</div>
                    
                    {currentMentees.map(mentee => (
                        <button key={mentee.id} onClick={() => setSelectedMenteeId(mentee.id)}
                            className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${selectedMenteeId === mentee.id ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md' : 'hover:bg-slate-50 text-slate-700'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedMenteeId === mentee.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                {mentee.studentName.charAt(0)}
                            </div>
                            <div className="truncate font-bold text-sm">{mentee.studentName}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-2/3 flex flex-col bg-white">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50">
                    <div className="font-bold text-lg text-slate-800">
                        {!selectedMenteeId ? 'Broadcast to All Mentees' : selectedMentee?.studentName}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                    {chats
                        .filter(c => (selectedMenteeId === null && c.receiverId === 'group') || (selectedMenteeId && (c.receiverId === selectedMenteeId || (c.senderId === selectedMenteeId && c.receiverId === currentMentor?.id))))
                        .map(chat => {
                            const isMe = chat.senderId === currentMentor?.id;
                            return (
                                <div key={chat.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl p-4 ${isMe ? 'bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-tr-sm shadow-md shadow-purple-500/15' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                        {!isMe && <div className="text-[11px] font-bold text-purple-600 mb-1 uppercase tracking-widest">{chat.senderName}</div>}
                                        <div className="text-sm leading-relaxed">{chat.message}</div>
                                        <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-purple-200' : 'text-slate-400'} font-bold`}>
                                            {new Date(chat.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
                <div className="p-4 bg-gradient-to-t from-slate-50 to-white border-t border-slate-100">
                    <div className="flex gap-3">
                        <input type="text" placeholder={!selectedMenteeId ? "Type a broadcast message..." : "Type a message..."}
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm font-medium transition-all"
                            value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && chatInput.trim() && currentMentor) {
                                    sendMessage({ senderId: currentMentor.id, senderName: currentMentor.name, receiverId: selectedMenteeId || 'group', message: chatInput.trim() });
                                    setChatInput('');
                                }
                            }}
                        />
                        <button className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/25 transition-all shrink-0 hover:scale-105 active:scale-95"
                            onClick={() => {
                                if(chatInput.trim() && currentMentor) {
                                    sendMessage({ senderId: currentMentor.id, senderName: currentMentor.name, receiverId: selectedMenteeId || 'group', message: chatInput.trim() });
                                    setChatInput('');
                                }
                            }}>
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAssessmentTab = () => (
        <div className="space-y-6">
            {!selectedMentee ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-lg">
                    <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Mentee</h3>
                    <p className="text-slate-600">Please select a mentee to complete their End of Year report.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden max-w-4xl mx-auto">
                    <div className="bg-gradient-to-b from-amber-50/50 to-white p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">End of Year Overall Assessment</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Student: <span className="font-bold text-slate-800">{selectedMentee.studentName}</span> | Year: <span className="font-bold text-slate-800">{selectedMentee.year}</span>
                                </p>
                            </div>
                            {menteeAssessment?.isSignedAndLocked && (
                                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 uppercase tracking-widest">
                                    <CheckCircle2 className="w-4 h-4" /> Signed & Locked
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Attendance Remarks</label>
                            <textarea rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium resize-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Describe attendance performance..."
                                value={menteeAssessment ? menteeAssessment.attendanceRemarks : assessmentForm.attendanceRemarks}
                                onChange={e => setAssessmentForm({...assessmentForm, attendanceRemarks: e.target.value})}
                                disabled={!!menteeAssessment?.isSignedAndLocked} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assessments / Scholastic Remarks</label>
                            <textarea rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium resize-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Summarize scholastic achievement..."
                                value={menteeAssessment ? menteeAssessment.assessmentsRemarks : assessmentForm.assessmentsRemarks}
                                onChange={e => setAssessmentForm({...assessmentForm, assessmentsRemarks: e.target.value})}
                                disabled={!!menteeAssessment?.isSignedAndLocked} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Non-Scholastic Remarks</label>
                            <textarea rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium resize-none transition-all disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="Participation in extracurriculars, behavioral traits..."
                                value={menteeAssessment ? menteeAssessment.nonScholasticRemarks : assessmentForm.nonScholasticRemarks}
                                onChange={e => setAssessmentForm({...assessmentForm, nonScholasticRemarks: e.target.value})}
                                disabled={!!menteeAssessment?.isSignedAndLocked} />
                        </div>
                        {!menteeAssessment?.isSignedAndLocked && (
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                                <button className="px-6 py-2.5 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors border border-slate-200">Save Draft</button>
                                <button onClick={() => {
                                    if(!currentMentor || !selectedMenteeId) return;
                                    if(!assessmentForm.attendanceRemarks || !assessmentForm.assessmentsRemarks) return alert("Please fill major remarks.");
                                    if(confirm("Are you sure you want to sign and lock this assessment?")) {
                                        addAssessment({
                                            menteeId: selectedMenteeId, mentorId: currentMentor.id, year: selectedMentee.year,
                                            attendanceRemarks: assessmentForm.attendanceRemarks, assessmentsRemarks: assessmentForm.assessmentsRemarks,
                                            nonScholasticRemarks: assessmentForm.nonScholasticRemarks, isSignedAndLocked: true
                                        });
                                        alert("Report locked and approved!");
                                    }
                                }}
                                    className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/25">
                                    <ClipboardCheck className="w-4 h-4" /> Sign & Lock Report
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderCoordinatorView = () => {
        const menteesOfOthers = mentees.filter(m => m.mentorId !== currentMentor?.id);
        const coordinatorMeetingsToApprove = meetings.filter(m => 
            menteesOfOthers.some(mentee => mentee.id === m.menteeId) && m.isSigned && !m.coordinatorApproved
        );

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-b from-blue-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" /> Assigned Mentors
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Teachers you co-ordinate.</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {allMentors.map(mentor => {
                            const mCount = mentees.filter(m => m.mentorId === mentor.id).length;
                            return (
                                <div key={mentor.id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center justify-between hover:shadow-sm transition-shadow">
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{mentor.name}</div>
                                        <div className="text-xs text-slate-500">{mCount} Mentees</div>
                                    </div>
                                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                                        <Users className="w-4 h-4"/>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden max-h-[600px]">
                    <div className="bg-gradient-to-b from-blue-50/50 to-white p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileSignature className="w-5 h-5 text-blue-600" /> Pending Approvals
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Meetings waiting for your sign-off.</p>
                    </div>
                    <div className="overflow-y-auto p-6 space-y-4">
                        {coordinatorMeetingsToApprove.length === 0 ? (
                            <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-3">
                                <CheckCircle2 className="w-12 h-12 opacity-20 text-emerald-500" />
                                <p className="font-medium">No pending approvals.</p>
                            </div>
                        ) : (
                            coordinatorMeetingsToApprove.map(meeting => {
                                const menteeObj = mentees.find(m => m.id === meeting.menteeId);
                                const mentorObj = users.find(u => u.id === meeting.mentorId);
                                return (
                                    <div key={meeting.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:shadow-md transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">{menteeObj?.studentName}</span>
                                                <span className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold uppercase tracking-widest">by {mentorObj?.name}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 mb-2">
                                                Date: <span className="font-semibold">{new Date(meeting.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600">
                                                &quot;{meeting.discussionPoints}&quot;
                                            </div>
                                        </div>
                                        <button onClick={() => { approveMeeting(meeting.id); alert("Meeting Approved."); }}
                                            className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25">
                                            Approve & Sign
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
            {/* Premium Header */}
            <div className="relative mb-6 flex-shrink-0">
                <div className="bg-gradient-to-r from-purple-900 via-violet-900 to-indigo-900 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <GraduationCap className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Mentorship Management System</h2>
                                <p className="text-purple-300/80 text-sm font-medium">Monitor progress, schedule meetings, and provide assessments</p>
                            </div>
                        </div>
                        {isCoordinator && (
                            <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
                                <button onClick={() => setViewMode('mentor')}
                                    className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${viewMode === 'mentor' ? 'bg-white text-purple-700 shadow-sm' : 'text-white/70 hover:text-white'}`}>
                                    <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> As Mentor</span>
                                </button>
                                <button onClick={() => setViewMode('coordinator')}
                                    className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${viewMode === 'coordinator' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/70 hover:text-white'}`}>
                                    <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> As Coordinator</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {viewMode === 'mentor' && (
                <div className="flex gap-2 pb-4 flex-shrink-0 overflow-x-auto scrollbar-none">
                    {mentorTabConfig.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                                activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-md` : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}>
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pb-8">
                {viewMode === 'mentor' ? (
                    <>
                        {activeTab === 'mentees' && renderMenteesTab()}
                        {activeTab === 'meetings' && renderMeetingsTab()}
                        {activeTab === 'chats' && renderChatTab()}
                        {activeTab === 'assessments' && renderAssessmentTab()}
                    </>
                ) : (
                    renderCoordinatorView()
                )}
            </div>
        </div>
    );
}
