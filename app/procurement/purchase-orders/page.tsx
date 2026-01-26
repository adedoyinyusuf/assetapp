import { procurementService } from "@/lib/procurement/procurement-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function PurchaseOrdersPage() {
    const purchaseOrders = await procurementService.getPurchaseOrders({ limit: 50 });

    const draftCount = purchaseOrders.filter(po => po.status === 'DRAFT').length;
    const activeCount = purchaseOrders.filter(po => ['OPEN', 'IN_PROGRESS', 'ON_HOLD'].includes(po.status)).length;
    const completedCount = purchaseOrders.filter(po => po.status === 'COMPLETED').length;

    return (
        <div className="container py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground">Track and manage vendor orders</p>
                </div>
                <Link href="/procurement">
                    <Button variant="outline">← Back to Procurement</Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-gray-400 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Draft POs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700">{draftCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active POs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{activeCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed POs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{completedCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {purchaseOrders.map((po) => (
                            <Link
                                key={po.id}
                                href={`/procurement/purchase-orders/${po.id}`}
                                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium leading-none">{po.poNumber}</p>
                                        <span className="text-xs text-muted-foreground">• {po.vendor.name}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {po.items.length} items • ₦{Number(po.totalAmount).toLocaleString()} • Created by {po.creator.firstName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={
                                        po.status === 'DRAFT' ? 'secondary' :
                                            po.status === 'COMPLETED' ? 'default' :
                                                po.status === 'CANCELLED' ? 'destructive' : 'outline'
                                    }>
                                        {po.status}
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                        {purchaseOrders.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No purchase orders found.</p>
                                <p className="text-sm mt-2">Approve procurement requests to create purchase orders.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
