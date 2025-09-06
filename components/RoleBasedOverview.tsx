'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserRole, 
  Task, 
  canPerformTask 
} from '@/lib/auth/roles';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Activity,
  Search,
  Settings,
  Eye,
  Shield,
  FileText,
  Move
} from 'lucide-react';
import Link from 'next/link';

interface RoleBasedOverviewProps {
  role: UserRole;
  data: {
    totalAssets: number;
    totalValue: number;
    totalUsers: number;
    recentAssets: any[];
    assetMovements: number;
    categories: number;
    states: number;
  };
}

export function RoleBasedOverview({ role, data }: RoleBasedOverviewProps) {
  const getRoleSpecificStats = () => {
    const baseStats = [
      {
        title: 'Total Assets',
        value: data.totalAssets.toLocaleString(),
        icon: <Package className="h-4 w-4 text-muted-foreground" />,
        description: 'In the system',
        trend: '+12% from last month',
        trendIcon: <TrendingUp className="inline h-3 w-3 text-green-600" />
      }
    ];

    // Add role-specific stats
    if (canPerformTask(role, Task.VIEW_BASIC_ANALYTICS)) {
      baseStats.push({
        title: 'Total Value',
        value: `₦${(data.totalValue / 1000000).toFixed(1)}M`,
        icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        description: 'Asset portfolio value',
        trend: '+8% from last month',
        trendIcon: <TrendingUp className="inline h-3 w-3 text-green-600" />
      });
    }

    if (canPerformTask(role, Task.VIEW_USERS)) {
      baseStats.push({
        title: 'Total Users',
        value: data.totalUsers.toString(),
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        description: 'System users',
        trend: '+5% from last month',
        trendIcon: <TrendingUp className="inline h-3 w-3 text-green-600" />
      });
    }

    if (canPerformTask(role, Task.VIEW_MOVEMENT_HISTORY)) {
      baseStats.push({
        title: 'Asset Movements',
        value: data.assetMovements.toString(),
        icon: <Activity className="h-4 w-4 text-muted-foreground" />,
        description: 'Last 7 days',
        trend: 'Recent activity',
        trendIcon: <Activity className="inline h-3 w-3 text-blue-600" />
      });
    }

    return baseStats;
  };

  const getRoleSpecificActions = () => {
    const actions = [];

    if (canPerformTask(role, Task.VIEW_ASSET_DETAILS)) {
      actions.push({
        title: 'View Assets',
        icon: <Package className="h-6 w-6" />,
        href: '/assets',
        description: 'Browse all assets'
      });
    }

    if (canPerformTask(role, Task.CREATE_ASSET)) {
      actions.push({
        title: 'Add Asset',
        icon: <Package className="h-6 w-6" />,
        href: '/assets/add',
        description: 'Register new asset'
      });
    }

    if (canPerformTask(role, Task.VIEW_MOVEMENT_HISTORY)) {
      actions.push({
        title: 'Track Movement',
        icon: <Move className="h-6 w-6" />,
        href: '/asset-movement',
        description: 'Monitor asset movements'
      });
    }

    if (canPerformTask(role, Task.VIEW_BASIC_REPORTS)) {
      actions.push({
        title: 'Generate Report',
        icon: <FileText className="h-6 w-6" />,
        href: '/reports',
        description: 'Create asset reports'
      });
    }

    if (canPerformTask(role, Task.BASIC_SEARCH)) {
      actions.push({
        title: 'Search Assets',
        icon: <Search className="h-6 w-6" />,
        href: '/dashboard?tab=search',
        description: 'Find specific assets'
      });
    }

    if (canPerformTask(role, Task.MANAGE_SYSTEM_SETTINGS)) {
      actions.push({
        title: 'System Settings',
        icon: <Settings className="h-6 w-6" />,
        href: '/admin/settings',
        description: 'Configure system'
      });
    }

    return actions;
  };

  const getRoleSpecificContent = () => {
    switch (role) {
      case UserRole.VIEWER:
        return {
          title: 'Asset Overview',
          description: 'View and monitor asset information',
          icon: <Eye className="h-5 w-5" />
        };
        
      case UserRole.OPERATOR:
        return {
          title: 'Operations Overview',
          description: 'Manage assets and track movements',
          icon: <Activity className="h-5 w-5" />
        };
        
      case UserRole.MANAGER:
        return {
          title: 'Management Overview',
          description: 'Oversee operations and user activities',
          icon: <TrendingUp className="h-5 w-5" />
        };
        
      case UserRole.AUDITOR:
        return {
          title: 'Audit Overview',
          description: 'Monitor compliance and audit trails',
          icon: <Shield className="h-5 w-5" />
        };
        
      case UserRole.ADMIN:
        return {
          title: 'Administration Overview',
          description: 'Full system management and oversight',
          icon: <Settings className="h-5 w-5" />
        };
        
      case UserRole.SUPER_ADMIN:
        return {
          title: 'System Overview',
          description: 'Complete system control and administration',
          icon: <Shield className="h-5 w-5" />
        };
        
      default:
        return {
          title: 'Overview',
          description: 'System overview and quick actions',
          icon: <Activity className="h-5 w-5" />
        };
    }
  };

  const stats = getRoleSpecificStats();
  const actions = getRoleSpecificActions();
  const content = getRoleSpecificContent();

  return (
    <div className="space-y-6">
      {/* Role-Specific Header */}
      <div className="flex items-center gap-3 mb-6">
        {content.icon}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
          <p className="text-gray-600">{content.description}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.trendIcon} {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets - Only show if user can view assets */}
        {canPerformTask(role, Task.VIEW_ASSET_DETAILS) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentAssets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-gray-600">
                        {asset.category?.name} • {asset.state?.name}
                      </p>
                    </div>
                    <Badge variant="outline">
                      ₦{(asset.purchaseValue / 1000).toFixed(0)}K
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/assets">View All Assets</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {actions.slice(0, 4).map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button variant="outline" className="h-20 flex-col w-full">
                    {action.icon}
                    <span className="text-sm font-medium mt-1">{action.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Additional Content */}
      {role === UserRole.AUDITOR && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.categories}</div>
                <div className="text-sm text-gray-600">Asset Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{data.states}</div>
                <div className="text-sm text-gray-600">Geographic Locations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{data.assetMovements}</div>
                <div className="text-sm text-gray-600">Recent Movements</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status - Only for admin roles */}
      {(role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) && (
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Database: Online</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">API: Operational</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Authentication: Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
