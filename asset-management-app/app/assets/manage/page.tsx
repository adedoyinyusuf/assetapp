import { getAssets } from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AssetList from '@/components/AssetList'

export default async function ManageAssetsPage() {
  const assets = await getAssets()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Assets</h1>
      <Card>
        <CardHeader>
          <CardTitle>Asset List</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetList initialAssets={assets} />
        </CardContent>
      </Card>
    </div>
  )
}

