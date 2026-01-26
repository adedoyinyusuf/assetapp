import { db } from "@/lib/db";
import { procurementService } from "@/lib/procurement/procurement-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiveItemsModal } from "@/components/procurement/ReceiveItemsModal";
import { Separator } from "@/components/ui/separator";

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
    const poId = parseInt(params.id);
    if (isNaN(poId)) notFound();

    const po = await db.purchaseOrder.findUnique({
        where: { id: poId },
        include: {
            vendor: true,
            creator: { select: { firstName: true, lastName: true, email: true } },
            items: true,
            request: { select: { title: true } }
        }
    });

    if (!po) notFound();

    // Fetch States and LGAs for receiving
    const states = await db.state.findMany({ orderBy: { name: 'asc' } });
    const lgas = await db.lGA.findMany({ orderBy: { name: 'asc' } });

    const isFullyReceived = po.items.every(item => (item.receivedQuantity || 0) >= item.quantity);

    return (
        <div className="container py-10 max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/procurement/purchase-orders" className="text-sm text-muted-foreground hover:underline">
                            ← Back to POs
                        </Link>
                        <Badge variant={po.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {po.status}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{po.poNumber}</h1>
                    <p className="text-muted-foreground">
                        Vendor: <span className="font-medium text-foreground">{po.vendor.name}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Only show receive button if not cancelled and not fully received */}
                    {po.status !== 'CANCELLED' && !isFullyReceived && (
                        <ReceiveItemsModal po={po} states={states} lgas={lgas} />
                    )}
                    {/* Add Print/Export buttons here later */}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {po.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start border-b last:border-0 pb-4 last:pb-0">
                                        <div>
                                            <h4 className="font-semibold">{item.itemName}</h4>
                                            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                                            <p className="text-sm mt-1">
                                                Qty: {item.quantity} × ₦{Number(item.unitPrice).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">₦{Number(item.totalPrice).toLocaleString()}</p>
                                            <div className="mt-1">
                                                <Badge variant="outline" className={
                                                    (item.receivedQuantity || 0) >= item.quantity
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                }>
                                                    Received: {item.receivedQuantity || 0} / {item.quantity}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-semibold">Total Amount</span>
                                    <span className="text-xl font-bold">₦{Number(po.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {po.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm">{po.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Created By</span>
                                <span className="font-medium">{po.creator.firstName} {po.creator.lastName}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Created Date</span>
                                <span className="font-medium">{new Date(po.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Expected Delivery</span>
                                <span className="font-medium">
                                    {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : 'Not set'}
                                </span>
                            </div>
                            {po.request && (
                                <div>
                                    <span className="text-muted-foreground block">Linked Request</span>
                                    <span className="font-medium">{po.request.title}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Vendor Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Address</span>
                                <span className="font-medium">{po.vendor.address || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Contact</span>
                                <span className="font-medium">{po.vendor.contactPerson || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Phone</span>
                                <span className="font-medium">{po.vendor.phone || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
