'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    History,
    MapPin,
    User,
    CheckCircle2,
    AlertTriangle,
    Wrench,
    ArrowRightLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface AuditEvent {
    id: string;
    type: 'MOVEMENT' | 'CUSTODY' | 'VERIFICATION' | 'MAINTENANCE' | 'CREATION';
    date: Date;
    title: string;
    description: string;
    user: string;
    meta?: any;
}

interface AuditTimelineProps {
    asset: any;
}

export function AuditTimeline({ asset }: AuditTimelineProps) {
    // Merge and sort all events
    const events: AuditEvent[] = [];

    // 1. Creation
    if (asset.createdAt) {
        events.push({
            id: `create-${asset.id}`,
            type: 'CREATION',
            date: new Date(asset.createdAt),
            title: 'Asset Created',
            description: `Asset added to inventory with value ₦${asset.purchaseValue?.toLocaleString()}`,
            user: 'System' // Or createdBy if available
        });
    }

    // 2. Movements
    if (asset.movements) {
        asset.movements.forEach((m: any) => {
            events.push({
                id: `move-${m.id}`,
                type: 'MOVEMENT',
                date: new Date(m.createdAt),
                title: 'Location Changed',
                description: `Moved from ${m.fromState?.name || 'Unknown'} to ${m.toState?.name} - ${m.toLga?.name}`,
                user: m.performedBy?.firstName || 'Unknown User'
            });
        });
    }

    // 3. Custody Logs
    if (asset.custodyLogs) {
        asset.custodyLogs.forEach((c: any) => {
            events.push({
                id: `custody-${c.id}`,
                type: 'CUSTODY',
                date: new Date(c.assignedAt),
                title: 'Custody Assigned',
                description: `Assigned to ${c.user?.firstName} ${c.user?.lastName}`,
                user: c.assigner?.firstName || 'System'
            });
        });
    }

    // 4. Verifications (Assuming we can link them, or use lastVerifiedAt as a proxy if explicit logs aren't in this relation yet)
    // Ideally we'd fetch verifications relating to this asset. 
    // For now, let's look at the asset.verifications relation if it exists, or just omit if not populated.
    if (asset.verifications) {
        asset.verifications.forEach((v: any) => {
            events.push({
                id: `verif-${v.id}`,
                type: 'VERIFICATION',
                date: new Date(v.verifiedAt),
                title: `Verification: ${v.status}`,
                description: `Verified by ${v.verifiedBy?.firstName}. Condition: ${v.condition}`,
                user: v.verifiedBy?.firstName || 'Unknown',
                meta: { status: v.status }
            });
        });
    }

    // Sort by date descending
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Audit Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l border-slate-200 ml-3 space-y-8 pb-4">
                    {events.map((event, idx) => {
                        const Icon = getEventIcon(event.type);
                        return (
                            <div key={event.id} className="relative pl-8">
                                <span className={`absolute -left-[9px] top-1 h-5 w-5 rounded-full border bg-background flex items-center justify-center
                                    ${getEventColor(event.type)}
                                `}>
                                    <Icon className="h-3 w-3" />
                                </span>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{event.title}</p>
                                        <p className="text-sm text-muted-foreground">{event.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <time className="text-xs text-muted-foreground block">
                                            {format(event.date, 'MMM d, yyyy h:mm a')}
                                        </time>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {event.user}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {events.length === 0 && (
                        <div className="pl-8 text-sm text-muted-foreground">
                            No audit history available.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function getEventIcon(type: string) {
    switch (type) {
        case 'MOVEMENT': return MapPin;
        case 'CUSTODY': return User;
        case 'VERIFICATION': return CheckCircle2;
        case 'MAINTENANCE': return Wrench;
        case 'CREATION': return ArrowRightLeft;
        default: return History;
    }
}

function getEventColor(type: string) {
    switch (type) {
        case 'MOVEMENT': return 'border-blue-500 text-blue-500';
        case 'CUSTODY': return 'border-purple-500 text-purple-500';
        case 'VERIFICATION': return 'border-green-500 text-green-500';
        case 'MAINTENANCE': return 'border-orange-500 text-orange-500';
        default: return 'border-slate-400 text-slate-400';
    }
}
