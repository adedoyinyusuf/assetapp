'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateFleetAVRI } from '@/lib/analytics/avri';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface AVRIWidgetProps {
    assets: any[];
}

export function AVRIWidget({ assets }: AVRIWidgetProps) {
    const score = calculateFleetAVRI(assets);

    let colorClass = 'text-green-600';
    let bgClass = 'bg-green-100 dark:bg-green-900/20';
    let label = 'Excellent';

    if (score < 40) {
        colorClass = 'text-red-600';
        bgClass = 'bg-red-100 dark:bg-red-900/20';
        label = 'Critical';
    } else if (score < 70) {
        colorClass = 'text-amber-600';
        bgClass = 'bg-amber-100 dark:bg-amber-900/20';
        label = 'Needs Improvement';
    }

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">AVRI Score</CardTitle>
                    <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bgClass} ${colorClass}`}>
                    {label}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-xs text-muted-foreground">Target: 75+</div>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colorClass.replace('text-', 'bg-')}`}
                        style={{ width: `${Math.min(score, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Based on {assets.length} active assets
                </p>
            </CardContent>
        </Card>
    );
}
