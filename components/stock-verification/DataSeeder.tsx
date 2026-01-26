'use client';

import { useEffect } from 'react';
import { db } from '@/lib/stock-verification/db';

interface DataSeederProps {
    assets: any[];
    campaigns: any[];
}

export function DataSeeder({ assets, campaigns }: DataSeederProps) {
    useEffect(() => {
        const seed = async () => {
            try {
                // Clear and bulk add for fresh cache
                // Note: In a real large app, we might merge/upsert instead of clearing
                await db.transaction('rw', db.assets, db.campaigns, async () => {
                    await db.assets.clear();
                    await db.campaigns.clear();

                    const mappedAssets = assets.map(a => ({
                        id: a.id,
                        name: a.name,
                        serialNumber: a.serialNumber,
                        categoryName: a.category?.name || 'Unknown',
                        stateName: a.state?.name || 'Unknown',
                        lgaName: a.lga?.name || 'Unknown'
                    }));

                    const mappedCampaigns = campaigns.map(c => ({
                        id: c.id,
                        name: c.name,
                        status: c.status
                    }));

                    await db.assets.bulkAdd(mappedAssets);
                    await db.campaigns.bulkAdd(mappedCampaigns);
                });
                console.log('Local DB updated successfully');
            } catch (error) {
                console.error('Failed to seed local DB:', error);
            }
        };

        seed();
    }, [assets, campaigns]);

    return null; // Headless component
}
