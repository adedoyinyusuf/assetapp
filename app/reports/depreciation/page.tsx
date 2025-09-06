'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';

interface DepreciationReport {
  summary: {
    totalDepreciation: number;
    averageDepreciationRate: number;
    assetsFullyDepreciated: number;
    assetsNearingFullDepreciation: number;
  };
  yearlyTrends: Array<{
    year: number;
    totalDepreciation: number;
    assetCount: number;
    averageRate: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalDepreciation: number;
    averageRate: number;
    assetCount: number;
  }>;
  stateBreakdown: Array<{
    state: string;
    totalDepreciation: number;
    averageRate: number;
    assetCount: number;
  }>;
  criticalAssets: Array<{
    id: number;
    name: string;
    category: string;
    purchaseValue: number;
    currentValue: number;
    depreciationPercentage: number;
    yearsTilFullDepreciation: number;
  }>;
}

export default function DepreciationReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<DepreciationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch depreciation report data
  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...(selectedYear && selectedYear !== 'all' && { year: selectedYear }),
        ...(selectedCategory && selectedCategory !== 'all' && { category: selectedCategory }),
      });

      const response = await fetch(`/api/depreciation?${params}`);
      const data = await response.json();

      if (response.ok) {
        // Transform the depreciation records into report format
        const records = data.data || [];
        
        const report: DepreciationReport = {
          summary: {
            totalDepreciation: records.reduce((sum: number, record: any) => sum + record.depreciation, 0),
            averageDepreciationRate: records.length > 0 
              ? records.reduce((sum: number, record: any) => sum + record.depreciationPercentage, 0) / records.length 
              : 0,
            assetsFullyDepreciated: records.filter((record: any) => record.depreciationPercentage >= 100).length,
            assetsNearingFullDepreciation: records.filter((record: any) => 
              record.depreciationPercentage >= 80 && record.depreciationPercentage < 100
            ).length,
          },
          yearlyTrends: [],
          categoryBreakdown: [],
          stateBreakdown: [],
          criticalAssets: records
            .filter((record: any) => record.depreciationPercentage >= 75)
            .slice(0, 10)
            .map((record: any) => ({
              id: record.assetId,
              name: record.asset.name,
              category: record.asset.category.name,
              purchaseValue: record.asset.purchaseValue,
              currentValue: record.currentValue,
              depreciationPercentage: record.depreciationPercentage,
              yearsTilFullDepreciation: Math.max(0, (100 - record.depreciationPercentage) / 10), // Rough estimate
            }))
        };

        // Calculate category breakdown
        const categoryMap = new Map();
        records.forEach((record: any) => {
          const category = record.asset.category.name;
          if (!categoryMap.has(category)) {
            categoryMap.set(category, {
              category,
              totalDepreciation: 0,
              totalPercentage: 0,
              assetCount: 0,
            });
          }
          const catData = categoryMap.get(category);
          catData.totalDepreciation += record.depreciation;
          catData.totalPercentage += record.depreciationPercentage;
          catData.assetCount += 1;
        });

        report.categoryBreakdown = Array.from(categoryMap.values()).map((cat: any) => ({
          ...cat,
          averageRate: cat.assetCount > 0 ? cat.totalPercentage / cat.assetCount : 0,
        }));

        setReportData(report);
      } else {
        toast.error(data.error || 'Failed to fetch depreciation report');
      }
    } catch (error) {
      console.error('Error fetching depreciation report:', error);
      toast.error('Failed to fetch depreciation report');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedCategory]);

  useEffect(() => {
    if (session) {
      fetchReportData();
    }
  }, [session, fetchReportData]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    if (!reportData) return;

    try {
      const dataToExport = {
        summary: reportData.summary,
        categoryBreakdown: reportData.categoryBreakdown,
        criticalAssets: reportData.criticalAssets,
        generatedAt: new Date().toISOString(),
      };

      let content, mimeType, extension;
      
      if (format === 'csv') {
        const csvContent = [
          'Category,Total Depreciation,Average Rate,Asset Count',
          ...reportData.categoryBreakdown.map(cat => 
            `${cat.category},${cat.totalDepreciation},${cat.averageRate.toFixed(2)}%,${cat.assetCount}`
          )
        ].join('\n');
        
        content = csvContent;
        mimeType = 'text/csv';
        extension = 'csv';
      } else {
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `depreciation-report-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Depreciation report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
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
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-primary" />
              Depreciation Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Detailed analysis of asset depreciation trends
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select onValueChange={(value: 'csv' | 'json') => handleExport(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {reportData?.categoryBreakdown.map(cat => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : !reportData ? (
        <div className="text-center py-24">
          <TrendingDown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No depreciation data available</h3>
          <p className="text-gray-500">No depreciation records found for the selected filters.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
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
                    <p className="text-sm text-gray-600">Total Depreciation</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₦{reportData.summary.totalDepreciation.toLocaleString()}
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
                    <p className="text-sm text-gray-600">Avg. Depreciation Rate</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {reportData.summary.averageDepreciationRate.toFixed(1)}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Fully Depreciated</p>
                    <p className="text-2xl font-bold text-red-600">
                      {reportData.summary.assetsFullyDepreciated}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Near Full Depreciation</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {reportData.summary.assetsNearingFullDepreciation}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Depreciation by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.categoryBreakdown.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No category data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Assets</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Total Depreciation</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Average Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.categoryBreakdown.map((category, index) => (
                          <motion.tr
                            key={category.category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-4 px-4 font-medium text-gray-900">
                              {category.category}
                            </td>
                            <td className="py-4 px-4 text-right text-gray-700">
                              {category.assetCount}
                            </td>
                            <td className="py-4 px-4 text-right text-red-600 font-medium">
                              ₦{category.totalDepreciation.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Badge 
                                variant={category.averageRate > 75 ? "destructive" : "secondary"}
                              >
                                {category.averageRate.toFixed(1)}%
                              </Badge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Critical Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Critical Assets (High Depreciation)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.criticalAssets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No critical assets found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Asset</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Purchase Value</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Current Value</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Depreciation %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.criticalAssets.map((asset, index) => (
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
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline">{asset.category}</Badge>
                            </td>
                            <td className="py-4 px-4 text-right text-gray-700">
                              ₦{asset.purchaseValue.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right text-green-600 font-medium">
                              ₦{asset.currentValue.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Badge 
                                variant={asset.depreciationPercentage > 90 ? "destructive" : "secondary"}
                                className="font-medium"
                              >
                                {asset.depreciationPercentage.toFixed(1)}%
                              </Badge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
