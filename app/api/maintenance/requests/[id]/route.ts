import { NextResponse } from 'next/server';
import { MaintenanceService } from '@/lib/maintenance';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { MaintenanceStatus } from '@prisma/client';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Role verification - Only ADMIN and MANAGER can update status (approve/reject/complete)
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { status } = body;

        const updatedRequest = await MaintenanceService.updateRequestStatus(
            parseInt(params.id),
            status as MaintenanceStatus
        );

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating maintenance request:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
