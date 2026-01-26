
export interface DepreciationYear {
    year: number;
    openBookValue: number;
    depreciationExpense: number;
    accumulatedDepreciation: number;
    closingBookValue: number;
}

export function calculateDepreciationSchedule(
    purchaseValue: number,
    salvageValue: number,
    usefulLifeYears: number,
    purchaseDate: Date
): DepreciationYear[] {
    const schedule: DepreciationYear[] = [];

    // Validate inputs
    if (usefulLifeYears <= 0 || purchaseValue < 0) return [];

    const depreciableAmount = purchaseValue - salvageValue;
    const annualDepreciation = depreciableAmount / usefulLifeYears;

    let currentBookValue = purchaseValue;
    let accumulatedDepreciation = 0;
    const startYear = purchaseDate.getFullYear();

    for (let i = 1; i <= usefulLifeYears; i++) {
        const openBookValue = currentBookValue;

        // In the final year, adjust simply to match salvage value exactly to avoid rounding errors
        let expense = annualDepreciation;

        if (i === usefulLifeYears) {
            expense = currentBookValue - salvageValue;
        }

        // Ensure we don't drop below salvage value
        if (currentBookValue - expense < salvageValue) {
            expense = currentBookValue - salvageValue;
        }

        accumulatedDepreciation += expense;
        currentBookValue -= expense;

        schedule.push({
            year: startYear + i - 1, // Fiscal year assumption: depreciation starts immediately
            openBookValue: Number(openBookValue.toFixed(2)),
            depreciationExpense: Number(expense.toFixed(2)),
            accumulatedDepreciation: Number(accumulatedDepreciation.toFixed(2)),
            closingBookValue: Number(currentBookValue.toFixed(2))
        });
    }

    return schedule;
}
