'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  Calculator,
  Calendar,
  DollarSign,
  Building2,
  Package,
  Download,
  Filter,
  Search,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DepreciationRecord {
  id: number;
  assetId: number;
  asset: {
    id: number;
    name: string;
    description: string;
    purchaseValue: number;
    category: {
      id: number;
      name: string;
    };
  };
  year: number;
  depreciation: number;
  currentValue: number;
  depreciationPercentage: number;
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  id: number;
  name: string;
  purchaseValue: number;
  purchaseDate: string;
  usefulLife: number;
  salvageValue: number;
  category: {
    id: number;
    name: string;
  };
}

interface BulkCalculationModal {
  isOpen: boolean;
  year: number;
  selectedAssets: number[];
}

export default function DepreciationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [depreciationRecords, setDepreciationRecords] = useState<DepreciationRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DepreciationRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'year' | 'depreciation' | 'currentValue' | 'asset'>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [bulkModal, setBulkModal] = useState<BulkCalculationModal>({ isOpen: false, year: new Date().getFullYear(), selectedAssets: [] });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch depreciation records
  const fetchDepreciationRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(selectedYear && selectedYear !== 'all' && { year: selectedYear }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/depreciation?${params}`);
      const data = await response.json();

      if (response.ok) {
        setDepreciationRecords(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch depreciation records',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching depreciation records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch depreciation records',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, selectedYear, searchTerm]);

  // Fetch assets for bulk calculation
  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/assets?limit=100');
      const data = await response.json();

      if (response.ok) {
        setAssets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchDepreciationRecords();
      fetchAssets();
    }
  }, [session, fetchDepreciationRecords, fetchAssets]);

  // Filter and sort records
  useEffect(() => {
    let filtered = [...depreciationRecords];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.asset.category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(record =>
        record.asset.category.id.toString() === selectedCategory
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'year':
          aValue = a.year;
          bValue = b.year;
          break;
        case 'depreciation':
          aValue = a.depreciation;
          bValue = b.depreciation;
          break;
        case 'currentValue':
          aValue = a.currentValue;
          bValue = b.currentValue;
          break;
        case 'asset':
          aValue = a.asset.name;
          bValue = b.asset.name;
          break;
        default:
          aValue = a.year;
          bValue = b.year;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredRecords(filtered);
  }, [depreciationRecords, searchTerm, selectedCategory, sortBy, sortOrder]);

  // Bulk depreciation calculation
  const handleBulkCalculation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/depreciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bulk',
          year: bulkModal.year,
          assetIds: bulkModal.selectedAssets.length > 0 ? bulkModal.selectedAssets : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
        });
        setBulkModal({ isOpen: false, year: new Date().getFullYear(), selectedAssets: [] });
        fetchDepreciationRecords();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to calculate depreciation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error calculating depreciation:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate depreciation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete depreciation record
  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this depreciation record?')) return;

    try {
      const response = await fetch(`/api/depreciation?id=${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Depreciation record deleted successfully',
        });
        fetchDepreciationRecords();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete record',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete record',
        variant: 'destructive',
      });
    }
  };

  // Get unique categories
  const categories = [...new Set(depreciationRecords.map(record => record.asset.category))];

  // Get year range
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

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
            <TrendingDown className="h-8 w-8 text-primary" />
            Asset Depreciation
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage asset depreciation calculations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setBulkModal({ ...bulkModal, isOpen: true })}
            className="bg-primary hover:bg-primary/90"
            disabled={assets.length === 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Depreciation
          </Button>
          <Button variant="outline" onClick={fetchDepreciationRecords}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">
                  {depreciationRecords.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Depreciation</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{depreciationRecords.reduce((sum, record) => sum + record.depreciation, 0).toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{depreciationRecords.reduce((sum, record) => sum + record.currentValue, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Depreciation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {depreciationRecords.length > 0 
                    ? `${(depreciationRecords.reduce((sum, record) => sum + record.depreciationPercentage, 0) / depreciationRecords.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <Calculator className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="asset">Asset Name</SelectItem>
                    <SelectItem value="depreciation">Depreciation</SelectItem>
                    <SelectItem value="currentValue">Current Value</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depreciation Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Depreciation Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No depreciation records found</h3>
              <p className="text-gray-500">
                {depreciationRecords.length === 0
                  ? "Calculate depreciation for your assets to see records here."
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Asset</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Year</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Purchase Value</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Depreciation</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Current Value</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Depreciation %</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{record.asset.name}</p>
                          {record.asset.description && (
                            <p className="text-sm text-gray-500">{record.asset.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary">{record.asset.category.name}</Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{record.year}</td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        ₦{record.asset.purchaseValue.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-red-600 font-medium">
                        ₦{record.depreciation.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right text-green-600 font-medium">
                        ₦{record.currentValue.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Badge 
                          variant={record.depreciationPercentage > 50 ? "destructive" : "secondary"}
                          className="font-medium"
                        >
                          {record.depreciationPercentage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/assets/${record.assetId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(session.user.role === 'SUPERADMIN') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Calculation Modal */}
      <AnimatePresence>
        {bulkModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setBulkModal({ ...bulkModal, isOpen: false })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Calculate Bulk Depreciation</h2>
                <p className="text-gray-600 mt-1">Calculate depreciation for multiple assets at once</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calculation Year</label>
                  <Select
                    value={bulkModal.year.toString()}
                    onValueChange={(value) => setBulkModal({ ...bulkModal, year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Assets (optional - leave empty for all assets)</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {assets.map(asset => (
                      <label key={asset.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkModal.selectedAssets.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkModal({
                                ...bulkModal,
                                selectedAssets: [...bulkModal.selectedAssets, asset.id]
                              });
                            } else {
                              setBulkModal({
                                ...bulkModal,
                                selectedAssets: bulkModal.selectedAssets.filter(id => id !== asset.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{asset.name}</p>
                          <p className="text-sm text-gray-500">
                            {asset.category.name} • ₦{asset.purchaseValue.toLocaleString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    {bulkModal.selectedAssets.length === 0
                      ? `All ${assets.length} assets will be processed`
                      : `${bulkModal.selectedAssets.length} assets selected`
                    }
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important Note</p>
                      <p className="text-sm text-amber-700 mt-1">
                        This will calculate depreciation for the selected year. Existing records for the same asset and year will be skipped.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setBulkModal({ ...bulkModal, isOpen: false })}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkCalculation}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {isLoading ? 'Calculating...' : 'Calculate Depreciation'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

