'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MaterialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'filled' | 'outlined' | 'elevated';
  interactive?: boolean;
}

const MaterialCard = React.forwardRef<HTMLDivElement, MaterialCardProps>(
  ({ className, variant = 'filled', interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-medium2 ease-emphasis-decelerate",
          {
            // Filled variant (default)
            'bg-md-surface-container-highest text-md-on-surface': variant === 'filled',
            // Outlined variant
            'bg-md-surface border border-md-outline-variant text-md-on-surface': variant === 'outlined',
            // Elevated variant
            'bg-md-surface-container-low text-md-on-surface shadow-elevation-1 hover:shadow-elevation-2': variant === 'elevated',
            // Interactive states
            'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform': interactive,
            // State layers for interactive cards
            'hover:bg-md-on-surface/[0.08] active:bg-md-on-surface/[0.12]': interactive && variant === 'filled',
            'hover:bg-md-primary/[0.08] active:bg-md-primary/[0.12]': interactive && variant === 'outlined',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MaterialCard.displayName = 'MaterialCard';

const MaterialCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
MaterialCardHeader.displayName = 'MaterialCardHeader';

const MaterialCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-title-large font-normal tracking-tight text-md-on-surface", className)}
    {...props}
  />
));
MaterialCardTitle.displayName = 'MaterialCardTitle';

const MaterialCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-body-medium text-md-on-surface-variant", className)}
    {...props}
  />
));
MaterialCardDescription.displayName = 'MaterialCardDescription';

const MaterialCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-6 pt-0", className)} 
    {...props} 
  />
));
MaterialCardContent.displayName = 'MaterialCardContent';

const MaterialCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
MaterialCardFooter.displayName = 'MaterialCardFooter';

export { 
  MaterialCard, 
  MaterialCardHeader, 
  MaterialCardFooter, 
  MaterialCardTitle, 
  MaterialCardDescription, 
  MaterialCardContent 
};
