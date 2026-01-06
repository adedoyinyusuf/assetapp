import { createProcurementRequest } from "@/app/procurement/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewRequisitionPage() {
    return (
        <div className="container py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>New Purchase Requisition</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createProcurementRequest} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input name="title" placeholder="e.g., Office Supplies Q4" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea name="reason" placeholder="Why is this needed?" />
                        </div>

                        <div className="border p-4 rounded-md space-y-4">
                            <h3 className="font-medium">Item Details (Single Item for Demo)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="itemName">Item Name</Label>
                                    <Input name="itemName" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input name="quantity" type="number" min="1" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estimatedPrice">Est. Price (Per Unit)</Label>
                                <Input name="estimatedPrice" type="number" min="0" step="0.01" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="itemDescription">Description</Label>
                                <Input name="itemDescription" />
                            </div>
                        </div>

                        <Button type="submit" className="w-full">Submit Requisition</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
