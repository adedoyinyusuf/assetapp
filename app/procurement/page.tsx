import { procurementService } from "@/lib/procurement/procurement-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ProcurementDashboard() {
    const requests = await procurementService.getRequests({ limit: 10 });

    return (
        <div className="container py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
                    <p className="text-muted-foreground">Manage requisitions and purchase orders</p>
                </div>
                <div className="space-x-4">
                    <Link href="/procurement/requests/new">
                        <Button>New Requisition</Button>
                    </Link>
                    <Link href="/procurement/vendors">
                        <Button variant="outline">Manage Vendors</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.status === 'PENDING').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active POs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {/* Mock count for now */}
                            0
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Requisitions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <Link
                                key={request.id}
                                href={`/procurement/requests/${request.id}`}
                                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded transition-colors"
                            >
                                <div className="space-y-1">
                                    <p className="font-medium leading-none">{request.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Requested by {request.requester.firstName} • {request.items.length} items • ₦{Number(request.totalEstimatedCost).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={request.status === 'PENDING' ? 'secondary' : request.status === 'APPROVED' ? 'default' : 'destructive'}>
                                        {request.status}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                        {requests.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">No requisitions found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
