import { db } from "@/lib/db";
import { createCampaign } from "@/app/stock-verification/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default async function NewCampaignPage() {
    // Fetch states, LGAs, and categories for selection
    const [states, categories] = await Promise.all([
        db.state.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        db.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ]);

    return (
        <div className="container py-10 max-w-4xl">
            <div className="mb-6">
                <Link href="/stock-verification/campaigns" className="text-sm text-muted-foreground hover:underline">
                    ← Back to Campaigns
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Create Verification Campaign</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Set up a new asset verification campaign to track and verify assets across locations
                    </p>
                </CardHeader>
                <CardContent>
                    <form action={createCampaign} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>

                            <div className="space-y-2">
                                <Label htmlFor="name">Campaign Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Q1 2025 State Asset Verification"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe the purpose and scope of this campaign..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Timeline</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        type="date"
                                        id="endDate"
                                        name="endDate"
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Scope */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Campaign Scope</h3>

                            <div className="space-y-2">
                                <Label htmlFor="states">States (Leave empty for all states)</Label>
                                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {states.map((state) => (
                                        <div key={state.id} className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id={`state-${state.id}`}
                                                name="assignedStates"
                                                value={state.id}
                                                className="rounded border-gray-300"
                                            />
                                            <label htmlFor={`state-${state.id}`} className="text-sm">
                                                {state.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="categories">Asset Categories (Leave empty for all categories)</Label>
                                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {categories.map((category) => (
                                        <div key={category.id} className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id={`category-${category.id}`}
                                                name="assignedCategories"
                                                value={category.id}
                                                className="rounded border-gray-300"
                                            />
                                            <label htmlFor={`category-${category.id}`} className="text-sm">
                                                {category.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Budget & Instructions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Additional Details</h3>

                            <div className="space-y-2">
                                <Label htmlFor="budget">Budget (₦)</Label>
                                <Input
                                    type="number"
                                    id="budget"
                                    name="budget"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instructions">Instructions for Team</Label>
                                <Textarea
                                    id="instructions"
                                    name="instructions"
                                    placeholder="Provide detailed instructions for verification team members..."
                                    className="min-h-[150px]"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end pt-6 border-t">
                            <Link href="/stock-verification/campaigns">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit">Create Campaign</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
