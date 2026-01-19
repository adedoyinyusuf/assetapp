'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Settings,
    MapPin,
    Tags,
    History,
    ShieldCheck,
    ChevronRight,
    TrendingUp,
    Database
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserRole } from '@/lib/auth/roles';

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Admin modules configuration
    const adminModules = [
        {
            title: 'User Management',
            description: 'Manage user accounts, roles, and system access.',
            icon: Users,
            href: '/admin/users',
            color: 'bg-blue-500',
            stats: 'Active Users',
            role: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
            title: 'Role Permissions',
            description: 'Configure detailed permissions for user roles.',
            icon: ShieldCheck,
            href: '/admin/roles',
            color: 'bg-indigo-500',
            stats: 'Roles Configured',
            role: [UserRole.SUPER_ADMIN]
        },
        {
            title: 'Asset Categories',
            description: 'Define and manage asset categorizations.',
            icon: Tags,
            href: '/admin/categories',
            color: 'bg-green-500',
            stats: 'Categories',
            role: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
            title: 'Geographic Data',
            description: 'Manage States, LGAs, and Location hierarchies.',
            icon: MapPin,
            href: '/admin/locations',
            color: 'bg-amber-500',
            stats: 'Locations',
            role: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        },
        {
            title: 'Depreciation Rules',
            description: 'Set up depreciation methods and useful life defaults.',
            icon: TrendingUp,
            href: '/admin/depreciation',
            color: 'bg-purple-500',
            stats: 'Rules Active',
            role: [UserRole.SUPER_ADMIN]
        },
        {
            title: 'Audit Logs',
            description: 'View system-wide activity and security logs.',
            icon: History,
            href: '/admin/audit-logs',
            color: 'bg-orange-500',
            stats: 'Recent Entries',
            role: [UserRole.SUPER_ADMIN]
        },
        {
            title: 'System Settings',
            description: 'Configure general system preferences and defaults.',
            icon: Settings,
            href: '/admin/settings',
            color: 'bg-slate-600',
            stats: 'Configuration',
            role: [UserRole.SUPER_ADMIN]
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
            >
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Administration Console
                </h1>
                <p className="text-lg text-gray-500">
                    Overview of system management and configuration options.
                </p>
            </motion.div>

            {/* Admin Modules Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {adminModules.map((module, index) => {
                    // Basic role check
                    if (!session?.user?.role || !module.role.includes(session.user.role as UserRole)) return null;

                    return (
                        <motion.div
                            key={module.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={module.href}>
                                <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 group" style={{ borderLeftColor: module.color.replace('bg-', '') }}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-lg ${module.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                                                <module.icon className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">
                                                {module.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                {module.description}
                                            </p>
                                        </div>

                                        <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                                            <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                                                {module.stats}
                                            </span>
                                            <span className="group-hover:translate-x-1 transition-transform inline-flex items-center text-primary font-medium">
                                                Access Module
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Status / Info Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 bg-blue-50 border border-blue-100 rounded-lg p-6 flex items-start gap-4"
            >
                <Database className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                    <h4 className="font-semibold text-blue-900">System Status</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Your system is currently running version 1.0.0. All services are operational.
                        Database connection to PostgreSQL is active.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
