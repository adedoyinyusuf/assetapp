import { type AuthOptions } from "next-auth";
import { compare } from "bcryptjs";
import { Pool } from "pg";
import { UserRole } from "./roles";

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'asset_mgt_db',
  password: '11220099',
  port: 5432,
});

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password');
          return null;
        }

        let client;
        try {
          client = await pool.connect();
          console.log('Attempting to authenticate user:', credentials.email);
          
          // Get user with role and permissions
          const userRes = await client.query(
            `SELECT 
              u.id, 
              u.email, 
              u.first_name as "firstName", 
              u.last_name as "lastName",
              u.hashed_password,
              r.name as role,
              u.is_active as "isActive",
              u.last_login as "lastLogin"
            FROM users u
            JOIN user_roles r ON u.role_id = r.id
            WHERE u.email = $1`,
            [credentials.email]
          );

          if (userRes.rows.length === 0) {
            console.log('No user found with email:', credentials.email);
            return null;
          }

          const user = userRes.rows[0];
          
          if (!user.isActive) {
            console.log('User is not active:', credentials.email);
            return null;
          }

          // For testing purposes, compare with plain text 'password'
          // In production, use bcrypt compare
          let passwordValid = false;
          if (credentials.password === 'password') {
            passwordValid = true;
          } else {
            try {
              passwordValid = await compare(credentials.password, user.hashed_password);
            } catch (error) {
              console.log('Password comparison error:', error);
              passwordValid = false;
            }
          }

          if (!passwordValid) {
            console.log('Authentication failed - invalid password for user:', credentials.email);
            return null;
          }

          // Get user permissions
          const permissionsRes = await client.query(
            `SELECT p.name
             FROM role_permissions rp
             JOIN permissions p ON rp.permission_id = p.id
             WHERE rp.role_id = $1`,
            [user.id]
          );

          const permissions = permissionsRes.rows.map(row => row.name);

          // Update last login time
          await client.query(
            `UPDATE users SET last_login = NOW() WHERE id = $1`,
            [user.id]
          );

          console.log('User authenticated successfully:', user.email);

          // Map database role to UserRole enum
          const roleMap: { [key: string]: UserRole } = {
            'VIEWER': UserRole.VIEWER,
            'OPERATOR': UserRole.OPERATOR,
            'MANAGER': UserRole.MANAGER,
            'ADMIN': UserRole.ADMIN,
            'SUPER_ADMIN': UserRole.SUPER_ADMIN
          };

          const userRole = roleMap[user.role] || UserRole.VIEWER;

          return {
            id: user.id.toString(),
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: userRole,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            permissions: permissions,
            tasks: [], // Add empty tasks array to satisfy User interface
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        } finally {
          if (client) client.release();
        }
      },
    },
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
