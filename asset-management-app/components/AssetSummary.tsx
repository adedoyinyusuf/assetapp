import { getAssets, calculateDepreciation } from '@/app/actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDollarSign, faChartLine, faPercent } from '@fortawesome/free-solid-svg-icons'

export default async function AssetSummary() {
  const assets = await getAssets()
  const currentDate = new Date()

  const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchaseValue, 0)
  const totalCurrentValue = assets.reduce((sum, asset) => {
    const { currentValue } = calculateDepreciation(asset, currentDate)
    return sum + currentValue
  }, 0)
  const totalDepreciation = totalPurchaseValue - totalCurrentValue
  const depreciationPercentage = (totalDepreciation / totalPurchaseValue) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Purchase Value
          </CardTitle>
          <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalPurchaseValue.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Current Value
          </CardTitle>
          <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalCurrentValue.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Depreciation
          </CardTitle>
          <FontAwesomeIcon icon={faPercent} className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalDepreciation.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {depreciationPercentage.toFixed(2)}% of total value
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

