import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from './auth/roles';

// This file contains the NextAuth configuration for the application.
// It sets up the authentication options including providers, callbacks, and session handling.

// Define the auth options for NextAuth
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
    lastLogin: Date | null;
    permissions: string[];
  }
}

// Define the auth options for NextAuth
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt', // Use JWT strategy for session management
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        // Check if user exists and is active
        if (!user || !user.isActive) {
          throw new Error('Invalid email or password');
        }

        // Check if password is correct
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Return user data to be stored in the JWT token
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          permissions: user.role.permissions.map((p) => p.permission.name),
        };
      },
    }),
  ],
  callbacks: {
    // JWT callback is called whenever a JWT is created or updated
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin ?? null,
          permissions: user.permissions ?? [],
        };
      }
      return token;
    },
    // Session callback is called whenever a session is checked
    async session({ session, token }) {
      // Add user data to the session
      if (token) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id,
            email: token.email,
            firstName: token.firstName,
            lastName: token.lastName,
            role: token.role,
            isActive: token.isActive,
            lastLogin: token.lastLogin,
            permissions: token.permissions,
          },
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Helper function to check if a user has a specific role
export const hasRole = (user: any, requiredRole: UserRole): boolean => {
  if (!user?.role) return false;
  
  const roleHierarchy = Object.values(UserRole);
  const userLevel = roleHierarchy.indexOf(user.role as UserRole);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  
  return userLevel >= requiredLevel;
};

// Helper function to check if a user has a specific permission
export const hasPermission = (user: any, resource: string, action: string): boolean => {
  if (!user?.permissions) return false;
  
  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // Check if the user has the required permission
  return user.permissions.includes(`${action.toUpperCase()}_${resource.toUpperCase()}`);
};
