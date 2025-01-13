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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Track Depreciation</h1>
      <Card>
        <CardHeader>
          <CardTitle>Asset Depreciation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Purchase Value</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Total Depreciation</TableHead>
                <TableHead>Annual Depreciation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetDepreciations.map(({ asset, totalDepreciation, currentValue, annualDepreciation }) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>${asset.purchaseValue.toFixed(2)}</TableCell>
                  <TableCell>${currentValue.toFixed(2)}</TableCell>
                  <TableCell>${totalDepreciation.toFixed(2)}</TableCell>
                  <TableCell>${annualDepreciation.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

