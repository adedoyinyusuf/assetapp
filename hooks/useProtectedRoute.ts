'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

export function useProtectedRoute(requiredRole?: string, requiredPermission?: [string, string]) {
  const { user, loading, isAuthorized, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Redirect to sign in if not authenticated
    if (!user) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
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
  }, [user, loading, requiredRole, requiredPermission, router, pathname, isAuthorized, hasPermission]);

  return { user, loading };
}
