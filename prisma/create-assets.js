const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Asset Creation...');

    try {
        const superAdmin = await prisma.user.findUnique({ where: { email: 'admin@npc.gov.ng' } });
        if (!superAdmin) {
            console.error('CRITICAL: Super Admin user missing.');
            return;
        }

        // Ensure Dependencies (State/LGA/Category)
        // We upsert these to be safe
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

        const vehCategory = await prisma.category.upsert({
            where: { name: 'Vehicles' },
            update: {},
            create: { name: 'Vehicles', description: 'Official Cars' }
        });

        // Create Assets
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

            await prisma.asset.upsert({
                where: { tagNumber: 'NPC/VEH/001' },
                update: { lastVerificationStatus: 'PENDING' },
                create: {
                    name: 'Toyota Hilux 2023',
                    tagNumber: 'NPC/VEH/001',
                    categoryId: vehCategory.id,
                    stateId: state.id,
                    lgaId: lga.id,
                    createdBy: superAdmin.id,
                    status: 'IN_USE',
                    condition: 'GOOD',
                    purchaseCost: 45000000,
                    purchaseDate: new Date('2023-01-15'),
                    serialNumber: 'JTB123456789',
                    lastVerificationStatus: 'PENDING'
                }
            });
            console.log('✅ Assets created/synced');
        }

        const count = await prisma.asset.count();
        console.log('Total assets:', count);

    } catch (e) {
        console.error('ERROR:', JSON.stringify(e, null, 2));
        console.error('Stack:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
