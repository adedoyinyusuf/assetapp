'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Asset {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  location: {
    state: string;
    lga: string;
  };
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  status: string;
  usefulLife: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ManageAssetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && categoryFilter !== 'all' && { category: categoryFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/assets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAssets(data.data || []);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      } else {
        toast.error(data.error || 'Failed to fetch assets');
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to fetch assets');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();

      if (response.ok) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchAssets();
      fetchCategories();
    }
  }, [session, fetchAssets, fetchCategories]);

  // Handle delete asset
  const handleDeleteAsset = async (assetId: number) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Asset deleted successfully');
        fetchAssets();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    } finally {
      setDeleteAssetId(null);
    }
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle export
  const handleExport = () => {
    router.push('/reports/export');
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
            Manage Assets
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage all assets in your inventory
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchAssets}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link href="/assets/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DISPOSED">Disposed</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="purchaseValue">Purchase Value</SelectItem>
                  <SelectItem value="purchaseDate">Purchase Date</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Assets ({pagination.total})</CardTitle>
            <Badge variant="outline">
              Page {pagination.page} of {pagination.totalPages}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || (categoryFilter && categoryFilter !== 'all') || (statusFilter && statusFilter !== 'all')
                  ? 'No assets match your current filters.'
                  : 'Get started by adding your first asset.'}
              </p>
              <Link href="/assets/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Asset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('category')}
                      >
                        Category
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-right py-3 px-4">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium text-gray-700 hover:text-gray-900"
                        onClick={() => handleSort('purchaseValue')}
                      >
                        Purchase Value
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                      </Button>
                    </th>
                    <th className="text-right py-3 px-4">Current Value</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <motion.tr
                      key={asset.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {asset.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          Added {new Date(asset.purchaseDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{asset.category.name}</Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {asset.location.state}, {asset.location.lga}
                      </td>
                      <td className="py-4 px-4 text-right font-medium">
                        ₦{asset.purchaseValue.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-green-600">
                        ₦{asset.currentValue.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            asset.status === 'ACTIVE' ? 'default' :
                            asset.status === 'INACTIVE' ? 'secondary' :
                            asset.status === 'DISPOSED' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {asset.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/assets/${asset.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/assets/edit/${asset.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onSelect={() => setDeleteAssetId(asset.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAssetId} onOpenChange={() => setDeleteAssetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAssetId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => deleteAssetId && handleDeleteAsset(deleteAssetId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

