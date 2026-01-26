'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function createCampaign(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const budget = formData.get('budget') as string;
    const instructions = formData.get('instructions') as string;

    // Get selected states and categories
    const assignedStates = formData.getAll('assignedStates').map(Number);
    const assignedCategories = formData.getAll('assignedCategories').map(Number);

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    try {
        // Calculate target asset count based on scope
        const targetAssetCount = await db.asset.count({
            where: {
                ...(assignedStates.length > 0 && { stateId: { in: assignedStates } }),
                ...(assignedCategories.length > 0 && { categoryId: { in: assignedCategories } }),
                status: {
                    not: 'DISPOSED'
                }
            }
        });

        const campaign = await db.verificationCampaign.create({
            data: {
                name,
                description: description || undefined,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                assignedStates,
                assignedLgas: [], // Can be added later
                assignedCategories,
                budget: budget ? parseFloat(budget) : undefined,
                instructions: instructions || undefined,
                targetAssetCount,
                createdBy: userId,
                status: 'PLANNED',
            }
        });

        // Handle Auto-Assignment
        const autoAssign = formData.get('autoAssign') === 'true';
        if (autoAssign && assignedStates.length > 0) {
            const localUsers = await db.user.findMany({
                where: {
                    stateId: { in: assignedStates },
                    isActive: true,
                    // Optionally filtering by role if needed, e.g. role: { name: 'VERIFIER' }
                },
                select: { id: true, stateId: true, lgaId: true }
            });

            if (localUsers.length > 0) {
                // Create assignments for these users
                const assignmentsData = localUsers.map(user => ({
                    campaignId: campaign.id,
                    userId: user.id,
                    role: 'VERIFIER' as any, // Cast to enum
                    stateIds: user.stateId ? [user.stateId] : [],
                    lgaIds: user.lgaId ? [user.lgaId] : [],
                    categoryIds: assignedCategories,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    status: 'ACTIVE' as any
                }));

                await db.verificationAssignment.createMany({
                    data: assignmentsData
                });
            }
        }

        revalidatePath('/stock-verification/campaigns');
        redirect(`/stock-verification/campaigns/${campaign.id}`);
    } catch (error) {
        console.error('Failed to create campaign:', error);
        throw new Error('Failed to create campaign');
    }
}

import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';

export async function createVerification(formData: FormData) {
    const photoFiles = formData.getAll('photos') as File[];
    const photoUrls: string[] = [];

    // Handle File Uploads
    if (photoFiles.length > 0) {
        try {
            const uploadRelativePath = 'uploads/verifications';
            const uploadDir = join(process.cwd(), 'public', uploadRelativePath);
            await mkdir(uploadDir, { recursive: true });

            for (const file of photoFiles) {
                if (file.size > 0 && file.type.startsWith('image/')) {
                    const bytes = await file.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const filename = `${Date.now()}-${Math.round(Math.random() * 10000)}-${safeName}`;
                    const filepath = join(uploadDir, filename);

                    await writeFile(filepath, buffer);
                    photoUrls.push(`/${uploadRelativePath}/${filename}`);
                }
            }
        } catch (error) {
            console.error('Error uploading photos:', error);
            // Continue without photos or throw? For now, continue but log.
        }
    }

    const data = {
        campaignId: Number(formData.get('campaignId')),
        assetId: formData.get('assetId') ? Number(formData.get('assetId')) : undefined,
        qrCode: formData.get('qrCode') as string || undefined,
        physicalCondition: formData.get('physicalCondition') as any,
        locationAccurate: formData.get('locationAccurate') === 'true',
        notes: formData.get('notes') as string || undefined,
        createMaintenance: formData.get('createMaintenance') === 'on',
        photoUrls: photoUrls,
        coordinates: formData.get('coordinates') as string || undefined,
    };

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    try {
        const { VerificationService } = await import('@/lib/stock-verification/verification-service');
        const service = new VerificationService();

        await service.submitVerification(data, userId);

        revalidatePath('/stock-verification/verifications');
        revalidatePath(`/stock-verification/campaigns/${data.campaignId}`);
        redirect('/stock-verification/verifications');
    } catch (error) {
        // If it's a redirect error, rethrow it so Next.js handles it
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error('Failed to create verification:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create verification');
    }
}

export async function assignDiscrepancy(formData: FormData) {
    const discrepancyId = Number(formData.get('discrepancyId'));
    const assigneeId = Number(formData.get('assigneeId'));

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);
    // In future, can log 'userId' carried out the assignment

    try {
        await db.verificationDiscrepancy.update({
            where: { id: discrepancyId },
            data: {
                assignedTo: assigneeId,
                status: 'INVESTIGATING',
            }
        });

        revalidatePath(`/stock-verification/discrepancies/${discrepancyId}`);
        revalidatePath('/stock-verification/discrepancies');
    } catch (error) {
        console.error('Failed to assign discrepancy:', error);
        throw new Error('Failed to assign discrepancy');
    }
}

export async function resolveDiscrepancy(formData: FormData) {
    const discrepancyId = Number(formData.get('discrepancyId'));
    const resolutionNotes = formData.get('resolutionNotes') as string;
    const action = formData.get('action') as string;
    const resolutionAction = formData.get('resolutionAction') as string;

    // Get actual user ID from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    // Prepare action data if needed
    let actionData: any = {};
    if (resolutionAction === 'UPDATE_ASSET_LOCATION') {
        // In a real app we'd get these from formData
        // For now, defaulting or extracting if present
        // actionData = { stateId: ..., lgaId: ... }
    } else if (resolutionAction === 'UPDATE_ASSET_STATUS') {
        actionData = { status: formData.get('newStatus') };
    }

    try {
        const { DiscrepancyService } = await import('@/lib/stock-verification/discrepancy-service');
        const service = new DiscrepancyService();

        await service.resolveDiscrepancy(
            discrepancyId,
            resolutionNotes,
            userId,
            resolutionAction || undefined, // Pass the specific action (e.g. MARK_AS_DAMAGED)
            actionData
        );

        revalidatePath(`/stock-verification/discrepancies/${discrepancyId}`);
        revalidatePath('/stock-verification/discrepancies');
        // redirect('/stock-verification/discrepancies'); // Optional: redirect back to list
    } catch (error) {
        console.error('Failed to resolve discrepancy:', error);
        throw new Error('Failed to resolve discrepancy');
    }
}
