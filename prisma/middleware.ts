import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Create a new Prisma Client with extensions
const prisma = new PrismaClient().$extends({
  query: {
    user: {
      async $allOperations({ operation, args, query }) {
        // Hash password before create or update
        if ((operation === 'create' || operation === 'update') && args?.data?.hashedPassword) {
          const password = args.data.hashedPassword;
          
          // Skip hashing if already hashed
          if (typeof password === 'string' && 
              !password.startsWith('$2a$') && 
              !password.startsWith('2b$')) {
            args.data.hashedPassword = await hash(password, 12);
          }
        }
        
        return query(args);
      }
    }
  }
});

export default prisma;
