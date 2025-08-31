'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Menu, X, FileText, BarChart2, Download, Home, Package, Move, TrendingDown, Plus } from 'lucide-react';
import { UserRole } from '@/lib/auth/roles';
import { Action, Resource, can } from '@/lib/auth/roles';
import { cn } from '@/lib/utils';

// Simple button component to avoid external dependencies
const Button = ({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary'
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

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
            'mr-2.5 flex-shrink-0',
            isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
          )}>
            {item.icon}
          </span>
        )}
        <span>{item.title}</span>
        {isActive && (
          <motion.span 
            className="absolute -bottom-px left-1/2 h-0.5 w-4 -translate-x-1/2 bg-primary rounded-full"
            layoutId="activeIndicator"
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        )}
      </>
    );

    const className = cn(
      'relative flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200',
      'group hover:bg-gray-50/80 rounded-lg',
      isActive 
        ? 'text-primary font-semibold' 
        : 'text-gray-700 hover:text-gray-900',
      isMobile 
        ? 'w-full px-4 py-3 text-left hover:bg-gray-50' 
        : 'mx-0.5 px-3 py-2'
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
          <span className="ml-1.5 text-xs opacity-60">↗</span>
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
      </Link>
    );
  };

  const renderDropdownMenu = (title: string, items: (MenuItem & { icon?: React.ReactNode; isExternal?: boolean; onClick?: () => void })[], isMobile = false) => {
    const filteredItems = items.filter(isAllowed);
    if (filteredItems.length === 0) return null;

    const isActive = filteredItems.some(item => 
      pathname === item.href || 
      (item.href !== '/' && pathname.startsWith(item.href))
    );

    if (isMobile) {
      return (
        <div key={title} className="w-full">
          <div className={cn(
            'flex items-center justify-between w-full px-4 py-3 text-sm font-medium',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}>
            {title}
          </div>
          <div className="mt-1 space-y-1 pl-4">
            {filteredItems.map((item) => renderNavigationItem({ ...item, title: `• ${item.title}` }, true))}
          </div>
        </div>
      );
    }

    // Desktop dropdown
    return (
      <div key={title} className="relative group">
        <button
          className={cn(
            'flex items-center h-full px-3 py-2.5 text-sm font-medium transition-colors',
            isActive 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span>{title}</span>
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div className="absolute left-0 mt-1 w-56 origin-top-left rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform translate-y-1 group-hover:translate-y-0 z-50">
          <div className="py-1">
            {filteredItems.map((item) => (
              <div key={item.href} className="px-1 py-0.5">
                {renderNavigationItem(item)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderNavigation = () => {
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
      <nav className="hidden md:flex md:items-center md:space-x-1">
        {navItems.map((item) => isAllowed(item) && renderNavigationItem(item))}
        {hasPermission(Action.READ, Resource.ASSET) && renderDropdownMenu('Assets', assetOperations)}
        {hasPermission(Action.READ, Resource.REPORT) && renderDropdownMenu('Reports', reports)}
        {hasPermission(Action.READ, Resource.USER) && renderDropdownMenu('Admin', administration)}
      </nav>
    );
  };

  // Define menu items with required permissions
  const mainMenuItems: MenuItem[] = [
    { href: '/', title: 'Home', description: 'Return to the home page' },
    { href: '/about', title: 'About', description: 'Learn about our system' },
  ];

  const dashboardItem: MenuItem = {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'View your dashboard',
    requiredPermission: { action: Action.READ, resource: Resource.DASHBOARD }
  };

  const assetOperations: MenuItem[] = [
    {
      href: '/assets/manage',
      title: 'Manage Assets',
      description: 'View and manage all assets in the system',
      icon: <Package className="h-4 w-4" />,
      requiredPermission: { action: Action.READ, resource: Resource.ASSET }
    },
    {
      href: '/assets/add',
      title: 'Add Asset',
      description: 'Register a new asset',
      icon: <Plus className="h-4 w-4" />,
      requiredPermission: { action: Action.CREATE, resource: Resource.ASSET }
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
  ];

  const reports: MenuItem[] = [
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
  ];

  const administration: MenuItem[] = [
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
  ];

  const management: MenuItem[] = [
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
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                AssetHub
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            {session && renderNavigation()}

            {/* User Menu / Sign In */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium">{session.user?.name || session.user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {userRole.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="text-sm border-primary/20 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link 
                  href="/auth/signin" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">
                {mobileMenuOpen ? 'Close menu' : 'Open menu'}
              </span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
          <div className="space-y-1 px-2 pb-4 pt-2">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.title}
              </Link>
            ))}
            
            {hasPermission(Action.READ, Resource.DASHBOARD) && (
              <Link
                href={dashboardItem.href}
                className={`block rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                  pathname === dashboardItem.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {dashboardItem.title}
              </Link>
            )}
            
            {assetOperations.filter(isAllowed).length > 0 && (
              <div className="border-t border-border/50 pt-2 mt-2">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  Asset Operations
                </p>
                {assetOperations.filter(isAllowed).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2.5 pl-6 text-base font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
            
            {management.filter(isAllowed).length > 0 && (
              <div className="border-t border-border/50 pt-2 mt-2">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  Management
                </p>
                {management.filter(isAllowed).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2.5 pl-6 text-base font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
            
            {administration.filter(isAllowed).length > 0 && (
              <div className="border-t border-border/50 pt-2 mt-2">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  Administration
                </p>
                {administration.filter(isAllowed).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2.5 pl-6 text-base font-medium transition-colors ${
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
            
            {/* User section */}
            <div className="border-t border-border my-2"></div>
            
            {session ? (
              <>
                <div className="px-4 py-2">
                  <p className="text-sm font-medium">{session.user?.name || session.user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center px-4 py-3 text-sm font-medium text-foreground hover:bg-accent rounded-md text-left"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="flex items-center px-4 py-3 text-sm font-medium text-foreground hover:bg-accent rounded-md"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
