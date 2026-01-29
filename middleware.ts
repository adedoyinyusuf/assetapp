import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { UserRole } from './lib/auth/roles';

const protectedRoutes = [
  '/dashboard',
  '/assets',
  '/operations',
  '/reports',
  '/team',
  '/settings',
  '/admin',
  '/stock-verification',
];

const roleBasedRoutes: Record<string, string[]> = {
  [UserRole.VIEWER]: [
    '/dashboard',
    '/assets',
    '/reports',
    '/stock-verification',
  ],
  [UserRole.OPERATOR]: [
    '/dashboard',
    '/assets',
    '/operations',
    '/reports',
    '/stock-verification',
  ],
  [UserRole.MANAGER]: [
    '/dashboard',
    '/assets',
    '/operations',
    '/reports',
    '/team',
    '/stock-verification',
  ],
  [UserRole.AUDITOR]: [
    '/dashboard',
    '/assets',
    '/reports',
    '/admin/audit-logs',
    '/stock-verification',
  ],
  [UserRole.ADMIN]: [
    '/dashboard',
    '/assets',
    '/operations',
    '/reports',
    '/team',
    '/settings',
    '/admin',
    '/stock-verification',
  ],
  [UserRole.SUPER_ADMIN]: protectedRoutes, // Access to everything

  // Stock Verification Specific Roles
  [UserRole.TEAM_LEADER]: [
    '/dashboard',
    '/assets',
    '/reports',
    '/team',
    '/stock-verification',
  ],
  [UserRole.SENIOR_VERIFIER]: [
    '/dashboard',
    '/assets',
    '/reports',
    '/stock-verification',
  ],
  [UserRole.VERIFIER]: [
    '/dashboard',
    '/assets',
    '/stock-verification',
  ],
  [UserRole.ASSISTANT_VERIFIER]: [
    '/dashboard',
    '/assets',
    '/stock-verification',
  ],
  [UserRole.QUALITY_CONTROLLER]: [
    '/dashboard',
    '/assets',
    '/reports',
    '/stock-verification',
  ],
  [UserRole.OBSERVER]: [
    '/dashboard',
    '/assets',
    '/reports',
    '/stock-verification',
  ],
};

function isPathAllowed(path: string, allowedPaths: string[]): boolean {
  return allowedPaths.some(allowedPath =>
    path === allowedPath ||
    path.startsWith(`${allowedPath}/`)
  );
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Allow access to root path, auth routes, and public pages without authentication
    if (
      pathname === '/' ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/about') ||
      pathname.startsWith('/contact') ||
      pathname.startsWith('/help')
    ) {
      return NextResponse.next();
    }

    // Redirect to dashboard if already authenticated and trying to access root
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check role-based access
    const userRole = token?.role as UserRole;

    if (!userRole) {
      return new NextResponse('Access Denied', { status: 403 });
    }

    // Super Admin has access to everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return NextResponse.next();
    }

    // Get allowed routes for the user's role
    const allowedRoutes = roleBasedRoutes[userRole] || [];

    // Check if the current path is allowed for the user's role
    const isAllowed = isPathAllowed(pathname, allowedRoutes);

    if (!isAllowed) {
      return NextResponse.rewrite(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, icons, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};
