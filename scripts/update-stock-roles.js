
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting STOCK roles update...');

    // Define Permissions needed for stock roles
    const permissions = [
        { name: 'VIEW_ASSETS', description: 'View assets', resource: 'assets', action: 'view' },
        { name: 'VIEW_REPORTS', description: 'View reports', resource: 'reports', action: 'view' },
        { name: 'VIEW_CATEGORIES', description: 'View categories', resource: 'categories', action: 'view' },
    ];

    console.log('Upserting Permissions...');
    const upsertedPermissions = [];
    for (const permission of permissions) {
        const p = await prisma.permission.upsert({
            where: { name: permission.name },
            update: permission,
            create: permission,
        });
        upsertedPermissions.push(p);
    }
    console.log(`✅ Upserted ${upsertedPermissions.length} permissions`);

    // Define Stock Verification Roles
    const roles = [
        {
            name: 'TEAM_LEADER',
            description: 'Leads stock verification teams',
            permissions: ['VIEW_ASSETS', 'VIEW_REPORTS', 'VIEW_CATEGORIES'],
        },
        {
            name: 'SENIOR_VERIFIER',
            description: 'Senior stock verifier',
            permissions: ['VIEW_ASSETS', 'VIEW_REPORTS'],
        },
        {
            name: 'VERIFIER',
            description: 'Standard stock verifier',
            permissions: ['VIEW_ASSETS'],
        },
        {
            name: 'ASSISTANT_VERIFIER',
            description: 'Assistant stock verifier',
            permissions: ['VIEW_ASSETS'],
        },
        {
            name: 'QUALITY_CONTROLLER',
            description: 'Ensures verification quality',
            permissions: ['VIEW_ASSETS', 'VIEW_REPORTS'],
        },
        {
            name: 'OBSERVER',
            description: 'Observes verification process',
            permissions: ['VIEW_ASSETS'],
        },
    ];

    console.log('Upserting Stock Roles...');
    for (const role of roles) {
        const { permissions: permissionNames, ...roleData } = role;

        console.log(`Processing ${role.name}...`);
        // Create or update the role
        const createdRole = await prisma.userRole.upsert({
            where: { name: roleData.name },
            update: roleData,
            create: roleData,
        });

        // Assign permissions to the role
        for (const permissionName of permissionNames) {
            const permission = upsertedPermissions.find(p => p.name === permissionName);
            if (permission) {
                await prisma.rolePermission.upsert({
                    where: {
                        roleId_permissionId: {
                            roleId: createdRole.id,
                            permissionId: permission.id,
                        },
                    },
                    update: {},
                    create: {
                        roleId: createdRole.id,
                        permissionId: permission.id,
                    },
                });
            }
        }
        console.log(`✅ Upserted role: ${createdRole.name}`);
    }

    console.log('🎉 Stock Roles update completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error updating stock roles:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
