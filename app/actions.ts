
'use server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma.server'

// Interfaces
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
    defaultUsefulLifeYears?: number; // Made optional to match Prisma schema
    description?: string | null; // Updated to handle null from Prisma
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
  // Alias fields for compatibility
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

// Asset Movement functions
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
  revalidatePath('/asset-movement');
  revalidatePath('/operations/movements');
  return res.json();
}

// Asset CRUD
export async function getAssets(): Promise<Asset[]> {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        state: true,
        lga: true,
        movements: true
      }
    });
    
    // Map to the expected asset format
    return assets.map(asset => ({
      ...asset,
      // Ensure date is in string format
      purchaseDate: asset.purchaseDate instanceof Date 
        ? asset.purchaseDate.toISOString() 
        : typeof asset.purchaseDate === 'string' 
          ? asset.purchaseDate 
          : new Date().toISOString(),
      // Add legacy fields for backward compatibility
      category_id: asset.categoryId,
      state_id: asset.stateId,
      lga_id: asset.lgaId,
      state_name: asset.state?.name || '',
      lga_name: asset.lga?.name || '',
      category_name: asset.category?.name || ''
    }));
  } catch (error) {
    console.error('Error fetching assets:', error);
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
  console.log('=== getCategories() called ===');
  
  try {
    // 1. First, check if prisma is defined
    if (!prisma) {
      console.error('Prisma client is not initialized');
      throw new Error('Prisma client is not initialized');
    }
    
    console.log('Prisma client is available');
    
    // 2. Try to get categories using raw SQL query with proper typing
    console.log('Attempting to fetch categories...');
    const categories = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, name, description, created_at, updated_at 
      FROM categories 
      ORDER BY name ASC
    `;
    
    console.log('Successfully fetched categories:', JSON.stringify(categories, null, 2));
    
    return categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || undefined,
      defaultUsefulLifeYears: 0,
      parent_id: undefined,
      created_at: new Date(cat.created_at).toISOString(),
      updated_at: new Date(cat.updated_at).toISOString()
    } as Category));
    
  } catch (error: unknown) {
    console.error('Error in getCategories:', error);
    throw error;
  }
}

export async function addCategory(name: string): Promise<Category> {
  try {
    // First check if category with same name already exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM categories WHERE name = ${name} LIMIT 1
    `;
    
    if (existing && (existing as any[]).length > 0) {
      throw new Error('A category with this name already exists');
    }
    
    // Create the new category
    const result = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      INSERT INTO categories (name, description, created_at, updated_at)
      VALUES (${name}, '', NOW(), NOW())
      RETURNING *
    `;
    
    const newCategory = result[0];
    
    // Return the new category in the expected format
    return {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description || undefined,
      defaultUsefulLifeYears: 0,
      parent_id: undefined,
      created_at: newCategory.created_at.toISOString(),
      updated_at: newCategory.updated_at.toISOString()
    };
  } catch (error) {
    console.error('Error adding category:', error);
    throw new Error('Failed to add category');
  }
}

export async function updateCategory(id: number, name: string): Promise<void> {
  try {
    // First check if category exists
    const categoryExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM categories WHERE id = ${id}
    `;
    
    if (!categoryExists || categoryExists.length === 0) {
      throw new Error('Category not found');
    }
    
    // Check if another category with the same name already exists
    const nameExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM categories WHERE name = ${name} AND id != ${id} LIMIT 1
    `;
    
    if (nameExists && nameExists.length > 0) {
      throw new Error('A category with this name already exists');
    }
    
    // Update the category
    await prisma.$executeRaw`
      UPDATE categories 
      SET name = ${name}, updated_at = NOW() 
      WHERE id = ${id}
    `;
    
  } catch (error: any) {
    console.error('Error updating category:', error);
    throw new Error(error.message || 'Failed to update category');
  }
}

export async function deleteCategory(id: number): Promise<void> {
  try {
    // First check if category exists
    const categoryExists = await prisma.$queryRaw<Array<{id: number}>>`
      SELECT id FROM categories WHERE id = ${id}
    `;
    
    if (!categoryExists || categoryExists.length === 0) {
      throw new Error('Category not found');
    }
    
    // Check if any assets are using this category
    const assetsUsingCategory = await prisma.$queryRaw<Array<{count: number}>>`
      SELECT COUNT(*) as count FROM assets WHERE category_id = ${id}
    `;
    
    if (assetsUsingCategory && assetsUsingCategory[0].count > 0) {
      throw new Error('Cannot delete category: There are assets using this category');
    }
    
    // Delete the category
    await prisma.$executeRaw`
      DELETE FROM categories WHERE id = ${id}
    `;
    
  } catch (error: any) {
    console.error('Error deleting category:', error);
    throw new Error(error.message || 'Failed to delete category');
  }
}

// State & LGA
export async function getStates(): Promise<State[]> {
  try {
    const res = await fetch('http://localhost:3000/api/states');
    if (!res.ok) return [];
    const response = await res.json();
    // Handle paginated response - extract data array
    return response.data || response;
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
  revalidatePath('/admin/locations');
  return res.json();
}

