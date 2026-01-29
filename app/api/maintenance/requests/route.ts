import { NextResponse } from 'next/server';
import { MaintenanceService } from '@/lib/maintenance';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { MaintenancePriority } from '@prisma/client';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const assetId = searchParams.get('assetId');

        const filters: any = {};
        if (status && status !== 'ALL') filters.status = status;
        if (assetId) filters.assetId = parseInt(assetId);

        const requests = await MaintenanceService.getRequests(filters);
        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role verification
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'];
        // Normalize role to handle potential case/format differences if necessary, 
        // but assuming session.user.role is already a valid enum value from auth-options
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { assetId, title, description, priority, scheduledDate } = body;

        const newRequest = await MaintenanceService.createRequest({
            assetId: parseInt(assetId),
            requestedBy: parseInt(session.user.id),
            title,
            description,
            priority: (priority as MaintenancePriority) || 'MEDIUM',
            scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error('Error creating maintenance request:', error);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}
