import { procurementService } from "@/lib/procurement/procurement-service";
import { approveProcurementRequest, rejectProcurementRequest } from "@/app/procurement/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProcurementRequestDetailPage({ params }: { params: { id: string } }) {
    const requestId = parseInt(params.id);

    // Get the specific request
    const requests = await procurementService.getRequests({ limit: 100 });
    const request = requests.find(r => r.id === requestId);

    if (!request) {
        notFound();
    }

    const totalEstimated = request.items.reduce((sum, item) =>
        sum + (item.quantity * Number(item.estimatedPrice)), 0
    );

    const canApprove = request.status === 'PENDING';

    return (
        <div className="container py-10 max-w-4xl">
            <div className="mb-6">
                <Link href="/procurement" className="text-sm text-muted-foreground hover:underline">
                    ← Back to Procurement
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{request.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Request #{request.id} • Requested by {request.requester.firstName} {request.requester.lastName}
                            </p>
                        </div>
                        <Badge variant={request.status === 'PENDING' ? 'secondary' : request.status === 'APPROVED' ? 'default' : 'destructive'}>
                            {request.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Description */}
                    {request.description && (
                        <div>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-muted-foreground">{request.description}</p>
                        </div>
                    )}

                    {request.reason && (
                        <div>
                            <h3 className="font-semibold mb-2">Reason</h3>
                            <p className="text-muted-foreground">{request.reason}</p>
                        </div>
                    )}

                    <Separator />

                    {/* Items */}
                    <div>
                        <h3 className="font-semibold mb-4">Requested Items</h3>
                        <div className="space-y-3">
                            {request.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.itemName}</p>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                        )}
                                        <p className="text-sm mt-1">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">₦{Number(item.estimatedPrice).toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">per unit</p>
                                        <p className="text-sm font-medium mt-1">
                                            Total: ₦{(item.quantity * Number(item.estimatedPrice)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
                                <p className="text-2xl font-bold">₦{totalEstimated.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Approval Actions */}
                    {canApprove && (
                        <>
                            <Separator />
                            <div className="flex gap-4 justify-end">
                                <form action={rejectProcurementRequest}>
                                    <input type="hidden" name="requestId" value={request.id} />
                                    <Button type="submit" variant="outline">
                                        Reject Request
                                    </Button>
                                </form>
                                <form action={approveProcurementRequest}>
                                    <input type="hidden" name="requestId" value={request.id} />
                                    <Button type="submit">
                                        Approve Request
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}

                    {/* Approval/Rejection Info */}
                    {request.status === 'APPROVED' && (
                        <>
                            <Separator />
                            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-3">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    ✓ Request Approved
                                </p>
                                <Link href={`/procurement/purchase-orders/new?requestId=${request.id}`}>
                                    <Button className="w-full">
                                        Create Purchase Order →
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}

                    {request.status === 'REJECTED' && (
                        <>
                            <Separator />
                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium">Request Rejected</p>
                                {/* We'll show rejector info once the service is updated */}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
