
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting MDM roles update...');

    // Define Permissions needed for MDM roles
    const permissions = [
        { name: 'VIEW_MDM', description: 'View MDM Dashboard and Devices', resource: 'mdm', action: 'view' },
        { name: 'MANAGE_MDM', description: 'Full MDM Management', resource: 'mdm', action: 'manage' },
        { name: 'MANAGE_DEVICES', description: 'Manage Mobile Devices', resource: 'devices', action: 'manage' },
        { name: 'MANAGE_STAFF', description: 'Manage Staff assignments', resource: 'staff', action: 'manage' },
        { name: 'VIEW_STAFF', description: 'View Staff assignments', resource: 'staff', action: 'view' },
    ];

    console.log('Upserting MDM Permissions...');
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

    // Define MDM Roles
    const roles = [
        {
            name: 'MDM_ADMIN',
            description: 'Administrator for Mobile Device Management',
            permissions: ['VIEW_MDM', 'MANAGE_MDM', 'MANAGE_DEVICES', 'MANAGE_STAFF', 'VIEW_STAFF'],
        },
        {
            name: 'MDM_OFFICER',
            description: 'Officer managing devices and assignments',
            permissions: ['VIEW_MDM', 'MANAGE_DEVICES', 'MANAGE_STAFF', 'VIEW_STAFF'],
        },
        {
            name: 'MDM_AUDITOR',
            description: 'Read-only access to MDM data',
            permissions: ['VIEW_MDM', 'VIEW_STAFF'],
        },
    ];

    console.log('Upserting MDM Roles...');
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

    console.log('🎉 MDM Roles update completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error updating MDM roles:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
