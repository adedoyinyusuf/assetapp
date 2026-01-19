'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VerificationHistorySkeleton } from '@/components/ui/skeletons';
import { mobileOptimized, animations } from '@/lib/ui-utils';
import {
    CheckCircle2, AlertCircle, Clock, MapPin, FileText,
    ChevronRight, Loader2, Camera, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Verification {
    id: number;
    campaignId: number;
    status: string;
    physicalCondition: string;
    locationAccurate: boolean;
    notes?: string;
    verificationDate: string;
    verifier: {
        firstName?: string;
        lastName?: string;
    };
    campaign: {
        name: string;
        status: string;
    };
}

interface VerificationHistoryWidgetProps {
    assetId: number;
}

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    VERIFIED: { color: 'bg-success', label: 'Verified', icon: CheckCircle2 },
    PENDING: { color: 'bg-warning', label: 'Pending', icon: Clock },
    DISCREPANCY_FOUND: { color: 'bg-destructive', label: 'Issue Found', icon: AlertCircle },
    MISSING: { color: 'bg-destructive', label: 'Missing', icon: AlertCircle },
    DAMAGED: { color: 'bg-destructive', label: 'Damaged', icon: AlertCircle },
};

const conditionConfig: Record<string, { color: string; label: string }> = {
    EXCELLENT: { color: 'text-success', label: 'Excellent' },
    GOOD: { color: 'text-primary', label: 'Good' },
    FAIR: { color: 'text-warning', label: 'Fair' },
    POOR: { color: 'text-destructive', label: 'Poor' },
    DAMAGED: { color: 'text-destructive', label: 'Damaged' },
    MISSING: { color: 'text-muted-foreground', label: 'Missing' },
};

export default function VerificationHistoryWidget({ assetId }: VerificationHistoryWidgetProps) {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchVerifications();
    }, [assetId]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/assets/${assetId}/verifications`);

            if (!response.ok) {
                throw new Error('Failed to load verification history');
            }

            const data = await response.json();
            if (data.success) {
                setVerifications(data.data || []);
            } else {
                throw new Error(data.error || 'Failed to fetch verifications');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load verifications');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const displayedVerifications = showAll ? verifications : verifications.slice(0, 3);
    const latestVerification = verifications[0];

    if (loading) {
        return <VerificationHistorySkeleton />;
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Verification History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Verification History
                        </CardTitle>
                        <CardDescription>
                            {verifications.length} verification{verifications.length !== 1 ? 's' : ''} recorded
                        </CardDescription>
                    </div>
                    {latestVerification && (
                        <Badge className={statusConfig[latestVerification.status]?.color || 'bg-secondary'}>
                            Latest: {statusConfig[latestVerification.status]?.label || latestVerification.status}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {verifications.length === 0 ? (
                    <div className="text-center py-8">
                        <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">No verifications recorded yet</p>
                        <Button size="sm" className={mobileOptimized.touchTarget} asChild>
                            <Link href={`/stock-verification/verifications/new?assetId=${assetId}`}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Verify This Asset
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className={`space-y-4 ${animations.fadeIn}`}>
                        {displayedVerifications.map((verification, index) => {
                            const statusInfo = statusConfig[verification.status] || {
                                color: 'bg-secondary',
                                label: verification.status,
                                icon: FileText
                            };
                            const conditionInfo = conditionConfig[verification.physicalCondition] || {
                                color: 'text-foreground',
                                label: verification.physicalCondition
                            };

                            return (
                                <div
                                    key={verification.id}
                                    className={`p-4 rounded-lg border ${animations.hoverLift} transition-all ${index === 0 ? 'bg-muted/50 border-primary' : 'bg-background'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <statusInfo.icon className="w-4 h-4" />
                                                <span className="font-medium">
                                                    {verification.campaign.name}
                                                </span>
                                                {index === 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Latest
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Verified by {verification.verifier.firstName} {verification.verifier.lastName} on {formatDate(verification.verificationDate)}
                                            </p>
                                        </div>
                                        <Badge className={statusInfo.color}>
                                            {statusInfo.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Condition</p>
                                            <p className={`font-medium ${conditionInfo.color}`}>
                                                {conditionInfo.label}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Location</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {verification.locationAccurate ? 'Accurate' : 'Mismatch'}
                                            </p>
                                        </div>
                                    </div>

                                    {verification.notes && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm text-muted-foreground mb-1">Notes</p>
                                            <p className="text-sm">{verification.notes}</p>
                                        </div>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <Button variant="ghost" size="sm" className={mobileOptimized.touchTarget} asChild>
                                            <Link href={`/stock-verification/campaigns/${verification.campaignId}`}>
                                                View Campaign
                                                <ExternalLink className="w-3 h-3 ml-2" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        {verifications.length > 3 && (
                            <Button
                                variant="outline"
                                className={`w-full ${mobileOptimized.touchTarget}`}
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? 'Show Less' : `Show All ${verifications.length} Verifications`}
                                <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showAll ? 'rotate-90' : ''}`} />
                            </Button>
                        )}

                        <div className="pt-4 border-t">
                            <Button variant="outline" className={`w-full ${mobileOptimized.touchTarget}`} asChild>
                                <Link href={`/stock-verification/verifications/new?assetId=${assetId}`}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Verify Again
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
