"use client";

const ENTERPRISE_EMAILS_KEY = 'mededuai_enterprise_approved_emails';

export function isEnterpriseApproved(email: string): boolean {
    if (!email) return false;
    try {
        // If running on server or no window, return false gracefully
        if (typeof window === 'undefined') return false;
        
        const raw = localStorage.getItem(ENTERPRISE_EMAILS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.some(e => e.toLowerCase() === email.toLowerCase());
            }
        }
    } catch {}
    return false;
}

export function approveEnterpriseEmails(emails: string[]): void {
    try {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(ENTERPRISE_EMAILS_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        
        // Merge and deduplicate
        const merged = Array.from(new Set([...existing.map((e: string) => e.toLowerCase()), ...emails.map(e => e.toLowerCase())]));
        
        localStorage.setItem(ENTERPRISE_EMAILS_KEY, JSON.stringify(merged));
    } catch {}
}

export function revokeEnterpriseEmails(emails: string[]): void {
    try {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(ENTERPRISE_EMAILS_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const toRevoke = emails.map(e => e.toLowerCase());
        const updated = existing.filter((e: string) => !toRevoke.includes(e.toLowerCase()));
        localStorage.setItem(ENTERPRISE_EMAILS_KEY, JSON.stringify(updated));
    } catch {}
}

export function getApprovedEnterpriseEmails(): string[] {
    try {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(ENTERPRISE_EMAILS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {}
    return [];
}
