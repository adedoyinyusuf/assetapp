'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const errorMessages: Record<string, string> = {
  Signin: 'Try signing in with a different account.',
  OAuthSignin: 'Error signing in with the selected provider.',
  OAuthCallback: 'Error handling the OAuth callback.',
  OAuthCreateAccount: 'Error creating a new account.',
  EmailCreateAccount: 'Error creating a new account with email.',
  Callback: 'Error in the authentication callback.',
  OAuthAccountNotLinked:
    'To confirm your identity, sign in with the same account you used originally.',
  EmailSignin: 'Error sending the sign-in email.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'Unable to sign in.',
  SignOutFailed: 'There was an error signing out. Please try again.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                Return to Sign In
              </Link>
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="link" asChild>
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
