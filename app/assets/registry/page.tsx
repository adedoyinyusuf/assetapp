'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faFilter, faEdit, faEye, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
import { getAssets, getCategories, getStates, deleteAsset, Asset, Category, State } from '@/app/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AssetRegistryPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, categoriesData, statesData] = await Promise.all([
          getAssets(),
          getCategories(),
          getStates()
        ])
        setAssets(assetsData)
        setFilteredAssets(assetsData)
        setCategories(categoriesData)
        setStates(statesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = assets

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory)
    }

    // Filter by state
    if (selectedState && selectedState !== 'all') {
      filtered = filtered.filter(asset => asset.state === selectedState)
    }

    // Filter by value range
    if (minValue) {
      filtered = filtered.filter(asset => asset.purchaseValue >= parseFloat(minValue))
    }
    if (maxValue) {
      filtered = filtered.filter(asset => asset.purchaseValue <= parseFloat(maxValue))
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(asset => new Date(asset.purchaseDate) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(asset => new Date(asset.purchaseDate) <= new Date(dateTo))
    }

    setFilteredAssets(filtered)
  }, [assets, searchTerm, selectedCategory, selectedState, minValue, maxValue, dateFrom, dateTo])

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id)
        const updatedAssets = assets.filter(asset => asset.id !== id)
        setAssets(updatedAssets)
        setFilteredAssets(updatedAssets)
      } catch (error) {
        console.error('Error deleting asset:', error)
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedState('')
    setMinValue('')
    setMaxValue('')
    setDateFrom('')
    setDateTo('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading asset registry...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Asset Registry</h1>
        <Link href="/assets/register">
          <Button>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Register New Asset
          </Button>
        </Link>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Search & Filter Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search by name */}
            <div>
              <Label htmlFor="search">Search by Name</Label>
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Enter asset name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter by category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by state */}
            <div>
              <Label htmlFor="state">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All states</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value range */}
            <div>
              <Label htmlFor="minValue">Min Value ($)</Label>
              <Input
                id="minValue"
                type="number"
                placeholder="0"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxValue">Max Value ($)</Label>
              <Input
                id="maxValue"
                type="number"
                placeholder="No limit"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
            </div>

            {/* Date range */}
            <div>
              <Label htmlFor="dateFrom">Purchase Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Purchase Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Showing {filteredAssets.length} of {assets.length} assets
              </p>
            </div>
            <div className="text-sm text-gray-600">
              Total Value: ${filteredAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Value</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>${asset.purchaseValue.toLocaleString()}</TableCell>
                    <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{asset.state}, {asset.lga}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/assets/${asset.id}`}>
                          <Button variant="outline" size="sm">
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/assets/edit?id=${asset.id}`}>
                          <Button variant="outline" size="sm">
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(asset.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAssets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No assets found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
