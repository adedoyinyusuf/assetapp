import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Smartphone,
    Apple,
    CircleDot,
    MapPin,
    BatteryFull,
    BatteryMedium,
    BatteryLow,
    HardDrive
} from 'lucide-react';

async function getDevices() {
    try {
        const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mdm/devices`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching devices:', error);
        return [];
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'AVAILABLE': return 'bg-green-500';
        case 'ASSIGNED': return 'bg-blue-500';
        case 'REPAIR': return 'bg-orange-500';
        case 'RETIRED': return 'bg-gray-500';
        default: return 'bg-gray-500';
    }
}

function getBatteryIcon(level?: number) {
    if (!level) return BatteryMedium;
    if (level >= 70) return BatteryFull;
    if (level >= 30) return BatteryMedium;
    return BatteryLow;
}

export default async function DevicesPage() {
    const devices = await getDevices();

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mobile Devices</h1>
                    <p className="text-muted-foreground mt-1">
                        {devices.length} device{devices.length !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <Link
                    href="/mdm/devices/add"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Add Device
                </Link>
            </div>

            {/* Device Grid */}
            {devices.length === 0 ? (
                <Card className="p-12 text-center">
                    <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No devices registered</h3>
                    <p className="text-muted-foreground mb-4">
                        Get started by registering your first mobile device
                    </p>
                    <Link
                        href="/mdm/devices/add"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        Register Device
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device: any) => {
                        const BatteryIcon = getBatteryIcon(device.battery_level);
                        const isIOS = device.os_type === 'iOS';

                        return (
                            <Link key={device.id} href={`/mdm/devices/${device.id}`}>
                                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isIOS ? 'bg-gray-100' : 'bg-green-100'}`}>
                                                {isIOS ? (
                                                    <Apple className="h-5 w-5" />
                                                ) : (
                                                    <Smartphone className="h-5 w-5 text-green-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">
                                                    {device.device_name || device.model || 'Unknown Device'}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {device.manufacturer} {device.model}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={getStatusColor(device.status)} variant="default">
                                            {device.status}
                                        </Badge>
                                    </div>

                                    {/* Device Info */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">IMEI</span>
                                            <span className="font-mono text-xs">{device.imei_1}</span>
                                        </div>

                                        {device.os_version && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">OS</span>
                                                <span>{device.os_type} {device.os_version}</span>
                                            </div>
                                        )}

                                        {device.battery_level !== null && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <BatteryIcon className="h-4 w-4" />
                                                    Battery
                                                </span>
                                                <span>{device.battery_level}%</span>
                                            </div>
                                        )}

                                        {device.storage_used_gb !== null && device.storage_total_gb !== null && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <HardDrive className="h-4 w-4" />
                                                    Storage
                                                </span>
                                                <span>{device.storage_used_gb}/{device.storage_total_gb} GB</span>
                                            </div>
                                        )}

                                        {device.is_enrolled && (
                                            <div className="pt-2 border-t">
                                                <Badge variant="outline" className="text-xs">
                                                    <CircleDot className="h-3 w-3 mr-1 text-green-500" />
                                                    MDM Enrolled
                                                </Badge>
                                                {device.is_locked && (
                                                    <Badge variant="destructive" className="text-xs ml-2">
                                                        Locked
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {device.last_location_lat && device.last_location_lng && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                                                <MapPin className="h-3 w-3" />
                                                Location tracked
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
