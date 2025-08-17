import { getAssets, getCategories, getStates, getLGAs } from '@/app/actions'
import AssetForm from '@/components/AssetForm'

export default async function EditAssetPage({ searchParams }: { searchParams: { id: string } }) {
  const assets = await getAssets()
  const asset = assets.find(a => a.id === parseInt(searchParams.id))
  const categories = await getCategories()
  const states = await getStates()

  if (!asset) {
    return <div>Asset not found</div>
  }

  const lgas = asset.state_id !== undefined ? await getLGAs(asset.state_id) : []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Asset</h1>
      <AssetForm 
        asset={asset} 
        categories={categories}
        states={states}
        initialLgas={lgas}
      />
    </div>
  )
}

