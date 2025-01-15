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
import { addAsset, updateAsset, getCategories, getStates, getLGAs, Asset, Category, State } from '@/app/actions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave } from '@fortawesome/free-solid-svg-icons'

interface AssetFormProps {
  asset?: Asset
}

export default function AssetForm({ asset }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '')
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || '')
  const [usefulLife, setUsefulLife] = useState(asset?.usefulLife.toString() || '')
  const [salvageValue, setSalvageValue] = useState(asset?.salvageValue.toString() || '')
  const [category, setCategory] = useState(asset?.category || '')
  const [state, setState] = useState(asset?.state || '')
  const [lga, setLga] = useState(asset?.lga || '')

  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<string[]>([])

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedCategories = await getCategories()
        const fetchedStates = await getStates()
        setCategories(fetchedCategories)
        setStates(fetchedStates)

        if (asset?.state) {
          const stateObj = fetchedStates.find(s => s.name === asset.state)
          if (stateObj) {
            const fetchedLGAs = await getLGAs(stateObj.id)
            setLgas(fetchedLGAs)
          }
        }
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }
    fetchData()
  }, [asset])

  const handleStateChange = async (stateName: string) => {
    setState(stateName)
    setLga('')
    const selectedState = states.find(s => s.name === stateName)
    if (selectedState) {
      try {
        const fetchedLGAs = await getLGAs(selectedState.id)
        setLgas(fetchedLGAs)
      } catch (error) {
        console.error('Error fetching LGAs:', error)
        setLgas([])
      }
    } else {
      setLgas([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const assetData = {
      name,
      purchaseValue: parseFloat(purchaseValue),
      purchaseDate,
      usefulLife: parseInt(usefulLife),
      salvageValue: parseFloat(salvageValue),
      category,
      state,
      lga
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
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">{asset ? 'Edit Asset' : 'Add New Asset'}</h2>
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
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
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
        <Select value={state} onValueChange={handleStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="lga">LGA</Label>
        <Select value={lga} onValueChange={setLga}>
          <SelectTrigger>
            <SelectValue placeholder="Select an LGA" />
          </SelectTrigger>
          <SelectContent>
            {lgas.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
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

