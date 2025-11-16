'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence, cubicBezier } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  containerClassName?: string;
  pageTitle?: string;
  pageDescription?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { 
    duration: 0.3, 
    ease: cubicBezier(0.4, 0, 0.2, 1)
  }
};

export function AppLayout({
  children,
  className,
  showHeader = true,
  showFooter = true,
  containerClassName,
  pageTitle,
  pageDescription,
  breadcrumbs
}: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={cn(
      'min-h-screen bg-background text-foreground',
      'selection:bg-primary/20 selection:text-primary-foreground',
      className
    )}>
      {/* Header */}
      {showHeader && (
        <Header />
      )}

      {/* Page Title & Breadcrumbs */}
      {(pageTitle || breadcrumbs) && (
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className={cn(
            'container mx-auto px-4 py-6',
            containerClassName
          )}>
            {breadcrumbs && (
              <nav className="mb-4" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center">
                      {index > 0 && (
                        <span className="mx-2 text-muted-foreground/50">/</span>
                      )}
                      {crumb.href ? (
                        <a 
                          href={crumb.href}
                          className="hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">
                          {crumb.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            
            {pageTitle && (
              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold tracking-tight"
                >
                  {pageTitle}
                </motion.h1>
                {pageDescription && (
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-muted-foreground max-w-3xl"
                  >
                    {pageDescription}
                  </motion.p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            {...pageTransition}
            className={cn(
              'container mx-auto px-4 py-8',
              containerClassName
            )}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {showFooter && (
        <Footer />
      )}

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" 
             style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-success/3 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '4s' }} />
      </div>
    </div>
  );
}

// Specialized layout variants for different page types
export function DashboardLayout({ children, ...props }: Omit<AppLayoutProps, 'containerClassName'>) {
  return (
    <AppLayout
      containerClassName="max-w-7xl"
      {...props}
    >
      {children}
    </AppLayout>
  );
}

export function FormLayout({ children, ...props }: Omit<AppLayoutProps, 'containerClassName'>) {
  return (
    <AppLayout
      containerClassName="max-w-2xl"
      {...props}
    >
      {children}
    </AppLayout>
  );
}

export function WideLayout({ children, ...props }: Omit<AppLayoutProps, 'containerClassName'>) {
  return (
    <AppLayout
      containerClassName="max-w-none px-8"
      {...props}
    >
      {children}
    </AppLayout>
  );
}

// Error page layout
export function ErrorLayout({ 
  children, 
  title = "Something went wrong",
  description = "We're experiencing technical difficulties. Please try again later."
}: { 
  children?: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <AppLayout 
      showHeader={false} 
      showFooter={false}
      className="flex items-center justify-center"
    >
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}