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
  ChevronDown,
  User,
  LogOut,
  Settings,
  Shield,
  Smartphone,
  Users
} from 'lucide-react';
import { UserRole, Action, Resource, can } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { UserMenu } from './UserMenu';

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
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;
  const isAuthenticated = !!session?.user;

  // Add shadow when scrolling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);


  const hasPermission = useCallback((action: Action, resource: Resource): boolean => {
    if (!isAuthenticated || !userRole) return false;
    return can(userRole, action, resource);
  }, [isAuthenticated, userRole]);

  const isAllowed = useCallback((item: MenuItem): boolean => {
    if (!item.allowedRoles && !item.requiredPermission) return true;
    if (!isAuthenticated) return false;

    if (item.allowedRoles && (!userRole || !item.allowedRoles.includes(userRole))) {
      return false;
    }
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission.action, item.requiredPermission.resource);
    }
    return true;
  }, [isAuthenticated, userRole, hasPermission]);

  const renderNavigationItem = useCallback((item: MenuItem, isMobile = false) => {
    if (!isAllowed(item)) return null;

    const isActive = pathname === item.href ||
      (item.href !== '/' && pathname.startsWith(item.href));

    const content = (
      <>
        {item.icon && (
          <span className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-gray-500")}>
            {item.icon}
          </span>
        )}
        <span>{item.title}</span>
      </>
    );

    const mobileClasses = cn(
      "flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors",
      isActive
        ? "bg-primary/5 text-primary"
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
    );

    const desktopClasses = cn(
      "relative flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md",
      isActive
        ? "text-primary bg-primary/5"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    );

    if (item.onClick) {
      return (
        <button
          key={item.title}
          onClick={item.onClick}
          className={isMobile ? mobileClasses : desktopClasses}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={isMobile ? mobileClasses : desktopClasses}
        target={item.isExternal ? "_blank" : undefined}
      >
        {content}
      </Link>
    );
  }, [pathname, isAllowed]);

  // --- Menu Data Definitions (Cached) ---

  const mainMenuItems = useMemo((): MenuItem[] => [
    { href: '/', title: 'Home', icon: <Home className="h-4 w-4" /> },
    { href: '/dashboard', title: 'Dashboard', icon: <BarChart2 className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.DASHBOARD } },
  ], []);

  const assetOperations = useMemo((): MenuItem[] => [
    { href: '/assets/manage', title: 'Manage Assets', icon: <Package className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.ASSET } },
    { href: '/asset-movement', title: 'Asset Movement', icon: <Move className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.ASSET_MOVEMENT } },
    { href: '/depreciation', title: 'Track Depreciation', icon: <TrendingDown className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.REPORT } },
    { href: '/stock-verification', title: 'Stock Verification', icon: <Shield className="h-4 w-4" />, allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEADER, UserRole.VERIFIER] },
  ], []);

  const reports = useMemo((): MenuItem[] => [
    { href: '/reports', title: 'Asset Reports', icon: <FileText className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.REPORT } },
    { href: '/reports/depreciation', title: 'Depreciation Reports', icon: <BarChart2 className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.REPORT } },
    { href: '/reports/export', title: 'Export Data', icon: <Download className="h-4 w-4" />, requiredPermission: { action: Action.EXPORT, resource: Resource.REPORT } }
  ], []);

  const adminItems = useMemo((): MenuItem[] => [
    { href: '/admin/users', title: 'User Management', icon: <Users className="h-4 w-4" />, allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { href: '/admin/roles', title: 'Role Management', icon: <Shield className="h-4 w-4" />, allowedRoles: [UserRole.SUPER_ADMIN] },
    { href: '/admin/audit-logs', title: 'Audit Logs', icon: <FileText className="h-4 w-4" />, allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AUDITOR] },
  ], []);

  const managementItems = useMemo((): MenuItem[] => [
    { href: '/categories', title: 'Categories', icon: <Package className="h-4 w-4" />, allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { href: '/locations', title: 'Locations', icon: <Move className="h-4 w-4" />, allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER] },
  ], []);

  const mdmItems = useMemo((): MenuItem[] => [
    { href: '/mdm', title: 'MDM Dashboard', icon: <Smartphone className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.ASSET } },
    { href: '/mdm/devices', title: 'Mobile Devices', icon: <Smartphone className="h-4 w-4" />, requiredPermission: { action: Action.READ, resource: Resource.ASSET } },
    { href: '/mdm/staff', title: 'Staff Management', icon: <Users className="h-4 w-4" />, allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER] },
  ], []);

  // --- Render Helpers ---

  const renderDropdown = (title: string, items: MenuItem[]) => {
    const filtered = items.filter(isAllowed);
    if (filtered.length === 0) return null;

    return (
      <div className="relative group">
        <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
          {title}
          <ChevronDown className="ml-1 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="absolute left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left bg-white border border-gray-100 rounded-lg shadow-lg p-2 z-50">
          {filtered.map(item => (
            <div key={item.href} onClick={() => { /* close dropdown logic handled by css hover */ }}>
              {renderNavigationItem(item)}
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full bg-white border-b border-gray-200',
        scrolled && 'shadow-sm'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm text-white font-bold">
              A
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">AssetHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {mainMenuItems.map(item => renderNavigationItem(item))}
            {renderDropdown('Assets', assetOperations)}
            {renderDropdown('MDM', mdmItems)}
            {renderDropdown('Reports', reports)}
            {renderDropdown('Manage', managementItems)}
            {renderDropdown('Admin', adminItems)}
          </nav>

          {/* Right Area: User Menu & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              {session ? <UserMenu /> : (
                <Link href="/auth/signin" className="text-sm font-medium text-primary hover:text-primary/80">Sign In</Link>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Drawer (Sheet-like) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[300px] bg-white z-50 shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <span className="font-bold text-lg">Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Body - Scrollable */}
                <div className="flex-1 p-4 space-y-1">

                  {/* Direct Links */}
                  {mainMenuItems.map(item => (
                    <div key={item.href} onClick={() => setMobileMenuOpen(false)}>
                      {renderNavigationItem(item, true)}
                    </div>
                  ))}

                  <div className="my-4 border-t border-gray-100" />

                  {/* Accordion Groups */}
                  <Accordion type="single" collapsible className="w-full">

                    {/* Assets */}
                    <AccordionItem value="assets" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700">
                        Asset Operations
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-2 pl-4">
                        {assetOperations.map(item => renderNavigationItem(item, true))}
                      </AccordionContent>
                    </AccordionItem>

                    {/* MDM */}
                    <AccordionItem value="mdm" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700">
                        MDM
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-2 pl-4">
                        {mdmItems.map(item => renderNavigationItem(item, true))}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Reports */}
                    <AccordionItem value="reports" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700">
                        Reports
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-2 pl-4">
                        {reports.map(item => renderNavigationItem(item, true))}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Management */}
                    <AccordionItem value="manage" className="border-b-0">
                      <AccordionTrigger className="hover:no-underline py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700">
                        Management
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-2 pl-4">
                        {managementItems.map(item => renderNavigationItem(item, true))}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Admin */}
                    {isAuthenticated && (
                      <AccordionItem value="admin" className="border-b-0">
                        <AccordionTrigger className="hover:no-underline py-2 px-4 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700">
                          Administration
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2 pl-4">
                          {adminItems.map(item => renderNavigationItem(item, true))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>

                {/* Drawer Footer - User Profile */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  {session ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {session.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{session.user?.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{session.user?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-white border border-red-100 rounded-md hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="flex w-full items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg font-medium"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
