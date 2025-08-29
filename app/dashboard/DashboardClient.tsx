'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDollarSign, faChartLine, faPercent, faCubes } from '@fortawesome/free-solid-svg-icons'
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ChartDataItem {
  name: string
  value: number
}

interface DashboardClientProps {
  totalAssets: number
  totalPurchaseValue: number
  totalCurrentValue: number
  totalDepreciation: number
  depreciationPercentage: number
  chartData: {
    locations: ChartDataItem[]
    categories: ChartDataItem[]
  }
}

export default function DashboardClient({
  totalAssets,
  totalPurchaseValue,
  totalCurrentValue,
  totalDepreciation,
  depreciationPercentage,
  chartData
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <FontAwesomeIcon icon={faCubes} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
            <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPurchaseValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Current Value</CardTitle>
            <FontAwesomeIcon icon={faChartLine} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCurrentValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Depreciation</CardTitle>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.locations}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

