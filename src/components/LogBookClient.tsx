"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
    ClipboardList, Plus, CheckCircle2, AlertCircle, Loader2, Calendar,
    FileText, ListChecks, Activity, PenLine, Upload, X, Image as ImageIcon,
    User as UserIcon, Send, BookOpen, BadgeCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ── Types ─────────────────────────────────────────────────────────────────
type Role = 'student' | 'teacher' | 'deptadmin' | 'instadmin' | 'superadmin' | 'masteradmin';

interface Logbook {
    id: string;
    student_id: string;
    institution_id: string;
    department_id: string;
    course_name: string | null;
    academic_year: string;
    phase: string | null;
    block: string | null;
    status: 'draft' | 'faculty_approved' | 'hod_approved' | 'institution_approved' | 'finalized';
    finalized_pdf_url: string | null;
    faculty_approved_at: string | null;
    hod_approved_at: string | null;
    institution_approved_at: string | null;
    faculty_approved_by: string | null;
    hod_approved_by: string | null;
    institution_approved_by: string | null;
}

interface UserRow { id: string; full_name?: string; email?: string; role?: string; }
interface Session { id: string; logbook_id: string; session_date: string; time_from: string; time_to: string; session_type: string; topic: string; competency_no?: string; competency?: string; details?: any; learning_objectives?: string; reflection: string; attendance: 'present'|'absent'; faculty_incharge_id?: string; date_of_completion?: string; attempt?: string; rating?: string; decision?: string; feedback_remarks?: string; faculty_approved_at?: string | null; }
interface Assessment { id: string; logbook_id: string; assessment_category: 'formative'|'internal'; assessment_no: string; assessment_type: 'theory'|'practical'|'viva'; marks_received?: number; marks_out_of?: number; faculty_incharge_id?: string; feedback?: string; faculty_approved_at?: string | null; }
interface AttendanceReport { id: string; logbook_id: string; phase: string; block: string; attendance_pct: Record<string, number>; eligibility: 'eligible'|'not_eligible'|'not_applicable'; }
interface Activity { id: string; logbook_id: string; activity_type: string; activity_name: string; activity_date: string; details?: string; faculty_incharge_id?: string; }

interface Props {
    /** The viewer's app-level role (controls which actions are exposed). */
    role: Role;
    /** Current user id (auth.uid). */
    userId: string;
}

const SESSION_TYPES = [
    'AETCOM', 'Certifiable Skill Session', 'Non-Certifiable Skill Session',
    'Self Directed Learning', 'Seminar', 'Tutorials',
    'Integrated Teaching Session', 'Clinical Clerkship Session',
    'Skill Lab', 'PBL', 'CBL', 'TBL',
];
const PHASES = ['MBBS Phase I', 'MBBS Phase II', 'MBBS Phase III Part 1', 'MBBS Phase III Part 2'];
const BLOCKS = ['Block 1', 'Block 2', 'Block 3'];
const ATT_BUCKETS = ['theory', 'practical', 'clinical_posting'];
const ACTIVITY_TYPES = ['Additional Curricular', 'Extracurricular', 'Achievements', 'Awards'];
const ACTIVITY_NAMES = ['Seminar', 'Conference', 'Outreach activities', 'Workshop'];

const canApproveAsFaculty   = (role: Role) => role === 'teacher' || role === 'deptadmin' || role === 'instadmin' || role === 'superadmin' || role === 'masteradmin';
const canApproveAsHoD       = (role: Role) => role === 'deptadmin' || role === 'instadmin' || role === 'superadmin' || role === 'masteradmin';
const canApproveAsHoI       = (role: Role) => role === 'instadmin' || role === 'superadmin' || role === 'masteradmin';
const canWriteSessions      = (role: Role) => role !== 'student';
const canEditReflection     = (role: Role) => role === 'student' || role === 'teacher' || role === 'deptadmin' || role === 'instadmin' || role === 'superadmin' || role === 'masteradmin';

export default function LogBookClient({ role, userId }: Props) {
    const [tab, setTab] = useState<'sessions' | 'assessments' | 'attendance' | 'activities' | 'announcements' | 'classroom'>('sessions');
    const [logbooks, setLogbooks] = useState<Logbook[]>([]);
    const [selectedLogbookId, setSelectedLogbookId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);

    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [sigUploading, setSigUploading] = useState(false);

    const [sessions, setSessions] = useState<Session[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [attendance, setAttendance] = useState<AttendanceReport[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    const [showSessionForm, setShowSessionForm] = useState(false);
    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [showAttendanceForm, setShowAttendanceForm] = useState(false);
    const [showActivityForm, setShowActivityForm] = useState(false);

    // New Logbook MS States
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [classroomStudents, setClassroomStudents] = useState<any[]>([]);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const selectedLogbook = useMemo(
        () => logbooks.find(l => l.id === selectedLogbookId) || null,
        [logbooks, selectedLogbookId]
    );

    // ── Initial load: logbooks visible to this user + signature + users + institutions + departments ──
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [lbRes, sigRes, usersRes, instRes, deptRes] = await Promise.all([
                    supabase.from('logbooks').select('*').order('created_at', { ascending: false }),
                    supabase.from('logbook_signatures').select('signature_url').eq('user_id', userId).maybeSingle(),
                    supabase.from('users').select('id, full_name, email, role').limit(500),
                    supabase.from('institutions').select('*'),
                    supabase.from('departments').select('*'),
                ]);
                if (lbRes.error) throw lbRes.error;
                setLogbooks((lbRes.data || []) as Logbook[]);
                setSelectedLogbookId(prev => prev ?? (lbRes.data?.[0]?.id ?? null));
                setSignatureUrl(sigRes.data?.signature_url ?? null);
                setUsers((usersRes.data || []) as UserRow[]);
                setInstitutions(instRes.data || []);
                setDepartments(deptRes.data || []);
            } catch (e: any) {
                setError(e.message || 'Failed to load LogBook data.');
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    // ── Load Announcements when tab is selected ──
    useEffect(() => {
        if (tab !== 'announcements') return;
        (async () => {
            const { data } = await supabase.from('logbook_messages').select('*').order('sent_at', { ascending: false });
            if (data) setMessages(data);
        })();
    }, [tab]);

    // ── Load Classroom students when tab is selected ──
    useEffect(() => {
        if (tab !== 'classroom') return;
        (async () => {
            const { data } = await supabase.from('logbook_classroom_students').select('*').order('approved_at', { ascending: false });
            if (data) setClassroomStudents(data);
        })();
    }, [tab]);

    const refetchClassroom = async () => {
        const { data } = await supabase.from('logbook_classroom_students').select('*').order('approved_at', { ascending: false });
        if (data) setClassroomStudents(data);
    };

    // ── Whenever selected logbook changes, reload its children ──
    useEffect(() => {
        if (!selectedLogbookId) {
            setSessions([]); setAssessments([]); setAttendance([]); setActivities([]);
            return;
        }
        (async () => {
            const [s, a, att, act] = await Promise.all([
                supabase.from('logbook_sessions').select('*').eq('logbook_id', selectedLogbookId).order('session_date', { ascending: false }),
                supabase.from('logbook_assessments').select('*').eq('logbook_id', selectedLogbookId).order('created_at', { ascending: false }),
                supabase.from('logbook_attendance_reports').select('*').eq('logbook_id', selectedLogbookId),
                supabase.from('logbook_additional_activities').select('*').eq('logbook_id', selectedLogbookId).order('activity_date', { ascending: false }),
            ]);
            setSessions((s.data || []) as Session[]);
            setAssessments((a.data || []) as Assessment[]);
            setAttendance((att.data || []) as AttendanceReport[]);
            setActivities((act.data || []) as Activity[]);
        })();
    }, [selectedLogbookId]);

    const faculties = users.filter(u => u.role === 'teacher' || u.role === 'deptadmin' || u.role === 'instadmin');
    const students  = users.filter(u => u.role === 'student');

    // ── Signature upload ─────────────────────────────────────────────────
    const handleSignatureUpload = async (file: File) => {
        setSigUploading(true);
        try {
            const path = `signatures/${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const { error: upErr } = await supabase.storage.from('logbook').upload(path, file, { upsert: true });
            if (upErr) throw upErr;
            const { data } = supabase.storage.from('logbook').getPublicUrl(path);
            const url = data.publicUrl;
            const { error: dbErr } = await supabase.from('logbook_signatures').upsert({ user_id: userId, signature_url: url, updated_at: new Date().toISOString() });
            if (dbErr) throw dbErr;
            setSignatureUrl(url);
        } catch (e: any) {
            alert(`Signature upload failed: ${e.message}`);
        } finally {
            setSigUploading(false);
        }
    };

    // ── Approval actions ─────────────────────────────────────────────────
    const approveLogbook = async (level: 'faculty' | 'hod' | 'institution') => {
        if (!selectedLogbook) return;
        const now = new Date().toISOString();
        const patch: any = { updated_at: now };
        if (level === 'faculty') {
            patch.status = 'faculty_approved'; patch.faculty_approved_by = userId; patch.faculty_approved_at = now;
        } else if (level === 'hod') {
            patch.status = 'hod_approved'; patch.hod_approved_by = userId; patch.hod_approved_at = now;
        } else if (level === 'institution') {
            patch.status = 'institution_approved'; patch.institution_approved_by = userId; patch.institution_approved_at = now;
        }
        const { error: e } = await supabase.from('logbooks').update(patch).eq('id', selectedLogbook.id);
        if (e) { alert(`Approval failed: ${e.message}`); return; }
        setLogbooks(prev => prev.map(l => l.id === selectedLogbook.id ? { ...l, ...patch } : l));
    };

    const handleDownloadPDF = async () => {
        if (!selectedLogbook) return;
        setGeneratingPdf(true);
        try {
            // Find student user row
            const student = users.find(u => u.id === selectedLogbook.student_id);
            const studentName = student?.full_name || student?.email || 'Student';
            const dept = departments.find(d => d.id === selectedLogbook.department_id);
            const deptName = dept?.name || 'Department';

            // Initialize jsPDF
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Setup styling
            const primaryColor = [16, 185, 129]; // Emerald
            const darkColor = [30, 41, 59]; // Slate 800

            // Header Banner
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(22);
            doc.text('MEDEDUAI LOGBOOK RECORD', 15, 25);
            
            // Subtitle
            doc.setFontSize(10);
            doc.setFont('Helvetica', 'normal');
            doc.text('Official Academic Logbook and Assessments Portfolio', 15, 32);

            // Left info block
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('STUDENT INFORMATION', 15, 52);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Name: ${studentName}`, 15, 58);
            doc.text(`Email: ${student?.email || 'N/A'}`, 15, 64);
            doc.text(`Course: ${selectedLogbook.course_name || 'MBBS'}`, 15, 70);

            // Right info block
            doc.setFont('Helvetica', 'bold');
            doc.text('ACADEMIC DETAILS', 120, 52);
            doc.setFont('Helvetica', 'normal');
            doc.text(`Academic Year: ${selectedLogbook.academic_year}`, 120, 58);
            doc.text(`Phase & Block: ${selectedLogbook.phase || 'N/A'} - ${selectedLogbook.block || 'N/A'}`, 120, 64);
            doc.text(`Department: ${deptName}`, 120, 70);

            // Horizontal Line
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 76, 195, 76);

            let y = 84;

            // 1. Sessions List
            if (sessions.length > 0) {
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('1. LOGBOOK SESSIONS', 15, y);
                y += 8;

                doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
                doc.setFontSize(9);
                for (const s of sessions) {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    const fac = users.find(u => u.id === s.faculty_incharge_id);
                    doc.setFont('Helvetica', 'bold');
                    doc.text(`${s.session_date} - ${s.topic} (${s.session_type})`, 15, y);
                    y += 5;
                    doc.setFont('Helvetica', 'normal');
                    doc.text(`Faculty: ${fac?.full_name || 'N/A'} | Attendance: ${s.attendance} | Attempt: ${s.attempt || 'N/A'} | Rating: ${s.rating || 'N/A'} | Decision: ${s.decision || 'N/A'}`, 15, y);
                    y += 5;
                    if (s.reflection) {
                        const splitRef = doc.splitTextToSize(`Reflection: ${s.reflection}`, 180);
                        for (const line of splitRef) {
                            if (y > 270) {
                                doc.addPage();
                                y = 20;
                            }
                            doc.text(line, 15, y);
                            y += 4.5;
                        }
                    }
                    y += 4;
                }
                y += 6;
            }

            // 2. Assessments
            if (assessments.length > 0) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('2. ASSESSMENTS', 15, y);
                y += 8;

                doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
                doc.setFontSize(9);
                for (const a of assessments) {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    const fac = users.find(u => u.id === a.faculty_incharge_id);
                    doc.setFont('Helvetica', 'bold');
                    doc.text(`${a.assessment_category.toUpperCase()} ASSESS. #${a.assessment_no} (${a.assessment_type})`, 15, y);
                    y += 5;
                    doc.setFont('Helvetica', 'normal');
                    doc.text(`Marks: ${a.marks_received ?? 'N/A'} / ${a.marks_out_of ?? 'N/A'} | Faculty: ${fac?.full_name || 'N/A'}`, 15, y);
                    y += 5;
                    if (a.feedback) {
                        doc.text(`Feedback: ${a.feedback}`, 15, y);
                        y += 5;
                    }
                    y += 3;
                }
                y += 6;
            }

            // 3. Attendance Reports
            if (attendance.length > 0) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('3. ATTENDANCE STATUS', 15, y);
                y += 8;

                doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
                doc.setFontSize(9);
                for (const att of attendance) {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.setFont('Helvetica', 'bold');
                    doc.text(`${att.phase} - ${att.block} | Eligibility: ${att.eligibility.toUpperCase()}`, 15, y);
                    y += 5;
                    doc.setFont('Helvetica', 'normal');
                    const pctStrings = Object.entries(att.attendance_pct || {}).map(([k, v]) => `${k.replace('_', ' ')}: ${v}%`).join(', ');
                    doc.text(`Attendance Breakdown: ${pctStrings}`, 15, y);
                    y += 7;
                }
                y += 5;
            }

            // 4. Additional Activities
            if (activities.length > 0) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(12);
                doc.text('4. ADDITIONAL ACTIVITIES', 15, y);
                y += 8;

                doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
                doc.setFontSize(9);
                for (const act of activities) {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    const fac = users.find(u => u.id === act.faculty_incharge_id);
                    doc.setFont('Helvetica', 'bold');
                    doc.text(`${act.activity_name} (${act.activity_type}) - ${act.activity_date}`, 15, y);
                    y += 5;
                    doc.setFont('Helvetica', 'normal');
                    doc.text(`Faculty: ${fac?.full_name || 'N/A'}`, 15, y);
                    y += 5;
                    if (act.details) {
                        doc.text(`Details: ${act.details}`, 15, y);
                        y += 5;
                    }
                    y += 3;
                }
                y += 10;
            }

            // 5. Signatures Column
            if (y > 210) {
                doc.addPage();
                y = 20;
            }
            doc.setDrawColor(203, 213, 225);
            doc.line(15, y, 195, y);
            y += 10;

            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('APPROVAL & VERIFICATION SIGNATURES', 15, y);
            y += 15;

            // Fetch Signatures
            const approvers = [
                selectedLogbook.faculty_approved_by,
                selectedLogbook.hod_approved_by,
                selectedLogbook.institution_approved_by
            ].filter(Boolean) as string[];

            let signatureMap: Record<string, string> = {};
            if (approvers.length > 0) {
                const { data: sigData } = await supabase.from('logbook_signatures').select('user_id, signature_url').in('user_id', approvers);
                if (sigData) {
                    for (const row of sigData) {
                        signatureMap[row.user_id] = row.signature_url;
                    }
                }
            }

            const colWidth = 60;
            const xOffset = 15;

            // Draw Faculty Signature Column
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.setFontSize(10);
            doc.setFont('Helvetica', 'bold');
            doc.text('Faculty Incharge', xOffset, y);
            doc.setFontSize(8);
            if (selectedLogbook.faculty_approved_at) {
                doc.setFont('Helvetica', 'normal');
                doc.text(`Approved: ${new Date(selectedLogbook.faculty_approved_at).toLocaleDateString()}`, xOffset, y + 5);
                const sigUrl = signatureMap[selectedLogbook.faculty_approved_by || ''];
                if (sigUrl) {
                    try {
                        const base64 = await urlToBase64(sigUrl);
                        doc.addImage(base64, 'PNG', xOffset, y + 8, 40, 15);
                    } catch {
                        doc.text('[Signed Digitally]', xOffset, y + 12);
                    }
                } else {
                    doc.text('[Signed Digitally]', xOffset, y + 12);
                }
            } else {
                doc.setFont('Helvetica', 'italic');
                doc.text('Pending Approval', xOffset, y + 5);
            }

            // Draw HoD Signature Column
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Head of Dept. (HOD)', xOffset + colWidth, y);
            doc.setFontSize(8);
            if (selectedLogbook.hod_approved_at) {
                doc.setFont('Helvetica', 'normal');
                doc.text(`Approved: ${new Date(selectedLogbook.hod_approved_at).toLocaleDateString()}`, xOffset + colWidth, y + 5);
                const sigUrl = signatureMap[selectedLogbook.hod_approved_by || ''];
                if (sigUrl) {
                    try {
                        const base64 = await urlToBase64(sigUrl);
                        doc.addImage(base64, 'PNG', xOffset + colWidth, y + 8, 40, 15);
                    } catch {
                        doc.text('[Signed Digitally]', xOffset + colWidth, y + 12);
                    }
                } else {
                    doc.text('[Signed Digitally]', xOffset + colWidth, y + 12);
                }
            } else {
                doc.setFont('Helvetica', 'italic');
                doc.text('Pending Approval', xOffset + colWidth, y + 5);
            }

            // Draw HoI Signature Column
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('Head of Inst. (HOI)', xOffset + colWidth * 2, y);
            doc.setFontSize(8);
            if (selectedLogbook.institution_approved_at) {
                doc.setFont('Helvetica', 'normal');
                doc.text(`Approved: ${new Date(selectedLogbook.institution_approved_at).toLocaleDateString()}`, xOffset + colWidth * 2, y + 5);
                const sigUrl = signatureMap[selectedLogbook.institution_approved_by || ''];
                if (sigUrl) {
                    try {
                        const base64 = await urlToBase64(sigUrl);
                        doc.addImage(base64, 'PNG', xOffset + colWidth * 2, y + 8, 40, 15);
                    } catch {
                        doc.text('[Signed Digitally]', xOffset + colWidth * 2, y + 12);
                    }
                } else {
                    doc.text('[Signed Digitally]', xOffset + colWidth * 2, y + 12);
                }
            } else {
                doc.setFont('Helvetica', 'italic');
                doc.text('Pending Approval', xOffset + colWidth * 2, y + 5);
            }

            doc.save(`Logbook_${studentName}_${selectedLogbook.academic_year}.pdf`);
        } catch (e: any) {
            alert(`Failed to generate PDF: ${e.message}`);
        } finally {
            setGeneratingPdf(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading LogBook…
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <ClipboardList className="w-8 h-8 text-emerald-600" /> LogBook MS
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {role === 'student' && 'View and complete your logbook entries.'}
                        {role === 'teacher' && 'Fill session columns, mark attendance, and approve logbooks.'}
                        {role === 'deptadmin' && 'Approve students, structure the logbook, and approve after faculty.'}
                        {(role === 'instadmin' || role === 'superadmin' || role === 'masteradmin') && 'Initiate logbooks, see department-wise progress, and grant final approval.'}
                    </p>
                </div>
                <SignatureCard
                    url={signatureUrl}
                    uploading={sigUploading}
                    onUpload={handleSignatureUpload}
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* ── Institution dashboard counters (HoI only) ───────────── */}
            {(role === 'instadmin' || role === 'superadmin' || role === 'masteradmin') && (
                <InstitutionDashboard logbooks={logbooks} />
            )}

            {/* ── Logbook Selector & Main Body ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                        {logbooks.length === 0 ? (
                            <span className="text-xs font-semibold text-slate-500 italic">No student logbooks initiated yet.</span>
                        ) : (
                            <select
                                value={selectedLogbookId ?? ''}
                                onChange={e => setSelectedLogbookId(e.target.value || null)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white outline-none focus:border-emerald-500"
                            >
                                {logbooks.map(l => {
                                    const student = users.find(u => u.id === l.student_id);
                                    return (
                                        <option key={l.id} value={l.id}>
                                            {student?.full_name || student?.email || 'Student'} · {l.academic_year} · {l.phase || '—'} · {l.block || '—'}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                        {selectedLogbook && <StatusPill status={selectedLogbook.status} />}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {(role === 'instadmin' || role === 'deptadmin' || role === 'superadmin' || role === 'masteradmin') && (
                            <button
                                onClick={() => setShowInitiateModal(true)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Initiate Logbook
                            </button>
                        )}
                        {selectedLogbook && (
                            <>
                                {selectedLogbook.status === 'draft' && canApproveAsFaculty(role) && (
                                    <button onClick={() => approveLogbook('faculty')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1">
                                        <BadgeCheck className="w-3.5 h-3.5" /> Faculty Approve
                                    </button>
                                )}
                                {selectedLogbook.status === 'faculty_approved' && canApproveAsHoD(role) && (
                                    <button onClick={() => approveLogbook('hod')} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1">
                                        <BadgeCheck className="w-3.5 h-3.5" /> HoD Approve
                                    </button>
                                )}
                                {selectedLogbook.status === 'hod_approved' && canApproveAsHoI(role) && (
                                    <button onClick={() => approveLogbook('institution')} className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 flex items-center gap-1">
                                        <BadgeCheck className="w-3.5 h-3.5" /> Institution Approve
                                    </button>
                                )}
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={generatingPdf}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1 disabled:opacity-50 transition-all"
                                >
                                    {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                    Download PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-2 overflow-x-auto bg-white">
                    <TabButton active={tab === 'sessions'} onClick={() => setTab('sessions')} icon={<Calendar className="w-4 h-4" />} label="Log Book Session" count={sessions.length} />
                    <TabButton active={tab === 'assessments'} onClick={() => setTab('assessments')} icon={<FileText className="w-4 h-4" />} label="LB Assessment" count={assessments.length} />
                    <TabButton active={tab === 'attendance'} onClick={() => setTab('attendance')} icon={<ListChecks className="w-4 h-4" />} label="LB Attendance Report" count={attendance.length} />
                    <TabButton active={tab === 'activities'} onClick={() => setTab('activities')} icon={<Activity className="w-4 h-4" />} label="LB Additional Activities" count={activities.length} />
                    <TabButton active={tab === 'announcements'} onClick={() => setTab('announcements')} icon={<Send className="w-4 h-4" />} label="Announcements" count={messages.length} />
                    {(role === 'deptadmin' || role === 'instadmin' || role === 'superadmin' || role === 'masteradmin') && (
                        <TabButton active={tab === 'classroom'} onClick={() => setTab('classroom')} icon={<UserIcon className="w-4 h-4" />} label="Classroom Roster" count={classroomStudents.length} />
                    )}
                </div>

                <div className="p-5">
                    {tab === 'sessions' && (
                        logbooks.length === 0 ? <EmptyState role={role} /> : (
                            <SessionList
                                items={sessions}
                                users={users}
                                role={role}
                                canAdd={canWriteSessions(role)}
                                onAdd={() => setShowSessionForm(true)}
                                onReload={() => setSelectedLogbookId(id => id)}
                            />
                        )
                    )}
                    {tab === 'assessments' && (
                        logbooks.length === 0 ? <EmptyState role={role} /> : (
                            <AssessmentList
                                items={assessments}
                                users={users}
                                role={role}
                                onAdd={() => setShowAssessmentForm(true)}
                            />
                        )
                    )}
                    {tab === 'attendance' && (
                        logbooks.length === 0 ? <EmptyState role={role} /> : (
                            <AttendanceList
                                items={attendance}
                                role={role}
                                onAdd={() => setShowAttendanceForm(true)}
                            />
                        )
                    )}
                    {tab === 'activities' && (
                        logbooks.length === 0 ? <EmptyState role={role} /> : (
                            <ActivityList
                                items={activities}
                                users={users}
                                role={role}
                                onAdd={() => setShowActivityForm(true)}
                            />
                        )
                    )}
                    {tab === 'announcements' && (
                        <AnnouncementsTab
                            messages={messages}
                            users={users}
                            role={role}
                            onBroadcastClick={() => setShowBroadcastModal(true)}
                        />
                    )}
                    {tab === 'classroom' && (
                        <ClassroomRosterTab
                            students={students}
                            departments={departments}
                            classroomStudents={classroomStudents}
                            userId={userId}
                            onReload={refetchClassroom}
                        />
                    )}
                </div>
            </div>

            {/* ── Modals ──────────────────────────────────────────────── */}
            {showSessionForm && selectedLogbook && (
                <SessionForm
                    logbookId={selectedLogbook.id}
                    role={role}
                    userId={userId}
                    faculties={faculties}
                    onClose={() => setShowSessionForm(false)}
                    onSaved={s => { setSessions(prev => [s, ...prev]); setShowSessionForm(false); }}
                />
            )}
            {showAssessmentForm && selectedLogbook && (
                <AssessmentForm
                    logbookId={selectedLogbook.id}
                    faculties={faculties}
                    students={students}
                    onClose={() => setShowAssessmentForm(false)}
                    onSaved={a => { setAssessments(prev => [a, ...prev]); setShowAssessmentForm(false); }}
                />
            )}
            {showAttendanceForm && selectedLogbook && (
                <AttendanceForm
                    logbookId={selectedLogbook.id}
                    onClose={() => setShowAttendanceForm(false)}
                    onSaved={a => { setAttendance(prev => [a, ...prev]); setShowAttendanceForm(false); }}
                />
            )}
            {showActivityForm && selectedLogbook && (
                <ActivityForm
                    logbookId={selectedLogbook.id}
                    faculties={faculties}
                    students={students}
                    onClose={() => setShowActivityForm(false)}
                    onSaved={a => { setActivities(prev => [a, ...prev]); setShowActivityForm(false); }}
                />
            )}
            {showInitiateModal && (
                <InitiateLogbookModal
                    students={students}
                    institutions={institutions}
                    departments={departments}
                    userId={userId}
                    onClose={() => setShowInitiateModal(false)}
                    onSaved={lb => {
                        setLogbooks(prev => [lb, ...prev]);
                        setSelectedLogbookId(lb.id);
                        setShowInitiateModal(false);
                    }}
                />
            )}
            {showBroadcastModal && (
                <BroadcastModal
                    institutions={institutions}
                    departments={departments}
                    userId={userId}
                    onClose={() => setShowBroadcastModal(false)}
                    onSaved={msg => {
                        setMessages(prev => [msg, ...prev]);
                        setShowBroadcastModal(false);
                    }}
                />
            )}
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
            {icon} {label} <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{count}</span>
        </button>
    );
}

function StatusPill({ status }: { status: Logbook['status'] }) {
    const map: Record<Logbook['status'], { label: string; cls: string }> = {
        draft:                  { label: 'Draft',                cls: 'bg-slate-100 text-slate-700' },
        faculty_approved:       { label: 'Faculty Approved',     cls: 'bg-emerald-100 text-emerald-700' },
        hod_approved:           { label: 'HoD Approved',         cls: 'bg-indigo-100 text-indigo-700' },
        institution_approved:   { label: 'Institution Approved', cls: 'bg-purple-100 text-purple-700' },
        finalized:              { label: 'Finalized · PDF Ready',cls: 'bg-amber-100 text-amber-700' },
    };
    const m = map[status];
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${m.cls}`}>{m.label}</span>;
}

function SignatureCard({ url, uploading, onUpload }: { url: string | null; uploading: boolean; onUpload: (f: File) => void }) {
    return (
        <div className="border border-slate-200 rounded-xl p-3 bg-white flex items-center gap-3 min-w-[260px]">
            <div className="w-16 h-12 rounded bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                {url ? <img src={url} alt="Signature" className="max-w-full max-h-full object-contain" /> : <PenLine className="w-5 h-5 text-slate-300" />}
            </div>
            <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">Your Signature</p>
                <p className="text-[10px] text-slate-500">{url ? 'Uploaded — used for approvals.' : 'Upload to enable approval.'}</p>
            </div>
            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} {url ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
                />
            </label>
        </div>
    );
}

function InstitutionDashboard({ logbooks }: { logbooks: Logbook[] }) {
    const byDept = useMemo(() => {
        const m = new Map<string, { total: number; finalized: number; in_progress: number; }>();
        for (const lb of logbooks) {
            const cur = m.get(lb.department_id) || { total: 0, finalized: 0, in_progress: 0 };
            cur.total += 1;
            if (lb.status === 'finalized' || lb.status === 'institution_approved') cur.finalized += 1;
            else cur.in_progress += 1;
            m.set(lb.department_id, cur);
        }
        return Array.from(m.entries());
    }, [logbooks]);

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-indigo-50 border border-emerald-100 rounded-2xl p-5">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Institution Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Counter label="Total Logbooks" value={logbooks.length} />
                <Counter label="Finalized" value={logbooks.filter(l => l.status === 'finalized' || l.status === 'institution_approved').length} />
                <Counter label="Pending HoI" value={logbooks.filter(l => l.status === 'hod_approved').length} />
                <Counter label="Pending HoD" value={logbooks.filter(l => l.status === 'faculty_approved').length} />
            </div>
            {byDept.length > 0 && (
                <div className="mt-4 text-xs">
                    <p className="font-bold text-slate-700 mb-2">Per Department</p>
                    <div className="space-y-1">
                        {byDept.map(([deptId, c]) => (
                            <div key={deptId} className="flex items-center justify-between bg-white/70 px-3 py-1.5 rounded-lg">
                                <span className="font-mono text-[10px] text-slate-500 truncate">{deptId.slice(0, 8)}…</span>
                                <span className="text-slate-600">{c.finalized}/{c.total} finalized · {c.in_progress} in progress</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function Counter({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-white rounded-xl border border-white px-3 py-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
        </div>
    );
}

function EmptyState({ role }: { role: Role }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No logbooks are visible to you yet.</p>
            <p className="text-xs text-slate-400 mt-1">
                {role === 'student' && 'Wait for your department to initiate your logbook.'}
                {role === 'teacher' && 'Once your HoD assigns you as faculty incharge, logbooks will appear here.'}
                {role === 'deptadmin' && 'Initiate a logbook from the New Logbook button on your dashboard (coming next).'}
                {(role === 'instadmin' || role === 'superadmin' || role === 'masteradmin') && 'Initiate a logbook from the Department panel (coming next).'}
            </p>
        </div>
    );
}

// ── Lists ───────────────────────────────────────────────────────────────

function SessionList({ items, users, role, canAdd, onAdd }: { items: Session[]; users: UserRow[]; role: Role; canAdd: boolean; onAdd: () => void; onReload: () => void; }) {
    return (
        <div>
            <ListHeader title="Sessions" count={items.length} onAdd={canAdd ? onAdd : undefined} addLabel="Add Session" />
            {items.length === 0 ? <Hint text="No sessions yet." /> : (
                <div className="space-y-2 mt-3">
                    {items.map(s => {
                        const fac = users.find(u => u.id === s.faculty_incharge_id);
                        return (
                            <div key={s.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{s.topic}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full">{s.session_type}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                    <span>📅 {s.session_date}</span>
                                    <span>👤 {fac?.full_name || fac?.email || 'Faculty TBD'}</span>
                                    <span>📌 {s.attendance}</span>
                                    {s.attempt && <span>🔁 {s.attempt}</span>}
                                    {s.rating && <span>⭐ {s.rating}</span>}
                                    {s.decision && <span>✅ {s.decision}</span>}
                                </div>
                                {s.reflection && (
                                    <details className="mt-2">
                                        <summary className="text-xs font-bold text-slate-500 cursor-pointer">Reflection</summary>
                                        <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{s.reflection}</p>
                                    </details>
                                )}
                                {s.faculty_approved_at && (
                                    <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-700 font-bold"><CheckCircle2 className="w-3 h-3" /> Approved by faculty</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AssessmentList({ items, users, role, onAdd }: { items: Assessment[]; users: UserRow[]; role: Role; onAdd: () => void; }) {
    const canAdd = role !== 'student';
    return (
        <div>
            <ListHeader title="Assessments" count={items.length} onAdd={canAdd ? onAdd : undefined} addLabel="Add Assessment" />
            {items.length === 0 ? <Hint text="No assessments yet." /> : (
                <div className="space-y-2 mt-3">
                    {items.map(a => {
                        const fac = users.find(u => u.id === a.faculty_incharge_id);
                        return (
                            <div key={a.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">
                                        {a.assessment_category === 'formative' ? 'Formative' : 'Internal'} · #{a.assessment_no} · {a.assessment_type}
                                    </span>
                                    {a.marks_received != null && a.marks_out_of != null && (
                                        <span className="text-xs font-bold text-emerald-700">{a.marks_received} / {a.marks_out_of}</span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">👤 {fac?.full_name || fac?.email || 'Faculty TBD'}</div>
                                {a.feedback && <p className="text-xs text-slate-700 mt-1">{a.feedback}</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AttendanceList({ items, role, onAdd }: { items: AttendanceReport[]; role: Role; onAdd: () => void; }) {
    const canAdd = role === 'deptadmin' || role === 'instadmin' || role === 'superadmin' || role === 'masteradmin';
    return (
        <div>
            <ListHeader title="Attendance Reports" count={items.length} onAdd={canAdd ? onAdd : undefined} addLabel="Add Report" />
            {items.length === 0 ? <Hint text="No attendance reports yet." /> : (
                <div className="space-y-2 mt-3">
                    {items.map(a => (
                        <div key={a.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                <span className="text-sm font-bold text-slate-900">{a.phase} · {a.block}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                    a.eligibility === 'eligible' ? 'bg-emerald-100 text-emerald-700' :
                                    a.eligibility === 'not_eligible' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>{a.eligibility.replace('_', ' ')}</span>
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                                {Object.entries(a.attendance_pct || {}).map(([k, v]) => (
                                    <span key={k}>{k}: <b className="text-slate-700">{v}%</b></span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ActivityList({ items, users, role, onAdd }: { items: Activity[]; users: UserRow[]; role: Role; onAdd: () => void; }) {
    const canAdd = role !== 'student';
    return (
        <div>
            <ListHeader title="Additional Activities" count={items.length} onAdd={canAdd ? onAdd : undefined} addLabel="Add Activity" />
            {items.length === 0 ? <Hint text="No activities yet." /> : (
                <div className="space-y-2 mt-3">
                    {items.map(a => {
                        const fac = users.find(u => u.id === a.faculty_incharge_id);
                        return (
                            <div key={a.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{a.activity_name}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full">{a.activity_type}</span>
                                </div>
                                <div className="text-xs text-slate-500">📅 {a.activity_date} · 👤 {fac?.full_name || fac?.email || 'Faculty TBD'}</div>
                                {a.details && <p className="text-xs text-slate-700 mt-1">{a.details}</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ListHeader({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd?: () => void; addLabel: string; }) {
    return (
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">{title} <span className="text-slate-400">({count})</span></h3>
            {onAdd && (
                <button onClick={onAdd} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> {addLabel}
                </button>
            )}
        </div>
    );
}

function Hint({ text }: { text: string }) {
    return <p className="text-xs text-slate-400 italic mt-4">{text}</p>;
}

// ── Forms ───────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] flex flex-col`}>
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <div className="p-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
    return (
        <label className="block">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}{required && <span className="text-red-500">*</span>}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-emerald-500";

function SessionForm({ logbookId, role, userId, faculties, onClose, onSaved }: {
    logbookId: string; role: Role; userId: string; faculties: UserRow[];
    onClose: () => void; onSaved: (s: Session) => void;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState<Partial<Session> & { time_from_local: string; time_to_local: string; details_text: string; }>({
        session_date: today,
        time_from_local: '09:00',
        time_to_local: '10:00',
        session_type: SESSION_TYPES[0],
        topic: '',
        competency_no: '',
        competency: '',
        details_text: '',
        learning_objectives: '',
        reflection: '',
        attendance: 'present',
        faculty_incharge_id: '',
        attempt: 'F',
        rating: 'M',
        decision: 'C',
        feedback_remarks: '',
    });
    const [files, setFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);

    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null); // base64 string
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        x: 25,
        y: 25,
        width: 50,
        height: 50,
    });
    const [completedCrop, setCompletedCrop] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showCropper, setShowCropper] = useState(false);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setShowCamera(true);
        } catch (e: any) {
            alert(`Unable to access camera: ${e.message}`);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
    };

    const captureSnapshot = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopCamera();
                setShowCropper(true);
            }
        }
    };

    const getCroppedImgFile = async () => {
        if (!imgRef.current || !completedCrop) return null;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );

        return new Promise<File | null>((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(null);
                    return;
                }
                const file = new File([blob], `captured_reflection_${Date.now()}.jpg`, { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg');
        });
    };

    const handleCropComplete = async () => {
        const croppedFile = await getCroppedImgFile();
        if (croppedFile) {
            setFiles(prev => [...prev, croppedFile]);
            setCapturedImage(null);
            setShowCropper(false);
        } else {
            alert('Could not crop the image.');
        }
    };

    // Clean up camera stream if component unmounts
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const wordCount = (form.reflection || '').trim() ? (form.reflection || '').trim().split(/\s+/).length : 0;

    const handleSave = async (approve = false) => {
        if (!form.topic) { alert('Topic is required.'); return; }
        if (approve && wordCount < 200) { alert(`Reflection must be at least 200 words to approve (currently ${wordCount}).`); return; }
        setSaving(true);
        try {
            const time_from = new Date(`${form.session_date}T${form.time_from_local}:00`).toISOString();
            const time_to = new Date(`${form.session_date}T${form.time_to_local}:00`).toISOString();
            const payload: any = {
                logbook_id: logbookId,
                session_date: form.session_date,
                time_from, time_to,
                session_type: form.session_type,
                topic: form.topic,
                competency_no: form.competency_no || null,
                competency: form.competency || null,
                details: form.details_text ? { note: form.details_text } : {},
                learning_objectives: form.learning_objectives || null,
                reflection: form.reflection || '',
                attendance: form.attendance,
                faculty_incharge_id: form.faculty_incharge_id || null,
                date_of_completion: form.date_of_completion || null,
                attempt: form.attempt || null,
                rating: form.rating || null,
                decision: form.decision || null,
                feedback_remarks: form.feedback_remarks || null,
            };
            if (approve && canApproveAsFaculty(role)) {
                payload.faculty_approved_at = new Date().toISOString();
                payload.faculty_approved_by = userId;
            }
            const { data, error } = await supabase.from('logbook_sessions').insert(payload).select().single();
            if (error) throw error;

            // Upload reflection files
            if (files.length > 0) {
                for (const f of files) {
                    const path = `sessions/${data.id}/${Date.now()}_${f.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const { error: upErr } = await supabase.storage.from('logbook').upload(path, f);
                    if (upErr) { console.warn('file upload failed', upErr.message); continue; }
                    const { data: urlData } = supabase.storage.from('logbook').getPublicUrl(path);
                    await supabase.from('logbook_session_files').insert({
                        session_id: data.id,
                        file_url: urlData.publicUrl,
                        file_type: f.type === 'application/pdf' ? 'pdf' : 'image',
                        uploaded_by: userId,
                    });
                }
            }

            onSaved(data as Session);
        } catch (e: any) {
            alert(`Save failed: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalShell title="Add Log Book Session" onClose={onClose} wide>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Date" required>
                    <input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Timings (From – To)" required>
                    <div className="flex gap-2">
                        <input type="time" value={form.time_from_local} onChange={e => setForm({ ...form, time_from_local: e.target.value })} className={inputCls} />
                        <input type="time" value={form.time_to_local} onChange={e => setForm({ ...form, time_to_local: e.target.value })} className={inputCls} />
                    </div>
                </Field>
                <Field label="Type" required>
                    <input list="session-types" value={form.session_type} onChange={e => setForm({ ...form, session_type: e.target.value })} className={inputCls} placeholder="Pick or type Add New value" />
                    <datalist id="session-types">{SESSION_TYPES.map(t => <option key={t} value={t} />)}</datalist>
                </Field>
                <Field label="Topic / Module / Session Name" required>
                    <input value={form.topic || ''} onChange={e => setForm({ ...form, topic: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Competency No">
                    <input value={form.competency_no || ''} onChange={e => setForm({ ...form, competency_no: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Competency">
                    <input value={form.competency || ''} onChange={e => setForm({ ...form, competency: e.target.value })} className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                    <Field label="Details (Learning Domain · Level · Core · # times required)">
                        <textarea value={form.details_text} onChange={e => setForm({ ...form, details_text: e.target.value })} rows={2} className={inputCls} />
                    </Field>
                </div>
                <div className="md:col-span-2">
                    <Field label="Learning Objectives">
                        <textarea value={form.learning_objectives || ''} onChange={e => setForm({ ...form, learning_objectives: e.target.value })} rows={2} className={inputCls} />
                    </Field>
                </div>
                <div className="md:col-span-2">
                    <Field label={`Reflection (min 200 words — currently ${wordCount})`}>
                        <textarea
                            value={form.reflection || ''}
                            onChange={e => setForm({ ...form, reflection: e.target.value })}
                            rows={6}
                            className={`${inputCls} ${wordCount > 0 && wordCount < 200 ? 'border-amber-400' : ''}`}
                            placeholder="What did you learn from this session… What change did this session make… How will you apply this knowledge…"
                            disabled={!canEditReflection(role)}
                        />
                    </Field>
                </div>
                <Field label="Attendance">
                    <select value={form.attendance} onChange={e => setForm({ ...form, attendance: e.target.value as any })} className={inputCls}>
                        <option value="present">Present</option><option value="absent">Absent</option>
                    </select>
                </Field>
                <Field label="Faculty Incharge">
                    <select value={form.faculty_incharge_id || ''} onChange={e => setForm({ ...form, faculty_incharge_id: e.target.value })} className={inputCls}>
                        <option value="">Select…</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.full_name || f.email}</option>)}
                    </select>
                </Field>
                <Field label="Date of Completion">
                    <input type="date" value={form.date_of_completion || ''} onChange={e => setForm({ ...form, date_of_completion: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Attempt">
                    <select value={form.attempt || ''} onChange={e => setForm({ ...form, attempt: e.target.value })} className={inputCls}>
                        <option value="F">F — First</option><option value="R">R — Repeat</option><option value="Re">Re — Remedial</option>
                    </select>
                </Field>
                <Field label="Rating">
                    <select value={form.rating || ''} onChange={e => setForm({ ...form, rating: e.target.value })} className={inputCls}>
                        <option value="B">B — Below Expectations</option><option value="M">M — Meets Expectations</option><option value="E">E — Exceeds Expectations</option>
                    </select>
                </Field>
                <Field label="Decision">
                    <select value={form.decision || ''} onChange={e => setForm({ ...form, decision: e.target.value })} className={inputCls}>
                        <option value="C">C — Completed</option><option value="R">R — Repeat</option><option value="Re">Re — Remedial</option>
                    </select>
                </Field>
                <div className="md:col-span-2">
                    <Field label="Feedback / Remarks">
                        <textarea value={form.feedback_remarks || ''} onChange={e => setForm({ ...form, feedback_remarks: e.target.value })} rows={2} className={inputCls} />
                    </Field>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <Field label="Reflection Evidence / Attachments (Images or PDFs)">
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-colors">
                                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-xs font-bold text-slate-700">Select files or photo</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Images or PDFs</span>
                                <input type="file" multiple accept="image/*,application/pdf" className="hidden"
                                    onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={startCamera}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-emerald-500 hover:bg-emerald-50/10 transition-colors cursor-pointer"
                            >
                                <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                                <span className="text-xs font-bold text-slate-700">Take Photo with Camera</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Uses default device webcam</span>
                            </button>
                        </div>
                    </Field>

                    {/* Camera Modal overlay / viewport */}
                    {showCamera && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full flex flex-col">
                                <div className="px-4 py-3 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Webcam Viewer</span>
                                    <button type="button" onClick={stopCamera} className="p-1 rounded text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="relative aspect-video bg-black flex items-center justify-center">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4 bg-slate-800 flex items-center justify-between gap-3">
                                    <button type="button" onClick={stopCamera} className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-xs font-bold text-slate-300 hover:bg-slate-650">Cancel</button>
                                    <button type="button" onClick={captureSnapshot} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1">
                                        📷 Capture Photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cropper Modal overlay */}
                    {showCropper && capturedImage && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                                <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Crop Captured Reflection</span>
                                    <button type="button" onClick={() => { setCapturedImage(null); setShowCropper(false); }} className="p-1 rounded text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
                                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                                        <img ref={imgRef} src={capturedImage} alt="Crop source" className="max-h-[60vh] object-contain" />
                                    </ReactCrop>
                                </div>
                                <div className="p-4 bg-slate-50 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <button type="button" onClick={() => { setCapturedImage(null); setShowCropper(false); }} className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100">Discard</button>
                                    <button type="button" onClick={handleCropComplete} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">Crop & Queue</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Queued Files list */}
                    {files.length > 0 && (
                        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Files Queued for Upload</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {files.map((f, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 text-xs">
                                        <span className="truncate max-w-[80%] font-mono text-slate-600">{f.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-1 rounded text-red-500 hover:bg-red-50"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Draft
                </button>
                {canApproveAsFaculty(role) && (
                    <button onClick={() => handleSave(true)} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save & Approve
                    </button>
                )}
            </div>
        </ModalShell>
    );
}

function AssessmentForm({ logbookId, faculties, students, onClose, onSaved }: { logbookId: string; faculties: UserRow[]; students: UserRow[]; onClose: () => void; onSaved: (a: Assessment) => void; }) {
    const [form, setForm] = useState<any>({
        assessment_category: 'formative', assessment_no: '', assessment_type: 'theory',
        marks_received: '', marks_out_of: '', faculty_incharge_id: '', feedback: '',
        student_ids: [] as string[],
    });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!form.assessment_no) { alert('Assessment number is required.'); return; }
        setSaving(true);
        try {
            const { data, error } = await supabase.from('logbook_assessments').insert({
                logbook_id: logbookId,
                assessment_category: form.assessment_category,
                assessment_no: form.assessment_no,
                assessment_type: form.assessment_type,
                marks_received: form.marks_received === '' ? null : Number(form.marks_received),
                marks_out_of: form.marks_out_of === '' ? null : Number(form.marks_out_of),
                faculty_incharge_id: form.faculty_incharge_id || null,
                feedback: form.feedback || null,
            }).select().single();
            if (error) throw error;
            if (form.student_ids.length > 0) {
                await supabase.from('logbook_assessment_students').insert(
                    form.student_ids.map((sid: string) => ({ assessment_id: data.id, student_id: sid }))
                );
            }
            onSaved(data as Assessment);
        } catch (e: any) { alert(e.message); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title="Add Assessment" onClose={onClose}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Category"><select value={form.assessment_category} onChange={e => setForm({ ...form, assessment_category: e.target.value })} className={inputCls}><option value="formative">Formative</option><option value="internal">Internal</option></select></Field>
                <Field label="No" required><input value={form.assessment_no} onChange={e => setForm({ ...form, assessment_no: e.target.value })} className={inputCls} /></Field>
                <Field label="Type"><select value={form.assessment_type} onChange={e => setForm({ ...form, assessment_type: e.target.value })} className={inputCls}><option value="theory">Theory</option><option value="practical">Practical</option><option value="viva">Viva</option></select></Field>
                <div></div>
                <Field label="Marks Received"><input type="number" value={form.marks_received} onChange={e => setForm({ ...form, marks_received: e.target.value })} className={inputCls} /></Field>
                <Field label="Out Of"><input type="number" value={form.marks_out_of} onChange={e => setForm({ ...form, marks_out_of: e.target.value })} className={inputCls} /></Field>
                <div className="col-span-2"><Field label="Faculty Incharge"><select value={form.faculty_incharge_id} onChange={e => setForm({ ...form, faculty_incharge_id: e.target.value })} className={inputCls}><option value="">Select…</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.full_name || f.email}</option>)}</select></Field></div>
                <div className="col-span-2">
                    <Field label="Allot Students (hold Ctrl/Cmd for multi)">
                        <select multiple value={form.student_ids} onChange={e => setForm({ ...form, student_ids: Array.from(e.target.selectedOptions, o => o.value) })} className={inputCls + ' h-28'}>
                            {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                        </select>
                    </Field>
                </div>
                <div className="col-span-2"><Field label="Feedback"><textarea rows={3} value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} className={inputCls} /></Field></div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">{saving ? 'Saving…' : 'Save & Approve'}</button>
            </div>
        </ModalShell>
    );
}

function AttendanceForm({ logbookId, onClose, onSaved }: { logbookId: string; onClose: () => void; onSaved: (a: AttendanceReport) => void; }) {
    const [phase, setPhase] = useState(PHASES[0]);
    const [block, setBlock] = useState(BLOCKS[0]);
    const [pct, setPct] = useState<Record<string, number>>({ theory: 0, practical: 0, clinical_posting: 0 });
    const [extraKey, setExtraKey] = useState('');
    const [extraVal, setExtraVal] = useState('');
    const [eligibility, setEligibility] = useState<'eligible'|'not_eligible'|'not_applicable'>('eligible');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const final_pct = { ...pct };
            if (extraKey && extraVal) final_pct[extraKey] = Number(extraVal);
            const { data, error } = await supabase.from('logbook_attendance_reports').insert({
                logbook_id: logbookId, phase, block, attendance_pct: final_pct, eligibility,
            }).select().single();
            if (error) throw error;
            onSaved(data as AttendanceReport);
        } catch (e: any) { alert(e.message); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title="Add Attendance Report" onClose={onClose}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Phase"><input list="phases" value={phase} onChange={e => setPhase(e.target.value)} className={inputCls} /><datalist id="phases">{PHASES.map(p => <option key={p} value={p} />)}</datalist></Field>
                <Field label="Block"><input list="blocks" value={block} onChange={e => setBlock(e.target.value)} className={inputCls} /><datalist id="blocks">{BLOCKS.map(b => <option key={b} value={b} />)}</datalist></Field>
                {ATT_BUCKETS.map(k => (
                    <Field key={k} label={`${k.replace('_', ' ')} %`}>
                        <input type="number" value={pct[k] ?? 0} onChange={e => setPct({ ...pct, [k]: Number(e.target.value) })} className={inputCls} />
                    </Field>
                ))}
                <div className="col-span-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                    <Field label="Add New Bucket (name)"><input value={extraKey} onChange={e => setExtraKey(e.target.value)} className={inputCls} placeholder="e.g. emergency_posting" /></Field>
                    <Field label="% value"><input type="number" value={extraVal} onChange={e => setExtraVal(e.target.value)} className={inputCls} /></Field>
                </div>
                <div className="col-span-2"><Field label="Eligibility"><select value={eligibility} onChange={e => setEligibility(e.target.value as any)} className={inputCls}><option value="eligible">Eligible</option><option value="not_eligible">Not Eligible</option><option value="not_applicable">Not Applicable</option></select></Field></div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">{saving ? 'Saving…' : 'Save'}</button>
            </div>
        </ModalShell>
    );
}

function ActivityForm({ logbookId, faculties, students, onClose, onSaved }: { logbookId: string; faculties: UserRow[]; students: UserRow[]; onClose: () => void; onSaved: (a: Activity) => void; }) {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState<any>({
        activity_type: ACTIVITY_TYPES[0], activity_name: ACTIVITY_NAMES[0], activity_date: today,
        details: '', faculty_incharge_id: '', student_ids: [] as string[],
    });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const { data, error } = await supabase.from('logbook_additional_activities').insert({
                logbook_id: logbookId,
                activity_type: form.activity_type,
                activity_name: form.activity_name,
                activity_date: form.activity_date,
                details: form.details || null,
                faculty_incharge_id: form.faculty_incharge_id || null,
            }).select().single();
            if (error) throw error;
            if (form.student_ids.length > 0) {
                await supabase.from('logbook_additional_activity_students').insert(
                    form.student_ids.map((sid: string) => ({ activity_id: data.id, student_id: sid }))
                );
            }
            onSaved(data as Activity);
        } catch (e: any) { alert(e.message); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title="Add Additional Activity" onClose={onClose}>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Type"><input list="activity-types" value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value })} className={inputCls} /><datalist id="activity-types">{ACTIVITY_TYPES.map(t => <option key={t} value={t} />)}</datalist></Field>
                <Field label="Activity"><input list="activity-names" value={form.activity_name} onChange={e => setForm({ ...form, activity_name: e.target.value })} className={inputCls} /><datalist id="activity-names">{ACTIVITY_NAMES.map(n => <option key={n} value={n} />)}</datalist></Field>
                <Field label="Date"><input type="date" value={form.activity_date} onChange={e => setForm({ ...form, activity_date: e.target.value })} className={inputCls} /></Field>
                <Field label="Faculty Incharge"><select value={form.faculty_incharge_id} onChange={e => setForm({ ...form, faculty_incharge_id: e.target.value })} className={inputCls}><option value="">Select…</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.full_name || f.email}</option>)}</select></Field>
                <div className="col-span-2"><Field label="Allot Students"><select multiple value={form.student_ids} onChange={e => setForm({ ...form, student_ids: Array.from(e.target.selectedOptions, o => o.value) })} className={inputCls + ' h-24'}>{students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}</select></Field></div>
                <div className="col-span-2"><Field label="Details"><textarea rows={3} value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} className={inputCls} /></Field></div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">{saving ? 'Saving…' : 'Save'}</button>
            </div>
        </ModalShell>
    );
}

// ── New Logbook MS Helper Components ─────────────────────────────────────

const urlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                reject(new Error('Failed to get canvas context'));
            }
        };
        img.onerror = (e) => reject(e);
        img.src = url;
    });
};

function InitiateLogbookModal({
    students,
    institutions,
    departments,
    userId,
    onClose,
    onSaved
}: {
    students: UserRow[];
    institutions: any[];
    departments: any[];
    userId: string;
    onClose: () => void;
    onSaved: (lb: Logbook) => void;
}) {
    const [studentId, setStudentId] = useState('');
    const [instId, setInstId] = useState('');
    const [deptId, setDeptId] = useState('');
    const [academicYear, setAcademicYear] = useState('2025-26');
    const [phase, setPhase] = useState(PHASES[0]);
    const [block, setBlock] = useState(BLOCKS[0]);
    const [courseName, setCourseName] = useState('MBBS');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (students.length > 0 && !studentId) {
            setStudentId(students[0].id);
        }
    }, [students, studentId]);

    useEffect(() => {
        if (institutions.length > 0 && !instId) {
            setInstId(institutions[0].id);
        }
    }, [institutions, instId]);

    useEffect(() => {
        const filteredDepts = departments.filter(d => d.institution_id === instId);
        if (filteredDepts.length > 0) {
            // Auto select first department matching the selected institution
            setDeptId(filteredDepts[0].id);
        } else {
            setDeptId('');
        }
    }, [departments, instId]);

    const handleCreate = async () => {
        if (!studentId) { alert('Student is required.'); return; }
        if (!instId) { alert('Institution is required.'); return; }
        if (!deptId) { alert('Department is required.'); return; }
        if (!academicYear.trim()) { alert('Academic Year is required.'); return; }

        setSaving(true);
        try {
            const { data, error } = await supabase.from('logbooks').insert({
                student_id: studentId,
                institution_id: instId,
                department_id: deptId,
                course_name: courseName || null,
                academic_year: academicYear,
                phase: phase || null,
                block: block || null,
                status: 'draft',
                initiated_by: userId
            }).select().single();

            if (error) throw error;
            onSaved(data as Logbook);
        } catch (e: any) {
            alert(`Failed to initiate logbook: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const filteredDepts = departments.filter(d => d.institution_id === instId);

    return (
        <ModalShell title="Initiate Student Logbook" onClose={onClose}>
            <div className="space-y-4">
                <Field label="Select Student" required>
                    <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls}>
                        <option value="">Choose Student...</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Institution" required>
                    <select value={instId} onChange={e => setInstId(e.target.value)} className={inputCls}>
                        <option value="">Select Institution...</option>
                        {institutions.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Department" required>
                    <select value={deptId} onChange={e => setDeptId(e.target.value)} className={inputCls}>
                        <option value="">Select Department...</option>
                        {filteredDepts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Academic Year" required>
                        <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={inputCls} placeholder="e.g. 2025-26" />
                    </Field>
                    <Field label="Course Name">
                        <input value={courseName} onChange={e => setCourseName(e.target.value)} className={inputCls} placeholder="e.g. MBBS" />
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Phase">
                        <select value={phase} onChange={e => setPhase(e.target.value)} className={inputCls}>
                            {PHASES.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Block">
                        <select value={block} onChange={e => setBlock(e.target.value)} className={inputCls}>
                            {BLOCKS.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 flex items-center gap-1 transition-colors">
                        {saving ? 'Creating...' : 'Initiate Logbook'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function BroadcastModal({
    institutions,
    departments,
    userId,
    onClose,
    onSaved
}: {
    institutions: any[];
    departments: any[];
    userId: string;
    onClose: () => void;
    onSaved: (msg: any) => void;
}) {
    const [selectedInstId, setSelectedInstId] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [audience, setAudience] = useState<'all'|'hod'|'faculty'|'student'>('all');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (institutions.length > 0 && !selectedInstId) {
            setSelectedInstId(institutions[0].id);
        }
    }, [institutions, selectedInstId]);

    const handleSend = async () => {
        if (!selectedInstId) { alert('Institution is required.'); return; }
        if (!subject.trim()) { alert('Subject is required.'); return; }
        if (!body.trim()) { alert('Body message is required.'); return; }

        setSaving(true);
        try {
            const { data, error } = await supabase.from('logbook_messages').insert({
                institution_id: selectedInstId,
                department_id: selectedDeptId || null,
                sender_id: userId,
                audience,
                subject,
                body
            }).select().single();

            if (error) throw error;
            onSaved(data);
        } catch (e: any) {
            alert(`Failed to send broadcast: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const filteredDepts = departments.filter(d => d.institution_id === selectedInstId);

    return (
        <ModalShell title="Broadcast New Announcement" onClose={onClose}>
            <div className="space-y-4">
                <Field label="Institution" required>
                    <select value={selectedInstId} onChange={e => setSelectedInstId(e.target.value)} className={inputCls}>
                        <option value="">Select Institution...</option>
                        {institutions.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Department (Optional)">
                    <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className={inputCls}>
                        <option value="">Institution-Wide (All Departments)</option>
                        {filteredDepts.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Audience" required>
                    <select value={audience} onChange={e => setAudience(e.target.value as any)} className={inputCls}>
                        <option value="all">All Roles</option>
                        <option value="hod">Department Heads (HODs) Only</option>
                        <option value="faculty">Faculties Only</option>
                        <option value="student">Students Only</option>
                    </select>
                </Field>
                <Field label="Subject" required>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="Important announcement subject..." />
                </Field>
                <Field label="Message Body" required>
                    <textarea rows={4} value={body} onChange={e => setBody(e.target.value)} className={inputCls} placeholder="Type announcement details here..." />
                </Field>

                <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleSend} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 flex items-center gap-1 transition-colors">
                        {saving ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

function AnnouncementsTab({
    messages,
    users,
    role,
    onBroadcastClick
}: {
    messages: any[];
    users: UserRow[];
    role: Role;
    onBroadcastClick: () => void;
}) {
    const isSender = role === 'instadmin' || role === 'deptadmin' || role === 'superadmin' || role === 'masteradmin';

    // Filter messages visible to this role
    const visibleMessages = useMemo(() => {
        return messages.filter(m => {
            if (role === 'superadmin' || role === 'masteradmin' || role === 'instadmin') return true;
            if (role === 'deptadmin') return m.audience === 'hod' || m.audience === 'faculty' || m.audience === 'all';
            if (role === 'teacher') return m.audience === 'faculty' || m.audience === 'all';
            if (role === 'student') return m.audience === 'student' || m.audience === 'all';
            return false;
        });
    }, [messages, role]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Broadcast Announcements <span className="text-slate-400">({visibleMessages.length})</span></h3>
                {isSender && (
                    <button
                        onClick={onBroadcastClick}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 transition-colors"
                    >
                        <Send className="w-3.5 h-3.5" /> Broadcast Message
                    </button>
                )}
            </div>

            {visibleMessages.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-xs text-slate-400 italic">No announcements posted yet.</p>
                </div>
            ) : (
                <div className="space-y-3 mt-3">
                    {visibleMessages.map(m => {
                        const sender = users.find(u => u.id === m.sender_id);
                        const audienceMap: Record<string, string> = {
                            all: 'All',
                            hod: 'HODs',
                            faculty: 'Faculties',
                            student: 'Students'
                        };
                        return (
                            <div key={m.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                    <h4 className="text-sm font-bold text-slate-900">{m.subject}</h4>
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                                        To: {audienceMap[m.audience] || m.audience}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 whitespace-pre-wrap mb-3 leading-relaxed">{m.body}</p>
                                <div className="text-[10px] text-slate-400 flex items-center gap-4">
                                    <span>👤 By {sender?.full_name || sender?.email || 'Administrator'}</span>
                                    <span>📅 {new Date(m.sent_at).toLocaleDateString()} at {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function ClassroomRosterTab({
    students,
    departments,
    classroomStudents,
    userId,
    onReload
}: {
    students: UserRow[];
    departments: any[];
    classroomStudents: any[];
    userId: string;
    onReload: () => void;
}) {
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');

    // Set first department on load
    useEffect(() => {
        if (departments.length > 0 && !selectedDeptId) {
            setSelectedDeptId(departments[0].id);
        }
    }, [departments, selectedDeptId]);

    const handleApprove = async (studentId: string) => {
        if (!selectedDeptId) return;
        const { error } = await supabase.from('logbook_classroom_students').insert({
            department_id: selectedDeptId,
            student_id: studentId,
            approved_by: userId
        });
        if (error) {
            alert(`Approval failed: ${error.message}`);
        } else {
            onReload();
        }
    };

    const handleRevoke = async (studentId: string) => {
        if (!selectedDeptId) return;
        const { error } = await supabase.from('logbook_classroom_students').delete().match({
            department_id: selectedDeptId,
            student_id: studentId
        });
        if (error) {
            alert(`Revocation failed: ${error.message}`);
        } else {
            onReload();
        }
    };

    const isApproved = (studentId: string) => {
        return classroomStudents.some(cs => cs.student_id === studentId && cs.department_id === selectedDeptId);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-bold text-slate-700">Classroom Student Approvals</h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Department:</span>
                    <select
                        value={selectedDeptId}
                        onChange={e => setSelectedDeptId(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {students.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No students registered in the system.</p>
            ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                            <tr>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {students.map(s => {
                                const approved = isApproved(s.id);
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{s.full_name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-slate-500">{s.email || 'N/A'}</td>
                                        <td className="px-4 py-3">
                                            {approved ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                                                    Not Approved
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {approved ? (
                                                <button
                                                    onClick={() => handleRevoke(s.id)}
                                                    className="px-2.5 py-1 rounded bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors cursor-pointer"
                                                >
                                                    Revoke
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApprove(s.id)}
                                                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
