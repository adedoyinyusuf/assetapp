'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        // Clear any client-side state here if needed
        
        // Sign out from NextAuth
        await signOut({ redirect: false });
        
        // Redirect to home page after sign out
        router.push('/');
      } catch (error) {
        console.error('Error during sign out:', error);
        router.push('/auth/error?error=SignOutFailed');
      }
    };

    performSignOut();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Signing Out</h1>
        <p className="text-gray-600">Please wait while we sign you out...</p>
      </div>
    </div>
  );
}
