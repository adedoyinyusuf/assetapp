import { db } from "@/lib/db";
import { procurementService } from "@/lib/procurement/procurement-service";
import { maintenanceService } from "@/lib/maintenance/maintenance-service";
import { disposalService } from "@/lib/disposal/disposal-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ReportsOverviewPage() {
    // Get summary statistics from all modules
    const [
        totalAssets,
        procurementRequests,
        maintenanceRequests,
        disposalRequests,
    ] = await Promise.all([
        db.asset.count(),
        procurementService.getRequests({ limit: 5 }),
        maintenanceService.getRequests({ limit: 5 }),
        disposals.getRequests({ limit: 5 }),
    ]);

    // Count assets by status
    const inStoreCount = await db.asset.count({ where: { status: 'IN_STORE' } });
    const inUseCount = await db.asset.count({ where: { status: 'IN_USE' } });
    const maintenanceCount = await db.asset.count({ where: { status: 'MAINTENANCE' } });
    const disposedCount = await db.asset.count({ where: { status: 'DISPOSED' } });
    const missingCount = await db.asset.count({ where: { status: 'MISSING' } });

    return (
        <div className="container py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
                <p className="text-muted-foreground">Comprehensive view of all asset management activities</p>
            </div>

            {/* Asset Status Overview */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Asset Status Distribution</h2>
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Store</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inStoreCount}</div>
                            <p className="text-xs text-muted-foreground">Available</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Use</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inUseCount}</div>
                            <p className="text-xs text-muted-foreground">Deployed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{maintenanceCount}</div>
                            <p className="text-xs text-muted-foreground">Under repair</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disposed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{disposedCount}</div>
                            <p className="text-xs text-muted-foreground">End of life</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalAssets}</div>
                            <p className="text-xs text-muted-foreground">All assets</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Module Activity Overview */}
            <div className="grid gap-6 md:grid-cols-4">
                {/* Procurement */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Procurement</span>
                            <Link href="/procurement" className="text-sm font-normal text-primary hover:underline">
                                View all →
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-2xl font-bold">
                                    {procurementRequests.filter(r => r.status === 'PENDING').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {procurementRequests.filter(r => r.status === 'APPROVED').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Approved</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {procurementRequests.filter(r => r.status === 'ORDERED').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Ordered</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Recent Requests</p>
                            {procurementRequests.slice(0, 3).map(req => (
                                <div key={req.id} className="text-sm flex justify-between">
                                    <span className="truncate">{req.title}</span>
                                    <Badge variant="outline" className="text-xs">{req.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Maintenance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Maintenance</span>
                            <Link href="/maintenance" className="text-sm font-normal text-primary hover:underline">
                                View all →
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-2xl font-bold">
                                    {maintenanceRequests.filter(r => r.status === 'PENDING').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {maintenanceRequests.filter(r => r.status === 'IN_PROGRESS').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Active</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {maintenanceRequests.filter(r => r.priority === 'CRITICAL').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Critical</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Recent Requests</p>
                            {maintenanceRequests.slice(0, 3).map(req => (
                                <div key={req.id} className="text-sm flex justify-between">
                                    <span className="truncate">{req.title}</span>
                                    <Badge variant={req.priority === 'CRITICAL' ? 'destructive' : 'outline'} className="text-xs">
                                        {req.priority}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Disposal */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Disposal</span>
                            <Link href="/disposal" className="text-sm font-normal text-primary hover:underline">
                                View all →
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-2xl font-bold">
                                    {disposalRequests.filter(r => r.status === 'PENDING').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Pending</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {disposalRequests.filter(r => r.status === 'APPROVED').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Approved</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {disposalRequests.filter(r => r.status === 'COMPLETED').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Completed</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Recent Requests</p>
                            {disposalRequests.slice(0, 3).map(req => (
                                <div key={req.id} className="text-sm flex justify-between">
                                    <span className="truncate">{req.asset.name}</span>
                                    <Badge variant="outline" className="text-xs">{req.reason}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Verification */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Verification</span>
                            <Link href="/stock-verification/campaigns" className="text-sm font-normal text-primary hover:underline">
                                View all →
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-xs text-muted-foreground">Active</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-xs text-muted-foreground">Verified</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">0</div>
                                <div className="text-xs text-muted-foreground">Issues</div>
                            </div>
                        </div>
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No active campaigns</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        <Link href="/procurement/requests/new" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="font-medium">New Procurement</div>
                            <div className="text-sm text-muted-foreground">Create requisition</div>
                        </Link>
                        <Link href="/maintenance/requests/new" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="font-medium">Report Issue</div>
                            <div className="text-sm text-muted-foreground">Maintenance request</div>
                        </Link>
                        <Link href="/disposal/requests/new" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="font-medium">Dispose Asset</div>
                            <div className="text-sm text-muted-foreground">End of life</div>
                        </Link>
                        <Link href="/stock-verification/campaigns/new" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="font-medium">Start Verification</div>
                            <div className="text-sm text-muted-foreground">New campaign</div>
                        </Link>
                        <Link href="/assets" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="font-medium">View Assets</div>
                            <div className="text-sm text-muted-foreground">Browse inventory</div>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
