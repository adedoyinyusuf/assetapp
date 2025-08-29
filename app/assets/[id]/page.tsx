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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Category Information</h3>
                <div className="space-y-2">
                  <p><strong>Category:</strong> {category?.name}</p>
                  {category?.description && (
                    <p><strong>Description:</strong> {category.description}</p>
                  )}
                  <p>
                    <strong>Default Useful Life:</strong> {category?.defaultUsefulLifeYears || 5} years
                    {asset.usefulLife !== category?.defaultUsefulLifeYears && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Custom: {asset.usefulLife} years)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Location</h3>
                <p className="flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-red-500" />
                  {`${state?.name}, ${lga?.name}`}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Financial Details</h3>
                <div className="space-y-2">
                  <p><strong>Purchase Value:</strong> ${asset.purchaseValue.toFixed(2)}</p>
                  <p><strong>Purchase Date:</strong> {new Date(asset.purchaseDate).toLocaleDateString()}</p>
                  <p><strong>Useful Life:</strong> {asset.usefulLife} years</p>
                  <p><strong>Salvage Value:</strong> ${asset.salvageValue.toFixed(2)}</p>
                  <p><strong>Annual Depreciation:</strong> ${((asset.purchaseValue - asset.salvageValue) / asset.usefulLife).toFixed(2)}</p>
                </div>
              </div>
            </div>
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
                    <strong>From:</strong> {movement.from_state}, {movement.from_lga} <strong>To:</strong> {movement.to_state}, {movement.to_lga}
                  </p>
                  <p><strong>Date:</strong> {movement.movement_date}</p>
                  <p><strong>Reason:</strong> {movement.reason}</p>
                  {movement.notes && <p><strong>Notes:</strong> {movement.notes}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No movement history available.</p>
          )}
        </CardContent>
      </Card>

      <AssetMovementForm 
        assetId={asset.id} 
        currentLocation={`${state?.name}, ${lga?.name}`}
        currentStateId={asset.state_id}
        currentLgaId={asset.lga_id}
        categoryName={category?.name}
      />
    </div>
  )
}

