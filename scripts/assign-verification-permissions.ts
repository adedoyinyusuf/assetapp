import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignVerificationPermissions() {
  console.log('🔍 Checking current user roles and permissions...');

  try {
    // Find the super admin user
    const superAdminUser = await prisma.user.findFirst({
      where: { email: 'super.admin@npopc.gov.ng' },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!superAdminUser) {
      console.log('❌ Super admin user not found');
      return;
    }

    console.log(`👤 Found user: ${superAdminUser.email}`);
    console.log(`📝 Current role: ${superAdminUser.role.name}`);
    console.log(`🔑 Current permissions: ${superAdminUser.role.permissions.length}`);

    // Get the Verification Manager role
    const verificationManagerRole = await prisma.userRole.findFirst({
      where: { name: 'Verification Manager' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!verificationManagerRole) {
      console.log('❌ Verification Manager role not found');
      return;
    }

    console.log(`🎯 Found Verification Manager role with ${verificationManagerRole.permissions.length} permissions`);

    // Option 1: Add verification permissions to current role
    const currentRole = superAdminUser.role;
    
    // Get all verification permissions
    const verificationPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: 'campaign' },
          { resource: 'verification' },
          { resource: 'discrepancy' },
          { resource: 'assignment' },
          { resource: 'photo' },
          { resource: 'report' },
          { resource: 'analytics' },
          { resource: 'template' }
        ]
      }
    });

    console.log(`📋 Found ${verificationPermissions.length} verification permissions`);

    // Add verification permissions to the current role
    let addedCount = 0;
    for (const permission of verificationPermissions) {
      try {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: currentRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: currentRole.id,
            permissionId: permission.id,
          },
        });
        addedCount++;
      } catch (error) {
        // Permission already exists, skip
      }
    }

    console.log(`✅ Added ${addedCount} verification permissions to role "${currentRole.name}"`);

    // Verify the update
    const updatedUser = await prisma.user.findUnique({
      where: { id: superAdminUser.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const verificationPerms = updatedUser?.role.permissions.filter(rp => 
      ['campaign', 'verification', 'discrepancy', 'assignment', 'photo', 'report', 'analytics', 'template'].includes(rp.permission.resource)
    );

    console.log(`🎉 User now has ${verificationPerms?.length || 0} verification permissions`);
    console.log('✅ Permissions assigned successfully!');

  } catch (error) {
    console.error('❌ Error assigning permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
assignVerificationPermissions()
  .catch(console.error)
  .finally(() => process.exit(0));