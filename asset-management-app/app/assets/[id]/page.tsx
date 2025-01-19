import { getAssets, getAssetMovements, getCategories, getStates, getLGAs } from '@/app/actions'
import AssetMovementForm from '@/components/AssetMovementForm'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'

export default async function AssetDetailsPage({ params }: { params: { id: string } }) {
  const assets = await getAssets()
  const asset = assets.find(a => a.id === parseInt(params.id))
  const assetMovements = asset ? await getAssetMovements(asset.id) : []
  const categories = await getCategories()
  const states = await getStates()

  if (!asset) {
    return <div>Asset not found</div>
  }

  const category = categories.find(c => c.id === asset.category_id)
  const state = states.find(s => s.id === asset.state_id)
  const lgas = state ? await getLGAs(state.id) : []
  const lga = lgas.find(l => l.id === asset.lga_id)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Asset Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>{asset.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <p><strong>Category:</strong> {category?.name}</p>
            <p><strong>Current Location:</strong> {`${state?.name}, ${lga?.name}`}</p>
            <p><strong>Purchase Value:</strong> ${asset.purchaseValue.toFixed(2)}</p>
            <p><strong>Purchase Date:</strong> {asset.purchaseDate}</p>
            <p><strong>Useful Life:</strong> {asset.usefulLife} years</p>
            <p><strong>Salvage Value:</strong> ${asset.salvageValue.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {assetMovements.length > 0 ? (
            <ul className="space-y-4">
              {assetMovements.map((movement) => (
                <li key={movement.id} className="border-b pb-4">
                  <p>
                    <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
                    <strong>From:</strong> {movement.fromLocation} <strong>To:</strong> {movement.toLocation}
                  </p>
                  <p><strong>Date:</strong> {movement.moveDate}</p>
                  <p><strong>Notes:</strong> {movement.notes}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No movement history available.</p>
          )}
        </CardContent>
      </Card>

      <AssetMovementForm assetId={asset.id} currentLocation={`${state?.name}, ${lga?.name}`} />
    </div>
  )
}

