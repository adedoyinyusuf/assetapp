'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </SessionProvider>
  );
}
