import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from './lib/auth/roles';

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
  }
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/error',
  '/api/auth',
  '/_next',
  '/favicon.ico',
];

// Define role-based route access
const roleBasedRoutes: Record<string, string[]> = {
  [UserRole.VIEWER]: [
    '/assets',
    '/reports',
  ],
  [UserRole.OPERATOR]: [
    '/assets',
    '/operations',
    '/reports',
  ],
  [UserRole.MANAGER]: [
    '/assets',
    '/operations',
    '/reports',
    '/team',
  ],
  [UserRole.ADMIN]: [
    '/assets',
    '/operations',
    '/reports',
    '/team',
    '/settings',
  ],
  [UserRole.SUPER_ADMIN]: ['/'], // Access to everything
};

// Define admin-only routes
const adminRoutes = ['/settings', '/users', '/audit-logs'];

// Check if the path starts with any of the allowed paths
function isPathAllowed(path: string, allowedPaths: string[]): boolean {
  return allowedPaths.some(allowedPath => 
    path === allowedPath || 
    path.startsWith(`${allowedPath}/`)
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (isPathAllowed(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  // Get the token from the request
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // If no token and not a public route, redirect to signin
  if (!token) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check role-based access
  const userRole = token.role as UserRole;
  
  // If user has no role, deny access
  if (!userRole) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // Get allowed routes for the user's role
  const allowedRoutes = roleBasedRoutes[userRole] || [];
  
  // Check if the current path is allowed for the user's role
  const isAllowed = isPathAllowed(pathname, allowedRoutes);
  
  if (!isAllowed) {
    // If not allowed, redirect to dashboard or show an error
    return new NextResponse('Access Denied', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
