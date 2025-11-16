'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-destructive/90',
        success:
          'bg-success text-success-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-success/90',
        warning:
          'bg-warning text-warning-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-warning/90',
        outline:
          'border border-border bg-background shadow-elevation-1 hover:shadow-elevation-2 hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground',
        link:
          'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// =============================================================================
// CARD COMPONENT
// =============================================================================

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-elevation-1 transition-all duration-200 hover:shadow-elevation-2',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// =============================================================================
// BADGE COMPONENT
// =============================================================================

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow-elevation-1 hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        success:
          'border-transparent bg-success text-success-foreground hover:bg-success/80',
        warning:
          'border-transparent bg-warning text-warning-foreground hover:bg-warning/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// =============================================================================
// INPUT COMPONENT
// =============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// =============================================================================
// LABEL COMPONENT
// =============================================================================

const Label = React.forwardRef<
  React.ElementRef<'label'>,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';

// =============================================================================
// ALERT COMPONENT
// =============================================================================

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        success: 'border-success/20 bg-success/10 text-success [&>svg]:text-success',
        warning: 'border-warning/20 bg-warning/10 text-warning [&>svg]:text-warning',
        destructive: 'border-destructive/20 bg-destructive/10 text-destructive [&>svg]:text-destructive',
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

// =============================================================================
// AVATAR COMPONENT
// =============================================================================

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-elevation-1',
      className
    )}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-muted', className)}
      {...props}
    />
  );
}

// =============================================================================
// STATUS INDICATOR COMPONENT
// =============================================================================

const statusVariants = cva(
  'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      status: {
        online: 'bg-success/10 text-success',
        offline: 'bg-secondary/50 text-secondary-foreground',
        away: 'bg-warning/10 text-warning',
        busy: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      status: 'offline',
    },
  }
);

interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  showDot?: boolean;
}

function StatusIndicator({ 
  className, 
  status, 
  showDot = true, 
  children, 
  ...props 
}: StatusIndicatorProps) {
  const dotColors = {
    online: 'bg-success',
    offline: 'bg-secondary-foreground',
    away: 'bg-warning',
    busy: 'bg-destructive',
  };

  return (
    <div className={cn(statusVariants({ status }), className)} {...props}>
      {showDot && (
        <div 
          className={cn('h-2 w-2 rounded-full', dotColors[status || 'offline'])} 
        />
      )}
      {children}
    </div>
  );
}

// =============================================================================
// PROGRESS COMPONENT
// =============================================================================

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
}

function Progress({ 
  className, 
  value = 0, 
  max = 100, 
  variant = 'default',
  size = 'default',
  ...props 
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variants = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };
  
  const sizes = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3',
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-secondary',
        sizes[size],
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full w-full flex-1 transition-all duration-300 ease-smooth',
          variants[variant]
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Button,
  buttonVariants,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  badgeVariants,
  Input,
  Label,
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Skeleton,
  StatusIndicator,
  statusVariants,
  Progress,
};