import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { type AuthOptions } from "next-auth";
import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "./roles";

declare module "next-auth" {
  interface User extends DefaultUser {
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    isActive: boolean;
    lastLogin: Date | null;
    permissions: string[];
  }
  
  interface Session extends DefaultSession {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    firstName?: string | null;
    lastName?: string | null;
    role?: UserRole;
    isActive?: boolean;
    lastLogin?: Date | null;
    permissions?: string[];
  }
}

interface UserWithPermissions {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: {
    name: UserRole;
    permissions: {
      permission: {
        name: string;
      }
    }[];
  };
  isActive: boolean;
  lastLogin: Date | null;
  password: string;
}

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }) as UserWithPermissions | null;

          if (!user || !user.isActive) {
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Return user data for the session
          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name as UserRole,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            permissions: user.role.permissions.map((p: { permission: { name: string } }) => p.permission.name),
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          permissions: user.permissions,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string | null,
          lastName: token.lastName as string | null,
          role: token.role as UserRole,
          isActive: token.isActive as boolean,
          lastLogin: token.lastLogin as Date | null,
          permissions: token.permissions as string[],
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
