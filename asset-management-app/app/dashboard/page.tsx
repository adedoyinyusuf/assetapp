import { getAssets, calculateDepreciation } from '@/app/actions'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const assets = await getAssets()
  const currentDate = new Date()

  const totalAssets = assets.length
  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0)

  const deprecationResults = await Promise.all(
    assets.map(asset => calculateDepreciation(asset, currentDate))
  )

  const totalCurrentValue = deprecationResults.reduce((sum, result) => sum + result.currentValue, 0)
  const totalDepreciation = totalPurchaseValue - totalCurrentValue
  const depreciationPercentage = totalPurchaseValue !== 0 ? (totalDepreciation / totalPurchaseValue) * 100 : 0

  const assetsByLocation = assets.reduce((acc, asset) => {
    const location = `${asset.state}, ${asset.lga}`
    acc[location] = (acc[location] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const assetsByCategory = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = {
    locations: Object.entries(assetsByLocation).map(([name, value]) => ({ name, value })),
    categories: Object.entries(assetsByCategory).map(([name, value]) => ({ name, value })),
  }

  return (
    <DashboardClient
      totalAssets={totalAssets}
      totalPurchaseValue={totalPurchaseValue}
      totalCurrentValue={totalCurrentValue}
      totalDepreciation={totalDepreciation}
      depreciationPercentage={depreciationPercentage}
      chartData={chartData}
    />
  )
}

