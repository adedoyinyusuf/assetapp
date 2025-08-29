import NextAuth from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-options';

// This is the main auth handler for API routes
const handler = NextAuth(authOptions) as any;

// Export the handler for API routes
export { handler as GET, handler as POST };

// For middleware, we'll use the getToken function directly from next-auth/jwt
// This is the recommended approach for Next.js 14 with App Router
export { getToken } from 'next-auth/jwt';
