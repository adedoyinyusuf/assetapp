import { getAssets, getAssetMovements } from '@/app/actions';
import AssetMovementForm from '@/components/AssetMovementForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

interface Asset {
  id: number;
  name: string;
  category: string;
  state: string;
  lga: string;
  purchaseValue: number;
  purchaseDate: string;
  usefulLife: number;
  salvageValue: number;
}

interface AssetMovement {
  id: number;
  fromLocation: string;
  toLocation: string;
  moveDate: string;
  notes: string;
}

interface Params {
  id: string;
}

// This function will fetch the data needed for the page
async function fetchAssetData(id: string): Promise<{ asset: Asset | null; assetMovements: AssetMovement[] }> {
  const assets = await getAssets();
  const asset = assets.find(a => a.id === parseInt(id));
  const assetMovements = await getAssetMovements(parseInt(id));
  return { asset: asset || null, assetMovements: assetMovements || [] };
}

export default async function AssetDetailsPage({ params }: { params: Params }) {
  const { id } = params;
  const { asset, assetMovements } = await fetchAssetData(id);

  if (!asset) {
    return <div>Asset not found</div>;
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
  );
}