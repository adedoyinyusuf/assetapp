'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Unauthorized Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don&apos;t have permission to access this page.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Your account doesn&apos;t have the required permissions to view this page.
              Please contact your system administrator if you believe this is an error.
            </p>

            <div className="mt-6">
              <Button
                onClick={() => router.back()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.push('/')}
                className="text-sm text-green-600 hover:text-green-500"
              >
                Return to home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
