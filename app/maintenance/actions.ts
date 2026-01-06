'use server';

import { maintenanceService } from '@/lib/maintenance/maintenance-service';
import { MaintenancePriority, MaintenanceStatus, WorkOrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Schema for creating a request
const CreateRequestSchema = z.object({
    assetId: z.coerce.number(),
    title: z.string().min(3),
    description: z.string().min(10),
    priority: z.nativeEnum(MaintenancePriority),
});

export async function createMaintenanceRequest(formData: FormData) {
    const rawData = {
        assetId: formData.get('assetId'),
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
    };

    const validated = CreateRequestSchema.safeParse(rawData);

    if (!validated.success) {
        throw new Error('Invalid form data');
    }

    // TODO: Get actual user ID from session
    const userId = 1; // Mock user ID for now

    try {
        await maintenanceService.createRequest({
            ...validated.data,
            userId,
        });
    } catch (error) {
        throw new Error('Failed to create request');
    }

    revalidatePath('/maintenance');
    redirect('/maintenance');
}

export async function updateWorkOrderStatus(workOrderId: number, status: WorkOrderStatus) {
    try {
        await maintenanceService.updateWorkOrder(workOrderId, { status });
        revalidatePath(`/maintenance/work-orders/${workOrderId}`);
    } catch (error) {
        throw new Error('Failed to update status');
    }
}
