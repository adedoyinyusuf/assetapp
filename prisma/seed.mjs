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
    { name: 'VIEW_ASSETS', description: 'View assets', resource: 'assets', action: 'view' },
    { name: 'CREATE_ASSETS', description: 'Create assets', resource: 'assets', action: 'create' },
    { name: 'EDIT_ASSETS', description: 'Edit assets', resource: 'assets', action: 'update' },
    { name: 'DELETE_ASSETS', description: 'Delete assets', resource: 'assets', action: 'delete' },
    { name: 'VIEW_CATEGORIES', description: 'View categories', resource: 'categories', action: 'view' },
    { name: 'MANAGE_CATEGORIES', description: 'Manage categories', resource: 'categories', action: 'manage' },
    { name: 'VIEW_USERS', description: 'View users', resource: 'users', action: 'view' },
    { name: 'MANAGE_USERS', description: 'Manage users', resource: 'users', action: 'manage' },
    { name: 'VIEW_REPORTS', description: 'View reports', resource: 'reports', action: 'view' },
    { name: 'EXPORT_REPORTS', description: 'Export reports', resource: 'reports', action: 'export' },
    { name: 'MANAGE_SETTINGS', description: 'Manage system settings', resource: 'settings', action: 'manage' },
    { name: 'VIEW_AUDIT_LOGS', description: 'View audit logs', resource: 'audit_logs', action: 'view' },
  ];

  // Create permissions in the database
  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.create({ data: permission });
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
      permissions: ['VIEW_ASSETS', 'CREATE_ASSETS', 'EDIT_ASSETS', 'VIEW_REPORTS', 'VIEW_CATEGORIES'],
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
      name: 'SUPER_ADMIN',
      description: 'Full system access including user management',
      permissions: permissions.map(p => p.name),
    },
  ];

  // Create roles and assign permissions
  for (const role of roles) {
    const { permissions: permissionNames, ...roleData } = role;
    
    const createdRole = await prisma.userRole.upsert({
      where: { name: roleData.name },
      update: roleData,
      create: roleData,
    });

    for (const permissionName of permissionNames) {
      const permission = createdPermissions.find(p => p.name === permissionName);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: createdRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: createdRole.id, permissionId: permission.id },
        });
      }
    }
    console.log(`✅ Created/Updated role: ${createdRole.name}`);
  }

  // Create test users
  const users = [
    { email: 'super.admin@npopc.gov.ng', firstName: 'Super', lastName: 'Admin', password: 'SuperAdmin@123', roleName: 'SUPER_ADMIN' },
    { email: 'admin@npopc.gov.ng', firstName: 'Admin', lastName: 'User', password: 'Admin@123', roleName: 'ADMIN' },
    { email: 'manager@npopc.gov.ng', firstName: 'Department', lastName: 'Manager', password: 'Manager@123', roleName: 'MANAGER' },
    { email: 'operator@npopc.gov.ng', firstName: 'Asset', lastName: 'Operator', password: 'Operator@123', roleName: 'OPERATOR' },
    { email: 'viewer@npopc.gov.ng', firstName: 'Read-Only', lastName: 'User', password: 'Viewer@123', roleName: 'VIEWER' },
  ];

  for (const user of users) {
    const hashedPassword = await hash(user.password, 12);
    const role = await prisma.userRole.findUnique({ where: { name: user.roleName } });

    if (!role) {
      console.warn(`Role ${user.roleName} not found for user ${user.email}`);
      continue;
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        hashedPassword,
        roleId: role.id,
        isActive: true,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        hashedPassword,
        roleId: role.id,
        isActive: true,
      },
    });
    console.log(`✅ Created/Updated user: ${user.email} (${user.roleName})`);
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
