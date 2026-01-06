'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="container py-10 flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <h2 className="text-xl font-bold">Something went wrong!</h2>
            </div>
            <p className="text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    );
}
