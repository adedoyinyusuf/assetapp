// Client-safe actions - no Prisma imports

// Types (safe to import on client)
export interface Asset {
  id: number;
  name: string;
  purchaseDate: string;
  purchaseValue: number;
  salvageValue: number;
  usefulLife: number;
  categoryId: number;
  stateId: number;
  lgaId: number;
  category?: {
    id: number;
    name: string;
    defaultUsefulLifeYears?: number;
    description?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
  state?: {
    id: number;
    name: string;
  };
  lga?: {
    id: number;
    name: string;
    stateId: number;
  };
  // Legacy fields for backward compatibility
  category_name?: string;
  state_name?: string;
  lga_name?: string;
  category_id?: number;
  state_id?: number;
  lga_id?: number;
}

export interface AssetMovement {
  id: number;
  asset_id: number;
  asset_name: string;
  from_state_id: number;
  from_lga_id: number;
  to_state_id: number;
  to_lga_id: number;
  from_state: string;
  from_lga: string;
  to_state: string;
  to_lga: string;
  movement_date: string;
  reason: string;
  notes?: string;
  moved_by?: string;
}

export interface Category {
  id: number;
  name: string;
  defaultUsefulLifeYears: number;
  description?: string;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
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

// Asset Movement functions (using fetch - safe for client)
export async function getAssetMovements(assetId?: number): Promise<AssetMovement[]> {
  try {
    const url = assetId ? `http://localhost:3000/api/assets/${assetId}/movements` : 'http://localhost:3000/api/asset-movements';
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function addAssetMovement(movement: Omit<AssetMovement, 'id' | 'asset_name' | 'from_state' | 'from_lga' | 'to_state' | 'to_lga'>): Promise<AssetMovement> {
  const res = await fetch('http://localhost:3000/api/asset-movements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movement),
  });
  // Note: revalidatePath only works in server actions, so we'll call this from server
  return res.json();
}

// Asset CRUD (using fetch - safe for client)
export async function addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
  const res = await fetch('http://localhost:3000/api/assets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(asset),
  });
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
}

export async function deleteAsset(id: number): Promise<void> {
  await fetch(`http://localhost:3000/api/assets/${id}`, {
    method: 'DELETE',
  });
}

// Depreciation calculation (pure function - safe for client)
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

// Category functions (using fetch - safe for client)
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:3000/api/categories');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// State & LGA functions (using fetch - safe for client)
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

export async function initializeLocations(): Promise<{ message: string }> {
  const res = await fetch('http://localhost:3000/api/initialize-locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}
