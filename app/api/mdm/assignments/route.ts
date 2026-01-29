import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

export const dynamic = 'force-dynamic';


const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// POST /api/mdm/assignments - Assign device to staff
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.device_id || !body.staff_id) {
            return NextResponse.json(
                { error: 'Device ID and Staff ID are required' },
                { status: 400 }
            );
        }

        const assignment = await mdmService.assignDevice(body);
        return NextResponse.json(assignment, { status: 201 });
    } catch (error: any) {
        console.error('Error assigning device:', error);
        return NextResponse.json(
            { error: 'Failed to assign device', details: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/mdm/assignments/[id]/return - Return device
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        await mdmService.returnDevice(id);

        return NextResponse.json({ message: 'Device returned successfully' });
    } catch (error: any) {
        console.error('Error returning device:', error);
        return NextResponse.json(
            { error: 'Failed to return device', details: error.message },
            { status: 500 }
        );
    }
}
