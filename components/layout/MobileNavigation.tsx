'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';
import { UserRole, Action, Resource, can } from '@/lib/auth/roles';
import { useState, useCallback } from 'react';

// Re-using the interface (could be moved to shared types)
export interface MenuItem {
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

interface MobileNavigationProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
    onSignOut: () => void;
    menuGroups: {
        main: MenuItem[];
        assets: MenuItem[];
        stockVerification: MenuItem[];
        mdm: MenuItem[];
        reports: MenuItem[];
        admin: MenuItem[];
    };
}

export function MobileNavigation({
    isOpen,
    onClose,
    session,
    onSignOut,
    menuGroups
}: MobileNavigationProps) {
    const pathname = usePathname();
    const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({});

    const userRole = session?.user?.role as UserRole | undefined;
    const isAuthenticated = !!session?.user;

    // Permission Logic
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

    const toggleAccordion = (id: string) => {
        setOpenAccordion(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderItem = (item: MenuItem) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

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

        const classes = cn(
            "flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors",
            isActive
                ? "bg-primary/10 text-primary" // Improved visibility
                : "text-gray-700 hover:bg-gray-100" // Improved hover
        );

        if (item.onClick) {
            return (
                <button
                    key={item.title}
                    onClick={() => {
                        item.onClick?.();
                        onClose();
                    }}
                    className={classes}
                >
                    {content}
                </button>
            );
        }

        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={classes}
                target={item.isExternal ? "_blank" : undefined}
            >
                {content}
            </Link>
        );
    };

    const renderGroup = (id: string, title: string, items: MenuItem[]) => {
        const filtered = items.filter(isAllowed);
        if (filtered.length === 0) return null;

        // Auto-open if active link is inside
        // const hasActive = filtered.some(item => pathname.startsWith(item.href));
        // useEffect(() => { if(hasActive) setOpenAccordion(p => ({...p, [id]: true})) }, []);

        const isOpen = openAccordion[id];

        return (
            <div className="border-b border-gray-100 last:border-0">
                <button
                    onClick={() => toggleAccordion(id)}
                    className="flex items-center justify-between w-full px-4 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors" // Larger tap target
                >
                    {title}
                    <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-gray-50/50"
                        >
                            <div className="pl-2 pb-2 pr-2">
                                {filtered.map(renderItem)}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" // Increased z-index
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-[85vw] max-w-[320px] bg-white z-[61] shadow-2xl overflow-y-auto flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <span className="font-bold text-lg text-gray-900">Menu</span>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close menu"
                            >
                                <X className="h-6 w-6" /> {/* Larger icon */}
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto pt-2">
                            <div className="px-2 space-y-1 pb-4">
                                {menuGroups.main.map(renderItem)}
                            </div>

                            <div className="border-t border-gray-100" />

                            {renderGroup('assets', 'Asset Operations', menuGroups.assets)}
                            {renderGroup('stockVerification', 'Stock Verification', menuGroups.stockVerification)}
                            {renderGroup('mdm', 'Mobile Device Management', menuGroups.mdm)}
                            {renderGroup('reports', 'Reports & Analytics', menuGroups.reports)}
                            {isAuthenticated && renderGroup('admin', 'Administration', menuGroups.admin)}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto sticky bottom-0">
                            {session ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
                                            {session.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{session.user?.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onSignOut}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/auth/signin"
                                    onClick={onClose}
                                    className="flex w-full items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg font-medium shadow hover:bg-primary/90 transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
