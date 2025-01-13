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
  lgas: string[];
}

let assets: Asset[] = [];
let assetMovements: AssetMovement[] = [];

let categories: Category[] = [
  { id: 1, name: "Fixed Assets: Buildings" },
  { id: 2, name: "Fixed Assets: Land" },
  { id: 3, name: "Fixed Assets: Machinery" },
  { id: 4, name: "Fixed Assets: Vehicles" },
  { id: 5, name: "Fixed Assets: Equipment" },
  { id: 6, name: "IT & Digital Assets: Digital Media Files (images, videos)" },
  { id: 7, name: "IT & Digital Assets: Computers" },
  { id: 8, name: "IT & Digital Assets: Servers" },
  { id: 9, name: "IT & Digital Assets: Networking Equipment" },
  { id: 10, name: "IT & Digital Assets: Software Licenses" },
  { id: 11, name: "IT & Digital Assets: Mobile Devices" },
  { id: 12, name: "Financial Assets: Cash and Cash Equivalents" },
  { id: 13, name: "Intellectual Property: geomaps" },
  { id: 14, name: "Intellectual Property: Copyrights" },
  { id: 15, name: "Inventory: Consumables" },
  { id: 16, name: "Maintenance and Repair: Spare Parts" },
  { id: 17, name: "Compliance and Licenses: Safety Certifications" },
  { id: 18, name: "Utility Assets: Energy Systems (solar panels, generators)" },
  { id: 19, name: "Utility Assets: HVAC Systems" },
  { id: 20, name: "Utility Assets: Waste Management Systems" }
];

let states: State[] = [
  {
    "id": 1,
    "name": "ABIA",
    "lgas": ["ABA NORTH", "ABA SOUTH", "AROCHUKWU", "BENDE", "IKWUANO", "ISIALA NGWA NORTH", "ISIALA NGWA SOUTH", "ISUIKWUATO", "OBI NGWA", "OHAFIA", "OSISIOMA", "UGWUNAGBO", "UKWA EAST", "UKWA WEST", "UMUAHIA NORTH", "UMUAHIA SOUTH", "UMU NNEOCHI"]
  },
  {
    "id": 2,
    "name": "ADAMAWA",
    "lgas": ["DEMSA", "FUFURE", "GANYE", "GAYUK", "GOMBI", "GRIE", "HONG", "JADA", "LARMURDE", "MADAGALI", "MAIHA", "MAYO BELWA", "MICHIKA", "MUBI NORTH", "MUBI SOUTH", "NUMAN", "SHELLENG", "SONG", "TOUNGO", "YOLA NORTH", "YOLA SOUTH"]
  },
  // ... other states
];

// Keep all the existing functions as they are...

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
  const newAsset = {
    ...asset,
    id: assets.length + 1,
  }
  assets.push(newAsset)
  revalidatePath('/assets')
  return newAsset
}

export async function updateAsset(updatedAsset: Asset): Promise<void> {
  const index = assets.findIndex(asset => asset.id === updatedAsset.id)
  if (index !== -1) {
    assets[index] = updatedAsset
    revalidatePath('/assets')
  }
}

export async function deleteAsset(id: number): Promise<void> {
  assets = assets.filter(asset => asset.id !== id)
  assetMovements = assetMovements.filter(movement => movement.assetId !== id)
  revalidatePath('/assets')
}

export async function getAssets(): Promise<Asset[]> {
  return assets
}

export async function getAssetMovements(assetId: number): Promise<AssetMovement[]> {
  return assetMovements.filter(movement => movement.assetId === assetId)
}

export async function addAssetMovement(movement: Omit<AssetMovement, 'id'>): Promise<AssetMovement> {
  const newMovement = {
    ...movement,
    id: assetMovements.length + 1,
  }
  assetMovements.push(newMovement)

  // Update the asset's current location
  const asset = assets.find(a => a.id === movement.assetId)
  if (asset) {
    asset.state = movement.toLocation.split(', ')[0]
    asset.lga = movement.toLocation.split(', ')[1]
  }

  revalidatePath('/assets')
  return newMovement
}

export async function calculateDepreciation(asset: Asset, currentDate: Date): Promise<{ totalDepreciation: number; currentValue: number; annualDepreciation: number }> {
  const purchaseDate = new Date(asset.purchaseDate)
  const yearsElapsed = (currentDate.getTime() - purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
  const depreciableValue = asset.purchaseValue - asset.salvageValue
  const annualDepreciation = asset.usefulLife > 0 ? depreciableValue / asset.usefulLife : 0
  const totalDepreciation = Math.min(yearsElapsed * annualDepreciation, depreciableValue)
  const currentValue = asset.purchaseValue - totalDepreciation
  return {
    totalDepreciation: totalDepreciation || 0,
    currentValue: currentValue || 0,
    annualDepreciation: annualDepreciation || 0
  }
}

export async function getCategories(): Promise<Category[]> {
  return categories
}

export async function addCategory(name: string): Promise<Category> {
  const newCategory = {
    id: categories.length + 1,
    name,
  }
  categories.push(newCategory)
  revalidatePath('/categories')
  return newCategory
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const index = categories.findIndex(category => category.id === id)
  if (index !== -1) {
    categories[index].name = name
    revalidatePath('/categories')
  }
}

export async function deleteCategory(id: number): Promise<void> {
  categories = categories.filter(category => category.id !== id)
  revalidatePath('/categories')
}

export async function getStates(): Promise<State[]> {
  return states
}

export async function getLGAs(stateId: number): Promise<string[]> {
  const state = states.find(s => s.id === stateId)
  return state ? state.lgas : []
}

