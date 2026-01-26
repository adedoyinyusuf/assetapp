import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// GET /api/mdm/devices/[id] - Get single device
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const device = await mdmService.getDeviceById(id);

        if (!device) {
            return NextResponse.json(
                { error: 'Device not found' },
                { status: 404 }
            );
        }

        // Get related data
        const [assignments, commands, maintenance, stats] = await Promise.all([
            mdmService.getDeviceAssignments(id),
            mdmService.getCommandHistory(id),
            mdmService.getDeviceMaintenance(id),
            mdmService.getStats()
        ]);

        return NextResponse.json({
            ...device,
            assignments,
            commands,
            maintenance
        });
    } catch (error: any) {
        console.error('Error fetching device:', error);
        return NextResponse.json(
            { error: 'Failed to fetch device', details: error.message },
            { status: 500 }
        );
    }
}

// PUT /api/mdm/devices/[id] - Update device
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();

        const device = await mdmService.updateDevice(id, body);

        return NextResponse.json(device);
    } catch (error: any) {
        console.error('Error updating device:', error);
        return NextResponse.json(
            { error: 'Failed to update device', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/mdm/devices/[id] - Delete device
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        await mdmService.deleteDevice(id);

        return NextResponse.json({ message: 'Device deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting device:', error);
        return NextResponse.json(
            { error: 'Failed to delete device', details: error.message },
            { status: 500 }
        );
    }
}
