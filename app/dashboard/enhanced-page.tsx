import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/advanced-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/enhanced-button';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/server-prisma';
import { can, canPerformTask } from '@/lib/auth/roles';
import { Action, Resource, Task } from '@/lib/auth/roles';
import { BarChart3, Search, Settings, Plus, ArrowUpDown, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function EnhancedDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin');
  }

  const role = session.user.role;

  // Check permissions
  const showAnalytics = canPerformTask(role, Task.VIEW_BASIC_ANALYTICS);
  const showSearch = canPerformTask(role, Task.BASIC_SEARCH);
  const showSettings = can(role, Action.MANAGE, Resource.SETTINGS);

  // Fetch dashboard data
  const [assetCount, activeAssets, totalValue] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count(),
    prisma.asset.aggregate({
      _sum: {
        purchaseValue: true,
      },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.firstName || 'User'}! Here&apos;s what&apos;s happening with your assets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-3xl font-bold">{assetCount}</p>
                <p className="text-sm text-green-600 dark:text-green-400">+5% from last month</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Assets</p>
                <p className="text-3xl font-bold">{activeAssets}</p>
                <p className="text-sm text-green-600 dark:text-green-400">+2% from last month</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold">
                  ${(totalValue._sum.purchaseValue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">+12% from last month</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-fit md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {showSearch && <TabsTrigger value="search">Search</TabsTrigger>}
          {showSettings && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted" />
                        <div>
                          <p className="text-sm font-medium">Asset #{1000 + i} updated</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Asset Distribution</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full rounded-md bg-muted/50">
                  {/* Chart placeholder */}
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Asset distribution chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {showAnalytics && (
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  {/* Analytics content will be loaded here */}
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Analytics dashboard will be displayed here</p>
                  </div>
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showSearch && (
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
                  <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search assets by name, category, or location..."
                      className="h-12 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search for assets by name, category, location, or any other attribute.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {showSettings && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Dashboard Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Appearance</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how the dashboard looks on your device.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure how you receive notifications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
