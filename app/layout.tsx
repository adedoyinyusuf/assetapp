import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Header } from '@/components/Header'
import { type ReactNode, Fragment } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Asset Management Solution',
  description: 'Manage your assets efficiently',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const content = (
    <Fragment>
      <div className="relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </Fragment>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers children={content} />
      </body>
    </html>
  )
}
