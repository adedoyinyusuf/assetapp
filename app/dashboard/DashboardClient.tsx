'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Package,
  TrendingUp,
  LineChart,
  Plus,
  Move,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
  PieChart,
  Users
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickAction, ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { WebSocketPermissionGate } from '@/components/PermissionGate';

interface Activity {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  message?: string;
}

interface RealTimeUpdate {
  id: string;
  type: 'asset' | 'user' | 'system' | 'depreciation' | 'info' | 'success' | 'warning' | 'error';
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
}

interface Asset {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  category: string;
  location: string;
  value: number;
  lastUpdated: Date;
}

interface DashboardClientProps {
  initialData?: any;
}

export default function DashboardClient({ }: DashboardClientProps) {
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('month');

  // Mock data - in a real app, this would come from your context/API
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          toast.error('Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Formatting functions
  const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  // Handlers
  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
    toast.success(`Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleAddAsset = () => {
    toast.info('Add Asset functionality will be implemented here');
  };

  const handleTransferAsset = () => {
    toast.info('Transfer Asset functionality will be implemented here');
  };
  const handleExportReport = (type: string) => {
    toast.success(`Exporting ${type} report...`);
  };

  const handleViewAsset = (assetId: string) => {
    toast.info(`Viewing asset ${assetId}`);
  };

  const handleFilterChange = (filter: object) => {
    toast.info(`Applying filter: ${JSON.stringify(filter)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[500px] flex-col gap-4">
        <p className="text-red-500">Failed to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const categoryData = metrics?.assetDistribution?.byCategory?.map((cat: any) => ({
    ...cat,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}` // Dummy colors for now
  })) || [];


  // Handle real-time updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mock WebSocket subscription for demo purposes
    const handleMockUpdate = () => {
      const mockData = {
        id: `mock-${Date.now()}`,
        name: 'Sample Asset',
        status: 'active',
        user: 'System',
        assetName: 'Sample Asset'
      };

      const newUpdate: RealTimeUpdate = {
        id: Date.now().toString(),
        type: 'info',
        message: `${mockData.name} has been updated`,
        status: 'info',
        timestamp: new Date()
      };

      setRealTimeUpdates(prev => [newUpdate, ...prev.slice(0, 4)]);

      if (notificationsEnabled) {
        toast.success(`Asset updated: ${mockData.name}`, {
          description: `Status: ${mockData.status}`
        });
      }
    };

    // Simulate periodic updates for demo
    const interval = setInterval(handleMockUpdate, 30000);

    // Initial update
    handleMockUpdate();

    return () => {
      clearInterval(interval);
    };
  }, [notificationsEnabled]);


  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  // Main render



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader
        title="Asset Management Dashboard"
        description="Overview of your assets, activities, and key metrics"
        onSearch={setSearchQuery}
        user={{
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'Administrator'
        }}
        showNotifications={notificationsEnabled}
        onNotificationsToggle={handleToggleNotifications}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction
          icon={<Plus className="h-6 w-6 text-blue-600" />}
          label="Add Asset"
          variant="primary"
          onClick={handleAddAsset}
        />
        <QuickAction
          icon={<Move className="h-6 w-6 text-purple-600" />}
          label="Transfer Asset"
          variant="default"
          onClick={() => handleTransferAsset()}
        />
        <QuickAction
          icon={<Download className="h-6 w-6 text-green-600" />}
          label="Export Report"
          variant="success"
          onClick={() => handleExportReport('pdf')}
        />
        <QuickAction
          icon={<Filter className="h-6 w-6 text-amber-600" />}
          label="Filter View"
          variant="warning"
          onClick={() => handleFilterChange({})}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Assets"
          value={formatNumber(metrics.totalAssets)}
          icon={<Package className="h-5 w-5 text-blue-600" />}
          description={`${Math.floor(metrics.totalAssets * 0.1)} added this month`}
          variant="primary"
          trend={{ value: 12.5, label: 'vs last month', positive: true }}
        />

        <DashboardCard
          title="Total Value"
          value={formatCurrency(metrics.totalValue)}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          description={`${formatCurrency(metrics.totalValue / 10)} in depreciation`}
          variant="success"
          trend={{ value: 5.2, label: 'vs last month', positive: true }}
        />

        <DashboardCard
          title="Active Assets"
          value={metrics.activeAssets}
          icon={<CheckCircle className="h-5 w-5 text-purple-600" />}
          description={`${Math.ceil(metrics.activeAssets * 0.15)} in use now`}
          variant="info"
          trend={{ value: 8.3, label: 'vs last month', positive: true }}
        />

        <DashboardCard
          title="Maintenance Needed"
          value={metrics.maintenanceNeeded}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          description={`${Math.ceil(metrics.maintenanceNeeded * 0.25)} high priority`}
          variant="warning"
          trend={{ value: 3.7, label: 'vs last month', positive: false }}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Asset Trend</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="text-sm rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1.5"
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="quarter">Last 90 days</option>
                  <option value="year">This year</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => handleExportReport('excel')}
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>
            <div className="h-80 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center p-6">
                <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Asset trend chart will be displayed here</p>
                <p className="text-sm text-gray-400 mt-1">Interactive chart showing asset value over time</p>
              </div>
            </div>
          </div>

          {/* Recent Assets */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Assets</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleAddAsset}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Asset</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Asset
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {metrics.recentAssets.map((asset: any) => (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {asset.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {asset.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-xs">
                            {asset.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {asset.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {formatCurrency(asset.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => handleViewAsset(asset.id)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    // In a real app, this would navigate to the assets page
                    toast.info('Navigating to all assets');
                  }}
                >
                  View all assets
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <ActivityFeed
            activities={metrics.recentActivities}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
          />

          {/* Asset Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-6">Asset Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Asset distribution chart</p>
                <p className="text-sm text-gray-400">By category and location</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {categoryData.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-200">Asset Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-700 dark:text-blue-300">Good Condition</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-700 dark:text-amber-300">Needs Maintenance</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="w-full bg-amber-200 dark:bg-amber-900/40 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-700 dark:text-red-300">Critical</span>
                  <span className="font-medium">7%</span>
                </div>
                <div className="w-full bg-red-200 dark:bg-red-900/40 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '7%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Updates Feed */}
      <WebSocketPermissionGate>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{realTimeUpdates.filter(u => u.type === 'asset').length}</div>
                    <div className="text-sm text-blue-600">Asset Updates</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{realTimeUpdates.filter(u => u.type === 'user').length}</div>
                    <div className="text-sm text-green-600">User Activities</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{realTimeUpdates.filter(u => u.type === 'system').length}</div>
                    <div className="text-sm text-purple-600">System Events</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{realTimeUpdates.filter(u => u.type === 'depreciation').length}</div>
                    <div className="text-sm text-orange-600">Depreciation</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="space-y-4">
                <div className="space-y-3">
                  {realTimeUpdates
                    .filter(update => update.type === 'asset')
                    .slice(0, 10)
                    .map(update => (
                      <div key={update.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(update.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.message}</p>
                          <p className="text-xs text-gray-500">
                            {update.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(update.status)}>
                          {update.status}
                        </Badge>
                      </div>
                    ))}
                  {realTimeUpdates.filter(u => u.type === 'asset').length === 0 && (
                    <p className="text-center text-gray-500 py-4">No asset updates yet</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="space-y-3">
                  {realTimeUpdates
                    .filter(update => update.type === 'user')
                    .slice(0, 10)
                    .map(update => (
                      <div key={update.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(update.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.message}</p>
                          <p className="text-xs text-gray-500">
                            {update.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(update.status)}>
                          {update.status}
                        </Badge>
                      </div>
                    ))}
                  {realTimeUpdates.filter(u => u.type === 'user').length === 0 && (
                    <p className="text-center text-gray-500 py-4">No user activities yet</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <div className="space-y-3">
                  {realTimeUpdates
                    .filter(update => update.type === 'system')
                    .slice(0, 10)
                    .map(update => (
                      <div key={update.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getStatusIcon(update.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.message}</p>
                          <p className="text-xs text-gray-500">
                            {update.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(update.status)}>
                          {update.status}
                        </Badge>
                      </div>
                    ))}
                  {realTimeUpdates.filter(u => u.type === 'system').length === 0 && (
                    <p className="text-center text-gray-500 py-4">No system events yet</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </WebSocketPermissionGate>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-600" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Movements</CardTitle>
            <Move className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-600" />
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assetDistribution.byCategory.length}</div>
            <p className="text-xs text-muted-foreground">
              Asset categories
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

