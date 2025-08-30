import { PrismaClient } from '@prisma/client/edge';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Type for Prisma middleware params
type Params = {
  model?: string;
  action: string;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
};

prisma.$use(async (params: Params, next: (params: Params) => Promise<any>) => {
  // Hash passwords before creating or updating a user
  if ((params.model === 'User') && (params.action === 'create' || params.action === 'update')) {
    const user = params.args.data || params.args?.data?.data || params.args;
    
    // Only hash if the password is being set/updated
    if (user?.hashedPassword) {
      // Skip hashing if it's already hashed (starts with $2a$ or $2b$)
      if (typeof user.hashedPassword === 'string' && 
          !user.hashedPassword.startsWith('$2a$') && 
          !user.hashedPassword.startsWith('$2b$')) {
        user.hashedPassword = await hash(user.hashedPassword, 12);
      }
    }
  }
  
  return next(params);
});

export default prisma;
