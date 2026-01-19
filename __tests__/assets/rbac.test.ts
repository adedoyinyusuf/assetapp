
import { POST } from '@/app/api/assets/route';
import { PUT as UPDATE_ASSET } from '@/app/api/assets/[id]/route';
import { UserRole } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// Mock NextResponse to avoid environment issues
jest.mock('next/server', () => ({
    NextResponse: {
        json: jest.fn((data, options) => ({
            json: () => Promise.resolve(data),
            status: options?.status || 200
        })),
    },
}));

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        asset: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            deleteMany: jest.fn(),
        },
        category: { findUnique: jest.fn() },
        state: { findUnique: jest.fn() },
        lGA: { findUnique: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn((callback) => callback([null, null, null])),
    },
}));

// Mock Auth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

describe('Asset Management Security & Functional Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/assets (Creation)', () => {

        it('should allow ADMIN to create an asset', async () => {
            // Setup
            require('next-auth').getServerSession.mockResolvedValue({
                user: { role: UserRole.ADMIN, id: '1' }
            });

            const req = {
                json: async () => ({
                    name: 'Test Asset',
                    purchaseValue: 1000,
                    purchaseDate: '2025-01-01',
                    usefulLife: 5,
                    categoryId: 1,
                    stateId: 1,
                    lgaId: 1
                })
            } as any; // Mock Request

            // Mocks
            (prisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.state.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
            (prisma.lGA.findUnique as jest.Mock).mockResolvedValue({ id: 1, stateId: 1 });
            (prisma.asset.create as jest.Mock).mockResolvedValue({ id: 100, name: 'Test Asset', createdAt: new Date(), updatedAt: new Date(), purchaseDate: new Date() });

            // Execute
            const response = await POST(req);
            const data = await response.json();

            // Verify
            expect(response.status).toBe(201);
            expect(data.name).toBe('Test Asset');
            expect(prisma.asset.create).toHaveBeenCalled();
        });

        it('should deny VIEWER from creating an asset', async () => {
            // Setup Unauthorized Session
            require('next-auth').getServerSession.mockResolvedValue({
                user: { role: UserRole.VIEWER, id: '2' }
            });

            const req = {
                json: async () => ({
                    name: 'Unauthorized Asset'
                })
            } as any;

            // Execute
            const response = await POST(req);
            const data = await response.json();

            // Verify
            expect(response.status).toBe(403);
            expect(data.error).toBe('Insufficient permissions');
            expect(prisma.asset.create).not.toHaveBeenCalled();
        });
    });

    describe('PUT /api/assets/[id] (Update)', () => {
        it('should allow MANAGER to update an asset', async () => {
            // Setup Manager Session
            require('next-auth').getServerSession.mockResolvedValue({
                user: { role: UserRole.MANAGER, id: '3' }
            });

            const req = {
                json: async () => ({ name: 'Updated Name', currentValue: 500 })
            } as any;

            // Mocks
            (prisma.asset.findUnique as jest.Mock).mockResolvedValue({
                id: 100,
                name: 'Old Name',
                purchaseDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            (prisma.asset.update as jest.Mock).mockResolvedValue({
                id: 100,
                name: 'Updated Name',
                purchaseDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Execute
            const response = await UPDATE_ASSET(req, { params: { id: '100' } });

            // Verify
            expect(response.status).toBe(200);
            expect(prisma.asset.update).toHaveBeenCalled();
        });

        it('should deny AUDITOR from updating an asset', async () => {
            // Setup Auditor Session
            require('next-auth').getServerSession.mockResolvedValue({
                user: { role: UserRole.AUDITOR, id: '4' }
            });

            const req = {
                json: async () => ({ name: 'Hacked Name' })
            } as any;

            // Execute
            const response = await UPDATE_ASSET(req, { params: { id: '100' } });

            // Verify
            expect(response.status).toBe(403);
            expect(prisma.asset.update).not.toHaveBeenCalled();
        });
    });
});
