'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const materialButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-label-large font-medium transition-all duration-medium2 ease-emphasis-decelerate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-38 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        filled: "bg-md-primary text-md-on-primary shadow-elevation-1 hover:shadow-elevation-2 hover:bg-md-primary/90 active:shadow-elevation-1 active:scale-95",
        'filled-tonal': "bg-md-secondary-container text-md-on-secondary-container shadow-elevation-1 hover:shadow-elevation-2 hover:bg-md-secondary-container/80 active:shadow-elevation-1 active:scale-95",
        outlined: "border-2 border-md-outline bg-transparent text-md-primary hover:bg-md-primary/8 focus:bg-md-primary/12 active:bg-md-primary/12",
        text: "bg-transparent text-md-primary hover:bg-md-primary/8 focus:bg-md-primary/12 active:bg-md-primary/12",
        elevated: "bg-md-surface-container-low text-md-primary shadow-elevation-1 hover:shadow-elevation-2 hover:bg-md-primary/8 active:shadow-elevation-1 active:scale-95",
      },
      size: {
        default: "h-10 px-6 py-2.5 rounded-xl",
        sm: "h-8 px-4 py-1.5 rounded-lg text-label-medium",
        lg: "h-12 px-8 py-3.5 rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
);

export interface MaterialButtonProps
  extends React.ComponentPropsWithoutRef<'button'>,
    VariantProps<typeof materialButtonVariants> {
  asChild?: boolean;
}

const MaterialButton = React.forwardRef<HTMLButtonElement, MaterialButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(materialButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
MaterialButton.displayName = 'MaterialButton';

export { MaterialButton, materialButtonVariants };
