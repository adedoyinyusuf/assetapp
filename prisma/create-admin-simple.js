const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Admin Creation (Schema Corrected)...');

    try {
        const role = await prisma.userRole.findFirst({ where: { name: 'SUPER_ADMIN' } });
        if (!role) {
            console.error('CRITICAL: SUPER_ADMIN role missing.');
            return;
        }

        const hashedPassword = await hash('password123', 10);

        const existingUser = await prisma.user.findUnique({ where: { email: 'admin@npc.gov.ng' } });
        if (existingUser) {
            console.log('User already exists:', existingUser.email);
        } else {
            console.log('Creating user...');
            const newUser = await prisma.user.create({
                data: {
                    email: 'admin@npc.gov.ng',
                    firstName: 'Super',
                    lastName: 'Admin',
                    hashedPassword: hashedPassword,
                    isActive: true,
                    role: { connect: { id: role.id } }
                }
            });
            console.log('User created:', newUser.email);
        }

        const count = await prisma.user.count();
        console.log('Total users now:', count);

    } catch (e) {
        console.error('ERROR:', JSON.stringify(e, null, 2));
        console.error('Stack:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
