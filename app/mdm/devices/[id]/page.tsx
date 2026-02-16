import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Smartphone,
    MapPin,
    BatteryFull,
    Calendar,
    CircleDot,
    Clock,
    Edit
} from 'lucide-react';
import RemoteControlPanel from '@/components/mdm/RemoteControlPanel';

async function getDevice(id: string) {
    try {
        const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mdm/devices/${id}`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching device:', error);
        return null;
    }
}

function formatDate(date: string | null | undefined) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
}

export default async function DeviceDetailPage({ params }: { params: { id: string } }) {
    const device = await getDevice(params.id);

    if (!device) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/mdm/devices">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">
                        {device.device_name || device.model || 'Unknown Device'}
                    </h1>
                    <p className="text-muted-foreground">
                        {device.manufacturer} • {device.os_type} {device.os_version}
                    </p>
                </div>
                <Badge className={`
          ${device.status === 'AVAILABLE' && 'bg-green-500'}
          ${device.status === 'ASSIGNED' && 'bg-blue-500'}
          ${device.status === 'REPAIR' && 'bg-orange-500'}
          ${device.status === 'RETIRED' && 'bg-gray-500'}
        `}>
                    {device.status}
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Device Information */}
                <div className="md:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Device Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm text-muted-foreground">IMEI 1</p>
                                <p className="font-mono text-sm">{device.imei_1}</p>
                            </div>
                            {device.imei_2 && (
                                <div>
                                    <p className="text-sm text-muted-foreground">IMEI 2</p>
                                    <p className="font-mono text-sm">{device.imei_2}</p>
                                </div>
                            )}
                            {device.serial_number && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Serial Number</p>
                                    <p className="font-mono text-sm">{device.serial_number}</p>
                                </div>
                            )}
                            {device.carrier && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Carrier</p>
                                    <p className="text-sm">{device.carrier}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Device Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Device Status</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {device.battery_level !== null && (
                                <div className="flex items-center gap-2">
                                    <BatteryFull className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Battery</p>
                                        <p className="text-sm font-medium">{device.battery_level}%</p>
                                    </div>
                                </div>
                            )}
                            {device.storage_used_gb !== null && device.storage_total_gb !== null && (
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Storage</p>
                                        <p className="text-sm font-medium">
                                            {device.storage_used_gb} / {device.storage_total_gb} GB
                                        </p>
                                    </div>
                                </div>
                            )}
                            {device.health_status && (
                                <div className="flex items-center gap-2">
                                    <CircleDot className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Health</p>
                                        <p className="text-sm font-medium">{device.health_status}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Purchase Info */}
                    {(device.purchase_date || device.purchase_value || device.warranty_expiry) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Purchase & Warranty</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {device.purchase_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Purchase Date</p>
                                        <p className="text-sm">{formatDate(device.purchase_date)}</p>
                                    </div>
                                )}
                                {device.purchase_value && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Purchase Value</p>
                                        <p className="text-sm">${device.purchase_value.toLocaleString()}</p>
                                    </div>
                                )}
                                {device.warranty_expiry && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                                        <p className="text-sm">{formatDate(device.warranty_expiry)}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Command History */}
                    {device.commands && device.commands.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Command History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {device.commands.slice(0, 5).map((cmd: any) => (
                                        <div key={cmd.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="text-sm font-medium">{cmd.command_type}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {cmd.initiated_by}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={cmd.status === 'EXECUTED' ? 'default' : cmd.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                                    {cmd.status}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(cmd.initiated_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Remote Control */}
                    <RemoteControlPanel
                        deviceId={device.id}
                        deviceName={device.device_name || device.model || 'Device'}
                        isEnrolled={device.is_enrolled || false}
                        isLocked={device.is_locked || false}
                    />

                    {/* Location */}
                    {device.last_location_lat && device.last_location_lng && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">Last known location:</p>
                                <p className="text-sm font-mono">
                                    {device.last_location_lat.toFixed(6)}, {device.last_location_lng.toFixed(6)}
                                </p>
                                {device.last_location_updated && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Updated {formatDate(device.last_location_updated)}
                                    </p>
                                )}
                                <Button className="w-full mt-4" variant="outline" size="sm">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    View on Map
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                            </Button>
                            <Button className="w-full" variant="outline" size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Maintenance
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
