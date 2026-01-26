'use server';

import { procurementService } from '@/lib/procurement/procurement-service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const CreateRequestSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    reason: z.string().optional(),
    items: z.array(z.object({
        itemName: z.string().min(1),
        quantity: z.coerce.number().min(1),
        estimatedPrice: z.coerce.number().min(0),
        description: z.string().optional(),
    })),
});

export async function createProcurementRequest(formData: FormData) {
    // Simplified parsing for demo (handling array from formData is tricky without a library or complex logic)
    // For this demo, we'll assume a single item or parse a JSON string if we were using a client component that sends JSON.
    // To keep it simple for the server action with standard FormData, let's assume one item for now or just mock the parsing.

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const reason = formData.get('reason') as string;

    // Mocking items for the demo since dynamic form fields with FormData are verbose to implement here
    const items = [{
        itemName: formData.get('itemName') as string,
        quantity: Number(formData.get('quantity')),
        estimatedPrice: Number(formData.get('estimatedPrice')),
        description: formData.get('itemDescription') as string,
    }];

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    try {
        await procurementService.createRequest({
            userId,
            title,
            description,
            reason,
            items,
        });
    } catch (error) {
        throw new Error('Failed to create request');
    }

    revalidatePath('/procurement');
    redirect('/procurement');
}

export async function receivePurchaseOrderItems(poId: number, formData: FormData) {
    const itemsJson = formData.get('items') as string;

    try {
        const items = JSON.parse(itemsJson);

        // Validate items structure if needed, or rely on service/types
        await procurementService.receiveItems(poId, items);

        revalidatePath(`/procurement/purchase-orders/${poId}`);
        // Maybe redirect if fully received? For now stay on page
    } catch (error) {
        console.error('Failed to receive items:', error);
        throw new Error('Failed to receive items');
    }
}

export async function approveProcurementRequest(formData: FormData) {
    const requestId = Number(formData.get('requestId'));

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    try {
        await procurementService.approveRequest(requestId, userId);
    } catch (error) {
        throw new Error('Failed to approve request');
    }

    revalidatePath('/procurement');
    revalidatePath(`/procurement/requests/${requestId}`);
    redirect('/procurement');
}

export async function rejectProcurementRequest(formData: FormData) {
    const requestId = Number(formData.get('requestId'));
    const reason = formData.get('reason') as string || 'Request rejected';

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    try {
        await procurementService.rejectRequest(requestId, userId, reason);
    } catch (error) {
        throw new Error('Failed to reject request');
    }

    revalidatePath('/procurement');
    revalidatePath(`/procurement/requests/${requestId}`);
    redirect('/procurement');
}

export async function createPurchaseOrderFromRequest(formData: FormData) {
    const requestId = formData.get('requestId') ? Number(formData.get('requestId')) : undefined;
    const vendorId = Number(formData.get('vendorId'));
    const poNumber = formData.get('poNumber') as string;
    const expectedDate = formData.get('expectedDate') as string;
    const notes = formData.get('notes') as string;

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    try {
        // If we have a requestId, get the request items
        let items: any[] = [];
        if (requestId) {
            const requests = await procurementService.getRequests({ limit: 100 });
            const request = requests.find(r => r.id === requestId);
            if (request) {
                items = request.items.map(item => ({
                    itemName: item.itemName,
                    quantity: item.quantity,
                    unitPrice: Number(item.estimatedPrice),
                    description: item.description,
                }));
            }
        }

        await procurementService.createPurchaseOrder({
            requestId,
            vendorId,
            userId,
            poNumber,
            expectedDate: expectedDate ? new Date(expectedDate) : undefined,
            notes,
            items,
        });
    } catch (error) {
        throw new Error('Failed to create purchase order');
    }

    revalidatePath('/procurement');
    revalidatePath('/procurement/purchase-orders');
    redirect('/procurement/purchase-orders');
}
