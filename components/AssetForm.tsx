'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addAsset, updateAsset, getLGAs, Asset, Category, State, LGA } from '@/app/client-actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave } from '@fortawesome/free-solid-svg-icons'

interface AssetFormProps {
  asset?: Asset;
  categories: Category[];
  states: State[];
  initialLgas: LGA[];
}

export default function AssetForm({ asset, categories, states, initialLgas }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '')
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue?.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || '')
  const [usefulLife, setUsefulLife] = useState(asset?.usefulLife?.toString() || '')
  const [salvageValue, setSalvageValue] = useState(asset?.salvageValue?.toString() || '0')
  const [categoryId, setCategoryId] = useState(asset?.category_id?.toString() || '')
  const [stateId, setStateId] = useState(asset?.state_id?.toString() || '')
  const [lgaId, setLgaId] = useState(asset?.lga_id?.toString() || '')
  const [lgas, setLgas] = useState<LGA[]>(initialLgas)

  const router = useRouter()

  useEffect(() => {
    if (stateId) {
      getLGAs(parseInt(stateId)).then(setLgas)
    }
  }, [stateId])

  // Update useful life when category changes
  useEffect(() => {
    if (categoryId) {
      const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
      if (selectedCategory && !asset?.id) { // Only set default useful life for new assets
        setUsefulLife(selectedCategory.defaultUsefulLifeYears?.toString() || '5');
      }
    }
  }, [categoryId, categories, asset?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryId) {
      alert('Please select a category');
      return;
    }

    // Create the base asset data
    const baseAssetData = {
      name,
      purchaseValue: parseFloat(purchaseValue) || 0,
      purchaseDate,
      usefulLife: parseInt(usefulLife) || 5,
      salvageValue: parseFloat(salvageValue) || 0,
      category_id: parseInt(categoryId),
      state_id: parseInt(stateId),
      lga_id: parseInt(lgaId),
    };

    // If we're updating, include the ID
    const assetData = asset?.id 
      ? { ...baseAssetData, id: asset.id } as Asset
      : baseAssetData as Omit<Asset, 'id'>;

    try {
      if (asset?.id) {
        await updateAsset(assetData as Asset);
      } else {
        await addAsset(assetData as Omit<Asset, 'id'>);
      }
      router.push('/assets');
      router.refresh();
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Failed to save asset. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <div>
        <Label htmlFor="name">Asset Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select 
          value={categoryId} 
          onValueChange={(value) => {
            setCategoryId(value);
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex flex-col">
                  <span>{category.name}</span>
                  {category.description && (
                    <span className="text-xs text-gray-500">{category.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="purchaseValue">Purchase Value</Label>
        <Input
          id="purchaseValue"
          type="number"
          value={purchaseValue}
          onChange={(e) => setPurchaseValue(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="purchaseDate">Purchase Date</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          required
        />
      </div>
      {/* Useful Life */}
      <div className="space-y-2">
        <Label htmlFor="usefulLife">Useful Life (years)</Label>
        <Input
          id="usefulLife"
          type="number"
          min="1"
          value={usefulLife}
          onChange={(e) => setUsefulLife(e.target.value)}
          required
        />
        {categoryId && (
          <p className="text-xs text-gray-500">
            Default for this category: {categories.find(c => c.id === parseInt(categoryId))?.defaultUsefulLifeYears || 5} years
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="salvageValue">Salvage Value</Label>
        <Input
          id="salvageValue"
          type="number"
          value={salvageValue}
          onChange={(e) => setSalvageValue(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="state">State</Label>
        <Select value={stateId} onValueChange={setStateId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="lga">LGA</Label>
        <Select value={lgaId} onValueChange={setLgaId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an LGA" />
          </SelectTrigger>
          <SelectContent>
            {lgas.map((l) => (
              <SelectItem key={l.id} value={l.id.toString()}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">
        <FontAwesomeIcon icon={faSave} className="mr-2" />
        {asset ? 'Update Asset' : 'Add Asset'}
      </Button>
    </form>
  )
}

