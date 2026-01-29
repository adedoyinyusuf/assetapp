import { disposalService } from "@/lib/disposal/disposal-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function DisposalDashboard() {
    const requests = await disposalService.getRequests({ limit: 10 });

    return (
        <div className="container py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Asset Disposal</h1>
                    <p className="text-muted-foreground">Manage end-of-life assets</p>
                </div>
                <Link href="/disposal/requests/new">
                    <Button>Request Disposal</Button>
                </Link>
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
                        <CardTitle className="text-sm font-medium">Completed Disposals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.status === 'COMPLETED').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Disposal Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="font-medium leading-none">{request.asset.name} ({request.asset.serialNumber})</p>
                                    <p className="text-sm text-muted-foreground">
                                        Reason: {request.reason} • Requested by {request.requester.firstName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={request.status === 'PENDING' ? 'secondary' : 'default'}>
                                        {request.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">No disposal requests found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
