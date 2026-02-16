import { getAssets, getAssetMovements } from '@/app/actions'

export const dynamic = 'force-dynamic'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AssetMovementPage() {
  const assets = await getAssets()
  const allMovements = await Promise.all(assets.map(asset => getAssetMovements(asset.id)))
  const movements = allMovements.flat()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Asset Movement</h1>
      <Card>
        <CardHeader>
          <CardTitle>Asset Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>From Location</TableHead>
                <TableHead>To Location</TableHead>
                <TableHead>Move Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => {
                const asset = assets.find(a => a.id === movement.asset_id)
                return (
                  <TableRow key={movement.id}>
                    <TableCell>{asset?.name}</TableCell>
                    <TableCell>{movement.from_state}, {movement.from_lga}</TableCell>
                    <TableCell>{movement.to_state}, {movement.to_lga}</TableCell>
                    <TableCell>{movement.movement_date}</TableCell>
                    <TableCell>{movement.notes}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

