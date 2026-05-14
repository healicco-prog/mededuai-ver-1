import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── CORS Configuration ──────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.mededuai.com',
  'https://mededuai.com',
  'https://mededuai.netlify.app',
  'https://www.pgmentor.in',
  'https://pgmentor.in',
];

function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  if (origin.startsWith('http://localhost')) return true;
  if (origin.endsWith('.netlify.app')) return true;
  if (origin.endsWith('.mededuai.com') || origin === 'https://mededuai.com') return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function getCorsHeaders(origin: string | null | undefined): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-admin-secret',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// ── Role-based routing helper ────────────────────────
function getHomeUrl(role: string): string {
  // All users go to their dashboard — Control Panel is accessed from sidebar
  const map: Record<string, string> = {
    superadmin: '/dashboard/admin',
    masteradmin: '/dashboard/admin',
    instadmin: '/dashboard/admin',
    deptadmin: '/dashboard/admin',
    teacher: '/dashboard/teacher',
    student: '/dashboard/student',
  };
  return map[role] || `/dashboard/${role}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // ── Handle CORS for API routes ─────────────────────
  if (pathname.startsWith('/api/')) {
    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: getCorsHeaders(origin),
      });
    }

    // For all other API requests, add CORS headers to response
    const response = NextResponse.next();
    const corsHeaders = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // ── Existing auth / RBAC middleware ────────────────
  const roleCookie = request.cookies.get('role');
  const role = roleCookie?.value;

  // ── Root path: Always show landing page ───────────
  // Let all users (authenticated or not) see the landing/home page.
  // Authenticated users can navigate to their dashboard via sidebar links.
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/dashboard/student') && role !== 'student' && role !== 'superadmin' && role !== 'masteradmin' && role !== 'admin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname.startsWith('/dashboard/teacher') && role !== 'teacher' && role !== 'superadmin' && role !== 'masteradmin' && role !== 'admin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname.startsWith('/dashboard/admin/creator') && role !== 'superadmin' && role !== 'masteradmin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname.startsWith('/dashboard/admin') && role !== 'admin' && role !== 'superadmin' && role !== 'masteradmin' && role !== 'deptadmin' && role !== 'instadmin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname.startsWith('/dashboard/superadmin') && role !== 'superadmin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }
  }

  // ── Explicitly allow Control Panel (login handled client-side within the page) ──
  if (pathname === '/contrl-panl' || pathname.startsWith('/contrl-panl/')) {
    return NextResponse.next();
  }

  // Let all other authenticated users access pages not explicitly matched above
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/api/:path*',
    '/dashboard/:path*',
    '/contrl-panl',
    '/contrl-panl/:path*',
    '/login',
    '/signup',
  ],
};

// Backwards-compat alias (middleware.ts still runs in Next.js 16 with deprecation warning)
export { proxy as middleware };
