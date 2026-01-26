import { NextResponse } from 'next/server';
import { MaintenanceService } from '@/lib/maintenance';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const assetId = searchParams.get('assetId');

        const filters: any = {};
        if (assetId) filters.assetId = parseInt(assetId);

        const workOrders = await MaintenanceService.getWorkOrders(filters);
        return NextResponse.json(workOrders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        // Body should match CreateWorkOrderParams
        // Including requestId if converting from request

        const workOrder = await MaintenanceService.createWorkOrder({
            ...body,
            assetId: parseInt(body.assetId),
            requestId: body.requestId ? parseInt(body.requestId) : undefined,
            assignedTo: body.assignedTo ? parseInt(body.assignedTo) : undefined,
            startDate: body.startDate ? new Date(body.startDate) : undefined
        });

        return NextResponse.json(workOrder, { status: 201 });
    } catch (error) {
        console.error('Error creating work order:', error);
        return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
    }
}
