
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Team Leader permissions...');

    // 1. Ensure Permissions Exist with correct resource/action
    const permissionsToEnsure = [
        { name: 'READ_CAMPAIGN', description: 'View verification campaigns', resource: 'campaign', action: 'read' },
        { name: 'CREATE_CAMPAIGN', description: 'Create verification campaigns', resource: 'campaign', action: 'create' },
        { name: 'UPDATE_CAMPAIGN', description: 'Edit verification campaigns', resource: 'campaign', action: 'update' },
        { name: 'READ_VERIFICATION', description: 'View verifications', resource: 'verification', action: 'read' },
        { name: 'CREATE_VERIFICATION', description: 'Create verifications', resource: 'verification', action: 'create' },
        { name: 'UPDATE_VERIFICATION', description: 'Edit verifications', resource: 'verification', action: 'update' },
        // Also include photos just in case
        { name: 'READ_PHOTO', description: 'View photos', resource: 'photo', action: 'view' },
        { name: 'UPLOAD_PHOTO', description: 'Upload photos', resource: 'photo', action: 'upload' },
    ];

    const createdPermissions = [];

    for (const perm of permissionsToEnsure) {
        const p = await prisma.permission.upsert({
            where: { name: perm.name },
            update: { resource: perm.resource, action: perm.action },
            create: perm,
        });
        createdPermissions.push(p);
        console.log(`✅ Permission ensured: ${p.name}`);
    }

    // 2. Ensure TEAM_LEADER Role exists
    const roleName = 'TEAM_LEADER';
    const role = await prisma.userRole.upsert({
        where: { name: roleName },
        update: {},
        create: {
            name: roleName,
            description: 'Leads stock verification teams',
        },
    });
    console.log(`✅ Role ensured: ${role.name}`);

    // 3. Assign Permissions to TEAM_LEADER
    // We want to add these permissions, keeping existing ones (like VIEW_ASSETS)
    const permsToAssign = [
        'READ_CAMPAIGN', 'CREATE_CAMPAIGN', 'UPDATE_CAMPAIGN',
        'READ_VERIFICATION', 'CREATE_VERIFICATION', 'UPDATE_VERIFICATION',
        'VIEW_ASSETS', 'VIEW_REPORTS', 'VIEW_CATEGORIES'
    ];

    for (const permName of permsToAssign) {
        const perm = await prisma.permission.findUnique({ where: { name: permName } });
        if (perm) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId: role.id,
                        permissionId: perm.id,
                    },
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: perm.id,
                },
            });
            console.log(`   + Assigned ${permName}`);
        } else {
            console.warn(`   ! Permission ${permName} not found in DB`);
        }
    }

    // 4. Update other roles (Verifier) if needed
    const verifierRole = await prisma.userRole.findUnique({ where: { name: 'VERIFIER' } });
    if (verifierRole) {
        const verifierPerms = ['READ_CAMPAIGN', 'READ_VERIFICATION', 'CREATE_VERIFICATION', 'UPDATE_VERIFICATION', 'VIEW_ASSETS'];
        for (const permName of verifierPerms) {
            const perm = await prisma.permission.findUnique({ where: { name: permName } });
            if (perm) {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId: verifierRole.id, permissionId: perm.id } },
                    update: {},
                    create: { roleId: verifierRole.id, permissionId: perm.id }
                });
                console.log(`   + Assigned ${permName} to VERIFIER`);
            }
        }
    }

    console.log('✅ Fix completed successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
