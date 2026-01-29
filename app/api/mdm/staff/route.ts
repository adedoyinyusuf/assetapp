import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

export const dynamic = 'force-dynamic';


const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// GET /api/mdm/staff - Get all staff
export async function GET() {
    try {
        const staff = await mdmService.getAllStaff();
        return NextResponse.json({ data: staff, count: staff.length });
    } catch (error: any) {
        console.error('Error fetching staff:', error);
        return NextResponse.json(
            { error: 'Failed to fetch staff', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/mdm/staff - Create new staff member
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.staff_id || !body.full_name) {
            return NextResponse.json(
                { error: 'Staff ID and full name are required' },
                { status: 400 }
            );
        }

        const staff = await mdmService.createStaff(body);
        return NextResponse.json(staff, { status: 201 });
    } catch (error: any) {
        console.error('Error creating staff:', error);
        return NextResponse.json(
            { error: 'Failed to create staff member', details: error.message },
            { status: 500 }
        );
    }
}
