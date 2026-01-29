import './globals.css';
import './stock-verification/enhanced-styles.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { type ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';


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

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
