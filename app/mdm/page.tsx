import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
    Smartphone,
    Users,
    ShieldCheck,
    WrenchIcon,
    PhoneCall,
    MapPin
} from 'lucide-react';

async function getMDMStats() {
    try {
        const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mdm/stats`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching MDM stats:', error);
        return null;
    }
}

export default async function MDMDashboard() {
    const stats = await getMDMStats();

    const quickStats = [
        {
            title: 'Total Devices',
            value: stats?.total_devices || 0,
            icon: Smartphone,
            href: '/mdm/devices',
            color: 'bg-blue-500'
        },
        {
            title: 'Assigned Devices',
            value: stats?.assigned_devices || 0,
            icon: Users,
            href: '/mdm/devices?status=ASSIGNED',
            color: 'bg-green-500'
        },
        {
            title: 'Available',
            value: stats?.available_devices || 0,
            icon: ShieldCheck,
            href: '/mdm/devices?status=AVAILABLE',
            color: 'bg-purple-500'
        },
        {
            title: 'In Repair',
            value: stats?.devices_in_repair || 0,
            icon: WrenchIcon,
            href: '/mdm/devices?status=REPAIR',
            color: 'bg-orange-500'
        },
        {
            title: 'Enrolled Devices',
            value: stats?.enrolled_devices || 0,
            icon: ShieldCheck,
            href: '/mdm/devices?is_enrolled=true',
            color: 'bg-indigo-500'
        },
        {
            title: 'Locked Devices',
            value: stats?.locked_devices || 0,
            icon: ShieldCheck,
            href: '/mdm/devices?locked=true',
            color: 'bg-red-500'
        }
    ];

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mobile Device Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage, track, and control your organization&apos;s mobile devices
                    </p>
                </div>
                <Link
                    href="/mdm/devices/add"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Register Device
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quickStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-md ${stat.color}`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Platform Stats */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Devices by Platform</CardTitle>
                            <CardDescription>Distribution across operating systems</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">iOS Devices</span>
                                    <span className="text-xl font-bold">{stats.ios_devices}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Android Devices</span>
                                    <span className="text-xl font-bold">{stats.android_devices}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common MDM tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Link
                                    href="/mdm/staff"
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                                >
                                    <Users className="h-4 w-4" />
                                    <span className="text-sm">Manage Staff</span>
                                </Link>
                                <Link
                                    href="/mdm/sim-cards"
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                                >
                                    <PhoneCall className="h-4 w-4" />
                                    <span className="text-sm">SIM Cards</span>
                                </Link>
                                <Link
                                    href="/mdm/map"
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                                >
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">Device Map</span>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
