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
import {
  Save,
  Info,
  Banknote,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AssetFormProps {
  asset?: Asset;
  categories: Category[];
  states: State[];
  initialLgas: LGA[];
  onDataRefresh?: () => Promise<void>;
}

export default function AssetForm({ asset, categories, states, initialLgas, onDataRefresh }: AssetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState(asset?.name || '')
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue?.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '')
  const [usefulLife, setUsefulLife] = useState(asset?.usefulLife?.toString() || '')
  const [salvageValue, setSalvageValue] = useState(asset?.salvageValue?.toString() || '0')
  const [categoryId, setCategoryId] = useState(asset?.category_id?.toString() || '')
  const [stateId, setStateId] = useState(asset?.state_id?.toString() || '')
  const [lgaId, setLgaId] = useState(asset?.lga_id?.toString() || '')

  const [lgas, setLgas] = useState<LGA[]>(initialLgas)
  const [loadingLgas, setLoadingLgas] = useState(false)

  // Load LGAs when state changes
  useEffect(() => {
    if (stateId) {
      setLoadingLgas(true);
      getLGAs(parseInt(stateId))
        .then((lgaData) => {
          setLgas(lgaData);
          // Only reset if the current lgaId is not in the new list (or if we just switched states manually)
          // For simplicity in edit mode, we might want to keep it if it's valid, but usually swapping state means invalidating LGA.
          // In edit mode initialization, we rely on initialLgas so this effect shouldn't break it if logic is right.
          if (asset?.state_id?.toString() !== stateId) {
            setLgaId('');
          } else if (!lgaData.find(l => l.id.toString() === lgaId)) {
            setLgaId('');
          }
        })
        .catch((error) => {
          console.error('Error loading LGAs:', error);
          setLgas([]);
        })
        .finally(() => {
          setLoadingLgas(false);
        });
    } else {
      setLgas([]);
      setLgaId('');
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
    setError(null);
    setIsSubmitting(true);

    // Validation
    if (!categoryId || !stateId || !lgaId) {
      setError('Please fill in all required fields including Category, State, and LGA.');
      setIsSubmitting(false);
      return;
    }

    const baseAssetData = {
      name,
      purchaseValue: parseFloat(purchaseValue) || 0,
      purchaseDate,
      usefulLife: parseInt(usefulLife) || 5,
      salvageValue: parseFloat(salvageValue) || 0,
      category_id: parseInt(categoryId),
      state_id: parseInt(stateId),
      lga_id: parseInt(lgaId),
      // Include camelCase to satisfy TypeScript interface
      categoryId: parseInt(categoryId),
      stateId: parseInt(stateId),
      lgaId: parseInt(lgaId),
    };

    const assetData = asset?.id
      ? { ...baseAssetData, id: asset.id }
      : baseAssetData;

    try {
      if (asset?.id) {
        await updateAsset(assetData as Asset);
      } else {
        const result = await addAsset(assetData);
        if (!result || !result.id) throw new Error('Failed to create asset');
      }

      // Success
      router.push('/assets');
      router.refresh();
    } catch (error) {
      console.error('Error saving asset:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  // Debug/Init Functionality for Dev/Admin
  const handleInitializeLocations = async () => {
    if (!confirm("This will initialize all Nigerian states and LGAs. Continue?")) return;
    try {
      const response = await fetch('/api/initialize-states-lgas', { method: 'POST' });
      if (response.ok) {
        if (onDataRefresh) await onDataRefresh();
        else window.location.reload();
      } else {
        throw new Error("Failed to initialize");
      }
    } catch (e) {
      alert("Initialization failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Section 1: Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Info className="h-5 w-5 text-primary" />
            Asset Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Asset Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Dell Latitude 5420 Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              required
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-muted-foreground">{category.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Financials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Banknote className="h-5 w-5 text-primary" />
            Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="purchaseValue">Purchase Value (₦) <span className="text-red-500">*</span></Label>
            <Input
              id="purchaseValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={purchaseValue}
              onChange={(e) => setPurchaseValue(e.target.value)}
              required
              className="h-11 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date <span className="text-red-500">*</span></Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usefulLife">Useful Life (Years) <span className="text-red-500">*</span></Label>
            <Input
              id="usefulLife"
              type="number"
              min="1"
              value={usefulLife}
              onChange={(e) => setUsefulLife(e.target.value)}
              required
              className="h-11"
            />
            {categoryId && (
              <p className="text-xs text-muted-foreground">
                Default for selected category: {categories.find(c => c.id === parseInt(categoryId))?.defaultUsefulLifeYears || 5} years
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salvageValue">Salvage Value (₦)</Label>
            <Input
              id="salvageValue"
              type="number"
              min="0"
              step="0.01"
              value={salvageValue}
              onChange={(e) => setSalvageValue(e.target.value)}
              required
              className="h-11 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Location & Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
            <Select value={stateId} onValueChange={setStateId} required>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {states.length === 0 && (
              <div onClick={handleInitializeLocations} className="text-xs text-blue-500 cursor-pointer hover:underline mt-1">
                No states found? Click here to initialize locations.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lga">LGA <span className="text-red-500">*</span></Label>
            <Select
              value={lgaId}
              onValueChange={setLgaId}
              disabled={!stateId || loadingLgas}
              required
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder={loadingLgas ? "Loading..." : "Select LGA"} />
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
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="h-11 px-8"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 px-8 min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {asset ? 'Update Asset' : 'Register Asset'}
            </>
          )}
        </Button>
      </div>

    </form>
  )
}
