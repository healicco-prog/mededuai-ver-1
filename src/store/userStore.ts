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

const defaultUsers: User[] = [];

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
