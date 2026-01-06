import { createDisposalRequest } from "@/app/disposal/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DisposalReason } from "@prisma/client";

export default function NewDisposalRequestPage() {
    return (
        <div className="container py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Request Asset Disposal</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createDisposalRequest} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="assetId">Asset ID</Label>
                            <Input name="assetId" type="number" placeholder="Enter Asset ID" required />
                            <p className="text-xs text-muted-foreground">In a real app, this would be a search/select.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Disposal</Label>
                            <Select name="reason" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(DisposalReason).map((reason) => (
                                        <SelectItem key={reason} value={reason}>
                                            {reason}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description / Notes</Label>
                            <Textarea name="description" placeholder="Additional details..." />
                        </div>

                        <Button type="submit" className="w-full">Submit Request</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
