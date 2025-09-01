'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateAssetReport } from '@/app/report-actions';
import { subDays } from 'date-fns';

interface Asset {
  id: string;
  name: string;
  purchaseValue: number;
  purchaseDate: string;
  usefulLife: number;
  salvageValue: number;
  category: string;
  state: string;
  lga: string;
  currentValue: number;
  totalDepreciation: number;
  depreciationPercentage: number;
  yearsElapsed: number;
}

interface ReportData {
  assets: Asset[];
  summary: {
    totalAssets: number;
    totalValue: number;
    totalDepreciation: number;
  };
  depreciationSummary: {
    totalDepreciation: number;
    averageDepreciation: number;
    mostDepreciated: Array<{
      id: string;
      name: string;
      depreciation: number;
    }>;
  };
  stateBreakdown: Array<{
    state: string;
    count: number;
    totalValue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalValue: number;
  }>;
}

interface DateRange {
  from: Date;
  to: Date;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [filters] = useState({
    category: '',
    state: '',
    lga: '',
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await generateAssetReport();
        setReport(data as unknown as ReportData);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [dateRange, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Asset Reports</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.summary.totalAssets}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{report.summary.totalValue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Depreciation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{report.summary.totalDepreciation.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Depreciation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.depreciationSummary.averageDepreciation.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="assets">All Assets</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
            <TabsTrigger value="location">By Location</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Depreciation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Depreciation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.depreciationSummary.mostDepreciated.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">
                          {item.depreciation.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assets">
            <Card>
              <CardHeader>
                <CardTitle>All Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Purchase Value</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Depreciation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>₦{asset.purchaseValue.toLocaleString()}</TableCell>
                        <TableCell>₦{asset.currentValue.toLocaleString()}</TableCell>
                        <TableCell>{asset.depreciationPercentage.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Assets by Location</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Asset Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.stateBreakdown.map((state) => (
                      <TableRow key={state.state}>
                        <TableCell>{state.state}</TableCell>
                        <TableCell>{state.count}</TableCell>
                        <TableCell className="text-right">
                          ₦{state.totalValue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
