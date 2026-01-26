import { db } from '@/lib/db';
import { getAssets, calculateDepreciation } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runAnnualDepreciation } from './actions';
import { Badge } from "@/components/ui/badge";

export default async function DepreciationPage() {
  const assets = await getAssets();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // 1. Calculate Real-time Projections (Existing logic)
  const assetDepreciations = await Promise.all(assets.map(async (asset) => {
    const { totalDepreciation, currentValue, annualDepreciation } = await calculateDepreciation(asset, currentDate);
    return { asset, totalDepreciation, currentValue, annualDepreciation };
  }));

  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const totalCurrentValue = assetDepreciations.reduce((sum, item) => sum + item.currentValue, 0);
  const totalDepreciationValue = assetDepreciations.reduce((sum, item) => sum + item.totalDepreciation, 0);
  const depreciationPercentage = totalPurchaseValue > 0 ? (totalDepreciationValue / totalPurchaseValue) * 100 : 0;

  // 2. Fetch Persisted Run History
  const runHistory = await db.depreciation.groupBy({
    by: ['year'],
    _sum: { depreciation: true },
    _count: { assetId: true },
    orderBy: { year: 'desc' }
  });

  return (
    <div className="space-y-8 container py-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Depreciation Engine</h1>

        <form action={async (fd) => {
          'use server';
          await runAnnualDepreciation(fd);
        }} className="flex gap-2 items-center bg-card p-2 rounded-lg border">
          <span className="text-sm font-medium">Run for Year:</span>
          <Input
            type="number"
            name="year"
            defaultValue={currentYear}
            className="w-24 h-8"
            min={2000}
            max={currentYear + 1}
          />
          <Button size="sm" type="submit">Run Process</Button>
        </form>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900">₦{totalPurchaseValue.toLocaleString()}</p>
            <p className="text-sm font-medium text-muted-foreground">Total Purchase Value</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-gray-900">₦{totalCurrentValue.toLocaleString()}</p>
            <p className="text-sm font-medium text-muted-foreground">Current Book Value</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-700">₦{totalDepreciationValue.toLocaleString()}</p>
            <p className="text-sm font-medium text-muted-foreground">Total Depreciation</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-purple-700">{depreciationPercentage.toFixed(1)}%</p>
            <p className="text-sm font-medium text-muted-foreground">Depreciated</p>
          </CardContent>
        </Card>
      </div>

      {/* Run History */}
      {runHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Posted Depreciation Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead>Assets Processed</TableHead>
                  <TableHead>Total Depreciation Posted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runHistory.map((run) => (
                  <TableRow key={run.year}>
                    <TableCell className="font-bold">{run.year}</TableCell>
                    <TableCell>{run._count.assetId}</TableCell>
                    <TableCell>₦{run._sum.depreciation?.toLocaleString() ?? 0}</TableCell>
                    <TableCell><Badge variant="outline">POSTED</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Asset Details */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Projections (Real-time)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Cost</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Total Dep.</TableHead>
                  <TableHead>Annual Dep.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetDepreciations.map(({ asset, totalDepreciation, currentValue, annualDepreciation }) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      {asset.name}
                      <div className="text-xs text-muted-foreground">{asset.serialNumber}</div>
                    </TableCell>
                    <TableCell>{asset.category?.name}</TableCell>
                    <TableCell>₦{asset.purchaseValue.toLocaleString()}</TableCell>
                    <TableCell>₦{currentValue.toLocaleString()}</TableCell>
                    <TableCell>₦{totalDepreciation.toLocaleString()}</TableCell>
                    <TableCell>₦{annualDepreciation.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
