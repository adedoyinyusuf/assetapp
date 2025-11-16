import { jest } from '@jest/globals';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
    has: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
  }),
}));

// Mock file system operations for testing
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('test file content')),
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({
    isDirectory: () => false,
    isFile: () => true,
    size: 1024,
  }),
}));

// Mock sharp for image processing in tests
jest.mock('sharp', () => {
  const mockSharp = {
    metadata: jest.fn().mockResolvedValue({
      width: 800,
      height: 600,
      format: 'jpeg',
    }),
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed image')),
  };
  
  return jest.fn(() => mockSharp);
}, { virtual: true });

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep errors for debugging
};

// Test database URL
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/assetapp_test';
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED = 'false';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock next-auth getServerSession to read headers set by test client
jest.mock('next-auth', () => {
  return {
    getServerSession: jest.fn(async (_authOptions?: any) => {
      const headers = (global as any).__CURRENT_REQUEST_HEADERS || {};
      const userIdHeader = headers['x-test-user-id'] || headers['x-user-id'];
      if (!userIdHeader) return null;
      return {
        user: { id: String(userIdHeader) },
      } as any;
    }),
  };
});

// Mock prisma server to use prismaMock
jest.mock('@/lib/prisma.server', () => {
  const { prismaMock } = require('../__mocks__/prisma');
  return { prisma: prismaMock };
});

// In-memory redis mock
const __redisStore: Record<string, number> = {};
jest.mock('@/lib/redis', () => ({
  redis: {
    incr: jest.fn(async (key: string) => {
      __redisStore[key] = (__redisStore[key] || 0) + 1;
      return __redisStore[key];
    }),
    expire: jest.fn(async (_key: string, _seconds: number) => {
      return true;
    }),
    get: jest.fn(async (key: string) => String(__redisStore[key] || '')),
    set: jest.fn(async (key: string, value: string) => { __redisStore[key] = Number(value) || 0; return 'OK'; }),
  },
}));

// Initialize in-memory prisma before tests
import { initInMemoryPrisma, resetDbStore } from '../utils/test-client';
beforeAll(() => {
  initInMemoryPrisma();
});
afterEach(() => {
  // reset redis counters between tests for predictable behavior
  Object.keys((global as any).__redisStore || {}).forEach(k => delete (global as any).__redisStore[k]);
});
afterAll(() => {
  resetDbStore();
});
// Global afterEach cleanup
afterEach(() => {
  jest.clearAllMocks();
});