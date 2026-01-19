'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationActivity {
    id: number;
    assetName: string;
    status: string;
    verifiedBy: string;
    timestamp: string;
    condition?: string;
}

interface ActivityFeedProps {
    activities: VerificationActivity[];
    isLoading?: boolean;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'VERIFIED':
            return { label: 'Verified', className: 'bg-green-100 text-green-700 border-green-200' };
        case 'DISCREPANCY':
            return { label: 'Discrepancy', className: 'bg-red-100 text-red-700 border-red-200' };
        case 'PENDING':
            return { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
        default:
            return { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'VERIFIED':
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        case 'DISCREPANCY':
            return <AlertTriangle className="h-4 w-4 text-red-600" />;
        default:
            return <Clock className="h-4 w-4 text-yellow-600" />;
    }
};

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Loading verification activity...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                                <div className="h-10 w-10 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>No verification activity yet</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Verification activity will appear here</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest {activities.length} verifications</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {activities.map((activity) => {
                        const statusBadge = getStatusBadge(activity.status);
                        const initials = activity.verifiedBy
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{activity.assetName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                by {activity.verifiedBy}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(activity.status)}
                                            <Badge variant="outline" className={statusBadge.className}>
                                                {statusBadge.label}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span>{format(new Date(activity.timestamp), 'MMM d, h:mm a')}</span>
                                        {activity.condition && (
                                            <span className="px-2 py-0.5 bg-muted rounded">
                                                Condition: {activity.condition}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
