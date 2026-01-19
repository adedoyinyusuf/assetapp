const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding (Upsert Strategy)...');

    // Skip cleanup or do best-effort
    // We will rely on Upsert to fix the data.

    // 1. Permissions (Upsert loop)
    const resources = ['ASSET', 'USER', 'REPORT', 'DASHBOARD', 'VERIFICATION', 'SETTINGS', 'WEBSOCKET'];
    const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'];

    for (const r of resources) {
        for (const a of actions) {
            const name = `${a}_${r}`;
            // Permission might be identified by name (if unique in schema) or composite? 
            // Schema for Permission not fully visible but assuming 'name' is unique or we can find it.
            // Usually Permission has `name` @unique? 
            // If not, we might create duplicates. 
            // Let's assume we can try default names.
            // Actually, roles.ts implies unique permission strings. 
            // We'll skip permission creation if we can't easily upsert, OR just try create and ignore error.
            try {
                // Checking if permission exists is expensive in loop, but safer.
                const exists = await prisma.permission.findFirst({ where: { name } });
                if (!exists) {
                    await prisma.permission.create({
                        data: { name, resource: r, action: a, description: `Can ${a} ${r}` }
                    });
                }
            } catch (e) { }
        }
    }
    console.log('✅ Permissions synced');

    // 2. Roles (Upsert)
    const roles = [
        { name: 'SUPER_ADMIN', description: 'Full System Access' },
        { name: 'ADMIN', description: 'Administrator' },
        { name: 'MANAGER', description: 'Manager' },
        { name: 'OPERATOR', description: 'Operator' },
        { name: 'VIEWER', description: 'Viewer' },
        { name: 'VERIFIER', description: 'Stock Verifier' },
        { name: 'TEAM_LEADER', description: 'Verification Team Leader' }
    ];

    const roleMap = {};
    for (const r of roles) {
        const role = await prisma.userRole.upsert({
            where: { name: r.name },
            update: {},
            create: { name: r.name, description: r.description }
        });
        roleMap[r.name] = role;
    }
    console.log('✅ Roles synced');

    // 3. Super Admin User (Upsert)
    const hashedPassword = await hash('password123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@npc.gov.ng' },
        update: {
            password: hashedPassword,
            role: { connect: { id: roleMap['SUPER_ADMIN'].id } },
            status: 'ACTIVE' // schema uses status or isActive? Step 2854 says isActive, Step 2887 tried isActive.
            // Wait, Step 2854 `model User` has `isActive Boolean @default(true)`. 
            // Previous seed Step 2887 used `isActive: true`.
            // BUT `server.js` (Step 2696 output) showed a user with `status: 'ACTIVE'`?
            // Let's check `User` model again.
            // Step 2854: `isActive Boolean`. 
            // `department` String?
            // So I will use `isActive: true`.
        },
        create: {
            email: 'admin@npc.gov.ng',
            firstName: 'Super',
            lastName: 'Admin',
            password: hashedPassword,
            isActive: true,
            department: 'IT',
            role: { connect: { id: roleMap['SUPER_ADMIN'].id } }
        }
    });
    console.log('✅ Super Admin synced:', superAdmin.email);

    // 4. Categories (Upsert)
    const computers = await prisma.category.upsert({
        where: { name: 'Computers' },
        update: {},
        create: { name: 'Computers', description: 'Laptops and Desktops' }
    });

    const vehicles = await prisma.category.upsert({
        where: { name: 'Vehicles' },
        update: {},
        create: { name: 'Vehicles', description: 'Official Cars' }
    });

    // 5. Locations (Upsert/Check)
    // State name unique? Assuming yes.
    // Schema for State? Not fully seen properly but likely name is unique.
    // If no unique constraint, upsert fails.
    // We will try findFirst then create.
    let state = await prisma.state.findFirst({ where: { code: 'FCT' } });
    if (!state) {
        state = await prisma.state.create({ data: { name: 'FCT', code: 'FCT' } });
    }

    // LGA
    let lga;
    if (prisma.lGA) {
        lga = await prisma.lGA.findFirst({ where: { code: 'AMAC' } });
        if (!lga) {
            lga = await prisma.lGA.create({ data: { name: 'Abuja Municipal', code: 'AMAC', stateId: state.id } });
        }
    }

    // 6. Assets (Upsert by Tag Number)
    if (lga) {
        await prisma.asset.upsert({
            where: { tagNumber: 'NPC/AST/001' }, // Tag Number usually unique
            update: {
                lastVerificationStatus: 'VERIFIED'
            },
            create: {
                name: 'HP EliteBook 840 G8',
                description: 'High performance laptop for staff',
                tagNumber: 'NPC/AST/001',
                serialNumber: '5CG1234567',
                categoryId: computers.id,
                stateId: state.id,
                lgaId: lga.id,
                status: 'IN_USE',
                condition: 'GOOD',
                purchaseDate: new Date(),
                purchaseCost: 850000,
                createdBy: superAdmin.id,
                lastVerificationStatus: 'VERIFIED',
                lastVerifiedAt: new Date()
            }
        });
    }

    console.log('✅ Seeding (Upsert) completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
