import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Create a mock for each Prisma model
const createModelMock = () => ({
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  upsert: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

// Create mocks for all models used in the stock verification module
export const prismaMock = {
  // Core asset models
  asset: createModelMock(),
  category: createModelMock(),
  state: createModelMock(),
  lGA: createModelMock(),
  user: createModelMock(),
  
  // Stock verification models
  verificationCampaign: createModelMock(),
  assetVerification: createModelMock(),
  verificationDiscrepancy: createModelMock(),
  verificationAssignment: createModelMock(),
  verificationTemplate: createModelMock(),
  verificationSchedule: createModelMock(),
  verificationAnalytics: createModelMock(),
  
  // System models
  auditLog: createModelMock(),
  permission: createModelMock(),
  role: createModelMock(),
  userRole: createModelMock(),
  userPermission: createModelMock(),
  
  // Transaction support
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  
  // Raw query support
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
  
  // Utility methods
  $on: jest.fn(),
  $use: jest.fn(),
} as any;

// Helper functions for creating mock data
export const createMockUser = (overrides = {}) => ({
  id: 1,
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAsset = (overrides = {}) => ({
  id: 1,
  assetTag: 'ASSET-001',
  assetName: 'Test Asset',
  categoryId: 1,
  stateId: 1,
  lgaId: null,
  location: 'Test Location',
  coordinates: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCampaign = (overrides = {}) => ({
  id: 1,
  name: 'Test Campaign',
  description: 'Test campaign description',
  status: 'DRAFT',
  priority: 'MEDIUM',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  stateIds: [1],
  lgaIds: [],
  categoryIds: [1],
  instructions: 'Test instructions',
  metadata: {},
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  targetAssetCount: 0,
  completedAssetCount: 0,
  assignmentCount: 0,
  discrepancyCount: 0,
  completionRate: 0,
  ...overrides,
});

export const createMockVerification = (overrides = {}) => ({
  id: 1,
  campaignId: 1,
  assetId: 1,
  verifierId: 1,
  assignmentId: 1,
  status: 'PENDING',
  physicalCondition: null,
  functionalStatus: null,
  location: null,
  coordinates: null,
  notes: null,
  reviewNotes: null,
  verificationDate: null,
  reviewDate: null,
  reviewerId: null,
  verificationDuration: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  scheduledDate: new Date(),
  ...overrides,
});

export const createMockDiscrepancy = (overrides = {}) => ({
  id: 1,
  verificationId: 1,
  campaignId: 1,
  assetId: 1,
  reporterId: 1,
  assigneeId: null,
  resolverId: null,
  type: 'DATA_INCONSISTENCY',
  severity: 'MEDIUM',
  status: 'OPEN',
  title: 'Test Discrepancy',
  description: 'Test discrepancy description',
  expectedValue: 'Expected value',
  actualValue: 'Actual value',
  location: null,
  coordinates: null,
  photoEvidence: [],
  resolutionNotes: null,
  metadata: {},
  reference: 'DSC-1-20240101-001',
  reportedAt: new Date(),
  assignedAt: null,
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAssignment = (overrides = {}) => ({
  id: 1,
  campaignId: 1,
  userId: 1,
  role: 'FIELD_VERIFIER',
  stateIds: [1],
  lgaIds: [],
  categoryIds: [1],
  startDate: null,
  endDate: null,
  dailyTarget: null,
  totalTarget: null,
  completedCount: 0,
  status: 'ACTIVE',
  instructions: null,
  permissions: [],
  reportingTo: null,
  mobileAccess: true,
  offlineAccess: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Reset function for cleaning up mocks between tests
export const resetPrismaMock = () => {
  Object.values(prismaMock).forEach((model: any) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((method: any) => {
        if (jest.isMockFunction(method)) {
          // Clear call history but preserve implementations
          method.mockClear();
        }
      });
    }
  });
  
  // Reset special methods by clearing call history only
  if (jest.isMockFunction(prismaMock.$transaction as any)) {
    (prismaMock.$transaction as jest.Mock).mockClear();
  }
  if (jest.isMockFunction(prismaMock.$connect as any)) {
    (prismaMock.$connect as jest.Mock).mockClear();
  }
  if (jest.isMockFunction(prismaMock.$disconnect as any)) {
    (prismaMock.$disconnect as jest.Mock).mockClear();
  }
};

// Auto-reset between tests
beforeEach(() => {
  resetPrismaMock();
});

export default prismaMock;