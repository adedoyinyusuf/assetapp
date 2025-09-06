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
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Asset Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track your organization's assets
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/assets/search">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Assets
            </Button>
          </Link>
          <Link href="/assets/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalAssets.toLocaleString()}
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
                    ₦{summary.totalValue.toLocaleString()}
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
                    {summary.categories.length}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/assets/manage" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Eye className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">View All Assets</p>
                    <p className="text-sm text-gray-500">Browse and manage your asset inventory</p>
                  </div>
                </Button>
              </Link>

              <Link href="/assets/add" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Plus className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Add New Asset</p>
                    <p className="text-sm text-gray-500">Register a new asset in the system</p>
                  </div>
                </Button>
              </Link>

              <Link href="/assets/search" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <Search className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Advanced Search</p>
                    <p className="text-sm text-gray-500">Search assets with advanced filters</p>
                  </div>
                </Button>
              </Link>

              <Link href="/asset-movement" className="block">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <MapPin className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Asset Movement</p>
                    <p className="text-sm text-gray-500">Track and manage asset movements</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Assets & Categories Overview */}
        <div className="space-y-6">
          {summary && (
            <>
              {/* Category Breakdown */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary.categories.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No categories found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {summary.categories.slice(0, 5).map((category, index) => (
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
                        {summary.categories.length > 5 && (
                          <Link href="/assets/manage">
                            <Button variant="link" className="p-0 h-auto">
                              View all categories →
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Assets */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary.recentAssets.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No recent assets found
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {summary.recentAssets.map((asset) => (
                          <div key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">
                                {asset.name}
                              </Link>
                              <p className="text-sm text-gray-500">
                                {asset.category} • {new Date(asset.purchaseDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                ₦{asset.purchaseValue.toLocaleString()}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
