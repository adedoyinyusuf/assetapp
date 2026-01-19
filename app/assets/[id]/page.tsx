import { getAssets, getAssetMovements, getCategories, getStates, getLGAs } from '@/app/actions'
import AssetMovementForm from '@/components/AssetMovementForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import VerificationHistoryWidget from '@/components/stock-verification/VerificationHistoryWidget' // Corrected import
import AssetVerificationStatus from '@/components/stock-verification/AssetVerificationStatus'
import { Button } from '@/components/ui/button'
import { CheckCircle2, MapPin, Calendar, DollarSign, Box, ArrowLeft, History, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function AssetDetailsPage({ params }: { params: { id: string } }) {
  const assets = await getAssets()
  const asset = assets.find(a => a.id === parseInt(params.id))
  const assetMovements = asset ? await getAssetMovements(asset.id) : []
  const categories = await getCategories()
  const states = await getStates()

  if (!asset) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Asset Not Found</h1>
        <Button asChild variant="outline">
          <Link href="/assets">Back to Inventory</Link>
        </Button>
      </div>
    )
  }

  // Use the category, state, and lga objects directly from the asset
  const category = asset.category || categories.find(c => c.id === (asset.categoryId || asset.category_id))
  const state = asset.state || states.find(s => s.id === (asset.stateId || asset.state_id))
  const lga = asset.lga || (asset.lga_id ? { id: asset.lga_id, name: asset.lga_name || '', stateId: asset.state_id || 0 } : null)

  const formattedValue = (val: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  return (
    <div className="container py-10 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/assets/manage"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Asset List
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <Badge variant={asset.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {asset.status || 'ACTIVE'}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <Box className="h-4 w-4" />
              {category?.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {state?.name}, {lga?.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Purchased {new Date(asset.purchaseDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href={`/stock-verification/verifications/new?assetId=${asset.id}`}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verify Asset
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/assets/edit/${asset.id}`}>
              Edit Details
            </Link>
          </Button>
        </div>
      </div>

      {/* Verification Status Banner */}
      <AssetVerificationStatus assetId={asset.id} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-8">
          {/* Key Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formattedValue(asset.currentValue || asset.purchaseValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Depreciated from {formattedValue(asset.purchaseValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Useful Life</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {asset.usefulLife} Years
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {category?.defaultUsefulLifeYears === asset.usefulLife ? 'Standard for category' : 'Custom duration'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Category Description</h4>
                  <p>{category?.description || 'No description available.'}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Exact Location</h4>
                  <p>{state?.name || 'Unknown State'} - {lga?.name || 'Unknown LGA'}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Salvage Value</h4>
                  <p>{formattedValue(asset.salvageValue)}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Annual Depreciation</h4>
                  <p>{formattedValue((asset.purchaseValue - asset.salvageValue) / asset.usefulLife)} / year</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movement History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Movement History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assetMovements.length > 0 ? (
                <div className="relative border-l border-muted ml-3 space-y-6 pb-2">
                  {assetMovements.map((movement, idx) => (
                    <div key={movement.id} className="ml-6 relative">
                      <div className="absolute -left-[31px] bg-background border rounded-full p-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-semibold">
                          Moved to {movement.to_state}, {movement.to_lga}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(movement.movement_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        From: {movement.from_state}, {movement.from_lga}
                      </p>
                      {movement.reason && (
                        <div className="mt-2 text-sm bg-muted/50 p-2 rounded">
                          Reason: {movement.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No movements recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-8">
          {/* Action Widget */}
          <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
            <h3 className="font-semibold">Quick Actions</h3>
            <AssetMovementForm
              assetId={asset.id}
              currentLocation={`${state?.name || 'Unknown'}, ${lga?.name || 'Unknown'}`}
              currentStateId={asset.stateId || asset.state_id || asset.state?.id || 0}
              currentLgaId={asset.lgaId || asset.lga_id || asset.lga?.id || 0}
              categoryName={category?.name || 'Unknown'}
            />
          </div>

          {/* Verification Widget */}
          <VerificationHistoryWidget assetId={asset.id} />
        </div>

      </div>
    </div>
  )
}
