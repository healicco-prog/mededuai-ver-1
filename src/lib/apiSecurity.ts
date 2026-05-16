import { verifyAuthAndRole } from '@/lib/authMiddleware';
import { NextResponse } from 'next/server';

const ipCache = new Map<string, { count: number, resetTime: number }>();

export type SecurityResult =
    | { authorized: false; response: NextResponse }
    | { authorized: true; user: any; role: any; response: null };

export async function checkSecurity(req: Request, options: {
    roles?: string[],
    requireAuth?: boolean,
    rateLimitCount?: number
} = {}): Promise<SecurityResult> {
    // ── 0. Check for Admin Secret — bypass rate limiting for bulk operations ──
    const adminSecret = req.headers.get('x-admin-secret');
    const expectedSecret = process.env.ADMIN_SECRET;
    const isAdminBypass = !!(adminSecret && expectedSecret && adminSecret === expectedSecret);

    // 1. Rate Limiting (in-memory per container per minute)
    // Superadmin with admin_secret gets 10x rate limit for bulk operations
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const baseLimit = options.rateLimitCount || 20;
    const limit = isAdminBypass ? baseLimit * 10 : baseLimit; // 200 req/min for admin

    const now = Date.now();
    let currentLimit = ipCache.get(ip);
    if (!currentLimit || currentLimit.resetTime < now) {
        currentLimit = { count: 1, resetTime: now + 60000 };
    } else {
        currentLimit.count++;
    }
    ipCache.set(ip, currentLimit);

    if (currentLimit.count > limit) {
        return { authorized: false, response: NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again later.' }, { status: 429 }) };
    }

    // 2. Authentication
    const requireAuth = options.requireAuth !== false;
    let user = null;
    let role = null;

    if (requireAuth) {
        const authData = await verifyAuthAndRole(req);
        user = authData.user;
        role = authData.role;

        if (!user || !role) {
            return { authorized: false, response: NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 }) };
        }

        // 3. Role validation
        if (options.roles && options.roles.length > 0) {
            if (!options.roles.includes(role)) {
                return { authorized: false, response: NextResponse.json({ success: false, error: `Forbidden. Requires one of: ${options.roles.join(', ')}` }, { status: 403 }) };
            }
        }
    }

    return { authorized: true, user, role, response: null };
}

export function validateInput(body: any, requiredFields: string[]) {
    for (const field of requiredFields) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
            return { valid: false, error: `Missing required field: ${field}` };
        }
    }
    return { valid: true };
}

