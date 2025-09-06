// lib/auth/auth-options.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import { compare } from "bcryptjs";
import { 
  UserRole,
  getPermissionsForRole,
  getTasksForRole
} from "./auth/roles";

// --------------------
// Extend NextAuth types
// --------------------
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
    lastLogin: Date | null;
    permissions: string[];
    tasks: string[];
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string | null;
    role?: UserRole;
    firstName?: string | null;
    lastName?: string | null;
    isActive?: boolean;
    lastLogin?: Date | null;
    permissions?: string[];
    tasks?: string[];
  }
}

// --------------------
// NextAuth Config
// --------------------
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { role: true },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        const role = (user.role?.name as UserRole) ?? UserRole.VIEWER;

        return {
          id: user.id.toString(),
          email: user.email,
          name:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email.split("@")[0],
          role,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          lastLogin: user.lastLogin ?? new Date(),
          permissions: getPermissionsForRole(role),
          tasks: getTasksForRole(role),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isActive = user.isActive;
        token.lastLogin = user.lastLogin ?? new Date();
        token.permissions = user.permissions ?? [];
        token.tasks = user.tasks ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // Ensure required fields are present
        if (token.id) session.user.id = token.id;
        if (token.email) session.user.email = token.email;
        if (token.name !== undefined) session.user.name = token.name;
        
        // Handle role with type assertion
        session.user.role = (token.role || "USER") as UserRole;
        
        // Handle other optional fields
        if (token.firstName !== undefined) session.user.firstName = token.firstName;
        if (token.lastName !== undefined) session.user.lastName = token.lastName;
        if (token.isActive !== undefined) session.user.isActive = token.isActive;
        if (token.lastLogin !== undefined) session.user.lastLogin = token.lastLogin;
        
        // Ensure arrays are never null/undefined
        session.user.permissions = token.permissions || [];
        session.user.tasks = token.tasks || [];
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
