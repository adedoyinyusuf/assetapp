import { PrismaClient, ProcurementRequest, PurchaseOrder, Vendor, ProcurementRequestStatus, PurchaseOrderStatus } from '@prisma/client';
import { db } from '@/lib/db';

export class ProcurementService {
    private db: PrismaClient;

    constructor() {
        this.db = db;
    }

    /**
     * Create a new vendor
     */
    async createVendor(data: {
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        address?: string;
        taxId?: string;
    }): Promise<Vendor> {
        return this.db.vendor.create({
            data,
        });
    }

    /**
     * Get all vendors
     */
    async getVendors() {
        return this.db.vendor.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Create a procurement request
     */
    async createRequest(data: {
        userId: number;
        title: string;
        description?: string;
        reason?: string;
        items: {
            itemName: string;
            quantity: number;
            estimatedPrice: number;
            description?: string;
        }[];
    }): Promise<ProcurementRequest> {
        const totalEstimatedCost = data.items.reduce(
            (sum, item) => sum + item.quantity * item.estimatedPrice,
            0
        );

        return this.db.procurementRequest.create({
            data: {
                requestedBy: data.userId,
                title: data.title,
                description: data.description,
                reason: data.reason,
                totalEstimatedCost,
                status: 'PENDING',
                items: {
                    create: data.items.map((item) => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                        estimatedPrice: item.estimatedPrice,
                        description: item.description,
                    })),
                },
            },
            include: {
                items: true,
            },
        });
    }

    /**
     * Get procurement requests
     */
    async getRequests(params: {
        status?: ProcurementRequestStatus;
        userId?: number;
        limit?: number;
        offset?: number;
    }) {
        const { status, userId, limit = 10, offset = 0 } = params;

        return this.db.procurementRequest.findMany({
            where: {
                status,
                requestedBy: userId,
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                items: true,
                purchaseOrders: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Create a Purchase Order from a Request
     */
    async createPurchaseOrder(data: {
        requestId?: number;
        vendorId: number;
        userId: number;
        poNumber: string;
        expectedDate?: Date;
        notes?: string;
        items: {
            itemName: string;
            quantity: number;
            unitPrice: number;
            description?: string;
        }[];
    }): Promise<PurchaseOrder> {
        const totalAmount = data.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        );

        // If linked to a request, update status
        if (data.requestId) {
            await this.db.procurementRequest.update({
                where: { id: data.requestId },
                data: { status: 'ORDERED' },
            });
        }

        return this.db.purchaseOrder.create({
            data: {
                poNumber: data.poNumber,
                vendorId: data.vendorId,
                requestId: data.requestId,
                createdBy: data.userId,
                status: 'DRAFT',
                totalAmount,
                expectedDate: data.expectedDate,
                notes: data.notes,
                items: {
                    create: data.items.map((item) => ({
                        itemName: item.itemName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                        description: item.description,
                    })),
                },
            },
            include: {
                items: true,
            },
        });
    }

    /**
     * Receive items from a PO and create Assets
     */
    async receiveItems(purchaseOrderId: number, itemsToReceive: {
        itemId: number; // PurchaseOrderItem ID
        quantityReceived: number;
        locationId: number; // Where to store the new assets
    }[]) {
        // 1. Update PO Items received quantity
        // 2. Create Asset records for each received item
        // 3. Update PO status if fully received

        const po = await this.db.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
            include: { items: true },
        });

        if (!po) throw new Error('Purchase Order not found');

        for (const receiveItem of itemsToReceive) {
            const poItem = po.items.find(i => i.id === receiveItem.itemId);
            if (!poItem) continue;

            // Update PO Item
            await this.db.purchaseOrderItem.update({
                where: { id: receiveItem.itemId },
                data: {
                    receivedQuantity: { increment: receiveItem.quantityReceived },
                },
            });

            // Create Assets (One record per quantity for individual tracking, or bulk? 
            // Usually individual tracking for assets is better)
            // For simplicity, let's create individual asset records
            for (let i = 0; i < receiveItem.quantityReceived; i++) {
                await this.db.asset.create({
                    data: {
                        name: `${poItem.itemName} - ${i + 1}`,
                        description: poItem.description || `Received from PO ${po.poNumber}`,
                        categoryId: 1, // Default category for now, should be selectable
                        status: 'IN_STORE',
                        purchaseDate: new Date(),
                        purchaseValue: poItem.unitPrice.toNumber(),
                        serialNumber: `PO-${po.poNumber}-${poItem.id}-${Date.now()}-${i}`, // Temp serial
                        stateId: 1, // Default state
                        lgaId: 1,   // Default LGA
                        usefulLife: 5,
                        salvageValue: 0,
                        currentValue: poItem.unitPrice.toNumber(),
                    },
                });
            }
        }

        // Check if fully received
        // (Simplified logic: just mark as COMPLETED if any receiving happens for now, 
        // real logic would check all items)
        await this.db.purchaseOrder.update({
            where: { id: purchaseOrderId },
            data: { status: 'COMPLETED' },
        });
    }

    /**
     * Approve a procurement request
     */
    async approveRequest(requestId: number, userId: number) {
        return this.db.procurementRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                approvedBy: userId,
                approvedAt: new Date(),
            },
        });
    }

    /**
     * Reject a procurement request
     */
    async rejectRequest(requestId: number, userId: number, reason: string) {
        return this.db.procurementRequest.update({
            where: { id: requestId },
            data: {
                status: 'REJECTED',
                rejectedBy: userId,
                rejectedAt: new Date(),
                rejectionReason: reason,
            },
        });
    }
}

export const procurementService = new ProcurementService();
