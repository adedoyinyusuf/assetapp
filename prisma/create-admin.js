const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Admin Creation...');

    // 1. Find Role
    const role = await prisma.userRole.findFirst({ where: { name: 'SUPER_ADMIN' } });
    if (!role) {
        throw new Error('SUPER_ADMIN role not found! Run full seed or debug.');
    }
    console.log('Found Role:', role.name, role.id);

    // 2. Create User
    const hashedPassword = await hash('password123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@npc.gov.ng' },
        update: {
            password: hashedPassword,
            role: { connect: { id: role.id } },
            isActive: true
        },
        create: {
            email: 'admin@npc.gov.ng',
            firstName: 'Super',
            lastName: 'Admin',
            password: hashedPassword,
            isActive: true,
            department: 'IT',
            role: { connect: { id: role.id } }
        }
    });
    console.log('✅ Super Admin synced:', superAdmin.email);

    // 3. Ensure Dependencies (State/LGA/Category)
    let state = await prisma.state.findFirst({ where: { code: 'FCT' } });
    if (!state) {
        state = await prisma.state.create({ data: { name: 'FCT', code: 'FCT' } });
    }

    let lga;
    if (prisma.lGA) {
        lga = await prisma.lGA.findFirst({ where: { code: 'AMAC' } });
        if (!lga) {
            lga = await prisma.lGA.create({ data: { name: 'Abuja Municipal', code: 'AMAC', stateId: state.id } });
        }
    }

    const compCategory = await prisma.category.upsert({
        where: { name: 'Computers' },
        update: {},
        create: { name: 'Computers', description: 'Laptops' }
    });

    // 4. Create Asset (for Dashboard data)
    if (lga) {
        await prisma.asset.upsert({
            where: { tagNumber: 'NPC/AST/001' },
            update: { lastVerificationStatus: 'VERIFIED' },
            create: {
                name: 'HP EliteBook 840 G8',
                tagNumber: 'NPC/AST/001',
                categoryId: compCategory.id,
                stateId: state.id,
                lgaId: lga.id,
                createdBy: superAdmin.id,
                status: 'IN_USE',
                condition: 'GOOD',
                purchaseCost: 850000,
                purchaseDate: new Date(),
                serialNumber: '5CG1234567',
                lastVerificationStatus: 'VERIFIED',
                lastVerifiedAt: new Date()
            }
        });
    }
    console.log('✅ Data restoration complete');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
