'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { animations } from '@/lib/ui-utils';

interface AssetVerificationStatusProps {
    assetId: number;
    compact?: boolean;
}

interface LatestVerification {
    status: string;
    physicalCondition: string;
    verificationDate: string;
    daysAgo: number;
}

const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
    VERIFIED: { variant: 'default', icon: CheckCircle2, label: 'Verified' },
    PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
    DISCREPANCY_FOUND: { variant: 'destructive', icon: AlertCircle, label: 'Issue' },
    MISSING: { variant: 'destructive', icon: XCircle, label: 'Missing' },
    DAMAGED: { variant: 'destructive', icon: AlertCircle, label: 'Damaged' },
};

export default function AssetVerificationStatus({ assetId, compact = false }: AssetVerificationStatusProps) {
    const [verification, setVerification] = useState<LatestVerification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLatestVerification();
    }, [assetId]);

    const fetchLatestVerification = async () => {
        try {
            const response = await fetch(`/api/assets/${assetId}/verification-status`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setVerification(data.data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch verification status:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Badge variant="outline">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Loading...
            </Badge>
        );
    }

    if (!verification) {
        return (
            <Badge variant="outline" className="text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                Not Verified
            </Badge>
        );
    }

    const config = statusConfig[verification.status] || statusConfig.PENDING;
    const Icon = config.icon;
    const isRecent = verification.daysAgo <= 30;

    if (compact) {
        return (
            <Badge variant={config.variant} className={`gap-1 ${animations.fadeIn}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${animations.fadeIn}`}>
            <Badge variant={config.variant} className="gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
            <span className={`text-xs ${isRecent ? 'text-muted-foreground' : 'text-warning'}`}>
                {verification.daysAgo === 0
                    ? 'Today'
                    : verification.daysAgo === 1
                        ? 'Yesterday'
                        : `${verification.daysAgo} days ago`}
            </span>
        </div>
    );
}
