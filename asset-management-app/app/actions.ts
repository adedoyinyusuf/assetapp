
'use server'
import { revalidatePath } from 'next/cache'

// Interfaces
export interface Asset {
  id: number;
  name: string;
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number;
  usefulLife: number;
  category: string;
  state: string;
  lga: string;
  category_id?: number;
  state_id?: number;
  lga_id?: number;
}

export interface AssetMovement {
  id: number;
  assetId: number;
  fromLocation: string;
  toLocation: string;
  moveDate: string;
  notes: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
}

export interface LGA {
  id: number;
  name: string;
  state_id: number;
}

// Asset Movement functions
export async function getAssetMovements(assetId: number): Promise<AssetMovement[]> {
  try {
    const res = await fetch(`http://localhost:3000/api/assets/${assetId}/movements`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addAssetMovement(movement: Omit<AssetMovement, 'id'>): Promise<AssetMovement> {
  const res = await fetch('http://localhost:3000/api/asset-movements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movement),
  });
  revalidatePath('/asset-movement');
  return res.json();
}

// Asset CRUD
export async function getAssets(): Promise<Asset[]> {
  try {
    const res = await fetch('http://localhost:3000/api/assets');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
  const res = await fetch('http://localhost:3000/api/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  });
  revalidatePath('/assets');
  return res.json();
}

export async function updateAsset(asset: Asset): Promise<void> {
  await fetch(`http://localhost:3000/api/assets/${asset.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  });
  revalidatePath('/assets');
}

export async function deleteAsset(id: number): Promise<void> {
  await fetch(`http://localhost:3000/api/assets/${id}`, {
    method: 'DELETE',
  });
  revalidatePath('/assets');
}

// Depreciation
export async function calculateDepreciation(asset: Asset, currentDate: Date): Promise<{ totalDepreciation: number; currentValue: number; annualDepreciation: number }> {
  const purchaseDate = new Date(asset.purchaseDate);
  const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
  const depreciableValue = asset.purchaseValue - asset.salvageValue;
  const annualDepreciation = asset.usefulLife > 0 ? depreciableValue / asset.usefulLife : 0;
  const totalDepreciation = Math.min(yearsElapsed * annualDepreciation, depreciableValue);
  const currentValue = asset.purchaseValue - totalDepreciation;
  return {
    totalDepreciation: totalDepreciation || 0,
    currentValue: currentValue || 0,
    annualDepreciation: annualDepreciation || 0
  };
}

// Category CRUD
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:3000/api/categories');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addCategory(name: string): Promise<Category> {
  const res = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  revalidatePath('/categories');
  return res.json();
}

export async function updateCategory(id: number, name: string): Promise<void> {
  await fetch(`http://localhost:3000/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  revalidatePath('/categories');
}

export async function deleteCategory(id: number): Promise<void> {
  await fetch(`http://localhost:3000/api/categories/${id}`, {
    method: 'DELETE',
  });
  revalidatePath('/categories');
}

// State & LGA
export async function getStates(): Promise<State[]> {
  try {
    const res = await fetch('http://localhost:3000/api/states');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function getLGAs(stateId: number): Promise<LGA[]> {
  try {
    const res = await fetch(`http://localhost:3000/api/states/${stateId}/lgas`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

