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
  // --- ASSET MANAGEMENT MODULE ---
  [UserRole.VIEWER]: ['/dashboard', '/assets', '/reports', '/settings/profile'],
  [UserRole.OPERATOR]: ['/dashboard', '/assets', '/operations', '/reports', '/settings/profile'],
  [UserRole.MANAGER]: ['/dashboard', '/assets', '/operations', '/reports', '/team', '/settings/profile'],
  [UserRole.AUDITOR]: ['/dashboard', '/assets', '/reports', '/admin/audit-logs', '/settings/profile'],

  // --- STOCK VERIFICATION MODULE ---
  [UserRole.VERIFIER]: ['/stock-verification', '/settings/profile'],
  [UserRole.ASSISTANT_VERIFIER]: ['/stock-verification', '/settings/profile'],
  [UserRole.SENIOR_VERIFIER]: ['/stock-verification', '/settings/profile'],
  [UserRole.TEAM_LEADER]: ['/stock-verification', '/settings/profile'],
  [UserRole.QUALITY_CONTROLLER]: ['/stock-verification', '/settings/profile'],
  [UserRole.OBSERVER]: ['/stock-verification', '/settings/profile'],

  // --- ADMIN / MDM MODULE ---
  [UserRole.ADMIN]: ['/dashboard', '/assets', '/operations', '/reports', '/team', '/settings', '/admin', '/mdm', '/stock-verification'], // Admin often needs broader access, but we can restrict if requested. Keeping broad for now as 'System Admin'.
  [UserRole.SUPER_ADMIN]: protectedRoutes,
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

    // Check role-based access
    const userRole = token?.role as UserRole;

    if (!userRole) {
      return new NextResponse('Access Denied', { status: 403 });
    }

    // Determine Role-Based Home URL
    let homeUrl = '/dashboard'; // Default for Asset/Admin roles

    // Stock Roles -> go to Stock Dashboard
    if ([
      UserRole.VERIFIER,
      UserRole.ASSISTANT_VERIFIER,
      UserRole.SENIOR_VERIFIER,
      UserRole.TEAM_LEADER,
      UserRole.QUALITY_CONTROLLER,
      UserRole.OBSERVER
    ].includes(userRole)) {
      homeUrl = '/stock-verification';
    }

    // Redirect to home if already authenticated and trying to access root
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL(homeUrl, req.url));
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
