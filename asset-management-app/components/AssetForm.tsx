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
import { addAsset, updateAsset, getLGAs, Asset, Category, State, LGA } from '@/app/actions'
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
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || '')
  const [usefulLife, setUsefulLife] = useState(asset?.usefulLife.toString() || '')
  const [salvageValue, setSalvageValue] = useState(asset?.salvageValue.toString() || '')
  const [categoryId, setCategoryId] = useState(asset?.category_id.toString() || '')
  const [stateId, setStateId] = useState(asset?.state_id.toString() || '')
  const [lgaId, setLgaId] = useState(asset?.lga_id.toString() || '')
  const [lgas, setLgas] = useState<LGA[]>(initialLgas)

  const router = useRouter()

  useEffect(() => {
    if (stateId) {
      getLGAs(parseInt(stateId)).then(setLgas)
    }
  }, [stateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const assetData = {
      name,
      purchaseValue: parseFloat(purchaseValue),
      purchaseDate,
      usefulLife: parseInt(usefulLife),
      salvageValue: parseFloat(salvageValue),
      category_id: parseInt(categoryId),
      state_id: parseInt(stateId),
      lga_id: parseInt(lgaId)
    }

    try {
      if (asset) {
        await updateAsset({ ...assetData, id: asset.id })
      } else {
        await addAsset(assetData)
      }
      router.push('/assets')
      router.refresh()
    } catch (error) {
      console.error('Error submitting asset:', error)
      // Handle error (e.g., show error message to user)
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
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
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
      <div>
        <Label htmlFor="usefulLife">Useful Life (years)</Label>
        <Input
          id="usefulLife"
          type="number"
          value={usefulLife}
          onChange={(e) => setUsefulLife(e.target.value)}
          required
        />
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

