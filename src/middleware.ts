import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── CORS Configuration ──────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.mededuai.com',
  'https://mededuai.com',
  'https://mededuai.netlify.app',
];

function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  if (origin.startsWith('http://localhost')) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

function getCorsHeaders(origin: string | null | undefined): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// ── Role-based routing helper ────────────────────────
function getHomeUrl(role: string): string {
  if (role === 'superadmin' || role === 'masteradmin') {
    return '/contrl-panl';
  }
  return `/dashboard/${role}`;
}

export function middleware(request: NextRequest) {
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

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/dashboard/student') && role !== 'student' && role !== 'superadmin' && role !== 'admin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname.startsWith('/dashboard/teacher') && role !== 'teacher' && role !== 'superadmin' && role !== 'admin') {
      return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
    }

    if (pathname.startsWith('/dashboard/admin/creator') && role !== 'superadmin') {
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

  // Redirect authenticated users away from login pages
  if ((pathname === '/login' || pathname === '/controlpanel') && role) {
    return NextResponse.redirect(new URL(getHomeUrl(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/login', '/controlpanel'],
};

