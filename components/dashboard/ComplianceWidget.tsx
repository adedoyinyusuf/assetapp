'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getComplianceHealth, ComplianceIssue } from '@/lib/compliance/checks';
import { ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ComplianceWidgetProps {
    assets: any[];
}

export function ComplianceWidget({ assets }: ComplianceWidgetProps) {
    const { score, compliantCount, totalAssets, issues } = getComplianceHealth(assets);

    // Determine status style
    let colorClass = 'text-green-600';
    let bgClass = 'bg-green-100 dark:bg-green-900/20';
    let Icon = ShieldCheck;
    let label = 'Compliant';

    if (score < 80) {
        colorClass = 'text-red-600';
        bgClass = 'bg-red-100 dark:bg-red-900/20';
        Icon = ShieldAlert;
        label = 'At Risk';
    } else if (score < 95) {
        colorClass = 'text-amber-600';
        bgClass = 'bg-amber-100 dark:bg-amber-900/20';
        Icon = AlertCircle;
        label = 'Attention Needed';
    }

    const highSeverityCount = issues.filter(i => i.severity === 'HIGH').length;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Compliance Health</CardTitle>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bgClass} ${colorClass}`}>
                    {label}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{score}%</div>
                    <div className="text-xs text-muted-foreground">{compliantCount}/{totalAssets} Assets OK</div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colorClass.replace('text-', 'bg-')}`}
                        style={{ width: `${score}%` }}
                    />
                </div>

                {/* Issues Summary */}
                <div className="mt-4 space-y-2">
                    {issues.length > 0 ? (
                        <>
                            <div className="text-xs font-medium text-slate-500">Top Issues</div>
                            {issues.slice(0, 2).map((issue, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs border-l-2 p-1 pl-2 border-slate-200">
                                    <span className={
                                        issue.severity === 'HIGH' ? 'text-red-600 font-bold' : 'text-amber-600'
                                    }>
                                        {issue.severity === 'HIGH' ? 'CRITICAL' : 'WARN'}:
                                    </span>
                                    <span className="text-muted-foreground truncate flex-1">
                                        {assetLink(issue)} - {issue.description}
                                    </span>
                                </div>
                            ))}
                            {issues.length > 2 && (
                                <div className="text-xs text-center text-muted-foreground pt-1">
                                    +{issues.length - 2} more issues
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-xs text-green-600 flex items-center gap-1 mt-2">
                            <ShieldCheck className="h-3 w-3" /> All audits passed.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Helper to make asset name bold or linked if possible within text
function assetLink(issue: ComplianceIssue) {
    return <span className="font-semibold text-foreground">{issue.assetName}</span>;
}
