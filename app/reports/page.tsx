'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Package,
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';

interface ReportData {
  summary: {
    totalAssets: number;
    totalValue: number;
    totalDepreciation: number;
    netBookValue: number;
    averageDepreciation: number;
    valueByStatus: Record<string, number>;
    depreciationPercentage: number;
  };
  categoryBreakdown: Record<string, {
    count: number;
    totalValue: number;
    percentage: number;
  }>;
  stateBreakdown: Record<string, {
    count: number;
    totalValue: number;
    percentage: number;
  }>;
  mostDepreciated: Array<{
    id: number;
    name: string;
    currentValue: number;
    depreciation: {
      total: number;
      percentage: number;
    };
  }>;
  generatedAt: string;
  assets: any[];
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reports');
      const data = await response.json();

      if (response.ok) {
        setReportData(data);
      } else {
        toast.error('Failed to fetch report data', {
          description: data.error || 'Failed to fetch report data'
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchReportData();
    }
  }, [session, fetchReportData]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!reportData) return;

    try {
      setIsExporting(true);
      
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success('Report exported successfully');
      } else {
        const data = await response.json();
        toast.error('Failed to export report', {
          description: data.error || 'Failed to export report'
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
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
            <FileText className="h-8 w-8 text-primary" />
            Asset Reports
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive asset management reports and analytics
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select onValueChange={(value: 'csv' | 'json' | 'pdf') => handleExport(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
              <SelectItem value="pdf">Export PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : !reportData ? (
        <div className="text-center py-24">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No report data available</h3>
          <p className="text-gray-500">Unable to generate reports at this time.</p>
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
                    <p className="text-sm text-gray-600">Total Assets</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.summary.totalAssets.toLocaleString()}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{reportData.summary.totalValue.toLocaleString()}
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
                    <p className="text-sm text-gray-600">Net Book Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{reportData.summary.netBookValue.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Depreciation</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{reportData.summary.totalDepreciation.toLocaleString()}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Breakdown Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Assets by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(reportData.categoryBreakdown).map(([category, data]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{category}</span>
                            <span className="text-sm text-gray-500">
                              {data.count} assets
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${data.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₦{data.totalValue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* State Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Assets by State
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(reportData.stateBreakdown).map(([state, data]) => (
                      <div key={state} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{state}</span>
                            <span className="text-sm text-gray-500">
                              {data.count} assets
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${data.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₦{data.totalValue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Most Depreciated Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Most Depreciated Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.mostDepreciated.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No depreciation data available
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-700">Asset</th>
                          <th className="text-right py-2 font-medium text-gray-700">Current Value</th>
                          <th className="text-right py-2 font-medium text-gray-700">Total Depreciation</th>
                          <th className="text-right py-2 font-medium text-gray-700">Depreciation %</th>
                          <th className="text-center py-2 font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.mostDepreciated.map((asset) => (
                          <tr key={asset.id} className="border-b border-gray-100">
                            <td className="py-3 text-gray-900 font-medium">
                              {asset.name}
                            </td>
                            <td className="py-3 text-right text-green-600">
                              ₦{asset.currentValue.toLocaleString()}
                            </td>
                            <td className="py-3 text-right text-red-600">
                              ₦{asset.depreciation.total.toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              <Badge 
                                variant={asset.depreciation.percentage > 75 ? "destructive" : "secondary"}
                              >
                                {asset.depreciation.percentage.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="py-3 text-center">
                              <Link href={`/assets/${asset.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Report Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Additional Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/reports/depreciation">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <TrendingDown className="h-8 w-8 text-red-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">Depreciation Reports</h3>
                          <p className="text-sm text-gray-600">Detailed depreciation analysis</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/reports/export">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Download className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">Export Data</h3>
                          <p className="text-sm text-gray-600">Download reports in various formats</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/analytics">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                        <div>
                          <h3 className="font-medium text-gray-900">Advanced Analytics</h3>
                          <p className="text-sm text-gray-600">Comprehensive analytics dashboard</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report Metadata */}
          <div className="text-center text-sm text-gray-500 mt-8">
            <p>Report generated on {new Date(reportData.generatedAt).toLocaleString()}</p>
          </div>
        </>
      )}
    </div>
  );
}
