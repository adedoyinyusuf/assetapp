'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldMetrics } from '@/lib/analytics';
import { CheckCircle2, AlertTriangle, Users, MapPin } from 'lucide-react';

interface FieldOpsWidgetProps {
    metrics: FieldMetrics;
}

export function FieldOpsWidget({ metrics }: FieldOpsWidgetProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
                    <p className="text-xs text-muted-foreground">
                        Across active zones
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Verification Progress</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {metrics.verificationProgress?.toFixed(1) || 0}%
                    </div>
                    <div className="h-2 w-full bg-slate-100 mt-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${Math.min(metrics.verificationProgress || 0, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {metrics.totalVerifications} verified
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Discrepancy Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {metrics.discrepancyRate?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Of verified assets
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Field Teams</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.teamsActive}</div>
                    <p className="text-xs text-muted-foreground">
                        Active verifiers
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
