import { getAssets, calculateDepreciation } from '@/app/actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DepreciationPage() {
  const assets = await getAssets()
  const currentDate = new Date()

  const assetDepreciations = await Promise.all(assets.map(async (asset) => {
    const { totalDepreciation, currentValue, annualDepreciation } = await calculateDepreciation(asset, currentDate)
    return { asset, totalDepreciation, currentValue, annualDepreciation }
  }))

  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0)
  const totalCurrentValue = assetDepreciations.reduce((sum, item) => sum + item.currentValue, 0)
  const totalDepreciationValue = assetDepreciations.reduce((sum, item) => sum + item.totalDepreciation, 0)
  const depreciationPercentage = totalPurchaseValue > 0 ? (totalDepreciationValue / totalPurchaseValue) * 100 : 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Depreciation Tracking</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">${totalPurchaseValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Purchase Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">${totalCurrentValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Current Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">${totalDepreciationValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Depreciation</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{depreciationPercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Depreciation Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Depreciation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Value</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Total Depreciation</TableHead>
                  <TableHead>Annual Depreciation</TableHead>
                  <TableHead>Depreciation %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetDepreciations.map(({ asset, totalDepreciation, currentValue, annualDepreciation }) => {
                  const depreciationPercent = asset.purchaseValue > 0 ? (totalDepreciation / asset.purchaseValue) * 100 : 0
                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell>${asset.purchaseValue.toLocaleString()}</TableCell>
                      <TableCell>${currentValue.toLocaleString()}</TableCell>
                      <TableCell>${totalDepreciation.toLocaleString()}</TableCell>
                      <TableCell>${annualDepreciation.toLocaleString()}</TableCell>
                      <TableCell>{depreciationPercent.toFixed(1)}%</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {assetDepreciations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No assets found for depreciation tracking.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
