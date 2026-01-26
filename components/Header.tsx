'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  FileText,
  BarChart2,
  Download,
  Home,
  Package,
  Move,
  TrendingDown,
  Plus,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';
import { UserRole } from '@/lib/auth/roles';
import { Action, Resource, can } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';


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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  const isAuthenticated = !!session?.user;
  const isLoading = status === 'loading';

  console.log('Header Debug:', {
    status,
    hasSession: !!session,
    hasUser: !!session?.user,
    userRole,
    isAuthenticated
  });

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

  const hasPermission = useCallback((action: Action, resource: Resource): boolean => {
    if (!isAuthenticated || !userRole) return false;
    return can(userRole, action, resource);
  }, [isAuthenticated, userRole]);

  const isAllowed = useCallback((item: MenuItem): boolean => {
    // Public items (no roles/permissions required) are always allowed
    if (!item.allowedRoles && !item.requiredPermission) return true;

    // If not authenticated, only public items are allowed
    if (!isAuthenticated) {
      // Debug log for restricted item access attempt
      if (item.title === 'Dashboard' || item.title === 'Manage Assets') {
        console.log('isAllowed Denied (Not Authenticated):', { item: item.title, isAuthenticated, userRole });
      }
      return false;
    }

    if (item.allowedRoles && (!userRole || !item.allowedRoles.includes(userRole))) {
      return false;
    }
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission.action, item.requiredPermission.resource);
    }
    return true;
  }, [isAuthenticated, userRole, hasPermission]);

  const handleSignOut = useCallback(async () => {
    setUserMenuOpen(false);
    await signOut({ redirect: false });
    router.push('/auth/signin');
  }, [router]);

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const renderNavigationItem = useCallback((item: MenuItem, isMobile = false) => {
    if (!isAllowed(item)) return null;

    const isActive = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href));

    const linkContent = (
      <>
        {item.icon && (
          <motion.span
            className={cn(
              'mr-3 flex-shrink-0 transition-all duration-200',
              isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'
            )}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            {item.icon}
          </motion.span>
        )}
        <span className="relative">
          {item.title}
          {isActive && !isMobile && (
            <motion.span
              className="absolute -bottom-6 left-1/2 h-0.5 w-full -translate-x-1/2 bg-gradient-to-r from-primary to-primary/60 rounded-full"
              layoutId="activeIndicator"
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
            />
          )}
        </span>
      </>
    );

    const className = cn(
      'relative flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-200',
      'group hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 rounded-xl',
      'hover:scale-105 hover:shadow-sm',
      isActive
        ? 'text-primary font-semibold bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm'
        : 'text-gray-700 hover:text-gray-900',
      isMobile
        ? 'w-full px-4 py-3.5 text-left hover:bg-primary/5 border-l-4 border-transparent hover:border-primary/20'
        : 'mx-1 px-4 py-2.5'
    );

    if (item.onClick) {
      return (
        <motion.button
          key={item.href}
          onClick={() => {
            item.onClick?.();
            if (isMobile) closeMobileMenu();
          }}
          className={className}
          whileHover={{ scale: isMobile ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {linkContent}
        </motion.button>
      );
    }

    if (item.isExternal) {
      return (
        <motion.a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          whileHover={{ scale: isMobile ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={isMobile ? closeMobileMenu : undefined}
        >
          {linkContent}
          <motion.span
            className="ml-2 text-xs opacity-60"
            whileHover={{ scale: 1.2, opacity: 1 }}
          >
            ↗
          </motion.span>
        </motion.a>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={className}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        <motion.div
          whileHover={{ scale: isMobile ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center w-full"
        >
          {linkContent}
        </motion.div>
      </Link>
    );
  }, [pathname, isAllowed, closeMobileMenu]);

  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({});

  const toggleDropdown = useCallback((title: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  }, []);

  const closeDropdown = useCallback((title: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [title]: false
    }));
  }, []);

  const renderDropdownMenu = useCallback((title: string, items: (MenuItem & { icon?: React.ReactNode; isExternal?: boolean; onClick?: () => void })[], isMobile = false) => {
    const filteredItems = items.filter(isAllowed);
    if (filteredItems.length === 0) return null;

    const isActive = filteredItems.some(item =>
      pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href))
    );

    const isOpen = dropdownStates[title] || false;

    if (isMobile) {
      return (
        <motion.div
          key={title}
          className="w-full"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <button
            onClick={() => toggleDropdown(title)}
            className={cn(
              'flex items-center justify-between w-full px-4 py-3.5 text-sm font-semibold rounded-lg transition-all duration-200',
              'bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-150',
              isActive ? 'text-primary from-primary/5 to-primary/10' : 'text-gray-700'
            )}
          >
            {title}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 opacity-50" />
            </motion.div>
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="mt-2 space-y-1 pl-2 border-l-2 border-gray-100 overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 * index }}
                  >
                    {renderNavigationItem({ ...item, title: item.title }, true)}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    // Desktop dropdown with click functionality
    return (
      <div key={title} className="relative" data-dropdown={title}>
        <motion.button
          onClick={() => toggleDropdown(title)}
          className={cn(
            'flex items-center h-full px-4 py-2.5 text-sm font-medium transition-all duration-200',
            'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 rounded-xl',
            'hover:scale-105 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20',
            isActive
              ? 'text-primary bg-gradient-to-r from-primary/5 to-primary/10 font-semibold'
              : 'text-gray-600 hover:text-gray-900'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{title}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="ml-2 h-4 w-4" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-64 origin-top-left rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 z-50 backdrop-blur-sm"
            >
              <div className="p-2">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.05 * index }}
                    className="p-1"
                    onClick={() => closeDropdown(title)}
                  >
                    {renderNavigationItem(item)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [pathname, isAllowed, renderNavigationItem, dropdownStates, toggleDropdown, closeDropdown]);

  // Enhanced user menu component
  const UserMenu = useCallback(() => {
    if (!session) return null;

    return (
      <div className="relative">
        <motion.button
          onClick={toggleUserMenu}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-200 hover:shadow-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium leading-tight">{session.user?.name || session.user?.email}</p>
              <p className="text-xs text-gray-500 capitalize leading-tight">
                {userRole?.toLowerCase().replace('_', ' ') || 'Guest'}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: userMenuOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button >

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 z-50 backdrop-blur-sm"
            >
              <div className="p-2">
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="font-medium text-gray-900">{session.user?.name || session.user?.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{userRole?.toLowerCase().replace('_', ' ') || 'Guest'}</p>
                </div>

                <motion.button
                  onClick={() => {
                    router.push('/profile');
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  whileHover={{ x: 4 }}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </motion.button>

                {(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) && (
                  <motion.button
                    onClick={() => {
                      router.push('/admin/settings');
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    whileHover={{ x: 4 }}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </motion.button>
                )}

                {(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) && (
                  <motion.button
                    onClick={() => {
                      router.push('/admin');
                      setUserMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    whileHover={{ x: 4 }}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </motion.button>
                )}

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <motion.button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    whileHover={{ x: 4 }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div >
    );
  }, [session, userRole, userMenuOpen, toggleUserMenu, handleSignOut, router]);

  // Optimized menu items with useMemo for better performance
  const mainMenuItems = useMemo((): MenuItem[] => [
    { href: '/', title: 'Home', description: 'Return to the home page' },
    { href: '/about', title: 'About', description: 'Learn about our system' },
  ], []);

  const dashboardItem = useMemo((): MenuItem => ({
    href: '/dashboard',
    title: 'Dashboard',
    description: 'View your dashboard',
    requiredPermission: { action: Action.READ, resource: Resource.DASHBOARD }
  }), []);

  const assetOperations = useMemo((): MenuItem[] => [
    {
      href: '/assets/manage',
      title: 'Manage Assets',
      description: 'View and manage all assets in the system',
      icon: <Package className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET }
    },
    {
      href: '/asset-movement',
      title: 'Asset Movement',
      description: 'Track and manage asset movements',
      icon: <Move className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET_MOVEMENT }
    },
    {
      href: '/depreciation',
      title: 'Track Depreciation',
      description: 'View and manage asset depreciation',
      icon: <TrendingDown className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
    {
      href: '/stock-verification',
      title: 'Stock Verification',
      description: 'Manage verification campaigns',
      icon: <Shield className="h-4 w-4" />,
      allowedRoles: [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.TEAM_LEADER,
        UserRole.SENIOR_VERIFIER,
        UserRole.VERIFIER
      ]
    },
  ], []);

  const reports = useMemo((): MenuItem[] => [
    {
      href: '/reports',
      title: 'Asset Reports',
      description: 'Generate and view asset reports',
      icon: <FileText className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
    {
      href: '/reports/depreciation',
      title: 'Depreciation Reports',
      description: 'View asset depreciation reports',
      icon: <BarChart2 className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
    {
      href: '/reports/export',
      title: 'Export Data',
      description: 'Export asset data in various formats',
      icon: <Download className="h-4 w-4" />,
      requiredPermission: { action: Action.EXPORT, resource: Resource.REPORT }
    }
  ], []);

  const administration = useMemo((): MenuItem[] => [
    {
      href: '/admin/users',
      title: 'User Management',
      description: 'Manage system users and permissions',
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      href: '/admin/roles',
      title: 'Role Management',
      description: 'Configure roles and permissions',
      allowedRoles: [UserRole.SUPER_ADMIN]
    },
    {
      href: '/admin/audit-logs',
      title: 'Audit Logs',
      description: 'View system activity and changes',
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR],
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
  ], []);

  const management = useMemo((): MenuItem[] => [
    {
      href: '/categories',
      title: 'Categories',
      description: 'Manage asset categories and types',
      requiredPermission: { action: Action.MANAGE, resource: Resource.ASSET_CATEGORY },
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    },
    {
      href: '/locations',
      title: 'Locations',
      description: 'Manage states and LGAs',
      requiredPermission: { action: Action.MANAGE, resource: Resource.ASSET },
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]
    },
  ], []);

  const mdmOperations = useMemo((): MenuItem[] => [
    {
      href: '/mdm',
      title: 'MDM Dashboard',
      description: 'Mobile Device Management dashboard',
      icon: <Package className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET }
    },
    {
      href: '/mdm/devices',
      title: 'Mobile Devices',
      description: 'Manage mobile devices',
      icon: <Package className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET }
    },
    {
      href: '/mdm/staff',
      title: 'Staff Management',
      description: 'Manage staff and assignments',
      icon: <Package className="h-4 w-4" />,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]
    },
  ], []);

  const renderNavigation = useCallback(() => {
    const navItems: MenuItem[] = [
      ...mainMenuItems,
      {
        href: '/dashboard',
        title: 'Dashboard',
        icon: <Home className="h-4 w-4" />,
        requiredPermission: { action: Action.READ, resource: Resource.DASHBOARD },
      },
    ];

    return (
      <nav className="hidden md:flex md:items-center md:space-x-2">
        {navItems.map((item) => isAllowed(item) && renderNavigationItem(item))}
        {hasPermission(Action.READ, Resource.ASSET) && renderDropdownMenu('Assets', assetOperations)}
        {hasPermission(Action.READ, Resource.ASSET) && renderDropdownMenu('MDM', mdmOperations)}
        {hasPermission(Action.READ, Resource.REPORT) && renderDropdownMenu('Reports', reports)}
        {management.filter(isAllowed).length > 0 && renderDropdownMenu('Management', management)}
        {hasPermission(Action.READ, Resource.USER) && renderDropdownMenu('Admin', administration)}
      </nav>
    );
  }, [mainMenuItems, assetOperations, reports, administration, isAllowed, renderNavigationItem, hasPermission, renderDropdownMenu]);

  // Click outside handler for user menu and dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Close user menu if clicking outside
      if (userMenuOpen && !target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }

      // Close dropdowns if clicking outside
      const clickedDropdown = target.closest('[data-dropdown]');
      if (!clickedDropdown) {
        setDropdownStates({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <motion.header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        'bg-white/90 backdrop-blur-xl border-b border-gray-200/50',
        scrolled ? 'shadow-lg shadow-gray-900/5' : 'shadow-sm'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                AssetHub
              </span>
            </Link>
          </motion.div>

          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            {renderNavigation()}

            {/* User Authentication Section */}
            <div className="hidden md:flex items-center gap-4" suppressHydrationWarning={true}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : session ? (
                <div data-user-menu>
                  <UserMenu />
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-sm hover:shadow-md border border-primary/20"
                  >
                    Sign In
                  </Link>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {session && (
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <motion.button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 hover:shadow-sm"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="sr-only">
                {mobileMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile menu with animations */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="space-y-2 px-4 py-6">
                {/* Main Menu Items */}
                {mainMenuItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'block rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200',
                        'border-l-4 border-transparent hover:border-primary/20',
                        pathname === item.href
                          ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-primary'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900'
                      )}
                      onClick={closeMobileMenu}
                    >
                      {item.title}
                    </Link>
                  </motion.div>
                ))}

                {/* Dashboard Item */}
                {session && hasPermission(Action.READ, Resource.DASHBOARD) && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <Link
                      href={dashboardItem.href}
                      className={cn(
                        'block rounded-xl px-4 py-3.5 text-base font-medium transition-all duration-200',
                        'border-l-4 border-transparent hover:border-primary/20',
                        pathname === dashboardItem.href
                          ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-primary'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:text-gray-900'
                      )}
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5" />
                        {dashboardItem.title}
                      </div>
                    </Link>
                  </motion.div>
                )}

                {/* Asset Operations Section */}
                {session && assetOperations.filter(isAllowed).length > 0 && (
                  <motion.div
                    className="border-t border-gray-200/50 pt-4 mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {renderDropdownMenu('Asset Operations', assetOperations, true)}
                  </motion.div>
                )}

                {/* Reports Section */}
                {session && reports.filter(isAllowed).length > 0 && (
                  <motion.div
                    className="border-t border-gray-200/50 pt-4 mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    {renderDropdownMenu('Reports', reports, true)}
                  </motion.div>
                )}

                {/* Management Section */}
                {session && management.filter(isAllowed).length > 0 && (
                  <motion.div
                    className="border-t border-gray-200/50 pt-4 mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    {renderDropdownMenu('Management', management, true)}
                  </motion.div>
                )}

                {/* Administration Section */}
                {session && administration.filter(isAllowed).length > 0 && (
                  <motion.div
                    className="border-t border-gray-200/50 pt-4 mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    {renderDropdownMenu('Administration', administration, true)}
                  </motion.div>
                )}

                {/* User Section */}
                <motion.div
                  className="border-t border-gray-200/50 pt-4 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                >
                  {session ? (
                    <>
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{session.user?.name || session.user?.email}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {userRole?.toLowerCase().replace('_', ' ') || 'Guest'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href="/auth/signin"
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary/80 rounded-xl transition-all duration-200 shadow-sm"
                        onClick={closeMobileMenu}
                      >
                        <User className="h-4 w-4" />
                        Sign In
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
