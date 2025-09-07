'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all assets to calculate summary data
      const [assetsRes, categoriesRes] = await Promise.all([
        fetch('/api/assets?limit=1000'), // Get a large number to capture all assets
        fetch('/api/categories')
      ]);

      const assetsData = await assetsRes.json();
      const categoriesData = await categoriesRes.json();
      
      // Calculate summary data from the assets
      const assets = assetsData.data || [];
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
        purchaseDate: asset.purchaseDate
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
        statusDistribution: [] // We don't have status data yet
      };

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
            {userRole === 'SUPERADMIN' && 'You have full system access'}
            {userRole === 'ADMIN' && 'Manage assets and oversee operations'}
            {userRole === 'MANAGER' && 'Monitor assets and generate reports'}
            {userRole === 'OPERATOR' && 'Handle day-to-day asset operations'}
            {userRole === 'AUDITOR' && 'Review and audit asset records'}
            {userRole === 'VIEWER' && 'View asset information and reports'}
          </p>
        </div>

        <div className="flex gap-2">
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
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Assets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardData?.totalAssets.toLocaleString() || 0}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₦{dashboardData?.totalValue.toLocaleString() || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboardData?.categories || 0}
                      </p>
                    </div>
                    <PieChart className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recent Movements</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {dashboardData?.assetMovements || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
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
                          <div key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">
                                {asset.name}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {asset.category.name} • {asset.location.state}, {asset.location.lga}
                              </p>
                            </div>
                            <div className="text-right">
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Asset Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
                    <p className="text-gray-500 mb-4">
                      Detailed charts and insights about your assets will be displayed here
                    </p>
                    <Link href="/reports">
                      <Button>
                        View Full Reports
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
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
      )}
    </div>
  );
}

