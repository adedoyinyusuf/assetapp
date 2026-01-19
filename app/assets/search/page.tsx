'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Save, FolderOpen, RefreshCcw, ArrowRight, ArrowLeft } from 'lucide-react'
import { getAssets, getCategories, getStates, Asset, Category, State } from '@/app/actions'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/assets"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
        <p className="text-muted-foreground mt-1">
          Filter assets by value, date, location, and technical specifications.
        </p>
      </div>

      {/* Search Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Filters
          </CardTitle>
          <CardDescription>
            Combine multiple filters to narrow down your asset list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* General Search */}
            <div className="col-span-full">
              <Label htmlFor="search">Keywords</Label>
              <Input
                id="search"
                placeholder="Search by name, category, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="minValue">Min Value (₦)</Label>
              <Input
                id="minValue"
                type="number"
                placeholder="0"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxValue">Max Value (₦)</Label>
              <Input
                id="maxValue"
                type="number"
                placeholder="No limit"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <Label htmlFor="dateFrom">Purchased After</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dateTo">Purchased Before</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Useful Life Range */}
            <div className="space-y-1.5">
              <Label htmlFor="usefulLifeMin">Min Life (Years)</Label>
              <Input
                id="usefulLifeMin"
                type="number"
                placeholder="0"
                value={usefulLifeMin}
                onChange={(e) => setUsefulLifeMin(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usefulLifeMax">Max Life (Years)</Label>
              <Input
                id="usefulLifeMax"
                type="number"
                placeholder="No limit"
                value={usefulLifeMax}
                onChange={(e) => setUsefulLifeMax(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t">
            <Button onClick={handleSearch} disabled={loading} size="lg" className="min-w-[150px]">
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search Assets'}
            </Button>
            <Button variant="outline" onClick={clearSearch} size="lg">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={saveSearch}>
              <Save className="mr-2 h-4 w-4" />
              Save Criteria
            </Button>
            <Button variant="ghost" onClick={loadSavedSearch}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Load Saved
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results Found ({searchResults.length})</h2>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Summary Card */}
              <Card className="md:col-span-2 lg:col-span-3 bg-muted/30 border-dashed">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-around text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">{formatCurrency(searchResults.reduce((sum, asset) => sum + asset.purchaseValue, 0))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Value</p>
                    <p className="text-xl font-bold">{formatCurrency(searchResults.length > 0 ? searchResults.reduce((sum, asset) => sum + asset.purchaseValue, 0) / searchResults.length : 0)}</p>
                  </div>
                </CardContent>
              </Card>

              {searchResults.map((asset) => (
                <Card key={asset.id} className="group hover:border-primary/50 transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                        {asset.name}
                      </CardTitle>
                      <Badge variant="secondary" className=" shrink-0">{asset.category?.name}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Value:</span>
                        <span className="font-medium text-foreground">{formatCurrency(asset.purchaseValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(asset.purchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="text-right">{asset.state?.name}, {asset.lga?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Life:</span>
                        <span>{asset.usefulLife} years</span>
                      </div>
                    </div>

                    <Button asChild className="w-full mt-4" variant="outline">
                      <Link href={`/assets/${asset.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No assets match your criteria</p>
                <p>Try adjusting your filters to broaden the search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
