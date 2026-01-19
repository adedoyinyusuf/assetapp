'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Stock Verification Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-50/50 rounded-lg border-2 border-dashed">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
                We encountered an error while loading the stock verification module.
                Please try refreshing the page.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => reset()} variant="default">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Reload Page
                </Button>
            </div>
        </div>
    );
}
