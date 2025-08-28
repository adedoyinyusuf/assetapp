'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport, faChartBar, faCalendar, faDownload } from '@fortawesome/free-solid-svg-icons'
import { getAssets, getCategories, getStates, Asset, Category, State } from '@/app/actions'

export default function ReportsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [selectedReport, setSelectedReport] = useState('asset-summary')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, categoriesData, statesData] = await Promise.all([
          getAssets(),
          getCategories(),
          getStates()
        ])
        setAssets(assetsData)
        setCategories(categoriesData)
        setStates(statesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const generateReport = () => {
    setLoading(true)
    // Simulate report generation
    setTimeout(() => {
      setLoading(false)
      alert('Report generated successfully!')
    }, 1000)
  }

  const exportReport = (format: string) => {
    alert(`Exporting report as ${format.toUpperCase()}...`)
  }

  const getAssetSummaryData = () => {
    let filtered = assets

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory)
    }
    if (selectedState && selectedState !== 'all') {
      filtered = filtered.filter(asset => asset.state === selectedState)
    }
    if (dateFrom) {
      filtered = filtered.filter(asset => new Date(asset.purchaseDate) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(asset => new Date(asset.purchaseDate) <= new Date(dateTo))
    }

    return filtered
  }

  const getCategoryBreakdown = () => {
    const breakdown = categories.map(category => {
      const categoryAssets = assets.filter(asset => asset.category === category.name)
      const totalValue = categoryAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0)
      return {
        category: category.name,
        count: categoryAssets.length,
        totalValue,
        percentage: assets.length > 0 ? (categoryAssets.length / assets.length * 100).toFixed(1) : '0'
      }
    })
    return breakdown.filter(item => item.count > 0)
  }

  const getLocationBreakdown = () => {
    const breakdown = states.map(state => {
      const stateAssets = assets.filter(asset => asset.state === state.name)
      const totalValue = stateAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0)
      return {
        state: state.name,
        count: stateAssets.length,
        totalValue,
        percentage: assets.length > 0 ? (stateAssets.length / assets.length * 100).toFixed(1) : '0'
      }
    })
    return breakdown.filter(item => item.count > 0)
  }

  const getDepreciationReport = () => {
    const currentDate = new Date()
    return assets.map(asset => {
      const purchaseDate = new Date(asset.purchaseDate)
      const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      const annualDepreciation = (asset.purchaseValue - asset.salvageValue) / asset.usefulLife
      const totalDepreciation = Math.min(annualDepreciation * yearsElapsed, asset.purchaseValue - asset.salvageValue)
      const currentValue = Math.max(asset.purchaseValue - totalDepreciation, asset.salvageValue)
      
      return {
        ...asset,
        yearsElapsed: yearsElapsed.toFixed(1),
        annualDepreciation,
        totalDepreciation,
        currentValue,
        depreciationPercentage: ((totalDepreciation / asset.purchaseValue) * 100).toFixed(1)
      }
    })
  }

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'asset-summary':
        const summaryData = getAssetSummaryData()
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
              {locationData.map((item) => (
                <TableRow key={item.state}>
                  <TableCell className="font-medium">{item.state}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>${item.totalValue.toLocaleString()}</TableCell>
                  <TableCell>{item.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case 'depreciation-report':
        const depreciationData = getDepreciationReport()
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
        return <div>Select a report type to view data.</div>
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Asset Reports</h1>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon={faChartBar} className="mr-2" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset-summary">Asset Summary</SelectItem>
                  <SelectItem value="category-breakdown">Category Breakdown</SelectItem>
                  <SelectItem value="location-breakdown">Location Breakdown</SelectItem>
                  <SelectItem value="depreciation-report">Depreciation Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Filter by Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Filter by State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <FontAwesomeIcon icon={faFileExport} className="mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => exportReport('csv')}>
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedReport === 'asset-summary' && 'Asset Summary Report'}
            {selectedReport === 'category-breakdown' && 'Category Breakdown Report'}
            {selectedReport === 'location-breakdown' && 'Location Breakdown Report'}
            {selectedReport === 'depreciation-report' && 'Depreciation Report'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderReportContent()}
        </CardContent>
      </Card>
    </div>
  )
}
