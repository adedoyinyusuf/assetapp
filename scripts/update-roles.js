
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting safe role update...');

    // Define Permissions
    const permissions = [
        // Asset permissions
        { name: 'VIEW_ASSETS', description: 'View assets', resource: 'assets', action: 'view' },
        { name: 'CREATE_ASSETS', description: 'Create assets', resource: 'assets', action: 'create' },
        { name: 'EDIT_ASSETS', description: 'Edit assets', resource: 'assets', action: 'update' },
        { name: 'DELETE_ASSETS', description: 'Delete assets', resource: 'assets', action: 'delete' },

        // Category permissions
        { name: 'VIEW_CATEGORIES', description: 'View categories', resource: 'categories', action: 'view' },
        { name: 'MANAGE_CATEGORIES', description: 'Manage categories', resource: 'categories', action: 'manage' },

        // User management permissions
        { name: 'VIEW_USERS', description: 'View users', resource: 'users', action: 'view' },
        { name: 'MANAGE_USERS', description: 'Manage users', resource: 'users', action: 'manage' },

        // Reports permissions
        { name: 'VIEW_REPORTS', description: 'View reports', resource: 'reports', action: 'view' },
        { name: 'EXPORT_REPORTS', description: 'Export reports', resource: 'reports', action: 'export' },

        // System settings
        { name: 'MANAGE_SETTINGS', description: 'Manage system settings', resource: 'settings', action: 'manage' },

        // Audit logs
        { name: 'VIEW_AUDIT_LOGS', description: 'View audit logs', resource: 'audit_logs', action: 'view' },
    ];

    console.log('Checking Permissions...');
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

    // Define Roles
    const roles = [
        {
            name: 'VIEWER',
            description: 'Can view assets and basic reports',
            permissions: ['VIEW_ASSETS', 'VIEW_REPORTS', 'VIEW_CATEGORIES'],
        },
        {
            name: 'OPERATOR',
            description: 'Can manage assets and view reports',
            permissions: [
                'VIEW_ASSETS', 'CREATE_ASSETS', 'EDIT_ASSETS',
                'VIEW_REPORTS', 'VIEW_CATEGORIES'
            ],
        },
        {
            name: 'MANAGER',
            description: 'Can manage assets, categories, and view all reports',
            permissions: [
                'VIEW_ASSETS', 'CREATE_ASSETS', 'EDIT_ASSETS', 'DELETE_ASSETS',
                'VIEW_REPORTS', 'EXPORT_REPORTS',
                'VIEW_CATEGORIES', 'MANAGE_CATEGORIES',
                'VIEW_USERS'
            ],
        },
        {
            name: 'ADMIN',
            description: 'Full access to all features',
            permissions: [
                'VIEW_ASSETS', 'CREATE_ASSETS', 'EDIT_ASSETS', 'DELETE_ASSETS',
                'VIEW_REPORTS', 'EXPORT_REPORTS',
                'VIEW_CATEGORIES', 'MANAGE_CATEGORIES',
                'VIEW_USERS', 'MANAGE_USERS',
                'VIEW_AUDIT_LOGS',
                'MANAGE_SETTINGS'
            ],
        },
        {
            name: 'SUPERADMIN',
            description: 'Full system access including user management',
            permissions: permissions.map(p => p.name),
        },
        // Stock Verification Roles
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

    console.log('Upserting Roles...');
    for (const role of roles) {
        const { permissions: permissionNames, ...roleData } = role;

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

    console.log('🎉 Role update completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error updating roles:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
