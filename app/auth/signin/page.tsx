'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
// ... imports

// ... JSX

import { SignInAnimation } from './SignInAnimation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setCurrentScene((prev: number) => (prev + 1) % 4);
    }, 5000);

    return () => {
      clearInterval(animationInterval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);

      // Check user role before redirecting
      // We need to fetch the session directly because the hook state might not have updated yet
      // Dynamically import getSession to avoid it being called on server side during build if mixed
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      const userRole = session?.user?.role as string | undefined;

      // Check if trying to access admin routes without permission
      const isAdminRoute = callbackUrl.includes('/admin');
      const hasAdminAccess = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

      if (isAdminRoute && !hasAdminAccess) {
        // Redirect non-admins to home instead of the restricted page
        router.push('/');
      } else if (callbackUrl === '/' || !callbackUrl) {
        // Determine redirection based on role for default login
        if (['VERIFIER', 'ASSISTANT_VERIFIER', 'SENIOR_VERIFIER', 'TEAM_LEADER', 'QUALITY_CONTROLLER', 'OBSERVER', 'AUDITOR_VERIFIER'].includes(userRole as string)) {
          router.push('/stock-verification');
        } else if (['MDM_ADMIN', 'MDM_OFFICER', 'MDM_AUDITOR'].includes(userRole as string)) {
          router.push('/mdm');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-50 p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row relative">
        {/* Home Link */}
        <Link
          href="/"
          className="absolute top-4 left-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors z-10"
        >
          ← Back to Home
        </Link>
        {/* Left Side - Animations */}
        <div className="hidden md:block md:w-1/2 bg-white relative overflow-hidden">
          <div className="relative w-full h-full">
            <SignInAnimation currentScene={currentScene} />
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                Welcome Back
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to manage your assets
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <Label htmlFor="email-address">Email address</Label>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <Loader2 className="h-5 w-5 text-green-500 group-hover:text-green-400 animate-spin" />
                    ) : (
                      <LogIn className="h-5 w-5 text-green-500 group-hover:text-green-400" />
                    )}
                  </span>
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Need help?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Contact the system administrator if you need assistance with your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
