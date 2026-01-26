import { prisma } from './db';
import { MaintenancePriority, MaintenanceStatus, WorkOrderStatus } from '@prisma/client';

export interface CreateMaintenanceRequestParams {
    assetId: number;
    requestedBy: number;
    title: string;
    description: string;
    priority: MaintenancePriority;
    scheduledDate?: Date; // Added to match UI, though not in schema, might need to handle as metadata or update schema. 
    // Update: Schema doesn't have scheduledDate on Request, but WorkOrder has startDate. 
    // For Request, we'll store it but it might just be for the WorkOrder later.
    // Actually, let's look at the schema again. Request has createdAt. 
    // We will assume "scheduledDate" from UI implies when it should happen, which maps to WorkOrder.startDate.
    // For now, we will create the request.
}

export interface CreateWorkOrderParams {
    requestId?: number;
    assetId: number;
    assignedTo?: number; // Internal Staff ID
    vendorName?: string;
    title: string;
    description: string;
    priority: MaintenancePriority;
    startDate?: Date;
    estimatedCost?: number; // Maps to labor/parts split later?
}

export class MaintenanceService {

    // --- Maintenance Requests ---

    static async createRequest(params: CreateMaintenanceRequestParams) {
        return prisma.maintenanceRequest.create({
            data: {
                assetId: params.assetId,
                requestedBy: params.requestedBy,
                title: params.title,
                description: params.description,
                priority: params.priority,
                status: 'PENDING',
            },
            include: {
                asset: true,
                requester: true,
            }
        });
    }

    static async getRequests(filters?: { status?: MaintenanceStatus; assetId?: number }) {
        return prisma.maintenanceRequest.findMany({
            where: filters,
            include: {
                asset: {
                    select: { name: true, id: true }
                },
                requester: {
                    select: { firstName: true, lastName: true }
                },
                workOrder: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async updateRequestStatus(id: number, status: MaintenanceStatus) {
        return prisma.maintenanceRequest.update({
            where: { id },
            data: { status },
        });
    }

    // --- Work Orders ---

    static async createWorkOrder(params: CreateWorkOrderParams) {
        // If linked to a request, update the request status to IN_PROGRESS
        if (params.requestId) {
            await prisma.maintenanceRequest.update({
                where: { id: params.requestId },
                data: { status: 'IN_PROGRESS' }
            });
        }

        return prisma.workOrder.create({
            data: {
                requestId: params.requestId,
                assetId: params.assetId,
                assignedTo: params.assignedTo,
                vendorName: params.vendorName,
                title: params.title,
                description: params.description,
                priority: params.priority,
                status: 'OPEN',
                startDate: params.startDate,
                // Default costs to 0
                laborCost: 0,
                partsCost: 0,
            },
            include: {
                asset: true,
                request: true
            }
        });
    }

    static async getWorkOrders(filters?: { status?: WorkOrderStatus; assetId?: number }) {
        return prisma.workOrder.findMany({
            where: filters,
            include: {
                asset: true,
                request: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async completeWorkOrder(id: number, costs: { labor: number; parts: number; notes?: string }) {
        const workOrder = await prisma.workOrder.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completionDate: new Date(),
                laborCost: costs.labor,
                partsCost: costs.parts,
                notes: costs.notes
            }
        });

        // Also complete the linked request
        if (workOrder.requestId) {
            await prisma.maintenanceRequest.update({
                where: { id: workOrder.requestId },
                data: { status: 'COMPLETED' }
            });
        }

        return workOrder;
    }
}
