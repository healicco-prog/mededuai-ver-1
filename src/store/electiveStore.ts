import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ElectiveInstitution {
    id: string;
    name: string;
    address: string;
    logoUrl: string; // base64 data-url
}

export interface Elective {
    id: string;
    institutionId: string;
    block: 1 | 2;
    facultyName: string;
    facultyDesignation: string;
    facultyEmail: string;
    electiveName: string;
    topicDetails: string;
    totalUptake: number; // max seats
}

export interface ElectiveStudent {
    id: string;
    institutionId: string;
    name: string;
    regNo: string;
    mobileNo: string;
    email: string;
    address: string;
    group: 1 | 2 | null; // null = no division
    meritRank: number | null; // for merit-weighted
}

export interface ElectiveDate {
    id: string;
    institutionId: string;
    block: 1 | 2;
    group: 1 | 2 | null;
    fromDate: string;
    toDate: string;
    studentsManual: string[]; // student IDs if manually assigned
}

export type AllotmentMethod = 'merit' | 'points';

export interface StudentPreference {
    id: string;
    institutionId: string;
    studentId: string;
    electiveId: string;
    block: 1 | 2;
    rank: number | null;     // for merit-weighted
    points: number | null;   // for point-based
    submittedAt?: string;    // ISO timestamp of when student submitted
}

export interface Allotment {
    id: string;
    institutionId: string;
    studentId: string;
    electiveId: string;
    block: 1 | 2;
    method: AllotmentMethod;
}

export interface ElectiveSession {
    id: string;
    institutionId: string;
    electiveId: string;
    facultyEmail: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    topic: string;
    slos: string;
    activityType: string; // SDL / SGT / Seminar / Skill Lab / Bedside Clinics / Clinical Procedure or Activity / Any Other
    levelOfParticipation: 'attended' | 'presented';
    reflectionMode: 'type' | 'upload';
    attendanceMap: Record<string, boolean>; // studentId -> present
}

export interface StudentReflection {
    id: string;
    institutionId: string;
    sessionId: string;
    studentId: string;
    reflectionText: string;
    imageUrls: string[]; // base64 data-urls
    submittedAt: string;
}

export interface TeacherGrade {
    id: string;
    institutionId: string;
    sessionId: string;
    studentId: string;
    // Skill Lab extras
    dateOfCompletion: string;
    attempt: 'First' | 'Repeat' | 'Remedial' | '';
    rating: 'B' | 'M' | 'E' | ''; // Below / Meets / Exceeds expectations
    comments: string;
    signatureUrl: string; // base64 data-url
}

export interface StudentFeedback {
    id: string;
    institutionId: string;
    studentId: string;
    block: 1 | 2;
    feedbackText: string;
    submittedAt: string;
}

export interface ElectiveCode {
    id: string;
    institutionId: string;
    code: string;
    createdAt: string;
}

export interface LogbookApproval {
    id: string;
    institutionId: string;
    studentId: string;
    approvedAt: string;
    approvedBy: string; // admin email or name
}

// ──────────────────────────────────────────────
// Store State & Actions
// ──────────────────────────────────────────────

interface ElectiveState {
    institutions: ElectiveInstitution[];
    electives: Elective[];
    students: ElectiveStudent[];
    dates: ElectiveDate[];
    allotmentMethod: AllotmentMethod;
    preferences: StudentPreference[];
    allotments: Allotment[];
    sessions: ElectiveSession[];
    reflections: StudentReflection[];
    grades: TeacherGrade[];
    feedbacks: StudentFeedback[];
    codes: ElectiveCode[];
    logbookApprovals: LogbookApproval[];
    allotmentComplete: boolean;

    // Institution
    addInstitution: (inst: Omit<ElectiveInstitution, 'id'>) => string;
    updateInstitution: (id: string, data: Partial<ElectiveInstitution>) => void;

    // Electives
    addElective: (el: Omit<Elective, 'id'>) => void;
    addElectives: (els: Omit<Elective, 'id'>[]) => void;
    updateElective: (id: string, data: Partial<Elective>) => void;
    deleteElective: (id: string) => void;

    // Students
    addStudent: (st: Omit<ElectiveStudent, 'id'>) => void;
    addStudents: (sts: Omit<ElectiveStudent, 'id'>[]) => void;
    updateStudent: (id: string, data: Partial<ElectiveStudent>) => void;
    deleteStudent: (id: string) => void;
    setStudentGroups: (mode: 'manual' | 'none') => void;
    assignStudentGroup: (studentId: string, group: 1 | 2 | null) => void;

    // Dates
    addDate: (d: Omit<ElectiveDate, 'id'>) => void;
    updateDate: (id: string, data: Partial<ElectiveDate>) => void;
    deleteDate: (id: string) => void;

    // Allotment
    setAllotmentMethod: (method: AllotmentMethod) => void;
    setPreference: (pref: Omit<StudentPreference, 'id'>) => void;
    setPreferences: (prefs: Omit<StudentPreference, 'id'>[]) => void;
    clearPreferences: (institutionId: string) => void;
    runAllotment: (institutionId: string) => void;
    clearAllotments: (institutionId: string) => void;

    // Sessions
    addSession: (s: Omit<ElectiveSession, 'id'>) => void;
    updateSession: (id: string, data: Partial<ElectiveSession>) => void;

    // Reflections
    addReflection: (r: Omit<StudentReflection, 'id'>) => void;

    // Grades
    addGrade: (g: Omit<TeacherGrade, 'id'>) => void;
    updateGrade: (id: string, data: Partial<TeacherGrade>) => void;

    // Feedback
    addFeedback: (f: Omit<StudentFeedback, 'id'>) => void;

    // Codes
    generateCode: (institutionId: string) => string;

    // Bulk update merit rank
    updateMeritRanks: (institutionId: string, ranks: { studentId: string; rank: number }[]) => void;

    // Logbook Approval
    approveLogbook: (institutionId: string, studentId: string, approvedBy: string) => void;
    revokeLogbookApproval: (institutionId: string, studentId: string) => void;
}

const uid = () => Math.random().toString(36).substring(2, 11);

// ──────────────────────────────────────────────
// Allotment Algorithms
// ──────────────────────────────────────────────

function runMeritAllotment(
    students: ElectiveStudent[],
    electives: Elective[],
    preferences: StudentPreference[],
    institutionId: string
): Allotment[] {
    const allotments: Allotment[] = [];
    const seatsTaken: Record<string, number> = {};
    electives.forEach(e => { seatsTaken[e.id] = 0; });

    const allottedBlock1 = new Set<string>();
    const allottedBlock2 = new Set<string>();

    // Sort students by merit rank (1 = best)
    const sorted = [...students]
        .filter(s => s.institutionId === institutionId && s.meritRank !== null)
        .sort((a, b) => (a.meritRank ?? 9999) - (b.meritRank ?? 9999));

    for (const block of [1, 2] as const) {
        const allottedSet = block === 1 ? allottedBlock1 : allottedBlock2;

        for (const student of sorted) {
            if (allottedSet.has(student.id)) continue;

            // Get this student's ranked preferences for this block, sorted by rank ASC
            const prefs = preferences
                .filter(p => p.studentId === student.id && p.block === block && p.institutionId === institutionId)
                .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));

            for (const pref of prefs) {
                const elective = electives.find(e => e.id === pref.electiveId);
                if (!elective) continue;
                if ((seatsTaken[elective.id] ?? 0) < elective.totalUptake) {
                    allotments.push({
                        id: uid(),
                        institutionId,
                        studentId: student.id,
                        electiveId: elective.id,
                        block,
                        method: 'merit',
                    });
                    seatsTaken[elective.id] = (seatsTaken[elective.id] ?? 0) + 1;
                    allottedSet.add(student.id);
                    break;
                }
            }
        }
    }

    return allotments;
}

function runPointBasedAllotment(
    students: ElectiveStudent[],
    electives: Elective[],
    preferences: StudentPreference[],
    institutionId: string
): Allotment[] {
    const allotments: Allotment[] = [];
    const seatsTaken: Record<string, number> = {};
    electives.forEach(e => { seatsTaken[e.id] = 0; });

    const allottedBlock1 = new Set<string>();
    const allottedBlock2 = new Set<string>();

    for (const block of [1, 2] as const) {
        const allottedSet = block === 1 ? allottedBlock1 : allottedBlock2;

        // Collect all (studentId, electiveId, points) for this block
        const blockPrefs = preferences.filter(
            p => p.block === block && p.institutionId === institutionId && p.points !== null
        );

        // Get unique point values descending
        const uniquePoints = [...new Set(blockPrefs.map(p => p.points!))].sort((a, b) => b - a);

        for (const pointLevel of uniquePoints) {
            // Group by elective for this point level
            const atThisLevel = blockPrefs.filter(p => p.points === pointLevel && !allottedSet.has(p.studentId));

            // Group by elective
            const byElective: Record<string, string[]> = {};
            for (const p of atThisLevel) {
                if (!byElective[p.electiveId]) byElective[p.electiveId] = [];
                byElective[p.electiveId].push(p.studentId);
            }

            for (const [electiveId, studentIds] of Object.entries(byElective)) {
                const elective = electives.find(e => e.id === electiveId);
                if (!elective) continue;

                const remaining = elective.totalUptake - (seatsTaken[electiveId] ?? 0);
                if (remaining <= 0) continue;

                // Shuffle for lottery tie-break
                const shuffled = [...studentIds].sort(() => Math.random() - 0.5);
                const winners = shuffled.slice(0, remaining);

                for (const sId of winners) {
                    if (allottedSet.has(sId)) continue;
                    allotments.push({
                        id: uid(),
                        institutionId,
                        studentId: sId,
                        electiveId,
                        block,
                        method: 'points',
                    });
                    seatsTaken[electiveId] = (seatsTaken[electiveId] ?? 0) + 1;
                    allottedSet.add(sId);
                }
            }
        }

        // Cascade: students who lost tie-break get their next highest-pointed elective
        const unallotted = students.filter(s => s.institutionId === institutionId && !allottedSet.has(s.id));
        for (const student of unallotted) {
            const prefs = preferences
                .filter(p => p.studentId === student.id && p.block === block && p.institutionId === institutionId && p.points !== null)
                .sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

            for (const pref of prefs) {
                const elective = electives.find(e => e.id === pref.electiveId);
                if (!elective) continue;
                if ((seatsTaken[elective.id] ?? 0) < elective.totalUptake) {
                    allotments.push({
                        id: uid(),
                        institutionId,
                        studentId: student.id,
                        electiveId: elective.id,
                        block,
                        method: 'points',
                    });
                    seatsTaken[elective.id] = (seatsTaken[elective.id] ?? 0) + 1;
                    allottedSet.add(student.id);
                    break;
                }
            }
        }
    }

    return allotments;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useElectiveStore = create<ElectiveState>()(
    persist(
        (set, get) => ({
            institutions: [],
            electives: [],
            students: [],
            dates: [],
            allotmentMethod: 'merit',
            preferences: [],
            allotments: [],
            sessions: [],
            reflections: [],
            grades: [],
            feedbacks: [],
            codes: [],
            logbookApprovals: [],
            allotmentComplete: false,

            // ── Institution ──
            addInstitution: (inst) => {
                const id = uid();
                set(s => ({ institutions: [...s.institutions, { ...inst, id }] }));
                return id;
            },
            updateInstitution: (id, data) => set(s => ({
                institutions: s.institutions.map(i => i.id === id ? { ...i, ...data } : i)
            })),

            // ── Electives ──
            addElective: (el) => set(s => ({ electives: [...s.electives, { ...el, id: uid() }] })),
            addElectives: (els) => set(s => ({
                electives: [...s.electives, ...els.map(e => ({ ...e, id: uid() }))]
            })),
            updateElective: (id, data) => set(s => ({
                electives: s.electives.map(e => e.id === id ? { ...e, ...data } : e)
            })),
            deleteElective: (id) => set(s => ({ electives: s.electives.filter(e => e.id !== id) })),

            // ── Students ──
            addStudent: (st) => set(s => ({ students: [...s.students, { ...st, id: uid() }] })),
            addStudents: (sts) => set(s => ({
                students: [...s.students, ...sts.map(st => ({ ...st, id: uid() }))]
            })),
            updateStudent: (id, data) => set(s => ({
                students: s.students.map(st => st.id === id ? { ...st, ...data } : st)
            })),
            deleteStudent: (id) => set(s => ({ students: s.students.filter(st => st.id !== id) })),
            setStudentGroups: (mode) => set(s => ({
                students: s.students.map(st => ({ ...st, group: mode === 'none' ? null : st.group }))
            })),
            assignStudentGroup: (studentId, group) => set(s => ({
                students: s.students.map(st => st.id === studentId ? { ...st, group } : st)
            })),

            // ── Dates ──
            addDate: (d) => set(s => ({ dates: [...s.dates, { ...d, id: uid() }] })),
            updateDate: (id, data) => set(s => ({
                dates: s.dates.map(d => d.id === id ? { ...d, ...data } : d)
            })),
            deleteDate: (id) => set(s => ({ dates: s.dates.filter(d => d.id !== id) })),

            // ── Allotment ──
            setAllotmentMethod: (method) => set({ allotmentMethod: method }),
            setPreference: (pref) => {
                set(s => {
                    const existing = s.preferences.findIndex(
                        p => p.studentId === pref.studentId && p.electiveId === pref.electiveId && p.block === pref.block
                    );
                    if (existing >= 0) {
                        const updated = [...s.preferences];
                        updated[existing] = { ...updated[existing], ...pref };
                        return { preferences: updated };
                    }
                    return { preferences: [...s.preferences, { ...pref, id: uid() }] };
                });
            },
            setPreferences: (prefs) => set(s => ({
                preferences: [
                    ...s.preferences.filter(p =>
                        !prefs.some(np => np.studentId === p.studentId && np.electiveId === p.electiveId && np.block === p.block)
                    ),
                    ...prefs.map(p => ({ ...p, id: uid() }))
                ]
            })),
            clearPreferences: (institutionId) => set(s => ({
                preferences: s.preferences.filter(p => p.institutionId !== institutionId)
            })),

            runAllotment: (institutionId) => {
                const state = get();
                const instStudents = state.students.filter(s => s.institutionId === institutionId);
                const instElectives = state.electives.filter(e => e.institutionId === institutionId);
                const instPrefs = state.preferences.filter(p => p.institutionId === institutionId);

                let result: Allotment[];
                if (state.allotmentMethod === 'merit') {
                    result = runMeritAllotment(instStudents, instElectives, instPrefs, institutionId);
                } else {
                    result = runPointBasedAllotment(instStudents, instElectives, instPrefs, institutionId);
                }

                set(s => ({
                    allotments: [...s.allotments.filter(a => a.institutionId !== institutionId), ...result],
                    allotmentComplete: true,
                }));
            },
            clearAllotments: (institutionId) => set(s => ({
                allotments: s.allotments.filter(a => a.institutionId !== institutionId),
                allotmentComplete: false,
            })),

            // ── Sessions ──
            addSession: (s) => set(st => ({ sessions: [...st.sessions, { ...s, id: uid() }] })),
            updateSession: (id, data) => set(st => ({
                sessions: st.sessions.map(s => s.id === id ? { ...s, ...data } : s)
            })),

            // ── Reflections ──
            addReflection: (r) => set(s => ({ reflections: [...s.reflections, { ...r, id: uid() }] })),

            // ── Grades ──
            addGrade: (g) => set(s => ({ grades: [...s.grades, { ...g, id: uid() }] })),
            updateGrade: (id, data) => set(s => ({
                grades: s.grades.map(g => g.id === id ? { ...g, ...data } : g)
            })),

            // ── Feedback ──
            addFeedback: (f) => set(s => ({ feedbacks: [...s.feedbacks, { ...f, id: uid() }] })),

            // ── Codes ──
            generateCode: (institutionId) => {
                const code = 'EL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                set(s => ({
                    codes: [...s.codes, { id: uid(), institutionId, code, createdAt: new Date().toISOString() }]
                }));
                return code;
            },

            // ── Merit Ranks ──
            updateMeritRanks: (institutionId, ranks) => set(s => ({
                students: s.students.map(st => {
                    const match = ranks.find(r => r.studentId === st.id);
                    if (match && st.institutionId === institutionId) return { ...st, meritRank: match.rank };
                    return st;
                })
            })),

            // ── Logbook Approval ──
            approveLogbook: (institutionId, studentId, approvedBy) => set(s => ({
                logbookApprovals: [
                    ...s.logbookApprovals.filter(a => !(a.institutionId === institutionId && a.studentId === studentId)),
                    { id: uid(), institutionId, studentId, approvedAt: new Date().toISOString(), approvedBy }
                ]
            })),
            revokeLogbookApproval: (institutionId, studentId) => set(s => ({
                logbookApprovals: s.logbookApprovals.filter(a => !(a.institutionId === institutionId && a.studentId === studentId))
            })),
        }),
        {
            name: 'elective-storage',
            version: 1,
        }
    )
);
