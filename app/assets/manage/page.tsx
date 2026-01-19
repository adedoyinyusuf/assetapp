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
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  MoreHorizontal,
  ArrowUpDown,
  FilterX,
  ArrowLeft,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Asset {
  id: number;
  name: string;
  description?: string;
  category: {
    id: number;
    name: string;
    description?: string;
  };
  state: {
    id: number;
    name: string;
    code: string;
  };
  lga: {
    id: number;
    name: string;
    stateId: number;
  };
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  status?: string;
  usefulLife: number;
  salvageValue: number;
  createdAt: string;
  updatedAt: string;
  lastVerificationStatus?: string;
  lastVerifiedAt?: string;
}

const getVerificationStatusColor = (status: string) => {
  switch (status) {
    case 'VERIFIED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'DISCREPANCY': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

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

  // Handle sort (helper)
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStatusFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const hasFilters = searchTerm || (categoryFilter && categoryFilter !== 'all') || (statusFilter && statusFilter !== 'all');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start md:items-center border-b pb-6">
        <div className="space-y-1">
          <Link
            href="/assets"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Manage Inventory</h1>
          <p className="text-muted-foreground">
            View, filter, and manage your asset database.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchAssets} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => router.push('/reports/export')}>
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
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by asset name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DISPOSED">Disposed</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="purchaseValue">Value</SelectItem>
                  <SelectItem value="purchaseDate">Date Added</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="px-2">
                  <FilterX className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Assets List</CardTitle>
            <Badge variant="secondary">
              {pagination.total} Records
            </Badge>
          </div>
        </CardHeader>

        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No assets found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {hasFilters
                ? 'We couldn\'t find any assets matching your current filters. Try adjusting them.'
                : 'Your inventory is currently empty. Start by adding your first asset.'}
            </p>
            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            ) : (
              <Link href="/assets/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Asset
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px]">Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Value (₦)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <Link
                            href={`/assets/${asset.id}`}
                            className="block text-foreground hover:text-primary transition-colors font-semibold"
                          >
                            {asset.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            Added {new Date(asset.purchaseDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{asset.category.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {asset.state?.name}, {asset.lga?.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {asset.purchaseValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`
                            ${asset.status === 'ACTIVE' ? 'bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200' :
                            asset.status === 'INACTIVE' ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200' :
                              asset.status === 'DISPOSED' ? 'bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200' :
                                'bg-slate-100 text-slate-700'}
                          `}
                        variant="outline"
                      >
                        {asset.status ? asset.status.replace('_', ' ') : 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asset.lastVerificationStatus ? (
                        <div className="flex flex-col gap-1">
                          <Badge className={getVerificationStatusColor(asset.lastVerificationStatus)}>
                            {asset.lastVerificationStatus}
                          </Badge>
                          {asset.lastVerifiedAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(asset.lastVerifiedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not Verified</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/assets/${asset.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/assets/edit/${asset.id}`} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Asset
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onSelect={() => setDeleteAssetId(asset.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
              Delete Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
