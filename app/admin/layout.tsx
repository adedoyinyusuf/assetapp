'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/auth/roles';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not authenticated, redirect to sign in
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/admin/categories'));
      return;
    }

    // Check if user has admin privileges
    const userRole = session.user.role;
    if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
      // Not authorized for admin pages
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Check authorization again in render
  const userRole = session.user.role;
  if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.ADMIN) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
