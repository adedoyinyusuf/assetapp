'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Menu, X, FileText, BarChart2, Download, Home, Package, Move, Plus } from 'lucide-react';
import { UserRole } from '@/lib/auth/roles';
import { Action, Resource, can } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';
import { MaterialButton } from '@/components/ui/material-button';

interface MenuItem {
  href: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  requiredPermission?: {
    action: Action;
    resource: Resource;
  };
  allowedRoles?: UserRole[];
  isExternal?: boolean;
  onClick?: () => void;
}

export function MaterialHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole || UserRole.VIEWER;

  // Add shadow when scrolling
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const hasPermission = (action: Action, resource: Resource): boolean => {
    if (!userRole) return false;
    return can(userRole, action, resource);
  };

  const isAllowed = (item: MenuItem): boolean => {
    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
      return false;
    }
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission.action, item.requiredPermission.resource);
    }
    return true;
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const renderNavigationItem = (item: MenuItem, isMobile = false) => {
    if (!isAllowed(item)) return null;

    const isActive = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href));

    const linkContent = (
      <>
        {item.icon && (
          <span className={cn(
            'flex-shrink-0 transition-all duration-medium2',
            isMobile ? 'mr-3' : 'mr-2',
            isActive ? 'text-md-on-secondary-container' : 'text-md-on-surface-variant'
          )}>
            {item.icon}
          </span>
        )}
        <span className="text-label-large font-medium">{item.title}</span>
      </>
    );

    const className = cn(
      'relative flex items-center transition-all duration-medium2 ease-emphasis-decelerate',
      'rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary',
      isMobile
        ? 'w-full px-4 py-3 text-left'
        : 'px-4 py-2.5',
      isActive
        ? 'bg-md-secondary-container text-md-on-secondary-container'
        : 'text-md-on-surface hover:bg-md-on-surface/[0.08] active:bg-md-on-surface/[0.12]'
    );

    if (item.onClick) {
      return (
        <button
          key={item.href}
          onClick={item.onClick}
          className={className}
        >
          {linkContent}
        </button>
      );
    }

    if (item.isExternal) {
      return (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {linkContent}
          <span className="ml-2 text-xs opacity-60">↗</span>
        </a>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={className}
      >
        {linkContent}
        {isActive && !isMobile && (
          <motion.div
            className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-md-primary rounded-full"
            layoutId="activeIndicator"
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </Link>
    );
  };

  // Define menu items with required permissions
  const mainMenuItems: MenuItem[] = [
    {
      href: '/',
      title: 'Home',
      description: 'Return to the home page',
      icon: <Home className="h-5 w-5" />
    },
    {
      href: '/about',
      title: 'About',
      description: 'Learn about our system'
    },
  ];

  const dashboardItem: MenuItem = {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'View your dashboard',
    icon: <BarChart2 className="h-5 w-5" />,
    requiredPermission: { action: Action.READ, resource: Resource.DASHBOARD }
  };

  const assetOperations: MenuItem[] = [
    {
      href: '/assets',
      title: 'Manage Assets',
      description: 'View and manage all assets in the system',
      icon: <Package className="h-5 w-5" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET }
    },
    {
      href: '/asset-movement',
      title: 'Asset Movement',
      description: 'Track and manage asset movements',
      icon: <Move className="h-5 w-5" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET_MOVEMENT }
    },
  ];

  const reports: MenuItem[] = [
    {
      href: '/reports',
      title: 'Asset Reports',
      description: 'Generate and view asset reports',
      icon: <FileText className="h-5 w-5" />,
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
    {
      href: '/reports/export',
      title: 'Export Data',
      description: 'Export asset data in various formats',
      icon: <Download className="h-5 w-5" />,
      requiredPermission: { action: Action.EXPORT, resource: Resource.REPORT }
    }
  ];

  const navigationItems = [
    ...mainMenuItems,
    ...(hasPermission(Action.READ, Resource.DASHBOARD) ? [dashboardItem] : []),
    ...assetOperations.filter(isAllowed),
    ...reports.filter(isAllowed)
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-medium2 ease-emphasis-decelerate',
        'bg-md-surface/90 backdrop-blur-md border-b',
        scrolled ? 'border-md-outline-variant shadow-elevation-2' : 'border-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <span className="text-title-large font-medium bg-gradient-to-r from-md-primary to-md-tertiary bg-clip-text text-transparent transition-all duration-medium2 group-hover:scale-105">
                AssetHub
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => renderNavigationItem(item))}

              {/* Demo Link */}
              <Link
                href="/material-demo"
                className="px-4 py-2.5 text-label-large font-medium text-md-tertiary hover:bg-md-tertiary/[0.08] rounded-xl transition-all duration-medium2"
              >
                Material 3 Demo
              </Link>
            </nav>

            {/* User Menu / Sign In */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-body-medium font-medium text-md-on-surface">
                      {session.user?.name || session.user?.email}
                    </p>
                    <p className="text-body-small text-md-on-surface-variant capitalize">
                      {userRole.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <MaterialButton
                    variant="outlined"
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </MaterialButton>
                </div>
              ) : (
                <MaterialButton variant="filled" size="sm" asChild>
                  <Link href="/auth/signin">
                    Sign In
                  </Link>
                </MaterialButton>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <MaterialButton
              variant="text"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              className="text-md-on-surface"
            >
              <span className="sr-only">
                {mobileMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </MaterialButton>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden bg-md-surface-container border-t border-md-outline-variant"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navigationItems.map((item) => renderNavigationItem(item, true))}

            {/* Demo Link - Mobile */}
            <Link
              href="/material-demo"
              className="flex items-center w-full px-4 py-3 text-left rounded-xl text-label-large font-medium text-md-tertiary hover:bg-md-tertiary/[0.08] transition-all duration-medium2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Material 3 Demo
            </Link>

            {/* User section */}
            <div className="border-t border-md-outline-variant my-4 pt-4">
              {session ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-body-medium font-medium text-md-on-surface">
                      {session.user?.name || session.user?.email}
                    </p>
                    <p className="text-body-small text-md-on-surface-variant capitalize">
                      {userRole.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <MaterialButton
                    variant="outlined"
                    className="w-full mx-4"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </MaterialButton>
                </>
              ) : (
                <MaterialButton
                  variant="filled"
                  className="w-full mx-4"
                  asChild
                >
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </MaterialButton>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
