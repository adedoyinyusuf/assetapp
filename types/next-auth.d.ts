import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from '@/lib/auth/roles';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: UserRole;
      permissions: string[];
      isActive: boolean;
      lastLogin: Date | null;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user types
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    permissions: string[];
    isActive: boolean;
    lastLogin: Date | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id?: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: UserRole;
    permissions?: string[];
    isActive?: boolean;
    lastLogin?: Date | null;
    name?: string | null;
  }
}
