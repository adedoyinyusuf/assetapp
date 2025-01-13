import { getAssets, getAssetMovements } from '@/app/actions'
import AssetMovementForm from '@/components/AssetMovementForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'

export default async function AssetDetailsPage({ params }: { params: { id: string } }) {
  const assets = await getAssets()
  const asset = assets.find(a => a.id === parseInt(params.id))
  const assetMovements = await getAssetMovements(parseInt(params.id))

  if (!asset) {
    return <div>Asset not found</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Asset Details</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">{asset.name}</h2>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>Category:</strong> {asset.category}</p>
          <p><strong>Current Location:</strong> {`${asset.state}, ${asset.lga}`}</p>
          <p><strong>Purchase Value:</strong> ${asset.purchaseValue.toFixed(2)}</p>
          <p><strong>Purchase Date:</strong> {asset.purchaseDate}</p>
          <p><strong>Useful Life:</strong> {asset.usefulLife} years</p>
          <p><strong>Salvage Value:</strong> ${asset.salvageValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Movement History</h3>
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
      </div>

      <AssetMovementForm assetId={asset.id} currentLocation={`${asset.state}, ${asset.lga}`} />
    </div>
  )
}

