'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  const isSignInPage = pathname === '/auth/signin';

  if (isSignInPage) return null; // Don't show footer on sign-in page

  return (
    <footer className="border-t border-gray-200 bg-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} National Population Commission. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link 
              href="/about" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              About Us
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-4 text-center md:text-left">
          <p className="text-xs text-gray-500">
            Asset Management System v1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
