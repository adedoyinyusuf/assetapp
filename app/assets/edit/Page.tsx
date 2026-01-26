import { getAssets, getCategories, getStates, getLGAs } from '@/app/actions'
import AssetForm from '@/components/AssetForm'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditAssetPage({ searchParams }: { searchParams: { id: string } }) {
  const assets = await getAssets()
  const asset = assets.find(a => a.id === parseInt(searchParams.id))
  const categories = await getCategories()
  const states = await getStates()

  if (!asset) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Asset Not Found</h1>
        <Link href="/assets/manage" className="text-primary hover:underline">Return to List</Link>
      </div>
    )
  }

  const lgas = asset.state_id !== undefined ? await getLGAs(asset.state_id) : []

  return (
    <div className="container py-10 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div>
        <Link
          href={`/assets/${asset.id}`}
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Asset Details
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
        <p className="text-muted-foreground text-lg">
          Update the information for {asset.name}.
        </p>
      </div>

      <AssetForm
        asset={asset}
        categories={categories}
        states={states}
        initialLgas={lgas}
      />
    </div>
  )
}
