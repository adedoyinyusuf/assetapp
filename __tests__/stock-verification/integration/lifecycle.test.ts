
import { VerificationService } from '@/lib/stock-verification/verification-service';
import { prisma } from '@/lib/prisma.server';
import { BadRequestError } from '@/lib/errors';

// Mock dependencies
jest.mock('@/lib/prisma.server', () => ({
    prisma: {
        assetVerification: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        asset: {
            update: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        userRole: {
            findFirst: jest.fn(),
        }
    },
}));

// Mock console.error
console.error = jest.fn();

describe('VerificationService Integration', () => {
    let service: VerificationService;
    const mockDb = prisma;

    beforeEach(() => {
        service = new VerificationService();
        jest.clearAllMocks();
    });

    it('should update asset status to MISSING when verification is MISSING', async () => {
        const verificationId = 1;
        const assetId = 100;
        const userId = 5;

        // Mock permission check (internal method partial mock)
        jest.spyOn(service as any, 'checkUserAccess').mockResolvedValue(true);
        // Mock validation
        jest.spyOn(service as any, 'isValidStatusTransition').mockReturnValue(true);

        // Mock existing verification
        (mockDb.assetVerification.findUnique as jest.Mock).mockResolvedValue({
            id: verificationId,
            status: 'PENDING',
            assetId: assetId,
        });

        // Mock update result
        (mockDb.assetVerification.update as jest.Mock).mockResolvedValue({
            id: verificationId,
            status: 'MISSING',
            assetId: assetId,
            physicalCondition: 'MISSING',
        });

        await service.updateVerification(
            verificationId,
            { status: 'MISSING', physicalCondition: 'MISSING' },
            userId
        );

        // Expect Asset update
        expect(mockDb.asset.update).toHaveBeenCalledWith({
            where: { id: assetId },
            data: {
                status: 'MISSING'
            }
        });
    });

    it('should update asset status to MAINTENANCE when verification is DAMAGED', async () => {
        const verificationId = 2;
        const assetId = 101;
        const userId = 5;

        jest.spyOn(service as any, 'checkUserAccess').mockResolvedValue(true);
        jest.spyOn(service as any, 'isValidStatusTransition').mockReturnValue(true);

        (mockDb.assetVerification.findUnique as jest.Mock).mockResolvedValue({
            id: verificationId,
            status: 'IN_PROGRESS',
            assetId: assetId,
        });

        (mockDb.assetVerification.update as jest.Mock).mockResolvedValue({
            id: verificationId,
            status: 'DAMAGED',
            assetId: assetId,
            physicalCondition: 'DAMAGED',
        });

        await service.updateVerification(
            verificationId,
            { status: 'DAMAGED', physicalCondition: 'DAMAGED' },
            userId
        );

        expect(mockDb.asset.update).toHaveBeenCalledWith({
            where: { id: assetId },
            data: {
                status: 'MAINTENANCE'
            }
        });
    });

    it('should update lastVerifiedAt when verification is APPROVED', async () => {
        const verificationId = 3;
        const assetId = 102;
        const userId = 5;

        jest.spyOn(service as any, 'checkUserAccess').mockResolvedValue(true);
        jest.spyOn(service as any, 'isValidStatusTransition').mockReturnValue(true);

        (mockDb.assetVerification.findUnique as jest.Mock).mockResolvedValue({
            id: verificationId,
            status: 'VERIFIED',
            assetId: assetId,
        });

        (mockDb.assetVerification.update as jest.Mock).mockResolvedValue({
            id: verificationId,
            status: 'APPROVED',
            assetId: assetId,
        });

        await service.updateVerification(
            verificationId,
            { status: 'APPROVED' },
            userId
        );

        expect(mockDb.asset.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: assetId },
            data: expect.objectContaining({
                lastVerificationStatus: 'APPROVED',
                // lastVerifiedAt will be a Date, so we verify defined
                lastVerifiedAt: expect.any(Date)
            })
        }));
    });
});
