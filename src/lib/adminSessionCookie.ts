import crypto from 'crypto';

// Long-lived HMAC-signed session cookie that survives Supabase JWT expiry.
// Issued at login alongside the standard `role` + JWT cookies. When the 1h
// Supabase access token (and refresh token) is gone, verifyAuth falls back
// to this cookie so the admin doesn't get bounced to "Unauthorized." mid-session.

export const ADMIN_SESSION_COOKIE = 'mededuai_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const VERSION = 'v1';

export interface AdminSessionPayload {
    id: string;
    email: string;
    role: string;
    exp: number; // unix seconds
}

function getSecret(): string {
    // ADMIN_SECRET is set in Cloud Run (see env_vars.yaml). Fall back to the
    // service role key so signing is never silently weak — both are server-only.
    const s = process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!s) throw new Error('ADMIN_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is required to sign admin session cookies.');
    return s;
}

function b64urlEncode(buf: Buffer): string {
    return buf.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlDecode(s: string): Buffer {
    let pad = s.replace(/-/g, '+').replace(/_/g, '/');
    while (pad.length % 4) pad += '=';
    return Buffer.from(pad, 'base64');
}

export function signAdminSession(payload: Omit<AdminSessionPayload, 'exp'> & { exp?: number }): string {
    const full: AdminSessionPayload = {
        ...payload,
        exp: payload.exp ?? Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
    };
    const body = b64urlEncode(Buffer.from(JSON.stringify(full)));
    const sig = crypto.createHmac('sha256', getSecret()).update(`${VERSION}.${body}`).digest();
    return `${VERSION}.${body}.${b64urlEncode(sig)}`;
}

export function verifyAdminSession(raw: string | undefined | null): AdminSessionPayload | null {
    if (!raw) return null;
    const parts = raw.split('.');
    if (parts.length !== 3 || parts[0] !== VERSION) return null;
    const [ver, body, sig] = parts;

    let expectedSigB64: string;
    try {
        const expectedSig = crypto.createHmac('sha256', getSecret()).update(`${ver}.${body}`).digest();
        expectedSigB64 = b64urlEncode(expectedSig);
    } catch {
        return null;
    }

    if (sig.length !== expectedSigB64.length) return null;
    try {
        if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSigB64))) return null;
    } catch {
        return null;
    }

    try {
        const payload = JSON.parse(b64urlDecode(body).toString('utf-8')) as AdminSessionPayload;
        if (!payload?.id || !payload?.role || !payload?.exp) return null;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}
