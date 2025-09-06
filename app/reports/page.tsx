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
import { toast } from '@/components/ui/use-toast';
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
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch report data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch report data',
        variant: 'destructive',
      });
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

        toast({
          title: 'Success',
          description: 'Report exported successfully',
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to export report',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
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

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Types
type Asset = {
  id: number;
  name: string;
  description: string | null;
  purchaseValue: number;
  purchaseDate: string | Date;
  currentValue: number;
  usefulLife: number;
  salvageValue: number;
  category: string;
  state: string;
  lga: string;
  depreciation: {
    total: number;
    percentage: number;
    annual: number;
  };
  latestMovement: {
    from: {
      state: string;
      lga: string;
    };
    to: {
      state: string;
      lga: string;
    };
    date: string | Date;
    reason: string | null;
    movedBy: string | null;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ReportData = {
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
      annual: number;
    };
  }>;
  assets: Asset[];
  generatedAt: string | Date;
};

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/reports');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Format currency helper function
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage helper function
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Format date helper function
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchReportData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">No report data available</p>
          <Button onClick={fetchReportData} variant="outline" className="mt-4">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Asset Reports</h1>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalAssets}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Purchase Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.summary.totalValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Book Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.summary.netBookValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Depreciation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(report.summary.totalDepreciation)}
                  <div className="text-sm text-muted-foreground">
                    {formatPercentage(report.summary.depreciationPercentage)} of purchase value
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Asset List</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated on {formatDate(report.generatedAt)}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Purchase Value</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">Depreciation</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>
                          {asset.state} {asset.lga ? `- ${asset.lga}` : ''}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(asset.purchaseValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(asset.currentValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">
                            {formatCurrency(asset.depreciation.total)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatPercentage(asset.depreciation.percentage)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(asset.updatedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Depreciation Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Depreciation:</span>
                    <span className="font-medium">
                      {formatCurrency(report.summary.totalDepreciation)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Depreciation per Asset:</span>
                    <span className="font-medium">
                      {formatCurrency(report.summary.averageDepreciation)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depreciation Percentage:</span>
                    <span className="font-medium">
                      {formatPercentage(report.summary.depreciationPercentage)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Depreciated Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.mostDepreciated.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {asset.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(asset.depreciation.total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPercentage(asset.depreciation.percentage)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(report.categoryBreakdown).map(([category, data]) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell className="text-right">{data.count}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.totalValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(data.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By State</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(report.stateBreakdown).map(([state, data]) => (
                      <TableRow key={state}>
                        <TableCell className="font-medium">{state}</TableCell>
                        <TableCell className="text-right">{data.count}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.totalValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(data.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
