
import AssetForm from '@/components/AssetForm'
import { getCategories, getStates, getLGAs } from '@/app/actions'

export default async function AddAssetPage() {
  const categories = await getCategories();
  const states = await getStates();
  const initialLgas = states.length > 0 ? await getLGAs(states[0].id) : [];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Asset</h1>
      <AssetForm categories={categories} states={states} initialLgas={initialLgas} />
    </div>
  )
}

