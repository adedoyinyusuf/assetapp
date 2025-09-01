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
