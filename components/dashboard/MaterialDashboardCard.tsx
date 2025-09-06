'use client';

import React from 'react';
import { MaterialCard, MaterialCardHeader, MaterialCardTitle, MaterialCardContent } from '@/components/ui/material-card';
import { cn } from '@/lib/utils';

interface MaterialDashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: 'primary' | 'secondary' | 'tertiary' | 'neutral';
  size?: 'default' | 'compact';
  className?: string;
  interactive?: boolean;
  loading?: boolean;
}

export function MaterialDashboardCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = 'neutral',
  size = 'default',
  className,
  interactive = false,
  loading = false,
  ...props
}: MaterialDashboardCardProps) {
  // Icon container styling based on variant
  const getIconContainerStyles = () => {
    const baseStyles = "rounded-full p-3 shadow-elevation-1 transition-all duration-medium2";
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-md-primary-container text-md-on-primary-container`;
      case 'secondary':
        return `${baseStyles} bg-md-secondary-container text-md-on-secondary-container`;
      case 'tertiary':
        return `${baseStyles} bg-md-tertiary-container text-md-on-tertiary-container`;
      default:
        return `${baseStyles} bg-md-surface-variant text-md-on-surface-variant`;
    }
  };

  // Trend styling
  const getTrendStyles = () => {
    if (!trend) return "";
    return trend.positive 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <MaterialCard variant="elevated" className={cn("h-full", className)}>
        <MaterialCardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          size === 'compact' ? 'pb-2 p-4' : 'pb-3'
        )}>
          <div className="animate-pulse bg-md-surface-variant rounded h-4 w-20"></div>
          <div className="animate-pulse bg-md-surface-variant rounded-full h-12 w-12"></div>
        </MaterialCardHeader>
        <MaterialCardContent className={size === 'compact' ? 'px-4 pb-4' : undefined}>
          <div className="space-y-2">
            <div className="animate-pulse bg-md-surface-variant rounded h-8 w-16"></div>
            <div className="animate-pulse bg-md-surface-variant rounded h-3 w-24"></div>
          </div>
        </MaterialCardContent>
      </MaterialCard>
    );
  }

  return (
    <MaterialCard 
      variant="elevated" 
      interactive={interactive}
      className={cn("h-full group", className)}
      {...props}
    >
      <MaterialCardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        size === 'compact' ? 'pb-2 p-4' : 'pb-3'
      )}>
        <MaterialCardTitle className={cn(
          "text-md-on-surface-variant font-medium",
          size === 'compact' ? 'text-title-small' : 'text-title-medium'
        )}>
          {title}
        </MaterialCardTitle>
        <div className={cn(
          getIconContainerStyles(),
          interactive && 'group-hover:scale-110 group-active:scale-95'
        )}>
          {icon}
        </div>
      </MaterialCardHeader>
      
      <MaterialCardContent className={size === 'compact' ? 'px-4 pb-4' : undefined}>
        <div className="space-y-2">
          <div className={cn(
            "font-normal text-md-on-surface transition-colors",
            size === 'compact' ? 'text-headline-small' : 'text-headline-medium'
          )}>
            {value}
          </div>
          
          {description && (
            <p className="text-body-small text-md-on-surface-variant leading-relaxed">
              {description}
            </p>
          )}
          
          {trend && (
            <div className={cn(
              "flex items-center text-body-small font-medium",
              getTrendStyles()
            )}>
              <span className="flex items-center gap-1">
                {trend.positive ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="ml-2 text-md-on-surface-variant font-normal">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </MaterialCardContent>
    </MaterialCard>
  );
}

// Chart Card variant for analytics
export function MaterialChartCard({
  title,
  children,
  className,
  actions,
  ...props
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <MaterialCard variant="elevated" className={cn("h-full", className)} {...props}>
      <MaterialCardHeader>
        <div className="flex items-center justify-between">
          <MaterialCardTitle className="text-title-large font-medium">
            {title}
          </MaterialCardTitle>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </MaterialCardHeader>
      <MaterialCardContent className="h-full">
        {children}
      </MaterialCardContent>
    </MaterialCard>
  );
}
