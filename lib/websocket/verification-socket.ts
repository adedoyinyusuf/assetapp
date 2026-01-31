'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher, { Channel } from 'pusher-js';

export interface VerificationEvent {
    id: number;
    type: 'created' | 'updated' | 'deleted';
    assetId: number;
    assetName: string;
    status: string;
    verifiedBy: string;
    timestamp: string;
}

export interface CampaignProgressEvent {
    campaignId: number;
    campaignName: string;
    totalAssets: number;
    verifiedCount: number;
    progress: number;
    timestamp: string;
}

export interface DiscrepancyEvent {
    id: number;
    assetId: number;
    assetName: string;
    severity: string;
    description: string;
    timestamp: string;
}

type EventCallback<T> = (data: T) => void;

export function useVerificationSocket() {
    const pusherRef = useRef<Pusher | null>(null);
    const channelRef = useRef<Channel | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Initialize Pusher connection
    useEffect(() => {
        const appKey = process.env.NEXT_PUBLIC_PUSHER_KEY || 'APP_KEY';
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

        // Prevent double init
        if (pusherRef.current) return;

        try {
            const pusher = new Pusher(appKey, {
                cluster: cluster,
            });

            pusherRef.current = pusher;

            pusher.connection.bind('connected', () => {
                console.log('[Pusher] Connected');
                setIsConnected(true);
                setConnectionError(null);
            });

            pusher.connection.bind('disconnected', () => {
                console.log('[Pusher] Disconnected');
                setIsConnected(false);
            });

            pusher.connection.bind('error', (err: any) => {
                console.error('[Pusher] Connection error:', err);
                setConnectionError(err?.error?.data?.message || 'Connection error');
                setIsConnected(false);
            });

            // Subscribe to the channel
            const channel = pusher.subscribe('verification-updates');
            channelRef.current = channel;

        } catch (error: any) {
            console.error('[Pusher] Init error:', error);
            setConnectionError(error.message);
        }

        return () => {
            if (pusherRef.current) {
                pusherRef.current.disconnect();
                pusherRef.current = null;
            }
        };
    }, []);

    // Subscribe to verification events
    const subscribeToVerifications = useCallback((callback: EventCallback<VerificationEvent>) => {
        if (!channelRef.current) return () => { };

        const handlerCreated = (data: VerificationEvent) => {
            console.log('[Pusher] Verification created:', data);
            callback(data);
        };
        const handlerUpdated = (data: VerificationEvent) => {
            console.log('[Pusher] Verification updated:', data);
            callback(data);
        };

        // Pusher allows binding multiple events to channel
        channelRef.current.bind('verification:created', handlerCreated);
        channelRef.current.bind('verification:updated', handlerUpdated);

        return () => {
            channelRef.current?.unbind('verification:created', handlerCreated);
            channelRef.current?.unbind('verification:updated', handlerUpdated);
        };
    }, []);

    // Subscribe to campaign progress
    const subscribeToCampaignProgress = useCallback((callback: EventCallback<CampaignProgressEvent>) => {
        if (!channelRef.current) return () => { };

        const handler = (data: CampaignProgressEvent) => {
            console.log('[Pusher] Campaign progress:', data);
            callback(data);
        };

        channelRef.current.bind('campaign:progress', handler);

        return () => {
            channelRef.current?.unbind('campaign:progress', handler);
        };
    }, []);

    // Subscribe to discrepancies
    const subscribeToDiscrepancies = useCallback((callback: EventCallback<DiscrepancyEvent>) => {
        if (!channelRef.current) return () => { };

        const handler = (data: DiscrepancyEvent) => {
            console.log('[Pusher] Discrepancy new:', data);
            callback(data);
        };

        channelRef.current.bind('discrepancy:new', handler);

        return () => {
            channelRef.current?.unbind('discrepancy:new', handler);
        };
    }, []);

    // Emit verification created (for optimistic updates or theoretically client-triggered events)
    // Note: Pusher client events require specific plan/settings. usually best to trigger via server action.
    // For now we will keep empty or log warning.
    const emitVerificationCreated = useCallback((data: Partial<VerificationEvent>) => {
        // Client triggering is generally discouraged unless 'client-events' enabled.
        // We'll trust the server trigger via Server Action flow.
        console.log('[Pusher] Client emit not supported directly, use Server Action.');
    }, []);

    return {
        isConnected,
        connectionError,
        subscribeToVerifications,
        subscribeToCampaignProgress,
        subscribeToDiscrepancies,
        emitVerificationCreated
    };
}
