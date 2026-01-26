import { PrismaClient, DisposalRequest, DisposalRecord, DisposalReason, DisposalStatus, DisposalMethod } from '@prisma/client';
import { db } from '@/lib/db';

export class DisposalService {
    private db: PrismaClient;

    constructor() {
        this.db = db;
    }

    /**
     * Create a new disposal request
     */
    async createRequest(data: {
        assetId: number;
        userId: number;
        reason: DisposalReason;
        description?: string;
    }): Promise<DisposalRequest> {
        // Check for existing active request
        const existing = await this.db.disposalRequest.findFirst({
            where: {
                assetId: data.assetId,
                status: { in: ['PENDING', 'APPROVED'] }
            }
        });

        if (existing) {
            throw new Error('Asset already has an active disposal request');
        }

        return this.db.disposalRequest.create({
            data: {
                assetId: data.assetId,
                requestedBy: data.userId,
                reason: data.reason,
                description: data.description,
                status: 'PENDING',
            },
            include: {
                asset: true,
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Get disposal requests
     */
    async getRequests(params: {
        status?: DisposalStatus;
        assetId?: number;
        limit?: number;
        offset?: number;
    }) {
        const { status, assetId, limit = 10, offset = 0 } = params;

        return this.db.disposalRequest.findMany({
            where: {
                status,
                assetId,
            },
            include: {
                asset: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        serialNumber: true,
                    },
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                record: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Approve a disposal request
     */
    async approveRequest(requestId: number) {
        return this.db.disposalRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED' },
        });
    }

    /**
     * Reject a disposal request
     */
    async rejectRequest(requestId: number) {
        return this.db.disposalRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' },
        });
    }

    /**
     * Cancel a disposal request
     */
    async cancelRequest(requestId: number) {
        return this.db.disposalRequest.update({
            where: { id: requestId },
            data: { status: 'CANCELLED' },
        });
    }

    /**
     * Finalize disposal (Create Record and Update Asset)
     */
    async finalizeDisposal(data: {
        requestId?: number;
        assetId: number;
        userId: number;
        method: DisposalMethod;
        proceeds: number;
        notes?: string;
    }): Promise<DisposalRecord> {
        // Transaction to ensure atomicity
        return this.db.$transaction(async (tx) => {
            // 1. Create Disposal Record
            const record = await tx.disposalRecord.create({
                data: {
                    requestId: data.requestId,
                    assetId: data.assetId,
                    processedBy: data.userId,
                    method: data.method,
                    proceeds: data.proceeds,
                    notes: data.notes,
                    disposalDate: new Date(),
                },
            });

            // 2. Update Asset Status
            await tx.asset.update({
                where: { id: data.assetId },
                data: { status: 'DISPOSED' },
            });

            // 3. Update Request Status if exists
            if (data.requestId) {
                await tx.disposalRequest.update({
                    where: { id: data.requestId },
                    data: { status: 'COMPLETED' },
                });
            }

            return record;
        });
    }
}

export const disposalService = new DisposalService();
