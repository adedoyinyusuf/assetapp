'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Package,
  TrendingUp,
  Users,
  Activity,
  Settings,
  Search,
  PieChart,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { UserRole } from '@/lib/auth/roles';
import { useVerificationSocket } from '@/lib/websocket/verification-socket';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { AVRIWidget } from '@/components/dashboard/AVRIWidget';
import { ComplianceWidget } from '@/components/dashboard/ComplianceWidget';
import { FieldOpsWidget } from '@/components/dashboard/FieldOpsWidget';
import { TrendCharts } from '@/components/dashboard/TrendCharts';
import { AnalyticsData } from '@/lib/analytics'; // Ensure this type is exported from lib/analytics

// Dynamically import AssetMap to prevent SSR issues with Leaflet
const AssetMap = dynamic(() => import('@/components/dashboard/AssetMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />
});

interface DashboardData {
  totalAssets: number;
  totalValue: number;
  totalUsers: number;
  recentAssets: Array<{
    id: number;
    name: string;
    category: {
      name: string;
    };
    location: {
      state: string;
      lga: string;
    };
    purchaseValue: number;
    purchaseDate: string;
    lastVerificationStatus?: string;
  }>;
  assetMovements: number;
  categories: number;
  states: number;
  categoryBreakdown: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    assets: number;
    value: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  allAssets: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const { isConnected, subscribeToVerifications } = useVerificationSocket();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Subscribe to real-time verification events
  useEffect(() => {
    if (!dashboardData) return;

    const unsubscribe = subscribeToVerifications((event) => {
      // Show toast notification for new verifications
      if (event.type === 'created') {
        toast.success(`New verification: ${event.assetName} by ${event.verifiedBy}`);
      }

      // Update dashboard data
      setDashboardData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalAssets: event.type === 'created' ? prev.totalAssets + 1 : prev.totalAssets
        };
      });

      // Refresh dashboard data to get latest stats
      fetchDashboardData();
    });

    return unsubscribe;
  }, [dashboardData, subscribeToVerifications]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all assets to calculate summary data
      const [assetsRes, categoriesRes, analyticsRes] = await Promise.all([
        fetch('/api/assets?limit=1000', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/analytics', { cache: 'no-store' })
      ]);

      if (!assetsRes.ok) {
        const text = await assetsRes.text();
        throw new Error(`Assets fetch failed (${assetsRes.status}): ${text}`);
      }
      if (!categoriesRes.ok) {
        const text = await categoriesRes.text();
        throw new Error(`Categories fetch failed (${categoriesRes.status}): ${text}`);
      }
      if (!analyticsRes.ok) {
        console.warn('Analytics fetch failed');
      }

      const assetsData = await assetsRes.json();
      const categoriesData = await categoriesRes.json();
      const analyticsResult = analyticsRes.ok ? await analyticsRes.json() : null;
      if (analyticsResult) {
        setAnalyticsData(analyticsResult);
      }

      // Calculate summary data from the assets
      // Handle both old array format and new { data: [] } format
      const assets = Array.isArray(assetsData) ? assetsData : (assetsData.data || []);
      const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.data || []);

      // Calculate totals
      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum: number, asset: any) => sum + (asset.purchaseValue || 0), 0);

      // Get recent assets (last 5)
      const recentAssets = assets.slice(0, 5).map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        category: {
          name: asset.category?.name || 'Unknown'
        },
        location: {
          state: asset.state?.name || 'Unknown',
          lga: asset.lga?.name || 'Unknown'
        },
        purchaseValue: asset.purchaseValue || 0,
        purchaseDate: asset.purchaseDate,
        lastVerificationStatus: asset.lastVerificationStatus
      }));

      // Calculate category breakdown
      const categoryMap = new Map();
      assets.forEach((asset: any) => {
        const categoryName = asset.category?.name || 'Unknown';
        const existing = categoryMap.get(categoryName) || { name: categoryName, count: 0, value: 0 };
        existing.count += 1;
        existing.value += asset.purchaseValue || 0;
        categoryMap.set(categoryName, existing);
      });
      const categoryBreakdown = Array.from(categoryMap.values());

      // Transform data for dashboard
      const data: DashboardData = {
        totalAssets,
        totalValue,
        totalUsers: 0, // We don't have user data yet
        recentAssets,
        assetMovements: 0, // We don't have movement data yet
        categories: categories.length,
        states: 37, // Default Nigerian states
        categoryBreakdown,
        monthlyTrends: [], // We don't have trend data yet
        statusDistribution: [], // We don't have status data yet
        allAssets: assets
      };

      setDashboardData(data);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const userRole = session.user.role || 'VIEWER';
  const userName = session.user.firstName || session.user.email || 'User';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Welcome, {userName}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === UserRole.SUPER_ADMIN && 'You have full system access'}
            {userRole === UserRole.ADMIN && 'Manage assets and oversee operations'}
            {userRole === UserRole.MANAGER && 'Monitor assets and generate reports'}
            {userRole === UserRole.OPERATOR && 'Handle day-to-day asset operations'}
            {userRole === UserRole.AUDITOR && 'Review and audit asset records'}
            {userRole === UserRole.VIEWER && 'View asset information and reports'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionStatus isConnected={isConnected} />
          <Link href="/assets/search">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Assets
            </Button>
          </Link>
          <Link href="/reports">
            <Button>
              <Activity className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Dashboard Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-8 border border-red-200 bg-red-50 rounded-lg text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to load dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" className="border-red-200 hover:bg-red-100 text-red-700">
            Try Again
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.totalAssets.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₦{dashboardData?.totalValue.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categories</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {dashboardData?.categories || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <PieChart className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Recent Movements</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {dashboardData?.assetMovements || 0}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>



              {dashboardData?.allAssets && <AVRIWidget assets={dashboardData.allAssets} />}
              {dashboardData?.allAssets && <ComplianceWidget assets={dashboardData.allAssets} />}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Assets */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.recentAssets.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No recent assets found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData?.recentAssets.slice(0, 5).map((asset) => (
                          <div key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline truncate">
                                  {asset.name}
                                </Link>
                                {asset.lastVerificationStatus && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] h-5 px-1.5 ${asset.lastVerificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                      asset.lastVerificationStatus === 'DISCREPANCY' ? 'bg-red-100 text-red-800' :
                                        asset.lastVerificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                      }`}
                                  >
                                    {asset.lastVerificationStatus}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {asset.category.name} • {asset.location.state}, {asset.location.lga}
                              </p>
                            </div>
                            <div className="text-right pl-4">
                              <p className="text-sm font-medium text-green-600">
                                ₦{asset.purchaseValue.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(asset.purchaseDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Link href="/assets/manage">
                          <Button variant="link" className="p-0 h-auto w-full">
                            View all assets →
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Category Breakdown */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboardData?.categoryBreakdown.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No categories found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardData?.categoryBreakdown.slice(0, 5).map((category, index) => (
                          <div key={category.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{category.name}</Badge>
                              <span className="text-sm text-gray-600">
                                {category.count} assets
                              </span>
                            </div>
                            <span className="text-sm font-medium text-green-600">
                              ₦{category.value.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {(dashboardData?.categoryBreakdown.length || 0) > 5 && (
                          <Link href="/reports">
                            <Button variant="link" className="p-0 h-auto">
                              View full breakdown →
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {analyticsData?.fieldMetrics && (
                <FieldOpsWidget metrics={analyticsData.fieldMetrics} />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Asset Distribution Map
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {dashboardData?.allAssets && <AssetMap assets={dashboardData.allAssets} />}
                    </CardContent>
                  </Card>
                </div>
                <div>
                  {analyticsData?.trendAnalysis && (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Quick Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Total Asset Value</span>
                              <span className="font-bold">₦{(dashboardData?.totalValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Verified Assets</span>
                              <span className="font-bold text-green-600">
                                {analyticsData.fieldMetrics?.totalVerifications || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Maintenance Requests</span>
                              <span className="font-bold text-amber-600">
                                {analyticsData.operationalMetrics?.maintenanceFrequency || 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              {analyticsData?.trendAnalysis && <TrendCharts data={analyticsData.trendAnalysis} />}
            </motion.div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Feed</h3>
                    <p className="text-gray-500 mb-4">
                      Real-time activity updates will be displayed here
                    </p>
                    <Link href="/depreciation">
                      <Button variant="outline">
                        View Depreciation Records
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      )
      }
    </div >
  );
}

