import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

export const dynamic = 'force-dynamic';


const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// GET /api/mdm/devices - Get all devices with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const osType = searchParams.get('os_type');
        const isEnrolled = searchParams.get('is_enrolled');

        let devices = await mdmService.getAllDevices();

        // Apply filters
        if (status) {
            devices = devices.filter(d => d.status === status);
        }
        if (osType) {
            devices = devices.filter(d => d.os_type === osType);
        }
        if (isEnrolled !== null) {
            const enrolled = isEnrolled === 'true';
            devices = devices.filter(d => d.is_enrolled === enrolled);
        }

        return NextResponse.json({
            data: devices,
            count: devices.length
        });
    } catch (error: any) {
        console.error('Error fetching devices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch devices', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/mdm/devices - Create new device
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.imei_1) {
            return NextResponse.json(
                { error: 'IMEI 1 is required' },
                { status: 400 }
            );
        }

        // Check if IMEI already exists
        const existing = await mdmService.getDeviceByIMEI(body.imei_1);
        if (existing) {
            return NextResponse.json(
                { error: 'Device with this IMEI already exists' },
                { status: 409 }
            );
        }

        const device = await mdmService.createDevice(body);

        return NextResponse.json(device, { status: 201 });
    } catch (error: any) {
        console.error('Error creating device:', error);
        return NextResponse.json(
            { error: 'Failed to create device', details: error.message },
            { status: 500 }
        );
    }
}
