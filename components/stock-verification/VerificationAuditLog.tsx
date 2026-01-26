'use client';

import { format } from 'date-fns';
import { Activity, User, Clock, FileText } from 'lucide-react';

interface AuditLogEntry {
    id: number;
    action: string;
    entityType?: string;
    entityId?: number;
    user?: {
        name?: string;
        email?: string;
    };
    createdAt: string;
    details?: any;
}

interface VerificationAuditLogProps {
    logs: any[]; // Using any to match API response, typically includes AuditLog fields
    title?: string;
    maxHeight?: string;
}

export default function VerificationAuditLog({ logs, title = "Audit Trail", maxHeight = "400px" }: VerificationAuditLogProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground border rounded-lg bg-gray-50">
                No activity recorded yet.
            </div>
        );
    }

    return (
        <div className="border rounded-lg shadow-sm bg-white">
            <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{title}</h3>
            </div>
            <div className="p-4 overflow-y-auto" style={{ height: maxHeight }}>
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                    {logs.map((log) => (
                        <div key={log.id} className="relative">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary ring-1 ring-primary/20" />

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatAction(log.action)}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <User className="h-3 w-3" />
                                    <span>{log.user?.firstName || log.user?.email || 'System'}</span>
                                </div>

                                {/* Optional Details/Diff */}
                                {/* Simplified view of changes */}
                                {log.newValues && (
                                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded border font-mono">
                                        {JSON.stringify(log.newValues).substring(0, 100)}
                                        {JSON.stringify(log.newValues).length > 100 ? '...' : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function formatAction(action: string) {
    return action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}
