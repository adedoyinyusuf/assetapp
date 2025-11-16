import { type AuthOptions } from "next-auth";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma.server";
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
  id: number;  // Changed from string to number to match Prisma schema
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
  hashedPassword: string;
}

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

          // Verify password with bcrypt
          const isPasswordValid = await compare(credentials.password, user.hashedPassword);
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          // Update last login time
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Convert ID to string for NextAuth compatibility
          const userId = user.id.toString();
          
          // Normalize role name and validate against UserRole enum
          const roleName = user.role.name.replace(/[\s-]+/g, '_').toUpperCase();
          const normalizedRole = roleName === 'SUPERADMIN' ? UserRole.SUPER_ADMIN : roleName as UserRole;
          const validRole = Object.values(UserRole).find(r => r === normalizedRole) as UserRole;
          
          if (!validRole) {
            console.error('Invalid role:', user.role.name, 'Normalized to:', roleName, 'Valid roles:', Object.values(UserRole));
            throw new Error('Invalid user role');
          }
          
          // Return user data for the session
          return {
            id: userId,
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: validRole, // Use the validated role
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            permissions: user.role.permissions.map((p: { permission: { name: string } }) => p.permission.name),
            tasks: [], // Add empty tasks array to satisfy User interface
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
        // Ensure role is properly typed and normalized
        const roleName = (user.role as unknown as string).replace(/[\s-]+/g, '_').toUpperCase();
        const normalizedRole = roleName === 'SUPERADMIN' ? UserRole.SUPER_ADMIN : roleName as UserRole;
        const validRole = Object.values(UserRole).find(r => r === normalizedRole);
        
        if (!validRole) {
          console.error('Invalid role in JWT callback:', user.role);
          throw new Error('Invalid user role');
        }

        return {
          ...token,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: validRole,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          permissions: user.permissions,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Ensure role is properly typed
        const roleName = (token.role as unknown as string)?.replace(/[\s-]+/g, '_').toUpperCase();
        const normalizedRole = roleName === 'SUPERADMIN' ? UserRole.SUPER_ADMIN : roleName as UserRole;
        const validRole = Object.values(UserRole).find(r => r === normalizedRole);
        
        if (!validRole) {
          console.error('Invalid role in session callback:', token.role);
          throw new Error('Invalid user role in session');
        }

        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string | null,
          lastName: token.lastName as string | null,
          role: validRole,
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
