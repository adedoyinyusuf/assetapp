
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { VerificationService } from '../../../lib/stock-verification/verification-service';
import { prismaMock } from '../../__mocks__/prisma';
import { AssetVerificationStatus, PhysicalCondition } from '@prisma/client';

// Mock dependencies
jest.mock('@/lib/prisma.server', () => {
    const { prismaMock } = require('../../__mocks__/prisma');
    return {
        __esModule: true,
        prisma: prismaMock,
        default: prismaMock,
    };
});

jest.mock('fs/promises', () => ({
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
}));

jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
}));

describe('VerificationService', () => {
    let verificationService: VerificationService;
    const mockUserId = 1;

    beforeEach(() => {
        verificationService = new VerificationService();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('submitVerification', () => {
        const validRequest = {
            campaignId: 100,
            assetId: 50,
            physicalCondition: 'GOOD' as PhysicalCondition,
            locationAccurate: true,
            notes: 'Test verification',
            photoUrls: ['/path/to/photo.jpg'],
        };

        const mockUser = {
            id: mockUserId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            isActive: true,
            role: {
                permissions: [
                    { permission: { resource: 'verification', action: 'create' } }
                ]
            }
        };

        const mockCampaign = {
            id: 100,
            status: 'ACTIVE',
            assignedStates: [1],
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            assignments: [{ id: 1, userId: mockUserId }],
        };

        const mockAsset = {
            id: 50,
            serialNumber: 'SN12345',
            categoryId: 5,
            stateId: 1,
            name: 'Test Asset',
        };

        test('should submit verification successfully with assetId', async () => {
            // Mock User
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            // Mock Asset
            prismaMock.asset.findUnique.mockResolvedValue(mockAsset as any);

            // Mock Campaign
            prismaMock.verificationCampaign.findUnique.mockResolvedValue(mockCampaign as any);

            // Mock Assignments (User is assigned)
            prismaMock.verificationAssignment.findFirst.mockResolvedValue({ id: 1 } as any);

            // Mock Transaction
            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                return await fn(prismaMock);
            });

            // Mock Create
            prismaMock.assetVerification.create.mockResolvedValue({
                id: 1,
                ...validRequest,
                status: 'VERIFIED',
                verifierId: mockUserId,
                verificationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            // Mock existing update queries in transaction
            prismaMock.verificationCampaign.update.mockResolvedValue({} as any);
            prismaMock.auditLog.create.mockResolvedValue({} as any);

            const result = await verificationService.submitVerification(validRequest, mockUserId);

            expect(result).toBeDefined();
            expect(result.status).toBe('VERIFIED');
            expect(prismaMock.assetVerification.create).toHaveBeenCalled();
        });

        test('should identify asset by QR code if assetId is missing', async () => {
            // Mock User
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

            // Mock Asset lookup by serial from QR
            const qrCode = 'SN12345';
            prismaMock.asset.findFirst.mockResolvedValue(mockAsset as any);
            prismaMock.asset.findUnique.mockResolvedValue(mockAsset as any);

            // Mock Campaign
            prismaMock.verificationCampaign.findUnique.mockResolvedValue(mockCampaign as any);
            prismaMock.verificationAssignment.findFirst.mockResolvedValue({ id: 1 } as any);

            prismaMock.$transaction.mockImplementation(async (fn: any) => {
                return await fn(prismaMock);
            });

            prismaMock.assetVerification.create.mockResolvedValue({
                id: 1,
                assetId: mockAsset.id,
                // ...
                status: 'VERIFIED',
            } as any);

            const request = { ...validRequest, assetId: undefined, qrCode };

            await verificationService.submitVerification(request, mockUserId);

            expect(prismaMock.asset.findFirst).toHaveBeenCalledWith({
                where: { serialNumber: qrCode }
            });
        });

        test('should throw if asset not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.verificationCampaign.findUnique.mockResolvedValue(mockCampaign as any);
            prismaMock.asset.findUnique.mockResolvedValue(null); // Asset not found

            await expect(verificationService.submitVerification(validRequest, mockUserId))
                .rejects.toThrow('Asset not found');
        });

        test('should throw if user has no permission', async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                ...mockUser,
                role: { permissions: [] } // No permissions
            } as any);

            await expect(verificationService.submitVerification(validRequest, mockUserId))
                .rejects.toThrow('Insufficient permissions to submit verification');
        });

        test('should create discrepancy if requested', async () => {
            // Mock success flow
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.asset.findUnique.mockResolvedValue(mockAsset as any);
            prismaMock.verificationCampaign.findUnique.mockResolvedValue(mockCampaign as any);
            prismaMock.verificationAssignment.findFirst.mockResolvedValue({ id: 1 } as any);
            prismaMock.$transaction.mockImplementation(async (fn: any) => await fn(prismaMock));

            prismaMock.assetVerification.create.mockResolvedValue({ id: 1, status: 'DISCREPANCY_FOUND' } as any);

            const requestWithDiscrepancy = {
                ...validRequest,
                createDiscrepancy: true,
                notes: 'Location wrong',
                physicalCondition: 'GOOD' as PhysicalCondition, // Cast here to match enum
                locationAccurate: false
            };

            await verificationService.submitVerification(requestWithDiscrepancy, mockUserId);

            expect(prismaMock.verificationDiscrepancy.create).toHaveBeenCalled();
        });

        test('should create maintenance request if requested', async () => {
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
            prismaMock.asset.findUnique.mockResolvedValue(mockAsset as any);
            prismaMock.verificationCampaign.findUnique.mockResolvedValue(mockCampaign as any);
            prismaMock.verificationAssignment.findFirst.mockResolvedValue({ id: 1 } as any);
            prismaMock.$transaction.mockImplementation(async (fn: any) => await fn(prismaMock));

            prismaMock.assetVerification.create.mockResolvedValue({ id: 1, status: 'DAMAGED' } as any);

            const requestWithMaintenance = {
                ...validRequest,
                createMaintenance: true,
                physicalCondition: 'DAMAGED' as PhysicalCondition,
                notes: 'Broken screen'
            };

            await verificationService.submitVerification(requestWithMaintenance, mockUserId);

            expect(prismaMock.maintenanceRequest.create).toHaveBeenCalled();
        });
    });
});
