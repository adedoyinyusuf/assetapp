import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Get filter parameters
        const stateIds = searchParams.getAll('stateIds').map(id => parseInt(id)).filter(id => !isNaN(id));
        const categoryIds = searchParams.getAll('categoryIds').map(id => parseInt(id)).filter(id => !isNaN(id));

        // Build where clause
        const where: any = {
            status: {
                not: 'DISPOSED',
            },
        };

        if (stateIds.length > 0) {
            where.stateId = { in: stateIds };
        }

        if (categoryIds.length > 0) {
            where.categoryId = { in: categoryIds };
        }

        // Count assets matching criteria
        const count = await db.asset.count({ where });

        return NextResponse.json({
            success: true,
            count,
            filters: {
                states: stateIds.length,
                categories: categoryIds.length,
            },
        });
    } catch (error) {
        console.error('Error counting assets:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to count assets' },
            { status: 500 }
        );
    }
}
