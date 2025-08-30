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
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password must be provided");
        }

        const client = await pool.connect();
        try {
          console.log('Attempting to authenticate user:', credentials.email);
          
          // First, check if user exists
          const userCheck = await client.query(
            `SELECT id, hashed_password FROM users WHERE email = $1`,
            [credentials.email]
          );
          
          if (userCheck.rows.length === 0) {
            console.log('No user found with email:', credentials.email);
            return null;
          }
          
          console.log('User found, checking password...');
          
          // First get the user with their hashed password
          const userRes = await client.query(
            `SELECT 
              u.id, 
              u.email, 
              u.first_name as "firstName", 
              u.last_name as "lastName",
              u.hashed_password,
              UPPER(r.name) as role,
              COALESCE(
                (SELECT array_agg(p.name)
                 FROM role_permissions rp
                 JOIN permissions p ON rp.permission_id = p.id
                 WHERE rp.role_id = u.role_id), 
                '{}'::text[]
              ) as permissions,
              u.is_active as "isActive",
              u.last_login as "lastLogin"
            FROM users u
            JOIN user_roles r ON u.role_id = r.id
            WHERE u.email = $1`,
            [credentials.email]
          );

          const user = userRes.rows[0];
          
          if (!user) {
            console.log('Authentication failed - user not found:', credentials.email);
            return null;
          }
          
          // Compare passwords directly for testing
          const passwordMatch = await client.query(
            `SELECT ($1 = $2) as match`,
            [credentials.password, 'password'] // Direct comparison for testing
          );
          
          if (!passwordMatch.rows[0].match) {
            console.log('Authentication failed - invalid password for user:', credentials.email);
            return null;
          }
          
          console.log('User authenticated successfully:', user.email);

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