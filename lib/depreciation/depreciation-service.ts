import { PrismaClient, Asset, Depreciation } from '@prisma/client';
import { db } from '@/lib/db';

export class DepreciationService {
    private db: PrismaClient;

    constructor() {
        this.db = db;
    }

    /**
     * Run depreciation for a specific year
     * Calculates and persists depreciation for all eligible assets
     */
    async runDepreciation(year: number, userId: number): Promise<{ processed: number; errors: number }> {
        // 1. Fetch all active assets
        const assets = await this.db.asset.findMany({
            where: {
                status: { notIn: ['DISPOSED', 'MISSING'] },
                usefulLife: { gt: 0 } // Must have a useful life
            }
        });

        let processed = 0;
        let errors = 0;

        for (const asset of assets) {
            try {
                await this.processAssetDepreciation(asset, year);
                processed++;
            } catch (error) {
                console.error(`Failed to depreciate asset ${asset.id}:`, error);
                errors++;
            }
        }

        return { processed, errors };
    }

    /**
     * Process depreciation for a single asset for a given year
     */
    private async processAssetDepreciation(asset: Asset, year: number) {
        // Calculate Depreciation
        const { depreciationAmount, newCurrentValue } = this.calculateAnnualDepreciation(asset, year);

        // Transaction: Create/Update Depreciation Record + Update Asset Current Value
        await this.db.$transaction(async (tx) => {
            // Upsert the depreciation record for this year
            await tx.depreciation.upsert({
                where: {
                    assetId_year: {
                        assetId: asset.id,
                        year: year
                    }
                },
                update: {
                    depreciation: depreciationAmount,
                    currentValue: newCurrentValue,
                    updatedAt: new Date()
                },
                create: {
                    assetId: asset.id,
                    year: year,
                    depreciation: depreciationAmount,
                    currentValue: newCurrentValue
                }
            });

            // Update the asset's current value cache if this is the latest run
            // (Simplification: We always update asset's current value to match the latest calculation)
            await tx.asset.update({
                where: { id: asset.id },
                data: {
                    currentValue: newCurrentValue
                }
            });
        });
    }

    /**
     * Standard Straight-Line Calculation
     */
    private calculateAnnualDepreciation(asset: Asset, year: number): { depreciationAmount: number; newCurrentValue: number } {
        const purchaseYear = asset.purchaseDate.getFullYear();

        // If asset purchased after the run year, 0 depreciation
        if (purchaseYear > year) {
            return { depreciationAmount: 0, newCurrentValue: asset.purchaseValue };
        }

        const cost = asset.purchaseValue;
        const salvage = asset.salvageValue;
        const usefulLife = asset.usefulLife;
        const depreciableAmount = cost - salvage;

        if (depreciableAmount <= 0) {
            return { depreciationAmount: 0, newCurrentValue: cost };
        }

        const annualDepreciation = depreciableAmount / usefulLife;

        // Calculate cumulative depreciation up to (year - 1)
        // Ideally we sum up previous records, but for robustness we can recalculate assuming straight line
        const yearsElapsed = year - purchaseYear + 1; // Including this year? 
        // Let's rely on standard logic: 
        // Depreciation this year is `annualDepreciation`, capped by remaining book value.

        // We can check how much has been depreciated so far?
        // Or blindly apply straight line logic based on age.

        // Logic:
        // Age in years including this run year
        let age = year - purchaseYear;
        // If bought in Dec 2023, run for 2023 -> Age = 0? Or 1?
        // Let's assume full year depreciation for simplicity or pro-rata? 
        // Use full year for now as per requirement for "Simple Engine"
        if (age < 0) age = 0;

        // Total depreciation allowed up to this year end
        // If year == purchaseYear, maybe 1 year worth? Or 0?
        // Usually depreciation starts when placed in service.
        // Let's count the run year as 1 full year of depreciation if purchaseYear <= year.

        const yearsDepreciated = age + 1;

        // Cap years at useful life
        if (yearsDepreciated > usefulLife) {
            // Already fully depreciated in previous years
            // But we might need to record 0 for this year to show tracking?
            // If strictly > usefulLife, then depreciationAmount is 0
            return { depreciationAmount: 0, newCurrentValue: salvage };
        }

        // Check if this is the final year
        let depreciationAmount = annualDepreciation;

        // Calculate theoretical current value
        // value = cost - (annual * years)
        let newCurrentValue = cost - (annualDepreciation * yearsDepreciated);

        // Safety cap against salvage value
        if (newCurrentValue < salvage) {
            newCurrentValue = salvage;
            // Adjust this year's depreciation to match exactly
            const prevValue = cost - (annualDepreciation * (yearsDepreciated - 1));
            depreciationAmount = Math.max(0, prevValue - salvage);
        }

        return {
            depreciationAmount,
            newCurrentValue
        };
    }

    async getRunHistory() {
        // aggregate runs?
        // For now just return distinct years found
        const years = await this.db.depreciation.groupBy({
            by: ['year'],
            _count: true,
            _sum: {
                depreciation: true
            },
            orderBy: {
                year: 'desc'
            }
        });
        return years;
    }
}

export const depreciationService = new DepreciationService();
