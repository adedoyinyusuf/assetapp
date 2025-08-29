'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faEye, faFilter } from '@fortawesome/free-solid-svg-icons'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { deleteAsset, getCategories, Asset, Category } from '@/app/actions'

interface AssetListProps {
  initialAssets: Asset[]
}

export default function AssetList({ initialAssets }: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets || [])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(initialAssets || [])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCategories()
  }, [])
  
  // Update assets when initialAssets changes
  useEffect(() => {
    setAssets(initialAssets || [])
    setFilteredAssets(initialAssets || [])
  }, [initialAssets])
  
  // Filter assets based on search term and selected category
  useEffect(() => {
    let result = [...assets]
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(term) ||
        asset.category?.name?.toLowerCase().includes(term) ||
        asset.state?.name?.toLowerCase().includes(term) ||
        asset.lga?.name?.toLowerCase().includes(term)
      )
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const categoryId = parseInt(selectedCategory)
      result = result.filter(asset => asset.category_id === categoryId)
    }
    
    setFilteredAssets(result)
  }, [searchTerm, selectedCategory, assets])

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id)
        setAssets(assets.filter(asset => asset.id !== id))
        router.refresh()
      } catch (error) {
        console.error('Error deleting asset:', error)
        // Handle error (e.g., show error message to user)
      }
    }
  }

  if (isLoading) {
    return <div>Loading assets...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faFilter} className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search assets..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Asset Name</TableHead>
          <TableHead className="w-[200px]">Category</TableHead>
          <TableHead className="text-right">Purchase Value (₦)</TableHead>
          <TableHead>Purchase Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="w-[120px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredAssets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No assets found matching your criteria
            </TableCell>
          </TableRow>
        ) : (
          filteredAssets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-medium">{asset.name}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{asset.category?.name || asset.category_name || 'N/A'}</span>
                {asset.category?.description && (
                  <span className="text-xs text-gray-500">{asset.category.description}</span>
                )}
              </div>
            </TableCell>
            <TableCell>₦{asset.purchaseValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            <TableCell>{new Date(asset.purchaseDate).toLocaleDateString()}</TableCell>
            <TableCell>
              {asset.state?.name || asset.state_name}, {asset.lga?.name || asset.lga_name}
            </TableCell>
            <TableCell className="space-x-2">
              <Link href={`/assets/edit?id=${asset.id}`}>
                <Button variant="outline" size="sm">
                  <FontAwesomeIcon icon={faEdit} className="mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(asset.id)}>
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete
              </Button>
            </TableCell>
          </TableRow>
          ))
        )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

