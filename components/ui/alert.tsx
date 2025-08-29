import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:text-foreground [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'text-destructive border-destructive/50 dark:border-destructive [&>svg]:text-destructive text-destructive',
        success:
          'text-emerald-700 border-emerald-500/50 dark:border-emerald-500 [&>svg]:text-emerald-500',
        warning:
          'text-amber-700 border-amber-500/50 dark:border-amber-500 [&>svg]:text-amber-500',
        info: 'text-blue-700 border-blue-500/50 dark:border-blue-500 [&>svg]:text-blue-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

const AlertIcon = ({ variant }: { variant?: string }) => {
  switch (variant) {
    case 'destructive':
      return <XCircle className="h-5 w-5" />;
    case 'success':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5" />;
    case 'info':
      return <Info className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
};

export { Alert, AlertTitle, AlertDescription, AlertIcon };
