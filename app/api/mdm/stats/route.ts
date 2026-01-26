import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// GET /api/mdm/stats - Get MDM statistics
export async function GET() {
    try {
        const stats = await mdmService.getStats();
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Error fetching MDM stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics', details: error.message },
            { status: 500 }
        );
    }
}
