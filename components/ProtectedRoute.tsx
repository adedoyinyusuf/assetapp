'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Loader2 } from 'lucide-react';

import { UserRole } from '@/lib/auth/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: [string, string];
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, loading, isAuthorized, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect to sign in if not authenticated
    if (!user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Check role-based access
    if (requiredRole && !isAuthorized(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    // Check permission-based access
    if (requiredPermission && !hasPermission(requiredPermission[0], requiredPermission[1])) {
      router.push('/unauthorized');
    }
  }, [user, loading, requiredRole, requiredPermission, router, isAuthorized, hasPermission]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-gray-600">Loading user session...</p>
        </div>
      </div>
    );
  }

  // If we have a required role or permission and the user doesn't have it,
  // show a loading state while the redirect happens
  if (
    (requiredRole && !isAuthorized(requiredRole)) ||
    (requiredPermission && !hasPermission(requiredPermission[0], requiredPermission[1]))
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
