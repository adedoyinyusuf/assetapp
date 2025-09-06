'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faSave } from '@fortawesome/free-solid-svg-icons'
import { getAssets, getCategories, getStates, Asset, Category, State } from '@/app/actions'
import Link from 'next/link'

export default function AssetSearchPage() {
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Search criteria
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [usefulLifeMin, setUsefulLifeMin] = useState('')
  const [usefulLifeMax, setUsefulLifeMax] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, statesData] = await Promise.all([
          getCategories(),
          getStates()
        ])
        setCategories(categoriesData)
        setStates(statesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const allAssets = await getAssets()
      let filtered = allAssets

      // Apply all filters
      if (searchTerm) {
        filtered = filtered.filter(asset => 
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asset.category?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
          (asset.state?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
          (asset.lga?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
        )
      }

      if (selectedCategory && selectedCategory !== 'all') {
        filtered = filtered.filter(asset => asset.category?.name === selectedCategory)
      }

      if (selectedState && selectedState !== 'all') {
        filtered = filtered.filter(asset => asset.state?.name === selectedState)
      }

      if (minValue) {
        filtered = filtered.filter(asset => asset.purchaseValue >= parseFloat(minValue))
      }

      if (maxValue) {
        filtered = filtered.filter(asset => asset.purchaseValue <= parseFloat(maxValue))
      }

      if (dateFrom) {
        filtered = filtered.filter(asset => new Date(asset.purchaseDate) >= new Date(dateFrom))
      }

      if (dateTo) {
        filtered = filtered.filter(asset => new Date(asset.purchaseDate) <= new Date(dateTo))
      }

      if (usefulLifeMin) {
        filtered = filtered.filter(asset => asset.usefulLife >= parseInt(usefulLifeMin))
      }

      if (usefulLifeMax) {
        filtered = filtered.filter(asset => asset.usefulLife <= parseInt(usefulLifeMax))
      }

      setSearchResults(filtered)
      setHasSearched(true)
    } catch (error) {
      console.error('Error searching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedState('')
    setMinValue('')
    setMaxValue('')
    setDateFrom('')
    setDateTo('')
    setUsefulLifeMin('')
    setUsefulLifeMax('')
    setSearchResults([])
    setHasSearched(false)
  }

  const saveSearch = () => {
    const searchCriteria = {
      searchTerm,
      selectedCategory,
      selectedState,
      minValue,
      maxValue,
      dateFrom,
      dateTo,
      usefulLifeMin,
      usefulLifeMax
    }
    localStorage.setItem('savedAssetSearch', JSON.stringify(searchCriteria))
    alert('Search criteria saved!')
  }

  const loadSavedSearch = () => {
    const saved = localStorage.getItem('savedAssetSearch')
    if (saved) {
      const criteria = JSON.parse(saved)
      setSearchTerm(criteria.searchTerm || '')
      setSelectedCategory(criteria.selectedCategory || '')
      setSelectedState(criteria.selectedState || '')
      setMinValue(criteria.minValue || '')
      setMaxValue(criteria.maxValue || '')
      setDateFrom(criteria.dateFrom || '')
      setDateTo(criteria.dateTo || '')
      setUsefulLifeMin(criteria.usefulLifeMin || '')
      setUsefulLifeMax(criteria.usefulLifeMax || '')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Advanced Asset Search</h1>

      {/* Search Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Search Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* General Search */}
            <div className="col-span-full">
              <Label htmlFor="search">General Search</Label>
              <Input
                id="search"
                placeholder="Search by name, category, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Any category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State Filter */}
            <div>
              <Label htmlFor="state">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Any state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any state</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value Range */}
            <div>
              <Label htmlFor="minValue">Min Purchase Value ($)</Label>
              <Input
                id="minValue"
                type="number"
                placeholder="0"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxValue">Max Purchase Value ($)</Label>
              <Input
                id="maxValue"
                type="number"
                placeholder="No limit"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
            </div>

            {/* Date Range */}
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

            {/* Useful Life Range */}
            <div>
              <Label htmlFor="usefulLifeMin">Min Useful Life (years)</Label>
              <Input
                id="usefulLifeMin"
                type="number"
                placeholder="0"
                value={usefulLifeMin}
                onChange={(e) => setUsefulLifeMin(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="usefulLifeMax">Max Useful Life (years)</Label>
              <Input
                id="usefulLifeMax"
                type="number"
                placeholder="No limit"
                value={usefulLifeMax}
                onChange={(e) => setUsefulLifeMax(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={handleSearch} disabled={loading}>
              <FontAwesomeIcon icon={faSearch} className="mr-2" />
              {loading ? 'Searching...' : 'Search Assets'}
            </Button>
            <Button variant="outline" onClick={clearSearch}>
              Clear All
            </Button>
            <Button variant="outline" onClick={saveSearch}>
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              Save Search
            </Button>
            <Button variant="outline" onClick={loadSavedSearch}>
              Load Saved Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length} assets found)</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {/* Results Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Total Assets:</strong> {searchResults.length}
                    </div>
                    <div>
                      <strong>Total Value:</strong> ${searchResults.reduce((sum, asset) => sum + asset.purchaseValue, 0).toLocaleString()}
                    </div>
                    <div>
                      <strong>Avg Value:</strong> ${searchResults.length > 0 ? (searchResults.reduce((sum, asset) => sum + asset.purchaseValue, 0) / searchResults.length).toLocaleString() : 0}
                    </div>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((asset) => (
                    <Card key={asset.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><strong>Category:</strong> {asset.category?.name}</div>
                          <div><strong>Value:</strong> ${asset.purchaseValue.toLocaleString()}</div>
                          <div><strong>Purchase Date:</strong> {new Date(asset.purchaseDate).toLocaleDateString()}</div>
                          <div><strong>Location:</strong> {asset.state?.name}, {asset.lga?.name}</div>
                          <div><strong>Useful Life:</strong> {asset.usefulLife} years</div>
                        </div>
                        <div className="mt-4">
                          <Link href={`/assets/${asset.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No assets found matching your search criteria.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
