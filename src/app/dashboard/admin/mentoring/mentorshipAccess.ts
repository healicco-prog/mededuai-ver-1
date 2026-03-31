"use client";

// Centralized store for approved mentorship emails.
// The Institution Admin manages these via Department/Mentor/Mentee managers.
// Only users whose emails appear here can see "Mentorship MS" in their sidebar.

const MENTORSHIP_EMAILS_KEY = 'mededuai_mentoring_approved_emails';

export type ApprovedEmailEntry = {
    email: string;
    role: 'dept_head' | 'mentor' | 'mentee' | 'peer_mentee';
    name: string;
};

// Default approved emails — auto-seeds on first access so all roles work immediately
const DEFAULT_APPROVED_EMAILS: ApprovedEmailEntry[] = [
    // Department Heads
    { email: 'drnarayanabjp@gmail.com', role: 'dept_head', name: 'Dr. Narayana BJP' },
    { email: 'bjpdoddaballapura@gmail.com', role: 'dept_head', name: 'Dr. Doddaballapura' },
    { email: 'bjpkarnatakadoctorscell@gmail.com', role: 'dept_head', name: 'Dr. Karnataka Doctors Cell' },
    // Mentors
    { email: 'drnarayanabjp@gmail.com', role: 'mentor', name: 'Dr. Narayana BJP' },
    { email: 'bjpdoddaballapura@gmail.com', role: 'mentor', name: 'Dr. Doddaballapura' },
    // Mentees
    { email: 'narayanakdr@yahoo.co.in', role: 'mentee', name: 'Narayana K' },
    { email: 'aimsrcpharmac@gmail.com', role: 'mentee', name: 'AIMS RC Pharmacy' },
    // Peer Mentees
    { email: 'bjpdoddaballapura@gmail.com', role: 'peer_mentee', name: 'Dr. Doddaballapura' },
];

/** Get all approved email entries — auto-seeds defaults if localStorage is empty */
export function getApprovedEmails(): ApprovedEmailEntry[] {
    try {
        const raw = localStorage.getItem(MENTORSHIP_EMAILS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        // First access — seed with defaults
        localStorage.setItem(MENTORSHIP_EMAILS_KEY, JSON.stringify(DEFAULT_APPROVED_EMAILS));
        return DEFAULT_APPROVED_EMAILS;
    } catch {}
    return DEFAULT_APPROVED_EMAILS;
}

/** Save all approved email entries */
export function setApprovedEmails(entries: ApprovedEmailEntry[]): void {
    try {
        localStorage.setItem(MENTORSHIP_EMAILS_KEY, JSON.stringify(entries));
    } catch {}
}

/** Check if a specific email is approved for mentorship access */
export function isEmailApproved(email: string): boolean {
    if (!email) return false;
    const entries = getApprovedEmails();
    return entries.some(e => e.email.toLowerCase() === email.toLowerCase());
}

/** Sync department head emails — call this whenever departments list changes */
export function syncDeptHeadEmails(departments: { head: { email: string; name: string } }[]): void {
    const entries = getApprovedEmails();
    // Remove old dept_head entries, then add current ones
    const nonDeptEntries = entries.filter(e => e.role !== 'dept_head');
    const deptEntries: ApprovedEmailEntry[] = departments
        .filter(d => d.head.email)
        .map(d => ({ email: d.head.email, role: 'dept_head', name: d.head.name }));
    setApprovedEmails([...nonDeptEntries, ...deptEntries]);
}

/** Sync mentor emails — call this whenever mentor list changes */
export function syncMentorEmails(mentors: { email: string; name: string }[]): void {
    const entries = getApprovedEmails();
    const nonMentorEntries = entries.filter(e => e.role !== 'mentor');
    const mentorEntries: ApprovedEmailEntry[] = mentors
        .filter(m => m.email)
        .map(m => ({ email: m.email, role: 'mentor', name: m.name }));
    setApprovedEmails([...nonMentorEntries, ...mentorEntries]);
}

/** Sync mentee emails — call this whenever mentee list changes */
export function syncMenteeEmails(mentees: { email: string; name: string; type: 'mentee' | 'peer_mentee' }[]): void {
    const entries = getApprovedEmails();
    const nonMenteeEntries = entries.filter(e => e.role !== 'mentee' && e.role !== 'peer_mentee');
    const menteeEntries: ApprovedEmailEntry[] = mentees
        .filter(m => m.email)
        .map(m => ({ email: m.email, role: m.type, name: m.name }));
    setApprovedEmails([...nonMenteeEntries, ...menteeEntries]);
}
