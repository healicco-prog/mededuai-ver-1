import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenteeRecord {
    id: string;
    studentId: string;
    studentName: string;
    mentorId: string;
    peerMentorId?: string; // Links to another student acting as a peer mentor
    year: string;
    progressData: number[]; // Simple dummy data for graph
    
    // Profile Fields added by the student
    regNo?: string;
    mobileNumber?: string;
    emailId?: string;
    permanentAddress?: string;
    parentName?: string;
    parentContactNo?: string;
    parentContactMail?: string;
}

export interface MeetingRecord {
    id: string;
    menteeId: string;
    mentorId: string;
    isPeerMeeting: boolean; // Differentiate teacher-mentor vs peer-mentor
    date: string;
    
    // Teacher Meeting fields
    issuesRaised?: string;
    actionTaken?: string;
    discussionPoints?: string;
    goalSetting?: string;
    
    // Peer Meeting fields
    academicNonAcademic?: string;
    remarks?: string;

    nextMeetingDate: string;
    feedbackSent: boolean;
    isSigned: boolean;
    createdAt: string;
    coordinatorApproved?: boolean;
    
    // Mentee specific
    attendedByMentee?: boolean;
    menteeFeedback?: string;
}

export interface EndYearAssessment {
    id: string;
    menteeId: string;
    mentorId: string;
    year: string;
    attendanceRemarks: string;
    assessmentsRemarks: string;
    nonScholasticRemarks: string;
    isSignedAndLocked: boolean;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string; // 'group' for broadcast/group chat, or specific user ID
    message: string;
    timestamp: string;
}

interface MentorshipState {
    mentees: MenteeRecord[];
    meetings: MeetingRecord[];
    assessments: EndYearAssessment[];
    chats: ChatMessage[];
    
    // Actions
    updateMenteeProfile: (menteeId: string, profileData: Partial<MenteeRecord>) => void;

    addMeeting: (meeting: Omit<MeetingRecord, 'id' | 'createdAt'>) => void;
    signMeeting: (id: string) => void;
    approveMeeting: (id: string) => void;
    markMeetingAttended: (id: string) => void;
    addMeetingFeedback: (id: string, feedback: string) => void;
    
    addAssessment: (assessment: Omit<EndYearAssessment, 'id' | 'createdAt'>) => void;
    lockAssessment: (id: string) => void;

    sendMessage: (chat: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

// Dummy initial data for demonstration
const initialMentees: MenteeRecord[] = [
    { id: 'm1', studentId: '1', studentName: 'John Doe', mentorId: '3', peerMentorId: '2', year: '2023-2024', progressData: [65, 70, 75, 82, 85] },
    { id: 'm2', studentId: '2', studentName: 'Alice Smith', mentorId: '3', year: '2023-2024', progressData: [80, 82, 81, 85, 88] },
    { id: 'm3', studentId: 's3', studentName: 'Bob Johnson', mentorId: '4', year: '2023-2024', progressData: [60, 65, 68, 72, 75] } // Assigned to Dr. Cuddy
];

export const useMentorshipStore = create<MentorshipState>()(
    persist(
        (set) => ({
            mentees: initialMentees,
            meetings: [],
            assessments: [],
            chats: [
                { id: 'c1', senderId: '3', senderName: 'Dr. Gregory House', receiverId: 'group', message: 'Welcome to our mentorship group!', timestamp: new Date().toISOString() }
            ],

            updateMenteeProfile: (menteeId, profileData) => set((state) => ({
                mentees: state.mentees.map(m => 
                    m.id === menteeId ? { ...m, ...profileData } : m
                )
            })),

            addMeeting: (meeting) => set((state) => ({
                meetings: [
                    ...state.meetings,
                    { 
                        ...meeting, 
                        id: Math.random().toString(36).substr(2, 9), 
                        createdAt: new Date().toISOString() 
                    }
                ]
            })),

            signMeeting: (id) => set((state) => ({
                meetings: state.meetings.map(m => 
                    m.id === id ? { ...m, isSigned: true } : m
                )
            })),

            approveMeeting: (id) => set((state) => ({
                meetings: state.meetings.map(m => 
                    m.id === id ? { ...m, coordinatorApproved: true } : m
                )
            })),

            markMeetingAttended: (id) => set((state) => ({
                meetings: state.meetings.map(m =>
                    m.id === id ? { ...m, attendedByMentee: true } : m
                )
            })),

            addMeetingFeedback: (id, feedback) => set((state) => ({
                meetings: state.meetings.map(m =>
                    m.id === id ? { ...m, menteeFeedback: feedback } : m
                )
            })),

            addAssessment: (assessment) => set((state) => ({
                assessments: [
                    ...state.assessments,
                    {
                        ...assessment,
                        id: Math.random().toString(36).substr(2, 9),
                        createdAt: new Date().toISOString()
                    }
                ]
            })),

            lockAssessment: (id) => set((state) => ({
                assessments: state.assessments.map(a => 
                    a.id === id ? { ...a, isSignedAndLocked: true } : a
                )
            })),

            sendMessage: (chat) => set((state) => ({
                chats: [
                    ...state.chats,
                    {
                        ...chat,
                        id: Math.random().toString(36).substr(2, 9),
                        timestamp: new Date().toISOString()
                    }
                ]
            }))
        }),
        {
            name: 'mentorship-storage',
            version: 1,
        }
    )
);
