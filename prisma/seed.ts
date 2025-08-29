import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.userRole.deleteMany();

  console.log('✅ Cleared existing auth data');

  // Create permissions
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

  // Create permissions in the database
  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.create({
      data: permission,
    });
    createdPermissions.push(created);
  }
  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // Create roles with their permissions
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
      description: 'Full access to all features except user management',
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
      name: 'SUPER_ADMIN',
      description: 'Full system access including user management',
      permissions: permissions.map(p => p.name),
    },
  ];

  // Create roles and assign permissions
  for (const role of roles) {
    const createdRole = await prisma.userRole.create({
      data: {
        name: role.name,
        description: role.description,
      },
    });

    // Get the permission IDs for this role
    const permissionRecords = await prisma.permission.findMany({
      where: { name: { in: role.permissions } },
    });

    // Assign permissions to role
    for (const permission of permissionRecords) {
      await prisma.rolePermission.create({
        data: {
          roleId: createdRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`✅ Created role: ${role.name} with ${permissionRecords.length} permissions`);
  }

  // Create a default super admin user
  const hashedPassword = await hash('admin123', 12);
  const adminRole = await prisma.userRole.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (adminRole) {
    await prisma.user.create({
      data: {
        email: 'admin@npc.gov.ng',
        hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        roleId: adminRole.id,
        isActive: true,
      },
    });
    console.log('✅ Created default admin user (admin@npc.gov.ng / admin123)');
  }

  console.log('🌱 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
