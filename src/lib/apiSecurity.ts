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
    // 1. Rate Limiting (in-memory per container per minute)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = options.rateLimitCount || 20; // Default 20 req/min
    
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

        if (!user || user.role !== 'authenticated' || !role) {
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
