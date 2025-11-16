'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from './roles';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date | null;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  isAuthorized: (requiredRole?: UserRole) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: UpdateUserData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (!session && !['/auth/signin', '/auth/error'].includes(pathname)) {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Update user state when session changes
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName || null,
        lastName: session.user.lastName || null,
        role: session.user.role,
        permissions: session.user.permissions || [],
        isActive: session.user.isActive,
        lastLogin: session.user.lastLogin ? new Date(session.user.lastLogin) : null,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Check if the user has the required permission
    return user.permissions?.includes(`${action.toUpperCase()}_${resource.toUpperCase()}`) || false;
  };

  const isAuthorized = (requiredRole?: UserRole): boolean => {
    if (!session?.user) return false;
    if (!requiredRole) return true; // No role required
    
    const roleHierarchy = Object.values(UserRole);
    const userLevel = roleHierarchy.indexOf(session.user.role as UserRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    
    return userLevel >= requiredLevel;
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Refresh the session to get the latest user data
      await updateSession();
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      setUser(null);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (data: UpdateUserData) => {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const updatedUser = await response.json();
      
      // Update the session with the new user data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          firstName: data.firstName || session?.user?.firstName,
          lastName: data.lastName || session?.user?.lastName,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      await updateSession();
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading: status === 'loading' || loading,
    hasPermission,
    isAuthorized,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: [string, string]; // [resource, action]
};

export function ProtectedRoute({ children, requiredRole, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, isAuthorized, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    } else if (!loading && user) {
      // Check role-based access
      if (requiredRole && !isAuthorized(requiredRole)) {
        router.push('/unauthorized');
        return;
      }

      // Check permission-based access
      if (requiredPermission && !hasPermission(requiredPermission[0], requiredPermission[1])) {
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredRole, requiredPermission, router, isAuthorized, hasPermission]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
