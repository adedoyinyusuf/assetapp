'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
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
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole || UserRole.VIEWER;

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
        {item.icon && <span className="mr-2">{item.icon}</span>}
        <span>{item.title}</span>
        {isActive && (
          <motion.span 
            className="absolute bottom-0 left-0 h-0.5 bg-primary w-full"
            layoutId="activeIndicator"
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
            }}
          />
        )}
      </>
    );

    const className = cn(
      'relative flex items-center px-3 py-2.5 text-sm font-medium transition-colors',
      isActive 
        ? 'text-primary' 
        : 'text-muted-foreground hover:text-foreground',
      isMobile ? 'w-full px-4 py-3' : ''
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
      requiredPermission: { action: Action.READ, resource: Resource.ASSET }
    },
    {
      href: '/assets/add',
      title: 'Add Asset',
      description: 'Register a new asset',
      requiredPermission: { action: Action.CREATE, resource: Resource.ASSET }
    },
    {
      href: '/asset-movement',
      title: 'Asset Movement',
      description: 'Track and manage asset movements',
      requiredPermission: { action: Action.READ, resource: Resource.ASSET_MOVEMENT }
    },
    {
      href: '/depreciation',
      title: 'Track Depreciation',
      description: 'View and manage asset depreciation',
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
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
    {
      href: '/reports',
      title: 'Reports',
      description: 'Generate and view reports',
      requiredPermission: { action: Action.READ, resource: Resource.REPORT }
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              NPC Assets
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-1 text-sm font-medium md:flex">
            {mainMenuItems.map((item) => renderNavigationItem(item))}
            {renderDropdownMenu('Assets', assetOperations)}
            {hasPermission(Action.READ, Resource.DASHBOARD) && renderNavigationItem(dashboardItem)}
            {hasPermission(Action.READ, Resource.ASSET) && renderDropdownMenu('Management', management)}
            {hasPermission(Action.READ, Resource.USER) && renderDropdownMenu('Admin', administration)}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop User Menu */}
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

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 md:hidden transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
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
