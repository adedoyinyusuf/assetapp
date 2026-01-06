'use server';

import { disposalService } from '@/lib/disposal/disposal-service';
import { DisposalReason, DisposalMethod } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const CreateRequestSchema = z.object({
    assetId: z.coerce.number(),
    reason: z.nativeEnum(DisposalReason),
    description: z.string().optional(),
});

export async function createDisposalRequest(formData: FormData) {
    const assetId = Number(formData.get('assetId'));
    const reason = formData.get('reason') as DisposalReason;
    const description = formData.get('description') as string;

    // TODO: Get actual user ID
    const userId = 1;

    try {
        await disposalService.createRequest({
            userId,
            assetId,
            reason,
            description,
        });
    } catch (error) {
        throw new Error('Failed to create request');
    }

    revalidatePath('/disposal');
    redirect('/disposal');
}

export async function finalizeDisposal(formData: FormData) {
    const requestId = formData.get('requestId') ? Number(formData.get('requestId')) : undefined;
    const assetId = Number(formData.get('assetId'));
    const method = formData.get('method') as DisposalMethod;
    const proceeds = Number(formData.get('proceeds'));
    const notes = formData.get('notes') as string;

    // TODO: Get actual user ID
    const userId = 1;

    try {
        await disposalService.finalizeDisposal({
            userId,
            requestId,
            assetId,
            method,
            proceeds,
            notes,
        });
    } catch (error) {
        throw new Error('Failed to finalize disposal');
    }

    revalidatePath('/disposal');
    // Stay on page or redirect?
}
