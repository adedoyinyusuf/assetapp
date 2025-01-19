'use server'

import { revalidatePath } from 'next/cache'

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

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch('http://localhost:3000/api/assets');
  return res.json();
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

// Implement other functions (getAssetMovements, addAssetMovement, etc.) similarly

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

// Implement getCategories, addCategory, updateCategory, deleteCategory
// Implement getStates, getLGAs
// These will be similar to the asset functions, but with different endpoints

export async function getCategories(): Promise<Category[]> {
  const res = await fetch('http://localhost:3000/api/categories');
  return res.json();
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

export async function getStates(): Promise<State[]> {
  const res = await fetch('http://localhost:3000/api/states');
  return res.json();
}

export async function getLGAs(stateId: number): Promise<LGA[]> {
  const res = await fetch(`http://localhost:3000/api/states/${stateId}/lgas`);
  return res.json();
}

