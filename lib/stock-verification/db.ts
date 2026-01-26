import Dexie, { Table } from 'dexie';

export interface LocalAsset {
    id: number;
    name: string;
    serialNumber: string | null;
    categoryName: string;
    stateName: string;
    lgaName: string;
}

export interface LocalCampaign {
    id: number;
    name: string;
    status: string;
}

export interface PendingVerification {
    id?: number;
    data: any; // The form data payload
    createdAt: number;
    synced: boolean;
}

export class AssetAppDB extends Dexie {
    assets!: Table<LocalAsset, number>;
    campaigns!: Table<LocalCampaign, number>;
    pendingVerifications!: Table<PendingVerification, number>;

    constructor() {
        super('AssetAppDB');
        this.version(1).stores({
            assets: 'id, name, serialNumber', // Primary key and indexed props
            campaigns: 'id, status',
            pendingVerifications: '++id, synced, createdAt' // Auto-incrementing PK
        });
    }
}

export const db = new AssetAppDB();
