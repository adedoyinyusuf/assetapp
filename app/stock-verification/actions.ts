'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

    // TODO: Get actual user ID from session
    const userId = 1;

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

        revalidatePath('/stock-verification/campaigns');
        redirect(`/stock-verification/campaigns/${campaign.id}`);
    } catch (error) {
        console.error('Failed to create campaign:', error);
        throw new Error('Failed to create campaign');
    }
}

export async function createVerification(formData: FormData) {
    const campaignId = Number(formData.get('campaignId'));
    const assetId = Number(formData.get('assetId'));
    const physicalCondition = formData.get('physicalCondition') as string;
    const locationAccurate = formData.get('locationAccurate') === 'true';
    const notes = formData.get('notes') as string;
    const qrCode = formData.get('qrCode') as string;

    // TODO: Get actual user ID from session
    const userId = 1;

    try {
        // If QR code provided, lookup asset
        let actualAssetId = assetId;
        if (qrCode && !assetId) {
            const asset = await db.asset.findFirst({
                where: {
                    serialNumber: qrCode
                }
            });
            if (asset) {
                actualAssetId = asset.id;
            }
        }

        // Determine status based on condition and location
        let status: 'VERIFIED' | 'DISCREPANCY_FOUND' | 'MISSING' | 'DAMAGED' = 'VERIFIED';

        if (physicalCondition === 'MISSING') {
            status = 'MISSING';
        } else if (physicalCondition === 'DAMAGED') {
            status = 'DAMAGED';
        } else if (!locationAccurate || ['POOR', 'DAMAGED'].includes(physicalCondition)) {
            status = 'DISCREPANCY_FOUND';
        }

        const verification = await db.assetVerification.create({
            data: {
                campaignId,
                assetId: actualAssetId,
                verifierId: userId,
                status,
                physicalCondition: physicalCondition as any,
                locationAccurate,
                notes: notes || undefined,
                photoUrls: [], // TODO: Handle file upload
                verificationDate: new Date(),
            }
        });

        // Update campaign progress
        await db.verificationCampaign.update({
            where: { id: campaignId },
            data: {
                verifiedAssetCount: {
                    increment: 1
                }
            }
        });

        // Create discrepancy if issues found
        if (status === 'DISCREPANCY_FOUND' && formData.get('createDiscrepancy')) {
            await db.verificationDiscrepancy.create({
                data: {
                    verificationId: verification.id,
                    reportedBy: userId,
                    discrepancyType: !locationAccurate ? 'LOCATION_MISMATCH' : 'CONDITION_MISMATCH',
                    description: notes || 'Discrepancy found during verification',
                    severity: physicalCondition === 'POOR' ? 'HIGH' : 'MEDIUM',
                    status: 'REPORTED',
                }
            });
        }

        // Create maintenance request if needed
        if (status === 'DAMAGED' && formData.get('createMaintenance')) {
            await db.maintenanceRequest.create({
                data: {
                    assetId: actualAssetId,
                    requestedBy: userId,
                    title: `Verification: Asset Damaged`,
                    description: notes || 'Asset found damaged during verification',
                    priority: physicalCondition === 'DAMAGED' ? 'HIGH' : 'MEDIUM',
                    status: 'PENDING',
                }
            });
        }

        revalidatePath('/stock-verification/verifications');
        revalidatePath(`/stock-verification/campaigns/${campaignId}`);
        redirect('/stock-verification/verifications');
    } catch (error) {
        console.error('Failed to create verification:', error);
        throw new Error('Failed to create verification');
    }
}

export async function assignDiscrepancy(formData: FormData) {
    const discrepancyId = Number(formData.get('discrepancyId'));
    const assigneeId = Number(formData.get('assigneeId'));

    try {
        await db.verificationDiscrepancy.update({
            where: { id: discrepancyId },
            data: {
                assignedTo: assigneeId,
                status: 'ASSIGNED',
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

    // TODO: Get actual user ID from session
    const userId = 1;

    try {
        await db.verificationDiscrepancy.update({
            where: { id: discrepancyId },
            data: {
                status: action === 'resolve' ? 'RESOLVED' : 'REJECTED',
                resolutionNotes,
                resolvedBy: userId,
                resolutionDate: new Date(),
            }
        });

        revalidatePath(`/stock-verification/discrepancies/${discrepancyId}`);
        revalidatePath('/stock-verification/discrepancies');
        redirect('/stock-verification/discrepancies');
    } catch (error) {
        console.error('Failed to resolve discrepancy:', error);
        throw new Error('Failed to resolve discrepancy');
    }
}
