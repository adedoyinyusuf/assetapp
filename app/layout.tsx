import './globals.css';
import './stock-verification/enhanced-styles.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { type ReactNode } from 'react';
import { headers } from 'next/headers';

// Load Inter font with optimized settings
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'National Population Commission - Asset Management',
    template: '%s | NPC Asset Management',
  },
  description: 'Comprehensive asset management solution for National Population Commission',
  keywords: [
    'Asset Management',
    'National Population Commission',
    'Nigeria',
    'Government Assets',
    'Asset Tracking',
  ],
  authors: [{ name: 'National Population Commission' }],
  creator: 'NPC IT Department',
  publisher: 'National Population Commission',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'NPC Asset Management',
    title: 'National Population Commission - Asset Management',
    description: 'Comprehensive asset management solution for National Population Commission',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NPC Asset Management',
    description: 'Comprehensive asset management solution for National Population Commission',
    creator: '@npopc_ng',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NPC Assets',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
};

function AuthWrapper({ children }: { children: ReactNode }) {
  const headersList = headers();
  const pathname = headersList.get('x-invoke-path') || '';
  const isAuthPage = pathname.startsWith('/auth') || pathname.startsWith('/api/auth');

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground flex flex-col`}>
        <Providers>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}
