'use client';

export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
    if (isConnected) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
                <span>Live</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span>Offline</span>
        </div>
    );
}
