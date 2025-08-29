import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
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
          });

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
            role: user.role.name,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            permissions: user.role.permissions.map(p => p.permission.name),
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
          role: user.role,
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
          role: token.role as string,
          isActive: token.isActive as boolean,
          lastLogin: token.lastLogin as Date | null,
          permissions: token.permissions as string[],
        };
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
