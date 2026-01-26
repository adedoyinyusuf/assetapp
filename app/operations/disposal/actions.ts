'use server';

import { disposalService } from '@/lib/disposal/disposal-service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { DisposalMethod, DisposalReason } from '@prisma/client';

// Schema for creating a request
const DisposalRequestSchema = z.object({
    assetId: z.coerce.number(),
    reason: z.nativeEnum(DisposalReason),
    description: z.string().optional(),
});

// Schema for finalizing disposal
const FinalizeDisposalSchema = z.object({
    requestId: z.coerce.number(), // Optional in service but form usually comes from request
    assetId: z.coerce.number(),
    method: z.nativeEnum(DisposalMethod),
    proceeds: z.coerce.number().min(0),
    notes: z.string().optional(),
});

async function getUserId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    return Number(session.user.id);
}

export async function createDisposalRequest(formData: FormData) {
    const userId = await getUserId();

    const assetId = Number(formData.get('assetId'));
    const reason = formData.get('reason') as DisposalReason;
    const description = formData.get('description') as string;

    // Basic validation
    if (!assetId || !reason) {
        throw new Error('Missing required fields');
    }

    try {
        await disposalService.createRequest({
            userId,
            assetId,
            reason,
            description,
        });
    } catch (error) {
        throw new Error('Failed to create disposal request');
    }

    revalidatePath('/operations/disposal');
}

export async function approveDisposalRequest(formData: FormData) {
    await getUserId(); // Ensure auth
    const requestId = Number(formData.get('requestId'));

    try {
        await disposalService.approveRequest(requestId);
    } catch (error) {
        throw new Error('Failed to approve request');
    }

    revalidatePath('/operations/disposal');
}

export async function rejectDisposalRequest(formData: FormData) {
    await getUserId(); // Ensure auth
    const requestId = Number(formData.get('requestId'));

    try {
        await disposalService.rejectRequest(requestId);
    } catch (error) {
        throw new Error('Failed to reject request');
    }

    revalidatePath('/operations/disposal');
}

export async function cancelDisposalRequest(formData: FormData) {
    await getUserId(); // Ensure auth
    const requestId = Number(formData.get('requestId'));

    try {
        await disposalService.cancelRequest(requestId);
    } catch (error) {
        throw new Error('Failed to cancel request');
    }

    revalidatePath('/operations/disposal');
}

export async function finalizeDisposal(formData: FormData) {
    const userId = await getUserId();

    // Parse manually or use Zod based on preference
    // Using manual extraction for simplicity with FormData
    const requestId = formData.get('requestId') ? Number(formData.get('requestId')) : undefined;
    const assetId = Number(formData.get('assetId'));
    const method = formData.get('method') as DisposalMethod;
    const proceeds = Number(formData.get('proceeds') || 0);
    const notes = formData.get('notes') as string;

    try {
        await disposalService.finalizeDisposal({
            requestId,
            assetId,
            userId,
            method,
            proceeds,
            notes,
        });
    } catch (error) {
        throw new Error('Failed to finalize disposal');
    }

    revalidatePath('/operations/disposal');
}
