'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/design-system';
import { Activity, User, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface Verification {
    id: number;
    asset: { name: string; serialNumber?: string };
    verifier: { firstName?: string; lastName?: string; email: string };
    status: string;
    verificationDate: string;
}

interface RecentActivityWidgetProps {
    data: Verification[];
    loading: boolean;
}

export default function RecentActivityWidget({ data, loading }: RecentActivityWidgetProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" /> Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'VERIFIED': return <CheckCircle className="h-4 w-4 text-success" />;
            case 'DISCREPANCY_FOUND': return <AlertTriangle className="h-4 w-4 text-destructive" />;
            default: return <Clock className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Live Team Activity
                </CardTitle>
                <CardDescription>Real-time feed of verifications by your team</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent activity found.
                        </div>
                    ) : (
                        data.map((item) => (
                            <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className="mt-1 p-2 bg-primary/10 rounded-full">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-foreground">
                                            {item.verifier.firstName} {item.verifier.lastName || item.verifier.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            verified <strong>{item.asset.name}</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-xs font-medium bg-muted px-2 py-1 rounded">
                                        {getStatusIcon(item.status)}
                                        {item.status.replace('_', ' ')}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(item.verificationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
