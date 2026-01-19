'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface VerificationCardProps {
    verification: {
        id: number;
        assetName: string;
        assetId: number;
        status: string;
        verifiedBy?: string;
        verificationDate: string;
        location?: string;
        condition?: string;
        notes?: string;
        photosCount?: number;
    };
    onViewDetails?: (id: number) => void;
}

const getStatusColor = (status: string) => {
    const statusColors = {
        VERIFIED: 'bg-green-500/15 text-green-700 border-green-200',
        DISCREPANCY: 'bg-red-500/15 text-red-700 border-red-200',
        PENDING: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
        IN_PROGRESS: 'bg-blue-500/15 text-blue-700 border-blue-200',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/15 text-gray-700 border-gray-200';
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'VERIFIED':
            return <CheckCircle className="h-4 w-4" />;
        case 'DISCREPANCY':
            return <XCircle className="h-4 w-4" />;
        case 'IN_PROGRESS':
            return <Clock className="h-4 w-4" />;
        default:
            return <Clock className="h-4 w-4" />;
    }
};

export function VerificationCard({ verification, onViewDetails }: VerificationCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-base font-semibold">
                            {verification.assetName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            Asset ID: {verification.assetId}
                        </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(verification.status)}>
                        <span className="flex items-center gap-1">
                            {getStatusIcon(verification.status)}
                            {verification.status.replace('_', ' ')}
                        </span>
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {verification.verifiedBy && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate">{verification.verifiedBy}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(verification.verificationDate).toLocaleDateString()}</span>
                    </div>

                    {verification.location && (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{verification.location}</span>
                        </div>
                    )}
                </div>

                {verification.condition && (
                    <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Condition:</p>
                        <Badge variant="secondary" className="text-xs">
                            {verification.condition}
                        </Badge>
                    </div>
                )}

                {verification.notes && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {verification.notes}
                        </p>
                    </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                    {verification.photosCount !== undefined && (
                        <span className="text-xs text-muted-foreground">
                            📸 {verification.photosCount} photo{verification.photosCount !== 1 ? 's' : ''}
                        </span>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => onViewDetails?.(verification.id)}
                        asChild={!onViewDetails}
                    >
                        {onViewDetails ? (
                            <>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                            </>
                        ) : (
                            <Link href={`/stock-verification/verifications/${verification.id}`}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                            </Link>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
