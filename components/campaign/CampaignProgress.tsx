'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

interface CampaignStats {
    totalAssets: number;
    verifiedCount: number;
    pendingCount: number;
    discrepancyCount: number;
    progress: number;
    daysRemaining?: number;
}

interface CampaignProgressProps {
    stats: CampaignStats;
    campaignName: string;
}

export function CampaignProgress({ stats, campaignName }: CampaignProgressProps) {
    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 30) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getProgressStatus = (progress: number) => {
        if (progress >= 80) return { label: 'On Track', color: 'text-green-600 bg-green-50 border-green-200' };
        if (progress >= 50) return { label: 'In Progress', color: 'text-blue-600 bg-blue-50 border-blue-200' };
        if (progress >= 30) return { label: 'Behind Schedule', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
        return { label: 'Critical', color: 'text-red-600 bg-red-50 border-red-200' };
    };

    const progressStatus = getProgressStatus(stats.progress);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Campaign Progress
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {campaignName}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className={progressStatus.color}>
                        {progressStatus.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Overall Completion</span>
                        <span className="font-bold text-lg">{stats.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.progress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stats.verifiedCount} verified</span>
                        <span>{stats.totalAssets} total</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-900">{stats.verifiedCount}</p>
                            <p className="text-xs text-green-700">Verified</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-900">{stats.pendingCount}</p>
                            <p className="text-xs text-yellow-700">Pending</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="p-2 bg-red-100 rounded-full">
                            <TrendingUp className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-900">{stats.discrepancyCount}</p>
                            <p className="text-xs text-red-700">Discrepancies</p>
                        </div>
                    </div>

                    {stats.daysRemaining !== undefined && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-900">{stats.daysRemaining}</p>
                                <p className="text-xs text-blue-700">Days Left</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
