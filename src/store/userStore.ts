import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'student' | 'teacher' | 'deptadmin' | 'instadmin' | 'masteradmin' | 'superadmin';

export interface User {
    id: string;
    role: UserRole;
    name: string;
    email: string;
    password: string; // Stored in plain text for demonstration only
    createdAt: string;
    mentorId?: string; // Links a student to a specific mentor (teacher) 
    institutionName?: string; // Holds Institution Name for instadmin
    institutionLogo?: string; // Holds Base64 or URL for instadmin
}

interface UserState {
    users: User[];
    addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    updateUser: (id: string, data: Partial<User>) => void;
    deleteUser: (id: string) => void;
}

const defaultUsers: User[] = [
    { id: '1', role: 'student', name: 'John Doe', email: 'john@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '2', role: 'student', name: 'Alice Smith', email: 'alice@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '3', role: 'teacher', name: 'Dr. Gregory House', email: 'house@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '4', role: 'teacher', name: 'Dr. Lisa Cuddy', email: 'cuddy@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '5', role: 'deptadmin', name: 'Dept Admin', email: 'deptadmin@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '6', role: 'instadmin', name: 'Institution Admin', email: 'instadmin@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '7', role: 'masteradmin', name: 'Master Admin', email: 'masteradmin@mededu.ai', password: 'password123', createdAt: new Date().toISOString() },
    { id: '8', role: 'superadmin', name: 'System Superadmin', email: 'superadmin@mededu.ai', password: 'superpassword', createdAt: new Date().toISOString() }
];

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            users: defaultUsers,
            addUser: (user) => set((state) => ({
                users: [
                    ...state.users,
                    { ...user, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }
                ]
            })),
            updateUser: (id, data) => set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
            })),
            deleteUser: (id) => set((state) => ({
                users: state.users.filter(u => u.id !== id)
            }))
        }),
        {
            name: 'user-storage',
            version: 1,
        }
    )
);
