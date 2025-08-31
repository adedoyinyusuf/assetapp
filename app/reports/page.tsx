'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from 'lucide-react'
import { generateAssetReport, exportAssetReport } from '@/app/report-actions'

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
  currentValue?: number;
  totalDepreciation?: number;
  depreciationPercentage?: number;
  yearsElapsed?: number;
}

interface ReportData {
  assets: Asset[];
  depreciationSummary: {
    totalDepreciation: number;
    averageDepreciation: number;
    mostDepreciated: Array<{
      id: string;
      name: string;
      depreciation: number;
    }>;
  };
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Fetch report data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Cast to unknown first to avoid direct casting issues
        const reportData = (await generateAssetReport()) as unknown
        if (isReportData(reportData)) {
          setReport(reportData)
        } else {
          console.error('Unexpected report data format:', reportData)
          // Fallback to empty data
          setReport({
            assets: [],
            depreciationSummary: {
              totalDepreciation: 0,
              averageDepreciation: 0,
              mostDepreciated: []
            }
          })
        }
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  // Type guard for ReportData
  function isReportData(data: any): data is ReportData {
    return (
      data && 
      Array.isArray(data.assets) && 
      data.depreciationSummary && 
      typeof data.depreciationSummary.totalDepreciation === 'number' &&
      typeof data.depreciationSummary.averageDepreciation === 'number' &&
      Array.isArray(data.depreciationSummary.mostDepreciated)
    )
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true)
      if (format === 'csv') {
        const csvContent = await exportAssetReport('csv')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `asset-report-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('PDF export will be available soon')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const getAssetSummaryData = (): Asset[] => {
    if (!report?.assets) return []
    
    return report.assets.filter((asset: Asset) => {
      const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory
      const matchesState = selectedState === 'all' || asset.state === selectedState
      const matchesDateFrom = !dateFrom || new Date(asset.purchaseDate) >= new Date(dateFrom)
      const matchesDateTo = !dateTo || new Date(asset.purchaseDate) <= new Date(dateTo)
      
      return matchesCategory && matchesState && matchesDateFrom && matchesDateTo
    })
  }

  interface CategoryBreakdown {
    category: string;
    count: number;
    totalValue: number;
    percentage: number;
  }

  const getCategoryBreakdown = (): CategoryBreakdown[] => {
    if (!report?.assets || report.assets.length === 0) return [];
    
    // Group assets by category
    const assetsByCategory = report.assets.reduce<Record<string, Asset[]>>((acc, asset) => {
      const category = asset.category || 'Uncategorized';
      acc[category] = acc[category] || [];
      acc[category].push(asset);
      return acc;
    }, {});
    
    // Create breakdown for each category
    return Object.entries(assetsByCategory).map(([category, categoryAssets]) => {
      const totalValue = categoryAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
      const percentage = (categoryAssets.length / report.assets.length) * 100;
      
      return {
        category,
        count: categoryAssets.length,
        totalValue,
        percentage: parseFloat(percentage.toFixed(1))
      };
    }).filter(item => item.count > 0);
  }

  interface StateBreakdown {
    state: string;
    count: number;
    totalValue: number;
    percentage: number;
  }

  const getStateBreakdown = (): StateBreakdown[] => {
    if (!report?.assets || report.assets.length === 0) return [];
    
    // Group assets by state
    const assetsByState = report.assets.reduce<Record<string, Asset[]>>((acc, asset) => {
      const state = asset.state || 'Unknown';
      acc[state] = acc[state] || [];
      acc[state].push(asset);
      return acc;
    }, {});
    
    // Create breakdown for each state
    return Object.entries(assetsByState).map(([state, stateAssets]) => {
      const totalValue = stateAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
      const percentage = (stateAssets.length / report.assets.length) * 100;
      
      return {
        state,
        count: stateAssets.length,
        totalValue,
        percentage: parseFloat(percentage.toFixed(1))
      };
    }).filter(item => item.count > 0);
  }

  interface DepreciationReportItem extends Asset {
    yearsElapsed: string;
    annualDepreciation: number;
    totalDepreciation: number;
    currentValue: number;
    depreciationPercentage: string;
  }

  const getDepreciationReport = (): DepreciationReportItem[] => {
    if (!report?.assets) return [];
    
    const now = new Date();
    return report.assets.map(asset => {
      const purchaseDate = new Date(asset.purchaseDate);
      const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const annualDepreciation = (asset.purchaseValue - (asset.salvageValue || 0)) / Math.max(asset.usefulLife, 1);
      const totalDepreciation = Math.min(
        annualDepreciation * yearsElapsed, 
        asset.purchaseValue - (asset.salvageValue || 0)
      );
      const currentValue = Math.max(
        asset.purchaseValue - totalDepreciation, 
        asset.salvageValue || 0
      );
      
      return {
        ...asset,
        yearsElapsed: yearsElapsed.toFixed(1),
        annualDepreciation,
        totalDepreciation,
        currentValue,
        depreciationPercentage: ((totalDepreciation / asset.purchaseValue) * 100).toFixed(1)
      };
    })
  }

  interface LocationBreakdown {
    location: string;
    count: number;
    totalValue: number;
    percentage: number;
  }

  const getLocationBreakdown = (): LocationBreakdown[] => {
    if (!report?.assets || report.assets.length === 0) return [];
    
    // Group assets by location (using state as location for now)
    const assetsByLocation = report.assets.reduce<Record<string, Asset[]>>((acc, asset) => {
      const location = asset.state || 'Unknown';
      acc[location] = acc[location] || [];
      acc[location].push(asset);
      return acc;
    }, {});
    
    // Create breakdown for each location
    return Object.entries(assetsByLocation).map(([location, locationAssets]) => {
      const totalValue = locationAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
      const percentage = (locationAssets.length / report.assets.length) * 100;
      
      return {
        location,
        count: locationAssets.length,
        totalValue,
        percentage: parseFloat(percentage.toFixed(1))
      };
    }).filter(item => item.count > 0);
  };

  const renderReportContent = (tab: string) => {
    if (!report) return null;
    
    // Get the necessary data for the reports
    const stateBreakdown = getStateBreakdown();
    const summaryData = getAssetSummaryData();
    const depreciationData = getDepreciationReport();
    
    switch (tab) {
      case 'summary':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summaryData.length}</p>
                    <p className="text-sm text-gray-600">Total Assets</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">${summaryData.reduce((sum, asset) => sum + asset.purchaseValue, 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Value</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">${summaryData.length > 0 ? (summaryData.reduce((sum, asset) => sum + asset.purchaseValue, 0) / summaryData.length).toLocaleString() : 0}</p>
                    <p className="text-sm text-gray-600">Average Value</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{new Set(summaryData.map(asset => asset.category)).size}</p>
                    <p className="text-sm text-gray-600">Categories</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Value</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>${asset.purchaseValue.toLocaleString()}</TableCell>
                    <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{asset.state}, {asset.lga}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case 'category-breakdown':
        const categoryData = getCategoryBreakdown()
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Asset Count</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>${item.totalValue.toLocaleString()}</TableCell>
                  <TableCell>{item.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case 'location-breakdown':
        const locationData = getLocationBreakdown()
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Asset Count</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locationData.map((location) => (
                <TableRow key={location.location}>
                  <TableCell className="font-medium">{location.location}</TableCell>
                  <TableCell>{location.count}</TableCell>
                  <TableCell>${location.totalValue.toLocaleString()}</TableCell>
                  <TableCell>{location.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case 'location':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Asset Count</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stateBreakdown.map((state) => (
                <TableRow key={state.state}>
                  <TableCell className="font-medium">{state.state}</TableCell>
                  <TableCell>{state.count}</TableCell>
                  <TableCell>${state.totalValue.toLocaleString()}</TableCell>
                  <TableCell>{state.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case 'depreciation':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Purchase Value</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Total Depreciation</TableHead>
                <TableHead>Depreciation %</TableHead>
                <TableHead>Years Elapsed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depreciationData.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>${asset.purchaseValue.toLocaleString()}</TableCell>
                  <TableCell>${asset.currentValue.toLocaleString()}</TableCell>
                  <TableCell>${asset.totalDepreciation.toLocaleString()}</TableCell>
                  <TableCell>{asset.depreciationPercentage}%</TableCell>
                  <TableCell>{asset.yearsElapsed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      default:
        return <div>Select a report type</div>
    }
  }

  if (loading) {
    return <div>Loading report data...</div>
  }

        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Purchase Value</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryData.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.category}</TableCell>
                <TableCell>${asset.purchaseValue.toLocaleString()}</TableCell>
                <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                <TableCell>{asset.state}, {asset.lga}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )

  case 'category-breakdown':
    const categoryData = getCategoryBreakdown()
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Asset Count</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryData.map((item) => (
            <TableRow key={item.category}>
              <TableCell className="font-medium">{item.category}</TableCell>
              <TableCell>{item.count}</TableCell>
              <TableCell>${item.totalValue.toLocaleString()}</TableCell>
              <TableCell>{item.percentage}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  case 'location-breakdown':
    const locationData = getLocationBreakdown()
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>State</TableHead>
            <TableHead>Asset Count</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locationData.map((location) => (
            <TableRow key={location.location}>
              <TableCell className="font-medium">{location.location}</TableCell>
              <TableCell>{location.count}</TableCell>
              <TableCell>${location.totalValue.toLocaleString()}</TableCell>
              <TableCell>{location.percentage}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  case 'location':
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>State</TableHead>
            <TableHead>Asset Count</TableHead>
            <TableHead>Total Value</TableHead>
            <TableHead>Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stateBreakdown.map((state) => (
            <TableRow key={state.state}>
              <TableCell className="font-medium">{state.state}</TableCell>
              <TableCell>{state.count}</TableCell>
              <TableCell>${state.totalValue.toLocaleString()}</TableCell>
              <TableCell>{state.percentage}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  case 'depreciation':
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Purchase Value</TableHead>
            <TableHead>Current Value</TableHead>
            <TableHead>Total Depreciation</TableHead>
            <TableHead>Depreciation %</TableHead>
            <TableHead>Years Elapsed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {depreciationData.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.name}</TableCell>
              <TableCell>${asset.purchaseValue.toLocaleString()}</TableCell>
              <TableCell>${asset.currentValue.toLocaleString()}</TableCell>
              <TableCell>${asset.totalDepreciation.toLocaleString()}</TableCell>
              <TableCell>{asset.depreciationPercentage}%</TableCell>
              <TableCell>{asset.yearsElapsed}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  default:
    return <div>Select a report type</div>
}
};

if (loading) {
return <div>Loading report data...</div>
}

if (!report) {
return <div>Failed to load report data</div>
}

return (
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Asset Reports</h1>
      <p className="text-muted-foreground">View and export asset reports and analytics</p>
    </div>
    <div className="flex items-center space-x-2">
      <Button variant="outline" onClick={() => handleExport('csv')} disabled={exporting}>
        <Download className="mr-2 h-4 w-4" />
        {exporting ? 'Exporting...' : 'Export CSV'}
      </Button>
      <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting}>
        <Download className="mr-2 h-4 w-4" />
        {exporting ? 'Exporting...' : 'Export PDF'}
      </Button>
    </div>
  </div>

  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="summary">
        Summary
      </TabsTrigger>
      <TabsTrigger value="depreciation">
        Depreciation
      </TabsTrigger>
      <TabsTrigger value="location">
        Location
      </TabsTrigger>
      <TabsTrigger value="export">
        Export
      </TabsTrigger>
    </TabsList>
    <TabsContent value="export" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download reports in different formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')} 
              disabled={exporting}
              className="justify-start"
            >
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')} 
              disabled={exporting}
              className="justify-start"
            >
              <Download className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Export Options</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="includeDetails" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label
                  htmlFor="includeDetails"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include detailed asset information
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="includeCharts" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label
                  htmlFor="includeCharts"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include charts and visualizations
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
</div>
)
