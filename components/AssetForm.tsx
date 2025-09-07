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
  onDataRefresh?: () => Promise<void>;
}

export default function AssetForm({ asset, categories, states, initialLgas, onDataRefresh }: AssetFormProps) {
  const [name, setName] = useState(asset?.name || '')
  const [purchaseValue, setPurchaseValue] = useState(asset?.purchaseValue?.toString() || '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate || '')
  const [usefulLife, setUsefulLife] = useState(asset?.usefulLife?.toString() || '')
  const [salvageValue, setSalvageValue] = useState(asset?.salvageValue?.toString() || '0')
  const [categoryId, setCategoryId] = useState(asset?.category_id?.toString() || '')
  const [stateId, setStateId] = useState(asset?.state_id?.toString() || '')
  const [lgaId, setLgaId] = useState(asset?.lga_id?.toString() || '')
  const [lgas, setLgas] = useState<LGA[]>(initialLgas)
  const [loadingLgas, setLoadingLgas] = useState(false)

  // Debug logging
  console.log('AssetForm Props:', { categories: categories.length, states: states.length, initialLgas: initialLgas.length });
  console.log('States data:', states);
  console.log('Initial LGAs:', initialLgas);

  const router = useRouter()

  useEffect(() => {
    if (stateId) {
      setLoadingLgas(true);
      console.log('Loading LGAs for state:', stateId);
      getLGAs(parseInt(stateId))
        .then((lgaData) => {
          console.log('Loaded LGAs:', lgaData);
          setLgas(lgaData);
          setLgaId(''); // Reset LGA selection when state changes
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
    
    if (!categoryId) {
      alert('Please select a category');
      return;
    }

    if (!stateId) {
      alert('Please select a state');
      return;
    }

    if (!lgaId) {
      alert('Please select an LGA');
      return;
    }

    // Create the base asset data with correct field names for API
    const baseAssetData = {
      name,
      purchaseValue: parseFloat(purchaseValue) || 0,
      purchaseDate,
      usefulLife: parseInt(usefulLife) || 5,
      salvageValue: parseFloat(salvageValue) || 0,
      categoryId: parseInt(categoryId),
      stateId: parseInt(stateId),
      lgaId: parseInt(lgaId),
    };

    // If we're updating, include the ID
    const assetData = asset?.id 
      ? { ...baseAssetData, id: asset.id }
      : baseAssetData;

    try {
      let result;
      if (asset?.id) {
        await updateAsset(assetData as Asset);
        alert('Asset updated successfully!');
      } else {
        result = await addAsset(assetData);
        if (result && result.id) {
          alert('Asset added successfully!');
        } else {
          throw new Error('Failed to create asset');
        }
      }
      router.push('/assets');
      router.refresh();
    } catch (error) {
      console.error('Error saving asset:', error);
      // Show more detailed error message
      let errorMessage = 'Failed to save asset. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      alert(errorMessage);
    }
  }

  const handleInitializeLocations = async () => {
    try {
      console.log('Initializing Nigerian states and LGAs...');
      const response = await fetch('/api/initialize-states-lgas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('States and LGAs initialized:', result);
        alert(`Successfully initialized: ${result.statesCreated} states and ${result.lgasCreated} LGAs created.`);
        
        // Use the refresh callback if available, otherwise reload the page
        if (onDataRefresh) {
          await onDataRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const error = await response.json();
        console.error('Error initializing states and LGAs:', error);
        alert('Failed to initialize states and LGAs: ' + error.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to initialize states and LGAs');
    }
  };

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded text-sm">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <p>Categories: {categories.length}</p>
        <p>States: {states.length}</p>
        <p>Initial LGAs: {initialLgas.length}</p>
        <p>Current LGAs: {lgas.length}</p>
        {states.length === 0 && (
          <div className="mt-2">
            <button 
              type="button" 
              onClick={handleInitializeLocations}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Initialize Nigerian States & LGAs
            </button>
            <p className="text-xs mt-1 text-gray-600">
              Loads all 37 Nigerian states and 774 LGAs from official data
            </p>
          </div>
        )}
      </div>

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
        <Select value={lgaId} onValueChange={setLgaId} disabled={!stateId || loadingLgas}>
          <SelectTrigger>
            <SelectValue placeholder={
              !stateId 
                ? "Select a state first" 
                : loadingLgas 
                  ? "Loading LGAs..." 
                  : lgas.length === 0 
                    ? "No LGAs found" 
                    : "Select an LGA"
            } />
          </SelectTrigger>
          <SelectContent>
            {lgas.map((l) => (
              <SelectItem key={l.id} value={l.id.toString()}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {stateId && !loadingLgas && lgas.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No LGAs found for the selected state.
          </p>
        )}
      </div>
      <Button type="submit">
        <FontAwesomeIcon icon={faSave} className="mr-2" />
        {asset ? 'Update Asset' : 'Add Asset'}
      </Button>
    </form>
    </div>
  )
}

