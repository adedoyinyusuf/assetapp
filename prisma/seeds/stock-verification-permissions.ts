import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedStockVerificationPermissions() {
  console.log('🌱 Seeding Stock Verification permissions...');

  try {
    // Define Stock Verification permissions
    const verificationPermissions = [
      // Campaign Management
      { name: 'campaign:create', description: 'Create verification campaigns', resource: 'campaign', action: 'create' },
      { name: 'campaign:read', description: 'View verification campaigns', resource: 'campaign', action: 'read' },
      { name: 'campaign:update', description: 'Update verification campaigns', resource: 'campaign', action: 'update' },
      { name: 'campaign:delete', description: 'Delete verification campaigns', resource: 'campaign', action: 'delete' },
      { name: 'campaign:manage', description: 'Full campaign management', resource: 'campaign', action: 'manage' },

      // Asset Verification
      { name: 'verification:create', description: 'Create asset verifications', resource: 'verification', action: 'create' },
      { name: 'verification:read', description: 'View asset verifications', resource: 'verification', action: 'read' },
      { name: 'verification:update', description: 'Update asset verifications', resource: 'verification', action: 'update' },
      { name: 'verification:delete', description: 'Delete asset verifications', resource: 'verification', action: 'delete' },
      { name: 'verification:review', description: 'Review asset verifications', resource: 'verification', action: 'review' },
      { name: 'verification:approve', description: 'Approve asset verifications', resource: 'verification', action: 'approve' },

      // Discrepancy Management
      { name: 'discrepancy:create', description: 'Report discrepancies', resource: 'discrepancy', action: 'create' },
      { name: 'discrepancy:read', description: 'View discrepancies', resource: 'discrepancy', action: 'read' },
      { name: 'discrepancy:update', description: 'Update discrepancies', resource: 'discrepancy', action: 'update' },
      { name: 'discrepancy:assign', description: 'Assign discrepancies', resource: 'discrepancy', action: 'assign' },
      { name: 'discrepancy:resolve', description: 'Resolve discrepancies', resource: 'discrepancy', action: 'resolve' },
      { name: 'discrepancy:escalate', description: 'Escalate discrepancies', resource: 'discrepancy', action: 'escalate' },

      // Team Management
      { name: 'assignment:create', description: 'Create team assignments', resource: 'assignment', action: 'create' },
      { name: 'assignment:read', description: 'View team assignments', resource: 'assignment', action: 'read' },
      { name: 'assignment:update', description: 'Update team assignments', resource: 'assignment', action: 'update' },
      { name: 'assignment:delete', description: 'Delete team assignments', resource: 'assignment', action: 'delete' },

      // Photo Management
      { name: 'photo:upload', description: 'Upload verification photos', resource: 'photo', action: 'upload' },
      { name: 'photo:view', description: 'View verification photos', resource: 'photo', action: 'view' },
      { name: 'photo:delete', description: 'Delete verification photos', resource: 'photo', action: 'delete' },

      // Reports and Analytics
      { name: 'report:view', description: 'View verification reports', resource: 'report', action: 'view' },
      { name: 'report:export', description: 'Export verification reports', resource: 'report', action: 'export' },
      { name: 'analytics:view', description: 'View verification analytics', resource: 'analytics', action: 'view' },

      // Template Management
      { name: 'template:create', description: 'Create verification templates', resource: 'template', action: 'create' },
      { name: 'template:read', description: 'View verification templates', resource: 'template', action: 'read' },
      { name: 'template:update', description: 'Update verification templates', resource: 'template', action: 'update' },
      { name: 'template:delete', description: 'Delete verification templates', resource: 'template', action: 'delete' },
    ];

    // Insert permissions
    for (const permission of verificationPermissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      });
    }

    console.log(`✅ Created ${verificationPermissions.length} Stock Verification permissions`);

    // Define Stock Verification roles
    const verificationRoles = [
      {
        name: 'Verification Manager',
        description: 'Full access to verification system management',
        permissions: [
          'campaign:create', 'campaign:read', 'campaign:update', 'campaign:delete', 'campaign:manage',
          'verification:create', 'verification:read', 'verification:update', 'verification:delete', 
          'verification:review', 'verification:approve',
          'discrepancy:create', 'discrepancy:read', 'discrepancy:update', 'discrepancy:assign', 
          'discrepancy:resolve', 'discrepancy:escalate',
          'assignment:create', 'assignment:read', 'assignment:update', 'assignment:delete',
          'photo:upload', 'photo:view', 'photo:delete',
          'report:view', 'report:export', 'analytics:view',
          'template:create', 'template:read', 'template:update', 'template:delete'
        ]
      },
      {
        name: 'Field Supervisor',
        description: 'Supervise verification teams and review submissions',
        permissions: [
          'campaign:read',
          'verification:create', 'verification:read', 'verification:update', 'verification:review',
          'discrepancy:create', 'discrepancy:read', 'discrepancy:update', 'discrepancy:assign', 'discrepancy:resolve',
          'assignment:read', 'assignment:update',
          'photo:upload', 'photo:view',
          'report:view', 'report:export', 'analytics:view',
          'template:read'
        ]
      },
      {
        name: 'Verification Officer',
        description: 'Conduct asset verifications and report discrepancies',
        permissions: [
          'campaign:read',
          'verification:create', 'verification:read', 'verification:update',
          'discrepancy:create', 'discrepancy:read', 'discrepancy:update',
          'assignment:read',
          'photo:upload', 'photo:view',
          'report:view', 'analytics:view',
          'template:read'
        ]
      },
      {
        name: 'Asset Administrator',
        description: 'Manage asset data and resolve verification issues',
        permissions: [
          'campaign:read',
          'verification:read', 'verification:review', 'verification:approve',
          'discrepancy:read', 'discrepancy:update', 'discrepancy:resolve',
          'assignment:read',
          'photo:view',
          'report:view', 'report:export', 'analytics:view',
          'template:read'
        ]
      },
      {
        name: 'Verification Auditor',
        description: 'Read-only access to all verification data for auditing',
        permissions: [
          'campaign:read',
          'verification:read',
          'discrepancy:read',
          'assignment:read',
          'photo:view',
          'report:view', 'report:export', 'analytics:view',
          'template:read'
        ]
      }
    ];

    // Create roles and assign permissions
    for (const roleData of verificationRoles) {
      const role = await prisma.userRole.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: {
          name: roleData.name,
          description: roleData.description,
        },
      });

      // Get permissions for this role
      const permissions = await prisma.permission.findMany({
        where: {
          name: { in: roleData.permissions },
        },
      });

      // Assign permissions to role
      for (const permission of permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }

      console.log(`✅ Created role "${roleData.name}" with ${permissions.length} permissions`);
    }

    console.log('✅ Stock Verification permissions and roles seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding Stock Verification permissions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedStockVerificationPermissions()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}