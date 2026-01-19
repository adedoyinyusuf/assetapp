'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Verification {
    id: number;
    status: string;
    condition: string;
    verifiedAt: string;
    notes?: string;
    verifiedByUser: {
        firstName?: string;
        lastName?: string;
        email: string;
    };
    campaign?: {
        name: string;
    };
}

interface VerificationHistoryWidgetProps {
    assetId: number;
}

const statusConfig = {
    VERIFIED: { label: 'Verified', icon: CheckCircle2, color: 'bg-success text-success-foreground' },
    DISCREPANCY: { label: 'Discrepancy', icon: AlertCircle, color: 'bg-destructive text-destructive-foreground' },
    PENDING: { label: 'Pending', icon: Clock, color: 'bg-warning text-warning-foreground' },
};

const conditionColors = {
    EXCELLENT: 'text-success',
    GOOD: 'text-success',
    FAIR: 'text-warning',
    POOR: 'text-destructive',
    DAMAGED: 'text-destructive',
};

export function VerificationHistoryWidget({ assetId }: VerificationHistoryWidgetProps) {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVerifications();
    }, [assetId]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/stock-verification/verifications?assetId=${assetId}&sortBy=verifiedAt&sortOrder=desc`);
            const data = await response.json();

            if (data.success) {
                setVerifications(data.data || []);
            } else {
                setError(data.error || 'Failed to load verification history');
            }
        } catch (err) {
            setError('Failed to load verification history');
            console.error('Error fetching verifications:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verification History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verification History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (verifications.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Verification History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No verifications recorded for this asset yet.</p>
                        <Link href="/stock-verification/verifications/new">
                            <Button variant="outline" className="mt-4">
                                Create First Verification
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Verification History</span>
                    <Badge variant="secondary">{verifications.length} verification{verifications.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {verifications.map((verification) => {
                        const statusInfo = statusConfig[verification.status as keyof typeof statusConfig] || statusConfig.PENDING;
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div key={verification.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className={`p-2 rounded-full ${statusInfo.color}`}>
                                    <StatusIcon className="h-5 w-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                                        <Badge variant="outline" className={conditionColors[verification.condition as keyof typeof conditionColors]}>
                                            {verification.condition}
                                        </Badge>
                                    </div>

                                    <p className="text-sm font-medium">
                                        Verified by {verification.verifiedByUser.firstName || verification.verifiedByUser.email}
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(verification.verifiedAt), 'PPP p')}
                                    </p>

                                    {verification.campaign && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Campaign: {verification.campaign.name}
                                        </p>
                                    )}

                                    {verification.notes && (
                                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                                            {verification.notes}
                                        </p>
                                    )}
                                </div>

                                <Link href={`/stock-verification/verifications/${verification.id}`}>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Details
                                    </Button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
