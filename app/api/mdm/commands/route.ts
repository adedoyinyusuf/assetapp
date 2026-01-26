import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { MDMService } from '@/lib/services/mdm-service';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const mdmService = new MDMService(pool);

// POST /api/mdm/commands - Execute MDM command
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.device_id || !body.command_type || !body.initiated_by) {
            return NextResponse.json(
                { error: 'Device ID, command type, and initiated_by are required' },
                { status: 400 }
            );
        }

        // Validate command type
        const validCommands = ['LOCK', 'WIPE', 'LOCATE', 'ALARM', 'UNLOCK'];
        if (!validCommands.includes(body.command_type)) {
            return NextResponse.json(
                { error: 'Invalid command type' },
                { status: 400 }
            );
        }

        // Check if device is enrolled
        const device = await mdmService.getDeviceById(body.device_id);
        if (!device) {
            return NextResponse.json(
                { error: 'Device not found' },
                { status: 404 }
            );
        }

        if (!device.is_enrolled) {
            return NextResponse.json(
                { error: 'Device is not enrolled for MDM control' },
                { status: 403 }
            );
        }

        const command = await mdmService.executeCommand(body);

        // TODO: Integrate with actual push notification service
        // For now, just log the command
        console.log('MDM Command executed:', {
            commandId: command.id,
            deviceId: body.device_id,
            commandType: body.command_type,
            fcmToken: device.fcm_token,
            apnsToken: device.apns_token
        });

        return NextResponse.json({
            ...command,
            message: 'Command queued successfully. Device will execute when online.'
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error executing command:', error);
        return NextResponse.json(
            { error: 'Failed to execute command', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/mdm/commands/history/[deviceId] - Get command history
export async function GET(
    request: NextRequest,
    { params }: { params: { deviceId: string } }
) {
    try {
        const deviceId = parseInt(params.deviceId);
        const history = await mdmService.getCommandHistory(deviceId);

        return NextResponse.json({ data: history, count: history.length });
    } catch (error: any) {
        console.error('Error fetching command history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch command history', details: error.message },
            { status: 500 }
        );
    }
}
