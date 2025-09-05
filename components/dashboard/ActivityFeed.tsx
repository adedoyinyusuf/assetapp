import { Activity, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ActivityType = 'success' | 'warning' | 'error' | 'info';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

const activityIcons = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const activityColors = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({ activities, maxItems = 5, className = '' }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Recent Activity
        </h3>
        <Badge variant="outline" className="px-2 py-1 text-xs">
          {activities.length} activities
        </Badge>
      </div>
      
      <div className="space-y-3">
        {displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            >
              <div className="mt-0.5">
                <div className={cn("p-1.5 rounded-full", activityColors[activity.type])}>
                  {activityIcons[activity.type]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {activity.description}
                </p>
                {activity.user && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    by {activity.user}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p>No recent activities</p>
          </div>
        )}
      </div>
      
      {activities.length > maxItems && (
        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            View all activities
          </button>
        </div>
      )}
    </div>
  );
}

// Quick action button component
export function QuickAction({
  icon,
  label,
  onClick,
  variant = 'default',
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}) {
  const variantClasses = {
    default: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700',
    primary: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/50',
    success: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/50',
    warning: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/50',
    error: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50',
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${variantClasses[variant]} ${className}`}
    >
      <div className="p-2.5 rounded-full bg-white dark:bg-gray-700/50 mb-2">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
