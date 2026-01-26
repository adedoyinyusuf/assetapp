'use server'

import { prisma } from '@/lib/db';
import { Asset } from '@prisma/client';

export type AssetLifecycleDetails = Asset & {
    maintenanceRequests: any[];
    workOrders: any[];
    procurementRequest: any | null;
    purchaseOrder: any | null;
    disposalRecords: any[];
    movements: any[];
    category: any;
    state: any;
    lga: any;
    custodyLogs: any[];
    verifications: any[];
};

export async function getAssetLifecycleDetails(assetId: number) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            include: {
                category: true,
                state: true,
                lga: true,
                movements: {
                    orderBy: { movementDate: 'desc' },
                    take: 10,
                    include: {
                        fromState: true,
                        fromLga: true,
                        toState: true,
                        toLga: true
                    }
                },
                // Maintenance
                maintenanceRequests: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        requester: {
                            select: { firstName: true, lastName: true, email: true }
                        }
                    }
                },
                workOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        assignee: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                },
                // Procurement
                procurementRequest: {
                    include: {
                        requester: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                },
                purchaseOrder: {
                    include: {
                        vendor: true
                    }
                },
                // Disposal
                disposalRecords: {
                    orderBy: { disposalDate: 'desc' },
                    include: {
                        processor: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                },

                // Custody
                // @ts-ignore - Prisma Client type update lag
                custodyLogs: {
                    orderBy: { assignedAt: 'desc' },
                    include: {
                        user: {
                            select: { firstName: true, lastName: true, email: true }
                        },
                        assigner: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                },

                // Verifications
                verifications: {
                    orderBy: { verificationDate: 'desc' },
                    include: {
                        verifier: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }
            }
        });

        if (!asset) return null;

        // Use a compatible return type that avoids Date serialization issues
        // by letting Next.js Server Components handle the JSON serialization automatically
        // or by manually converting dates if passing to client components.
        // For now, we assume this is consumed by a Server Component.
        return asset;

    } catch (error) {
        console.error('Error fetching asset lifecycle details:', error);
        return null;
    }
}
