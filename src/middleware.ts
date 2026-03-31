import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper: get the correct home URL for a role
function getHomeUrl(role: string): string {
  if (role === 'superadmin' || role === 'masteradmin') {
    return '/contrl-panl';
  }
  return `/dashboard/${role}`;
}

export function middleware(request: NextRequest) {
  // Mock Authentication for testing
  // We use a 'role' cookie to simulate the RBAC login session
  const roleCookie = request.cookies.get('role');
  const role = roleCookie?.value;

  const { pathname } = request.nextUrl;

  // Protect all /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!role) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based routing validation
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
  matcher: ['/dashboard/:path*', '/login', '/controlpanel'],
};
