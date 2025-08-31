import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export default function LoadingSpinner({ 
  size = 'md', 
  className, 
  text = 'Loading...',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Page loading component
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <h2 className="mt-4 text-lg font-semibold">Loading...</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait while we load the page
        </p>
      </div>
    </div>
  );
}

// Inline loading component
export function InlineLoading({ size = 'sm', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  return (
    <div className="inline-flex items-center space-x-2">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Button loading state
export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="inline-flex items-center space-x-2">
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      <span>Loading...</span>
    </div>
  );
}
