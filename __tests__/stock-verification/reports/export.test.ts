
import { GET } from '@/app/api/stock-verification/reports/export/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        verificationCampaign: {
            findMany: jest.fn(),
        },
        assetVerification: {
            findMany: jest.fn(),
        },
        verificationDiscrepancy: {
            count: jest.fn(),
        },
    },
}));

// Mock console.error to avoid noise
console.error = jest.fn();

describe('Export Route API', () => {
    const mockSession = {
        user: { email: 'test@example.com', role: 'ADMIN' },
    };

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: { name: 'ADMIN' },
    };

    const mockCampaigns = [
        {
            id: 1,
            name: 'Campaign 1',
            status: 'ACTIVE',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            targetAssetCount: 100,
        },
    ];

    const mockVerifications = [
        { status: 'VERIFIED' },
        { status: 'PENDING' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.verificationCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);
        (prisma.assetVerification.findMany as jest.Mock).mockResolvedValue(mockVerifications);
        (prisma.verificationDiscrepancy.count as jest.Mock).mockResolvedValue(1);
    });

    it('should generate PDF when format is pdf', async () => {
        const req = new NextRequest(new URL('http://localhost/api/export?format=pdf&startDate=2024-01-01'));

        const response = await GET(req);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('should generate Excel when format is excel', async () => {
        const req = new NextRequest(new URL('http://localhost/api/export?format=excel&startDate=2024-01-01'));

        const response = await GET(req);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return 401 if not authenticated', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const req = new NextRequest(new URL('http://localhost/api/export'));

        const response = await GET(req);

        expect(response.status).toBe(401);
    });
});
