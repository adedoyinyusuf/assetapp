const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting manual production seed...');

    try {
        const email = 'admin@npopc.gov.ng';
        const password = 'Admin@123';
        const hashedPassword = await hash(password, 12);

        // 1. Ensure Role exists
        console.log('Ensuring SUPERADMIN role exists...');
        const role = await prisma.userRole.upsert({
            where: { name: 'SUPERADMIN' },
            update: {},
            create: {
                name: 'SUPERADMIN',
                description: 'Full system access including user management',
            },
        });

        // 2. Upsert User
        console.log(`Upserting user ${email}...`);
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                hashedPassword,
                roleId: role.id,
                isActive: true,
                firstName: 'Admin',
                lastName: 'User'
            },
            create: {
                email,
                hashedPassword,
                roleId: role.id,
                isActive: true,
                firstName: 'Admin',
                lastName: 'User'
            },
        });

        console.log(`✅ User ${user.email} created/updated successfully.`);
        console.log('Password set to: Admin@123');

    } catch (error) {
        console.error('❌ Error manual seeding:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
