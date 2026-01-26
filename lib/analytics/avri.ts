import { calculateDepreciationSchedule } from "../depreciation";

export interface AVRIMetrics {
    assetId: number;
    currentBookValue: number;
    avriScore: number; // 0-100
    utilizationFactor: number;
}

export function calculateAssetAVRI(asset: any): AVRIMetrics {
    // 1. Calculate Current Book Value
    // If we have a stored currentValue, use it. Otherwise calculate it.
    let bookValue = asset.currentValue;

    if (!bookValue && asset.purchaseValue && asset.usefulLife) {
        const schedule = calculateDepreciationSchedule(
            asset.purchaseValue,
            asset.salvageValue || 0,
            asset.usefulLife,
            new Date(asset.purchaseDate)
        );

        // Find current year's value
        const currentYear = new Date().getFullYear();
        const yearData = schedule.find(y => y.year === currentYear);
        bookValue = yearData ? yearData.closingBookValue : (
            // If undefined, check bounds
            currentYear < schedule[0]?.year ? asset.purchaseValue :
                schedule[schedule.length - 1]?.closingBookValue || 0
        );
    }

    if (!bookValue) bookValue = 0;

    // 2. Determine Utilization Factor based on Status
    let utilization = 0;
    switch (asset.status) {
        case 'IN_USE':
        case 'ACTIVE':
            utilization = 1.0;
            break;
        case 'IN_STORE':
            utilization = 0.8; // Available but idle
            break;
        case 'MAINTENANCE':
        case 'UNDER_MAINTENANCE':
            utilization = 0.4; // Cost center currently
            break;
        case 'MISSING':
        case 'DISPOSED':
        case 'SCRAPPED':
            utilization = 0.0;
            break;
        default:
            utilization = 0.5;
    }

    // 3. Calculate AVRI
    // (Value Retention %) * (Utilization) * 100
    const valueRetention = asset.purchaseValue > 0 ? (bookValue / asset.purchaseValue) : 0;
    const avri = valueRetention * utilization * 100;

    return {
        assetId: asset.id,
        currentBookValue: bookValue,
        avriScore: Math.round(avri * 10) / 10, // Round to 1 decimal
        utilizationFactor: utilization
    };
}

export function calculateFleetAVRI(assets: any[]): number {
    if (!assets.length) return 0;

    // Weighted average by purchase value? Or simple average?
    // Simple average is easier for "Index".
    const totalAvri = assets.reduce((sum, asset) => sum + calculateAssetAVRI(asset).avriScore, 0);
    return Math.round((totalAvri / assets.length) * 10) / 10;
}
