import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardVariants } from '@/lib/theme';

type CardVariant = keyof typeof cardVariants;

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  variant?: CardVariant;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  children?: ReactNode;
}

export function DashboardCard({
  title,
  value,
  icon,
  description,
  variant = 'default',
  trend,
  className = '',
  children,
}: DashboardCardProps) {
  const variantClasses = cardVariants[variant] || cardVariants.default;
  
  return (
    <Card className={`${variantClasses} ${className} h-full transition-all duration-300 hover:shadow-md`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="rounded-full p-2 bg-white/80 dark:bg-gray-700/50 shadow-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={`mt-2 flex items-center text-sm ${
            trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <span>{trend.value}%</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">{trend.label}</span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

// Card with chart component
export function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`bg-white dark:bg-gray-800 dark:border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
