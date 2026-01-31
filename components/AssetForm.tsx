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
  CheckCircle2,
  Camera,
  Upload,
  QrCode,
  X
} from 'lucide-react'
import QRScanner from '@/components/stock-verification/QRScanner';
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

  // Media & Scanning State
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(asset?.imageUrl || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(asset?.imageUrl || null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Form Fields
  const [name, setName] = useState(asset?.name || '')
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue?.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '')
  const [usefulLife, setUsefulLife] = useState(asset?.usefulLife?.toString() || '')
  const [salvageValue, setSalvageValue] = useState(asset?.salvageValue?.toString() || '0')
  const [categoryId, setCategoryId] = useState(asset?.category_id?.toString() || '')
  const [stateId, setStateId] = useState(asset?.state_id?.toString() || '')
  const [lgaId, setLgaId] = useState(asset?.lga_id?.toString() || '')

  const [serialNumber, setSerialNumber] = useState(asset?.serialNumber || '')
  const [batchNumber, setBatchNumber] = useState(asset?.batchNumber || '')
  const [referenceNumber, setReferenceNumber] = useState(asset?.referenceNumber || '')
  const [imei1, setImei1] = useState(asset?.imei1 || '')
  const [imei2, setImei2] = useState(asset?.imei2 || '')


  const [lgas, setLgas] = useState<LGA[]>(initialLgas)
  const [loadingLgas, setLoadingLgas] = useState(false)

  // Load LGAs when state changes
  useEffect(() => {
    if (stateId) {
      setLoadingLgas(true);
      getLGAs(parseInt(stateId))
        .then((lgaData) => {
          setLgas(lgaData);
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
      if (selectedCategory && !asset?.id) {
        setUsefulLife(selectedCategory.defaultUsefulLifeYears?.toString() || '5');
      }
    }
  }, [categoryId, categories, asset?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setImageUrl(result); // Set as base64 for submission
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImageUrl(null);
  };

  const handleScan = (code: string) => {
    setSerialNumber(code);
    setShowQRScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

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
      // Identity Fields
      serialNumber: serialNumber || undefined,
      batchNumber: batchNumber || undefined,
      referenceNumber: referenceNumber || undefined,
      imei1: imei1 || undefined,
      imei2: imei2 || undefined,
      imageUrl: imageUrl || undefined,
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

      router.push('/assets');
      router.refresh();
    } catch (error) {
      console.error('Error saving asset:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

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

      {/* Section 1.5: Asset Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5 text-primary" />
            Asset Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Asset Image (Evidence/Identification)</Label>

            {!previewUrl ? (
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer bg-muted/50">
                <input
                  type="file"
                  id="assetPhoto"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <label htmlFor="assetPhoto" className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Click to upload photo</p>
                  <p className="text-xs text-muted-foreground">Max 5MB (JPG, PNG)</p>
                </label>
              </div>
            ) : (
              <div className="relative w-full max-w-xs mx-auto">
                <img src={previewUrl} alt="Asset Preview" className="rounded-lg border object-cover w-full h-64" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full w-8 h-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 1.6: Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-primary gap-1"
                onClick={() => setShowQRScanner(!showQRScanner)}
              >
                <QrCode className="h-3 w-3" />
                {showQRScanner ? 'Close Scanner' : 'Scan QR'}
              </Button>
            </div>

            {showQRScanner && (
              <div className="mb-4 p-4 border rounded-md bg-muted/10">
                <QRScanner onScan={handleScan} />
                <Button variant="ghost" size="sm" onClick={() => setShowQRScanner(false)} className="mt-2 w-full">Cancel Scan</Button>
              </div>
            )}

            <Input
              id="serialNumber"
              placeholder="e.g. SN-12345678"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              placeholder="e.g. BATCH-2024-A"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              placeholder="e.g. REF-001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei1">IMEI No 1</Label>
            <Input
              id="imei1"
              placeholder="e.g. 35489..."
              value={imei1}
              onChange={(e) => setImei1(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei2">IMEI No 2</Label>
            <Input
              id="imei2"
              placeholder="e.g. 35490..."
              value={imei2}
              onChange={(e) => setImei2(e.target.value)}
              className="h-11"
            />
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
