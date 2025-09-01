import { PrismaClient as BasePrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// This file should only be imported in server components or API routes

// Function to hash a password if needed
async function hashPasswordIfNeeded(password: unknown): Promise<string> {
  if (typeof password === 'string' && 
      !password.startsWith('$2a$') && 
      !password.startsWith('$2b$')) {
    return await hash(password, 12);
  }
  return password as string;
}

// Create a function to get the Prisma client with extensions
function createPrismaClient() {
  // Create a new Prisma client with logging in development
  const prismaClient = new BasePrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Extend the Prisma client with password hashing
  return prismaClient.$extends({
    query: {
      user: {
        async create({ args, query }) {
          if (args.data && typeof args.data === 'object' && 'hashedPassword' in args.data) {
            args.data.hashedPassword = await hashPasswordIfNeeded(args.data.hashedPassword);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data && typeof args.data === 'object' && 'hashedPassword' in args.data) {
            if (args.data.hashedPassword && typeof args.data.hashedPassword === 'object' && 'set' in args.data.hashedPassword) {
              if (args.data.hashedPassword.set) {
                args.data.hashedPassword.set = await hashPasswordIfNeeded(args.data.hashedPassword.set);
              }
            } else {
              args.data.hashedPassword = await hashPasswordIfNeeded(args.data.hashedPassword);
            }
          }
          return query(args);
        },
        async upsert({ args, query }) {
          if (args.create && typeof args.create === 'object' && 'hashedPassword' in args.create) {
            args.create.hashedPassword = await hashPasswordIfNeeded(args.create.hashedPassword);
          }
          if (args.update && typeof args.update === 'object' && 'hashedPassword' in args.update) {
            args.update.hashedPassword = await hashPasswordIfNeeded(args.update.hashedPassword);
          }
          return query(args);
        }
      }
    }
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

// Create and export the Prisma client instance
const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
