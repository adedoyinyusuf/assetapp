import { getAssets } from '@/app/actions'
import AssetForm from '@/components/AssetForm'

export default async function EditAssetPage({ params }: { params: { id: string } }) {
  const assets = await getAssets()
  const asset = assets.find(a => a.id === parseInt(params.id))

  if (!asset) {
    return <div>Asset not found</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Asset</h1>
      <AssetForm asset={asset} />
    </div>
  )
}

