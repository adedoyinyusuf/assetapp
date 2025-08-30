import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Fetching users with their roles...');
    
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });

    console.log('\nUsers in the database:');
    console.log('---------------------');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Role: ${user.role?.name || 'No role assigned'}`);
      console.log(`Is Active: ${user.isActive}`);
      console.log('---------------------');
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
