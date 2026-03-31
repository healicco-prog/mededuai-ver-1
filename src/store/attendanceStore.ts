import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudentInfo {
    id: string;
    name: string;
    registrationNumber: string;
    rollNumber: string;
    email: string;
}

export interface CourseSetup {
    id: string;
    courseName: string;
    instituteName: string;
    departmentName: string;
    session?: string;
    logoUrl: string;
    faculty: string[];
    students: StudentInfo[];
}

export interface AttendanceRecord {
    id: string;
    courseId: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    topic: string;
    faculty: string;
    studentAttendance: { [studentId: string]: boolean }; // true = present
}

export interface AttendanceState {
    isPro: boolean;
    courses: CourseSetup[];
    attendanceRecords: AttendanceRecord[];
    setIsPro: (val: boolean) => void;
    addCourse: (course: CourseSetup) => void;
    updateCourse: (course: CourseSetup) => void;
    addAttendanceRecord: (record: AttendanceRecord) => void;
    updateAttendanceRecord: (record: AttendanceRecord) => void;
    deleteAttendanceRecord: (id: string) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
    persist(
        (set) => ({
            isPro: false,
            courses: [],
            attendanceRecords: [],
            setIsPro: (val) => set({ isPro: val }),
            addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
            updateCourse: (course) => set((state) => ({ courses: state.courses.map(c => c.id === course.id ? course : c) })),
            addAttendanceRecord: (record) => set((state) => ({ attendanceRecords: [...state.attendanceRecords, record] })),
            updateAttendanceRecord: (record) => set((state) => ({ attendanceRecords: state.attendanceRecords.map(r => r.id === record.id ? record : r) })),
            deleteAttendanceRecord: (id) => set((state) => ({ attendanceRecords: state.attendanceRecords.filter(r => r.id !== id) })),
        }),
        {
            name: 'attendance-storage',
            version: 1,
        }
    )
);
