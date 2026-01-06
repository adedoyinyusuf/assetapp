import { db } from "@/lib/db";
import { createVerification } from "@/app/stock-verification/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default async function NewVerificationPage() {
    // Fetch active campaigns and assets
    const [campaigns, assets] = await Promise.all([
        db.verificationCampaign.findMany({
            where: {
                status: {
                    in: ['ACTIVE', 'PLANNED']
                }
            },
            select: {
                id: true,
                name: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        db.asset.findMany({
            where: {
                status: {
                    not: 'DISPOSED'
                }
            },
            select: {
                id: true,
                name: true,
                serialNumber: true,
                category: {
                    select: { name: true }
                },
                state: {
                    select: { name: true }
                },
                lga: {
                    select: { name: true }
                }
            },
            orderBy: { name: 'asc' },
            take: 500, // Limit for performance
        }),
    ]);

    return (
        <div className="container py-10 max-w-4xl">
            <div className="mb-6">
                <Link href="/stock-verification/verifications" className="text-sm text-muted-foreground hover:underline">
                    ← Back to Verifications
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">New Asset Verification</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Record verification details for an asset
                    </p>
                </CardHeader>
                <CardContent>
                    <form action={createVerification} className="space-y-6">
                        {/* Campaign Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="campaignId">Campaign *</Label>
                            <Select name="campaignId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a campaign" />
                                </SelectTrigger>
                                <SelectContent>
                                    {campaigns.map((campaign) => (
                                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                            {campaign.name} ({campaign.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {campaigns.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No active campaigns available. <Link href="/stock-verification/campaigns/new" className="text-primary hover:underline">Create one first</Link>
                                </p>
                            )}
                        </div>

                        {/* Asset Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="assetId">Asset to Verify *</Label>
                            <select
                                name="assetId"
                                required
                                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select an asset...</option>
                                {assets.map((asset) => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.name} {asset.serialNumber ? `(SN: ${asset.serialNumber})` : ''} - {asset.category.name} - {asset.state.name}, {asset.lga.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Can't find the asset? Use QR scanner or search by serial number
                            </p>
                        </div>

                        {/* QR Code Option */}
                        <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">📷</span>
                                <Label className="text-base font-semibold">Quick Scan</Label>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Alternatively, scan the asset's QR code for instant identification
                            </p>
                            <Input
                                type="text"
                                name="qrCode"
                                placeholder="Scan or enter QR code..."
                            />
                        </div>

                        {/* Verification Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Verification Details</h3>

                            <div className="space-y-2">
                                <Label htmlFor="physicalCondition">Physical Condition *</Label>
                                <Select name="physicalCondition" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assess condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXCELLENT">Excellent - Like new</SelectItem>
                                        <SelectItem value="GOOD">Good - Minor wear</SelectItem>
                                        <SelectItem value="FAIR">Fair - Visible wear, functional</SelectItem>
                                        <SelectItem value="POOR">Poor - Significant wear</SelectItem>
                                        <SelectItem value="DAMAGED">Damaged - Needs repair</SelectItem>
                                        <SelectItem value="MISSING">Missing - Not found</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="locationAccurate">Location Verification *</Label>
                                <Select name="locationAccurate" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Verify location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">✓ Location is accurate</SelectItem>
                                        <SelectItem value="false">✗ Location mismatch</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Verification Notes</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    placeholder="Record any observations, issues, or additional information..."
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="photoUrls">Photo Evidence (Optional)</Label>
                                <Input
                                    type="file"
                                    id="photos"
                                    name="photos"
                                    accept="image/*"
                                    multiple
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload photos of the asset (max 5 photos, 5MB each)
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                            <Label className="text-sm font-semibold mb-2">Quick Actions After Verification</Label>
                            <div className="space-y-2 mt-3">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="createMaintenance"
                                        name="createMaintenance"
                                        className="rounded border-gray-300"
                                    />
                                    <label htmlFor="createMaintenance" className="text-sm">
                                        Create maintenance request if damaged
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="createDiscrepancy"
                                        name="createDiscrepancy"
                                        className="rounded border-gray-300"
                                    />
                                    <label htmlFor="createDiscrepancy" className="text-sm">
                                        Report discrepancy if location/condition issues found
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end pt-6 border-t">
                            <Link href="/stock-verification/verifications">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit">Submit Verification</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
