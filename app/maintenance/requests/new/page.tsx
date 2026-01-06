import { createMaintenanceRequest } from "@/app/maintenance/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";

export default async function NewRequestPage() {
    // Fetch assets for the dropdown - only show active assets (not disposed)
    const assets = await db.asset.findMany({
        where: {
            status: {
                not: 'DISPOSED'
            }
        },
        select: { id: true, name: true, status: true },
        take: 100, // Limit for demo
        orderBy: { name: 'asc' }
    });

    return (
        <div className="container py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>New Maintenance Request</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createMaintenanceRequest} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="asset">Asset</Label>
                            <Select name="assetId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an asset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assets.map((asset) => (
                                        <SelectItem key={asset.id} value={asset.id.toString()}>
                                            {asset.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input name="title" placeholder="e.g., Generator overheating" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                name="description"
                                placeholder="Describe the issue in detail..."
                                required
                                className="min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select name="priority" defaultValue="MEDIUM" required>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full">Submit Request</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
