import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// GET /api/mdm/sim-cards - Get all SIM cards
export async function GET() {
    try {
        const simCards = await mdmService.getAllSimCards();
        return NextResponse.json({ data: simCards, count: simCards.length });
    } catch (error: any) {
        console.error('Error fetching SIM cards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch SIM cards', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/mdm/sim-cards - Create new SIM card
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.sim_number) {
            return NextResponse.json(
                { error: 'SIM number is required' },
                { status: 400 }
            );
        }

        const simCard = await mdmService.createSimCard(body);
        return NextResponse.json(simCard, { status: 201 });
    } catch (error: any) {
        console.error('Error creating SIM card:', error);
        return NextResponse.json(
            { error: 'Failed to create SIM card', details: error.message },
            { status: 500 }
        );
    }
}
