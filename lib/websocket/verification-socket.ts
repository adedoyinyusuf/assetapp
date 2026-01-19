'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Initialize socket connection
    useEffect(() => {
        // Connect to the same host/port that's serving the app
        const socket = io({
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[WebSocket] Connected');
            setIsConnected(true);
            setConnectionError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error);
            setConnectionError(error.message);
            setIsConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Subscribe to verification events
    const subscribeToVerifications = useCallback((callback: EventCallback<VerificationEvent>) => {
        if (!socketRef.current) return () => { };

        const handler = (data: VerificationEvent) => {
            console.log('[WebSocket] Verification event:', data);
            callback(data);
        };

        socketRef.current.on('verification:created', handler);
        socketRef.current.on('verification:updated', handler);

        return () => {
            socketRef.current?.off('verification:created', handler);
            socketRef.current?.off('verification:updated', handler);
        };
    }, []);

    // Subscribe to campaign progress
    const subscribeToCampaignProgress = useCallback((callback: EventCallback<CampaignProgressEvent>) => {
        if (!socketRef.current) return () => { };

        const handler = (data: CampaignProgressEvent) => {
            console.log('[WebSocket] Campaign progress:', data);
            callback(data);
        };

        socketRef.current.on('campaign:progress', handler);

        return () => {
            socketRef.current?.off('campaign:progress', handler);
        };
    }, []);

    // Subscribe to discrepancies
    const subscribeToDiscrepancies = useCallback((callback: EventCallback<DiscrepancyEvent>) => {
        if (!socketRef.current) return () => { };

        const handler = (data: DiscrepancyEvent) => {
            console.log('[WebSocket] Discrepancy event:', data);
            callback(data);
        };

        socketRef.current.on('discrepancy:new', handler);

        return () => {
            socketRef.current?.off('discrepancy:new', handler);
        };
    }, []);

    // Emit verification created (for optimistic updates)
    const emitVerificationCreated = useCallback((data: Partial<VerificationEvent>) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('verification:created', data);
        }
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
