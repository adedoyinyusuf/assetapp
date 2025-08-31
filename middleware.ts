import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { UserRole } from './lib/auth/roles';

const protectedRoutes = [
  '/dashboard',
  '/assets',
  '/operations',
  '/reports',
  '/team',
  '/settings'
];

const roleBasedRoutes: Record<string, string[]> = {
  [UserRole.VIEWER]: [
    '/dashboard',
    '/assets',
    '/reports',
  ],
  [UserRole.OPERATOR]: [
    '/dashboard',
    '/assets',
    '/operations',
    '/reports',
  ],
  [UserRole.MANAGER]: [
    '/dashboard',
    '/assets',
    '/operations',
    '/reports',
    '/team',
  ],
  [UserRole.ADMIN]: [
    '/dashboard',
    '/assets',
    '/operations',
    '/reports',
    '/team',
    '/settings',
  ],
  [UserRole.SUPER_ADMIN]: protectedRoutes, // Access to everything
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

    // Allow access to root path and auth routes without authentication
    if (pathname === '/' || pathname.startsWith('/auth/')) {
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

    // Get allowed routes for the user's role
    const allowedRoutes = roleBasedRoutes[userRole] || [];
    
    // Check if the current path is allowed for the user's role
    const isAllowed = isPathAllowed(pathname, allowedRoutes);
    
    if (!isAllowed) {
      return new NextResponse('Access Denied', { status: 403 });
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
    '/dashboard/:path*',
    '/assets/:path*',
    '/operations/:path*',
    '/reports/:path*',
    '/team/:path*',
    '/settings/:path*',
  ]
};
