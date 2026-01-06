import { procurementService } from "@/lib/procurement/procurement-service";
import { createPurchaseOrderFromRequest } from "@/app/procurement/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function CreatePurchaseOrderPage({
    searchParams
}: {
    searchParams: { requestId?: string }
}) {
    const requestId = searchParams.requestId ? parseInt(searchParams.requestId) : null;

    // Get vendors for the dropdown
    const vendors = await procurementService.getVendors();

    let request = null;
    if (requestId) {
        const requests = await procurementService.getRequests({ limit: 100 });
        request = requests.find(r => r.id === requestId);

        if (!request || request.status !== 'APPROVED') {
            redirect('/procurement');
        }
    }

    return (
        <div className="container py-10 max-w-3xl">
            <div className="mb-6">
                <Link href="/procurement" className="text-sm text-muted-foreground hover:underline">
                    ← Back to Procurement
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Purchase Order</CardTitle>
                    {request && (
                        <p className="text-sm text-muted-foreground">
                            From Request: {request.title}
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <form action={createPurchaseOrderFromRequest} className="space-y-6">
                        {request && (
                            <input type="hidden" name="requestId" value={request.id} />
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor</Label>
                            <Select name="vendorId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map((vendor) => (
                                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                                            {vendor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="poNumber">PO Number</Label>
                            <Input
                                name="poNumber"
                                placeholder="e.g., PO-2025-001"
                                defaultValue={`PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                            <Input
                                type="date"
                                name="expectedDate"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                name="notes"
                                placeholder="Additional instructions or notes..."
                                className="min-h-[100px]"
                            />
                        </div>

                        {request && (
                            <div className="border rounded-lg p-4 bg-muted/50">
                                <h3 className="font-semibold mb-3">Items from Request</h3>
                                <div className="space-y-2 text-sm">
                                    {request.items.map((item) => (
                                        <div key={item.id} className="flex justify-between">
                                            <span>{item.itemName} (x{item.quantity})</span>
                                            <span className="font-medium">₦{Number(item.estimatedPrice).toLocaleString()}/unit</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 justify-end">
                            <Link href="/procurement">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit">Create Purchase Order</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
