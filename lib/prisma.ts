import { PrismaClient as BasePrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Create a new Prisma client with logging
const prismaClient = new BasePrismaClient({
  log: ['query', 'error', 'warn'],
});

// Function to hash a password if needed
async function hashPasswordIfNeeded(password: unknown): Promise<string> {
  if (typeof password === 'string' && 
      !password.startsWith('$2a$') && 
      !password.startsWith('$2b$')) {
    return await hash(password, 12);
  }
  return password as string;
}

// Extend the Prisma client with password hashing
const prisma = prismaClient.$extends({
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
            // Handle { set: string } case
            if (args.data.hashedPassword.set) {
              args.data.hashedPassword.set = await hashPasswordIfNeeded(args.data.hashedPassword.set);
            }
          } else {
            // Handle direct string assignment
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

type PrismaClient = typeof prisma;

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Ensure we're using a single instance in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export { prisma };
