import { maintenanceService } from "@/lib/maintenance/maintenance-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function MaintenanceDashboard() {
    const requests = await maintenanceService.getRequests({ limit: 10 });

    return (
        <div className="container py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
                    <p className="text-muted-foreground">Manage asset repairs and work orders</p>
                </div>
                <Link href="/maintenance/requests/new">
                    <Button>New Request</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.status !== 'COMPLETED').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Work Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.workOrder?.status === 'OPEN').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="font-medium leading-none">{request.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {request.asset.name} • Requested by {request.requester.firstName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={request.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
                                        {request.priority}
                                    </Badge>
                                    <Badge variant="outline">{request.status}</Badge>
                                </div>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">No maintenance requests found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
