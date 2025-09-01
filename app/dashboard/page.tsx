import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/server-prisma';
import { can, canPerformTask } from '@/lib/auth/roles';
import { Action, Resource, Task } from '@/lib/auth/roles';
import DashboardClient from './DashboardClient';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import AdvancedSearch from '@/components/AdvancedSearch';
import { RoleBasedWelcome } from '@/components/RoleBasedWelcome';
import { RoleBasedOverview } from '@/components/RoleBasedOverview';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PermissionGate } from '@/components/PermissionGate';

async function getDashboardData() {
  try {
    const [
      totalAssets,
      totalValue,
      totalUsers,
      recentAssets,
      assetMovements,
      categories,
      states
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.aggregate({
        _sum: { purchaseValue: true }
      }),
      prisma.user.count(),
      prisma.asset.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          state: true,
          lga: true
        }
      }),
      prisma.assetMovement.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.category.count(),
      prisma.state.count()
    ]);

    return {
      totalAssets,
      totalValue: totalValue._sum.purchaseValue || 0,
      totalUsers,
      recentAssets,
      assetMovements,
      categories,
      states
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      totalAssets: 0,
      totalValue: 0,
      totalUsers: 0,
      recentAssets: [],
      assetMovements: 0,
      categories: 0,
      states: 0
    };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const { role } = session.user;
  const dashboardData = await getDashboardData();

  // Determine which tabs to show based on user permissions
  const showAnalytics = canPerformTask(role, Task.VIEW_BASIC_ANALYTICS);
  const showSearch = canPerformTask(role, Task.BASIC_SEARCH);
  const showSettings = can(role, Action.MANAGE, Resource.SETTINGS);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Role-Based Welcome */}
      <RoleBasedWelcome 
        role={role} 
        userName={session.user?.firstName || session.user?.email} 
      />

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showAnalytics && (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          )}
          {showSearch && (
            <TabsTrigger value="search">Search</TabsTrigger>
          )}
          {showSettings && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <RoleBasedOverview role={role} data={dashboardData} />
        </TabsContent>

        {/* Analytics Tab - Only show if user has permission */}
        {showAnalytics && (
          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={<LoadingSpinner text="Loading analytics..." />}>
              <PermissionGate requiredTask={Task.VIEW_BASIC_ANALYTICS}>
                <AdvancedAnalytics />
              </PermissionGate>
            </Suspense>
          </TabsContent>
        )}

        {/* Search Tab - Only show if user has permission */}
        {showSearch && (
          <TabsContent value="search" className="space-y-6">
            <Suspense fallback={<LoadingSpinner text="Loading search..." />}>
              <PermissionGate requiredTask={Task.BASIC_SEARCH}>
                <AdvancedSearch />
              </PermissionGate>
            </Suspense>
          </TabsContent>
        )}

        {/* Settings Tab - Only show if user has permission */}
        {showSettings && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dashboard Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">User Preferences</h3>
                    <p className="text-gray-600">
                      Configure your dashboard preferences and notifications here.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Tab</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="overview">Overview</option>
                        {showAnalytics && <option value="analytics">Analytics</option>}
                        {showSearch && <option value="search">Search</option>}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Refresh Interval</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="0">Manual only</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline">Save Preferences</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Real-Time Updates Component - Only show if user has WebSocket permission */}
      <Suspense fallback={<LoadingSpinner text="Loading dashboard..." />}>
        <PermissionGate requiredTask={Task.ACCESS_WEBSOCKET}>
          <DashboardClient initialData={dashboardData} />
        </PermissionGate>
      </Suspense>
    </div>
  );
}

