'use client';

import React from 'react';
import { MaterialButton } from '@/components/ui/material-button';
import { MaterialDashboardCard, MaterialChartCard } from '@/components/dashboard/MaterialDashboardCard';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Download,
  Settings,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardData {
  totalAssets: number;
  totalValue: number;
  totalUsers: number;
  recentAssets: any[];
  assetMovements: number;
  categories: number;
  states: number;
}

interface MaterialDashboardProps {
  data: DashboardData;
  className?: string;
}

export function MaterialDashboard({ data, className }: MaterialDashboardProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-display-small font-normal text-md-on-surface">
            Asset Dashboard
          </h1>
          <p className="text-body-large text-md-on-surface-variant mt-1">
            Welcome to your comprehensive asset management overview
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <MaterialButton variant="outlined" size="sm">
            <Settings className="h-5 w-5" />
            Settings
          </MaterialButton>
          <MaterialButton variant="filled-tonal" size="sm">
            <Download className="h-5 w-5" />
            Export Data
          </MaterialButton>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MaterialDashboardCard
          title="Total Assets"
          value={data.totalAssets.toLocaleString()}
          icon={<Package className="h-6 w-6" />}
          description="Assets under management"
          trend={{ value: 12, label: "from last month", positive: true }}
          variant="primary"
          interactive
        />
        
        <MaterialDashboardCard
          title="Total Value"
          value={`₦${(data.totalValue / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-6 w-6" />}
          description="Current portfolio value"
          trend={{ value: 8, label: "from last month", positive: true }}
          variant="secondary"
          interactive
        />
        
        <MaterialDashboardCard
          title="Active Users"
          value={data.totalUsers}
          icon={<Users className="h-6 w-6" />}
          description="System users"
          trend={{ value: 5, label: "from last month", positive: true }}
          variant="tertiary"
          interactive
        />
        
        <MaterialDashboardCard
          title="Recent Movements"
          value={data.assetMovements}
          icon={<TrendingUp className="h-6 w-6" />}
          description="Last 7 days"
          trend={{ value: 15, label: "from previous week", positive: true }}
          variant="neutral"
          interactive
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MaterialChartCard
          title="Asset Distribution by Category"
          actions={
            <MaterialButton variant="text" size="sm">
              <BarChart3 className="h-4 w-4" />
              View Details
            </MaterialButton>
          }
        >
          <div className="flex h-64 items-center justify-center text-md-on-surface-variant">
            <div className="text-center">
              <PieChart className="h-12 w-12 mx-auto mb-3 opacity-60" />
              <p className="text-body-medium">Chart visualization would go here</p>
              <p className="text-body-small mt-1">Showing {data.categories} categories</p>
            </div>
          </div>
        </MaterialChartCard>
        
        <MaterialChartCard
          title="Asset Value Trends"
          actions={
            <MaterialButton variant="text" size="sm">
              <TrendingUp className="h-4 w-4" />
              View Trends
            </MaterialButton>
          }
        >
          <div className="flex h-64 items-center justify-center text-md-on-surface-variant">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-60" />
              <p className="text-body-medium">Trend visualization would go here</p>
              <p className="text-body-small mt-1">Across {data.states} states</p>
            </div>
          </div>
        </MaterialChartCard>
      </div>

      {/* Recent Activity */}
      <MaterialChartCard 
        title="Recent Asset Activity"
        actions={
          <MaterialButton variant="outlined" size="sm">
            View All
          </MaterialButton>
        }
      >
        <div className="space-y-4">
          {data.recentAssets.length > 0 ? (
            data.recentAssets.slice(0, 5).map((asset, index) => (
              <div 
                key={asset.id || index}
                className="flex items-center justify-between p-4 rounded-lg bg-md-surface-container-highest"
              >
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-md-primary-container p-2">
                    <Package className="h-4 w-4 text-md-on-primary-container" />
                  </div>
                  <div>
                    <p className="text-body-large font-medium text-md-on-surface">
                      {asset.name || `Asset ${index + 1}`}
                    </p>
                    <p className="text-body-small text-md-on-surface-variant">
                      {asset.category?.name || 'General'} • {asset.state?.name || 'Unknown Location'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-body-medium font-medium text-md-on-surface">
                    ₦{(asset.purchaseValue || 0).toLocaleString()}
                  </p>
                  <p className="text-body-small text-md-on-surface-variant">
                    {new Date(asset.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40 text-md-on-surface-variant" />
              <p className="text-body-medium text-md-on-surface-variant">No recent assets found</p>
            </div>
          )}
        </div>
      </MaterialChartCard>
    </div>
  );
}
