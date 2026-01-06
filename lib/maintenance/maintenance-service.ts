import { PrismaClient, MaintenanceRequest, WorkOrder, MaintenanceSchedule, MaintenanceStatus, MaintenancePriority, WorkOrderStatus, ScheduleType } from '@prisma/client';
import { db } from '@/lib/db';

export class MaintenanceService {
    private db: PrismaClient;

    constructor() {
        this.db = db;
    }

    /**
     * Create a new maintenance request
     */
    async createRequest(data: {
        assetId: number;
        userId: number;
        title: string;
        description: string;
        priority: MaintenancePriority;
    }): Promise<MaintenanceRequest> {
        return this.db.maintenanceRequest.create({
            data: {
                assetId: data.assetId,
                requestedBy: data.userId,
                title: data.title,
                description: data.description,
                priority: data.priority,
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
     * Get maintenance requests with filtering
     */
    async getRequests(params: {
        status?: MaintenanceStatus;
        assetId?: number;
        limit?: number;
        offset?: number;
    }) {
        const { status, assetId, limit = 10, offset = 0 } = params;

        return this.db.maintenanceRequest.findMany({
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
                    },
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                workOrder: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Create a work order from a request
     */
    async createWorkOrder(data: {
        requestId?: number;
        assetId: number;
        title: string;
        description: string;
        priority: MaintenancePriority;
        assignedTo?: number;
        vendorName?: string;
        startDate?: Date;
    }): Promise<WorkOrder> {
        // If linked to a request, update request status
        if (data.requestId) {
            await this.db.maintenanceRequest.update({
                where: { id: data.requestId },
                data: { status: 'APPROVED' },
            });
        }

        return this.db.workOrder.create({
            data: {
                requestId: data.requestId,
                assetId: data.assetId,
                title: data.title,
                description: data.description,
                priority: data.priority,
                assignedTo: data.assignedTo,
                vendorName: data.vendorName,
                startDate: data.startDate,
                status: 'OPEN',
            },
        });
    }

    /**
     * Update work order status and costs
     */
    async updateWorkOrder(id: number, data: {
        status?: WorkOrderStatus;
        laborCost?: number;
        partsCost?: number;
        notes?: string;
        completionDate?: Date;
    }): Promise<WorkOrder> {
        const workOrder = await this.db.workOrder.update({
            where: { id },
            data: {
                status: data.status,
                laborCost: data.laborCost,
                partsCost: data.partsCost,
                notes: data.notes,
                completionDate: data.completionDate,
            },
            include: {
                request: true,
            },
        });

        // If completed, update request status and potentially asset status
        if (data.status === 'COMPLETED' && workOrder.requestId) {
            await this.db.maintenanceRequest.update({
                where: { id: workOrder.requestId },
                data: { status: 'COMPLETED' },
            });
        }

        return workOrder;
    }

    /**
     * Create a maintenance schedule
     */
    async createSchedule(data: {
        assetId: number;
        title: string;
        frequency: ScheduleType;
        nextDueDate: Date;
        description?: string;
        assignedTo?: number;
    }): Promise<MaintenanceSchedule> {
        return this.db.maintenanceSchedule.create({
            data: {
                assetId: data.assetId,
                title: data.title,
                frequency: data.frequency,
                nextDueDate: data.nextDueDate,
                description: data.description,
                assignedTo: data.assignedTo,
            },
        });
    }

    /**
     * Get a work order by ID
     */
    async getWorkOrder(id: number) {
        return this.db.workOrder.findUnique({
            where: { id },
            include: {
                asset: true,
                request: {
                    include: {
                        requester: true
                    }
                },
                assignee: true
            }
        });
    }
}

export const maintenanceService = new MaintenanceService();
