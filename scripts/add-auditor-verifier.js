const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Adding Auditor Verifier user to production...');

    try {
        const email = 'auditor.verifier@npopc.gov.ng';
        const password = 'Auditor@123';
        const hashedPassword = await hash(password, 12);

        // 1. Ensure AUDITOR_VERIFIER role exists
        console.log('Ensuring AUDITOR_VERIFIER role exists...');
        const role = await prisma.userRole.upsert({
            where: { name: 'AUDITOR_VERIFIER' },
            update: {},
            create: {
                name: 'AUDITOR_VERIFIER',
                description: 'Audits and verifies assets',
            },
        });

        // 2. Upsert Auditor Verifier User
        console.log(`Upserting user ${email}...`);
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                hashedPassword,
                roleId: role.id,
                isActive: true,
                firstName: 'Auditor',
                lastName: 'Verifier'
            },
            create: {
                email,
                hashedPassword,
                roleId: role.id,
                isActive: true,
                firstName: 'Auditor',
                lastName: 'Verifier'
            },
        });

        console.log(`✅ User ${user.email} created/updated successfully.`);
        console.log('📧 Email: auditor.verifier@npopc.gov.ng');
        console.log('🔑 Password: Auditor@123');

    } catch (error) {
        console.error('❌ Error adding Auditor Verifier:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
