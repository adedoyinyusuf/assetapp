'use client';

import { useState, useEffect } from 'react';
import { db, PendingVerification } from '@/lib/stock-verification/db';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createVerification } from '@/app/stock-verification/actions';

export function OfflineStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Check initial status
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // periodic check for pending items
        const checkPending = async () => {
            const count = await db.pendingVerifications.where('synced').equals(0).count();
            setPendingCount(count);
        };

        checkPending();
        const interval = setInterval(checkPending, 2000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    const syncData = async () => {
        if (!isOnline) {
            toast.error("Cannot sync while offline");
            return;
        }

        setIsSyncing(true);
        let successCount = 0;
        let failCount = 0;

        try {
            const pendingItems = await db.pendingVerifications.where('synced').equals(0).toArray();

            for (const item of pendingItems) {
                try {
                    const formData = new FormData();
                    // Reconstruct FormData from stored object
                    Object.entries(item.data).forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            // Handle explicit arrays if any, usually photos are handled separately or as base64?
                            // For now assuming simple fields, photos might need special handling if stored as Blobs/Base64
                        } else {
                            formData.append(key, value as string);
                        }
                    });

                    // Special handling for action call - tricky with server actions directly from client DB
                    // We need to call the server action wrapper
                    await createVerification(formData);

                    // Mark as synced/delete
                    await db.pendingVerifications.delete(item.id!);
                    successCount++;
                } catch (error) {
                    console.error("Sync failed for item", item.id, error);
                    failCount++;
                }
            }

            if (successCount > 0) toast.success(`Synced ${successCount} records successfully`);
            if (failCount > 0) toast.error(`Failed to sync ${failCount} records`);

        } catch (error) {
            console.error("Sync loop error", error);
            toast.error("Sync process failed");
        } finally {
            setIsSyncing(false);
        }
    };

    if (isOnline && pendingCount === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
            {!isOnline && (
                <Badge variant="destructive" className="flex gap-1 items-center px-3 py-1 text-sm shadow-lg">
                    <WifiOff className="h-4 w-4" />
                    Offline Mode
                </Badge>
            )}

            {pendingCount > 0 && (
                <div className="bg-background border rounded-lg shadow-xl p-3 flex items-center gap-3 animate-in slide-in-from-bottom-5">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">{pendingCount} Pending Uploads</span>
                        <span className="text-xs text-muted-foreground">{isOnline ? 'Ready to sync' : 'Waiting for connection'}</span>
                    </div>
                    <Button
                        size="sm"
                        onClick={syncData}
                        disabled={!isOnline || isSyncing}
                        className={isSyncing ? "animate-pulse" : ""}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                </div>
            )}
        </div>
    );
}
