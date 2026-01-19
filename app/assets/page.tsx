'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  BarChart3,
  MapPin,
  TrendingUp,
  Eye,
  ArrowRight,
  Wallet,
  Building2,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface AssetSummary {
  totalAssets: number;
  totalValue: number;
  categories: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  recentAssets: Array<{
    id: number;
    name: string;
    category: string;
    purchaseValue: number;
    purchaseDate: string;
    status?: string;
  }>;
}

export default function AssetsIndexPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch asset summary
  useEffect(() => {
    if (session) {
      fetchAssetSummary();
    }
  }, [session]);

  const fetchAssetSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/assets?summary=true');
      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
      } else {
        toast.error('Failed to load asset summary');
      }
    } catch (error) {
      console.error('Error fetching asset summary:', error);
      toast.error('Failed to load asset summary');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container py-10 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground text-lg">
            Track, manage, and optimize your organization's detailed asset inventory.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/assets/search">
            <Button variant="outline" size="lg" className="h-10">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </Link>
          <Link href="/assets/add">
            <Button size="lg" className="h-10 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Assets"
          value={isLoading ? "..." : summary?.totalAssets.toLocaleString() || "0"}
          icon={Box}
          description="Assets in inventory"
          loading={isLoading}
          trend="+12% from last month" // Placeholder for trend
          trendUp={true}
        />
        <StatsCard
          title="Total Value"
          value={isLoading ? "..." : `₦${summary?.totalValue.toLocaleString() || "0"}`}
          icon={Wallet}
          description="Gross Asset Value"
          loading={isLoading}
          className="md:border-l md:border-r border-y-0"
        />
        <StatsCard
          title="Categories"
          value={isLoading ? "..." : summary?.categories.length.toString() || "0"}
          icon={Building2}
          description="Active Classifications"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - 2 Cols */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions Grid */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActionCard
                href="/assets/manage"
                title="View All Assets"
                description="Browse full inventory list"
                icon={Eye}
                color="bg-blue-500/10 text-blue-600"
              />
              <ActionCard
                href="/assets/add"
                title="Register Asset"
                description="Add new items to system"
                icon={Plus}
                color="bg-green-500/10 text-green-600"
              />
              <ActionCard
                href="/assets/search"
                title="Advanced Search"
                description="Filter and find specific items"
                icon={Search}
                color="bg-purple-500/10 text-purple-600"
              />
              <ActionCard
                href="/asset-movement"
                title="Asset Movement"
                description="Track location history"
                icon={MapPin}
                color="bg-orange-500/10 text-orange-600"
              />
            </div>
          </section>

          {/* Recent Assets List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Box className="h-5 w-5 text-primary" />
                Recently Added
              </h2>
              <Link href="/assets/manage" className="text-sm text-primary hover:underline flex items-center">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <Card className="overflow-hidden border-none shadow-md">
              <div className="divide-y">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))
                ) : summary?.recentAssets.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No assets found.
                  </div>
                ) : (
                  summary?.recentAssets.map((asset) => (
                    <div key={asset.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-4 group">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/assets/${asset.id}`} className="font-medium hover:text-primary truncate block">
                          {asset.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{asset.category}</span>
                          <span>•</span>
                          <span>{new Date(asset.purchaseDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₦{asset.purchaseValue.toLocaleString()}</div>
                        <Badge variant="secondary" className="text-[10px] uppercase">{asset.status || 'Active'}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/assets/${asset.id}`}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        </div>

        {/* Sidebar / Secondary Content - 1 Col */}
        <div className="space-y-8">
          {/* Category Breakdown */}
          <Card className="h-full border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                Distribution
              </CardTitle>
              <CardDescription>Asset count by category</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {summary?.categories.slice(0, 6).map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-muted-foreground">{cat.count} items</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min((cat.count / summary.totalAssets) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        ₦{cat.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, description, loading, className, trend, trendUp }: any) {
  return (
    <Card className={`border-none shadow-sm bg-card/50 backdrop-blur-sm hover:bg-card transition-colors ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
        {trend && (
          <div className={`text-xs mt-2 flex items-center ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActionCard({ href, title, description, icon: Icon, color }: any) {
  return (
    <Link href={href} className="group">
      <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer border-dashed border-2">
        <CardContent className="p-6 flex items-start gap-4">
          <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
