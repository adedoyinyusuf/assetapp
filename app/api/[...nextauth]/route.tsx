import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";
import { UserRole } from '@/lib/auth/roles';
import type { User } from 'next-auth';

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT ?? "5432"),
});

// Define your NextAuth options
const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password must be provided");
        }

        const client = await pool.connect();
        try {
          const res = await client.query(
            `SELECT 
              id, 
              email, 
              first_name as "firstName", 
              last_name as "lastName",
              UPPER(role) as role,
              permissions,
              is_active as "isActive",
              last_login as "lastLogin"
            FROM users 
            WHERE username = $1 
            AND password = crypt($2, password)`,
            [credentials.username, credentials.password]
          );

          const user = res.rows[0];

          if (user) {
            // Validate that the role from DB matches our enum
            const userRole = Object.values(UserRole).includes(user.role as UserRole) 
              ? user.role as UserRole 
              : UserRole.VIEWER; // fallback to VIEWER if role is invalid

            return {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: userRole,
              permissions: user.permissions || [],
              isActive: user.isActive,
              lastLogin: user.lastLogin,
              name: `${user.firstName} ${user.lastName}`.trim() || undefined
            };
          }
          return null;
        } finally {
          client.release();
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Cast user to our User type
        const typedUser = user as User;
        
        token.id = typedUser.id;
        token.email = typedUser.email;
        token.firstName = typedUser.firstName;
        token.lastName = typedUser.lastName;
        token.role = typedUser.role as UserRole;
        token.permissions = typedUser.permissions;
        token.isActive = typedUser.isActive;
        token.lastLogin = typedUser.lastLogin;
        token.name = typedUser.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure we have a valid role or default to VIEWER
      const role = token.role && Object.values(UserRole).includes(token.role as UserRole)
        ? token.role as UserRole
        : UserRole.VIEWER;

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id || '',
          email: token.email || '',
          firstName: token.firstName || null,
          lastName: token.lastName || null,
          role: role,
          permissions: token.permissions || [],
          isActive: token.isActive || false,
          lastLogin: token.lastLogin || null,
          name: token.name || null,
        }
      };
    },
  },
};

const handler = NextAuth(authOptions);

// Only export the handler as GET and POST for Next.js route
export { handler as GET, handler as POST };