'use server'

import { revalidatePath } from 'next/cache'

export interface Asset {
  id: number;
  name: string;
  purchase_date: string;
  purchase_value: number;
  salvage_value: number;
  useful_life: number;
  category_id: number;
  state_id: number;
  lga_id: number;
  created_at: string;
  updated_at: string;
}

export interface AssetMovement {
  id: number;
  asset_id: number;
  from_location: string;
  to_location: string;
  move_date: string;
  notes: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: number;
  name: string;
  created_at: string;
}

export interface LGA {
  id: number;
  name: string;
  state_id: number;
  created_at: string;
}

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch('http://localhost:3000/api/assets');
  if (!res.ok) {
    throw new Error('Failed to fetch assets');
  }
  return res.json();
}

export async function addAsset(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> {
  const res = await fetch('http://localhost:3000/api/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  });
  if (!res.ok) {
    throw new Error('Failed to add asset');
  }
  revalidatePath('/assets');
  return res.json();
}

export async function updateAsset(asset: Omit<Asset, 'created_at' | 'updated_at'>): Promise<Asset> {
  const res = await fetch(`http://localhost:3000/api/assets/${asset.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  });
  if (!res.ok) {
    throw new Error('Failed to update asset');
  }
  revalidatePath('/assets');
  return res.json();
}

export async function deleteAsset(id: number): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/assets/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete asset');
  }
  revalidatePath('/assets');
}

export async function calculateDepreciation(asset: Asset, currentDate: Date): Promise<{ totalDepreciation: number; currentValue: number; annualDepreciation: number }> {
  const purchaseDate = new Date(asset.purchase_date);
  const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
  const depreciableValue = asset.purchase_value - asset.salvage_value;
  const annualDepreciation = asset.useful_life > 0 ? depreciableValue / asset.useful_life : 0;
  const totalDepreciation = Math.min(yearsElapsed * annualDepreciation, depreciableValue);
  const currentValue = asset.purchase_value - totalDepreciation;
  return {
    totalDepreciation: totalDepreciation || 0,
    currentValue: currentValue || 0,
    annualDepreciation: annualDepreciation || 0
  };
}

// Implement getCategories, addCategory, updateCategory, deleteCategory
// Implement getStates, getLGAs
// These will be similar to the asset functions, but with different endpoints

