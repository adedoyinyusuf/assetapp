import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, Wrench, Trash2, CheckCircle2, AlertTriangle, MapPin, User, Calendar, Eye } from "lucide-react";

export default async function VerificationDetailPage({ params }: { params: { id: string } }) {
    const verificationId = parseInt(params.id);

    const verification = await db.assetVerification.findUnique({
        where: { id: verificationId },
        include: {
            asset: {
                include: {
                    category: true,
                    state: true,
                    lga: true
                }
            },
            verifier: true,
            campaign: true,
        }
    });

    if (!verification) {
        notFound();
    }

    // Parse coordinates if available
    const coordinates = verification.coordinates ? {
        latitude: verification.coordinates.split(',')[0]?.trim() || 'N/A',
        longitude: verification.coordinates.split(',')[1]?.trim() || 'N/A'
    } : null;

    const statusColors: Record<string, string> = {
        VERIFIED: "bg-green-100 text-green-800 border-green-200",
        DISCREPANCY_FOUND: "bg-red-100 text-red-800 border-red-200", // Fixed status key
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const conditionColors: Record<string, string> = {
        NEW: "bg-blue-100 text-blue-800",
        GOOD: "bg-green-100 text-green-800",
        FAIR: "bg-yellow-100 text-yellow-800",
        POOR: "bg-orange-100 text-orange-800",
        DAMAGED: "bg-red-100 text-red-800", // Fixed key
        SCRAP: "bg-gray-100 text-gray-800",
    };

    return (
        <div className="container py-8 max-w-4xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div>
                <Link
                    href="/stock-verification/verifications"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Verifications
                </Link>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold tracking-tight">Verification #{verification.id}</h1>
                        <Badge className={statusColors[verification.status] || "bg-gray-100"}>
                            {verification.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        Verified on {new Date(verification.verificationDate).toLocaleDateString()} at {new Date(verification.verificationDate).toLocaleTimeString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Asset Condition</p>
                                    <Badge variant="outline" className={`mt-1 ${verification.physicalCondition ? conditionColors[verification.physicalCondition] : ''}`}>
                                        {verification.physicalCondition || 'N/A'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Location Accurate</p>
                                    <p className="font-medium mt-1">{verification.locationAccurate ? "Yes" : "No"}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                                <p className="whitespace-pre-wrap text-sm">
                                    {verification.notes || "No notes provided."}
                                </p>
                            </div>

                            {(coordinates || verification.actualLocation) && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Location Data</p>
                                        <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                                            {coordinates && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>Lat: {coordinates.latitude}, Long: {coordinates.longitude}</span>
                                                </div>
                                            )}
                                            {verification.actualLocation && (
                                                <p className="pl-6 pt-1">{verification.actualLocation}</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Asset Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Link href={`/assets/${verification.assetId}`} className="text-lg font-semibold hover:underline flex items-center gap-2">
                                    {verification.asset.name}
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                                <p className="text-sm text-muted-foreground">{verification.asset.category.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">State:</span> {verification.asset.state.name}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">LGA:</span> {verification.asset.lga.name}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {/* Quick Actions Card - INTEGRATION FEATURE */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-primary flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button asChild className="w-full" variant="outline">
                                <Link href={`/assets/${verification.assetId}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Full Asset
                                </Link>
                            </Button>

                            {(verification.physicalCondition === 'POOR' || verification.physicalCondition === 'DAMAGED') && (
                                <Button asChild className="w-full" variant="secondary">
                                    <Link href={`/maintenance/new?assetId=${verification.assetId}&source=verification&sourceId=${verification.id}`}>
                                        <Wrench className="mr-2 h-4 w-4" />
                                        Schedule Maintenance
                                    </Link>
                                </Button>
                            )}

                            {(verification.physicalCondition === 'MISSING' || verification.physicalCondition === 'DAMAGED') && (
                                <Button asChild className="w-full" variant="destructive">
                                    <Link href={`/disposal/new?assetId=${verification.assetId}&source=verification&sourceId=${verification.id}`}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Recommend Disposal
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Meta Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Verifier</p>
                                    <p className="text-muted-foreground">{verification.verifier.firstName} {verification.verifier.lastName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Campaign</p>
                                    <Link href={`/stock-verification/campaigns/${verification.campaignId}`} className="text-primary hover:underline">
                                        {verification.campaign.name}
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
