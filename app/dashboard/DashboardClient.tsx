'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Bell, 
  BellOff, 
  RefreshCw, 
  TrendingUp, 
  Package,
  Move,
  Users,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useWebSocket } from '@/lib/websocket';
import { WebSocketPermissionGate } from '@/components/PermissionGate';

interface DashboardData {
  totalAssets: number;
  totalValue: number;
  totalUsers: number;
  recentAssets: any[];
  assetMovements: number;
  categories: number;
  states: number;
}

interface RealTimeUpdate {
  id: string;
  type: 'asset' | 'user' | 'system' | 'depreciation';
  message: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  details?: any;
}

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const webSocket = useWebSocket();

  useEffect(() => {
    if (!webSocket) return;

    // Subscribe to real-time events
    const subscriptions = [
      webSocket.subscribe('asset_update', handleAssetUpdate),
      webSocket.subscribe('user_activity', handleUserActivity),
      webSocket.subscribe('system_notification', handleSystemNotification),
      webSocket.subscribe('depreciation_update', handleDepreciationUpdate)
    ];

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [webSocket]);

  const handleAssetUpdate = (assetData: any) => {
    addUpdate('asset', `Asset "${assetData.name}" has been updated`, 'info');
    
    // Update dashboard data if needed
    if (assetData.action === 'created') {
      setData(prev => ({
        ...prev,
        totalAssets: prev.totalAssets + 1
      }));
    }
  };

  const handleUserActivity = (userData: any) => {
    addUpdate('user', `User ${userData.name} ${userData.action}`, 'info');
  };

  const handleSystemNotification = (notification: any) => {
    addUpdate('system', notification.message, notification.type);
  };

  const handleDepreciationUpdate = (depreciationData: any) => {
    addUpdate('depreciation', `Depreciation calculated for ${depreciationData.assetName}`, 'info');
  };

  const addUpdate = (type: string, message: string, status: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const update: RealTimeUpdate = {
      id: Date.now().toString(),
      type: type as any,
      message,
      status,
      timestamp: new Date()
    };

    setRealTimeUpdates(prev => [update, ...prev.slice(0, 19)]); // Keep last 20 updates
  };

  const clearUpdates = () => {
    setRealTimeUpdates([]);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    if (notificationsEnabled) {
      addUpdate('system', 'Real-time notifications disabled', 'warning');
    } else {
      addUpdate('system', 'Real-time notifications enabled', 'success');
    }
  };

  const refreshData = async () => {
    addUpdate('system', 'Refreshing dashboard data...', 'info');
    // In a real implementation, you would fetch fresh data here
    setTimeout(() => {
      addUpdate('system', 'Dashboard data refreshed successfully', 'success');
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

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
      {/* Real-Time Status Bar */}
      <WebSocketPermissionGate>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Real-Time Updates
                <Badge variant="secondary" className="text-xs">
                  {realTimeUpdates.length} updates
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleNotifications}
                  className="flex items-center gap-2"
                >
                  {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  {notificationsEnabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearUpdates}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </WebSocketPermissionGate>

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
            <div className="text-2xl font-bold">{data.totalAssets.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{data.assetMovements}</div>
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
            <div className="text-2xl font-bold">{data.totalUsers}</div>
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
            <div className="text-2xl font-bold">{data.categories}</div>
            <p className="text-xs text-muted-foreground">
              Asset categories
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

