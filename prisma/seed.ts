import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data if tables exist
  const clearTableIfExists = async (model: any) => {
    try {
      await model.deleteMany({});
    } catch (error: any) {
      if (error?.code !== 'P2021') { // Ignore "table does not exist" errors
        throw error;
      }
    }
  };

  // Clear stock verification tables (children first)
  await clearTableIfExists(prisma.verificationDiscrepancy);
  await clearTableIfExists(prisma.assetVerification);
  await clearTableIfExists(prisma.verificationAssignment);
  await clearTableIfExists(prisma.verificationSchedule);
  await clearTableIfExists(prisma.verificationAnalytics);
  await clearTableIfExists(prisma.verificationTemplate);
  await clearTableIfExists(prisma.verificationCampaign);

  // Clear auth-related tables
  await clearTableIfExists(prisma.auditLog);
  await clearTableIfExists(prisma.userSession);
  await clearTableIfExists(prisma.refreshToken);
  await clearTableIfExists(prisma.user);
  await clearTableIfExists(prisma.rolePermission);
  await clearTableIfExists(prisma.permission);
  await clearTableIfExists(prisma.userRole);

  // Clear asset-related tables
  await clearTableIfExists(prisma.assetMovement);
  await clearTableIfExists(prisma.asset);
  await clearTableIfExists(prisma.lGA); // Note: Prisma client uses the exact model name
  await clearTableIfExists(prisma.state);
  await clearTableIfExists(prisma.category);

  console.log('✅ Cleared existing data');

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

    // Stock Verification
    { name: 'READ_CAMPAIGN', description: 'View verification campaigns', resource: 'campaign', action: 'read' },
    { name: 'CREATE_CAMPAIGN', description: 'Create verification campaigns', resource: 'campaign', action: 'create' },
    { name: 'UPDATE_CAMPAIGN', description: 'Edit verification campaigns', resource: 'campaign', action: 'update' },
    { name: 'READ_VERIFICATION', description: 'View verifications', resource: 'verification', action: 'read' },
    { name: 'CREATE_VERIFICATION', description: 'Create verifications', resource: 'verification', action: 'create' },
    { name: 'UPDATE_VERIFICATION', description: 'Edit verifications', resource: 'verification', action: 'update' },
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
    // Stock Verification Roles
    {
      name: 'TEAM_LEADER',
      description: 'Leads stock verification teams',
      permissions: [
        'VIEW_ASSETS', 'VIEW_REPORTS', 'VIEW_CATEGORIES',
        'READ_CAMPAIGN', 'CREATE_CAMPAIGN', 'UPDATE_CAMPAIGN',
        'READ_VERIFICATION', 'CREATE_VERIFICATION', 'UPDATE_VERIFICATION'
      ],
    },
    {
      name: 'SENIOR_VERIFIER',
      description: 'Senior stock verifier',
      permissions: [
        'VIEW_ASSETS', 'VIEW_REPORTS',
        'READ_CAMPAIGN',
        'READ_VERIFICATION', 'CREATE_VERIFICATION', 'UPDATE_VERIFICATION'
      ],
    },
    {
      name: 'VERIFIER',
      description: 'Standard stock verifier',
      permissions: [
        'VIEW_ASSETS',
        'READ_CAMPAIGN',
        'READ_VERIFICATION', 'CREATE_VERIFICATION', 'UPDATE_VERIFICATION'
      ],
    },
    {
      name: 'ASSISTANT_VERIFIER',
      description: 'Assistant stock verifier',
      permissions: [
        'VIEW_ASSETS',
        'READ_CAMPAIGN',
        'READ_VERIFICATION', 'CREATE_VERIFICATION'
      ],
    },
    {
      name: 'QUALITY_CONTROLLER',
      description: 'Ensures verification quality',
      permissions: [
        'VIEW_ASSETS', 'VIEW_REPORTS',
        'READ_CAMPAIGN',
        'READ_VERIFICATION'
      ],
    },
    {
      name: 'OBSERVER',
      description: 'Observes verification process',
      permissions: [
        'VIEW_ASSETS',
        'READ_CAMPAIGN',
        'READ_VERIFICATION'
      ],
    },
    {
      name: 'AUDITOR_VERIFIER',
      description: 'Audits and verifies assets',
      permissions: [
        'VIEW_ASSETS',
        'READ_CAMPAIGN',
        'READ_VERIFICATION', 'CREATE_VERIFICATION', 'UPDATE_VERIFICATION'
      ],
    },
  ];

  // Create roles in the database
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
      const permission = createdPermissions.find(p => p.name === permissionName);
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
    console.log(`✅ Created/Updated role: ${createdRole.name}`);
  }

  // Create test users with different roles
  const users = [
    {
      email: 'super.admin@npopc.gov.ng',
      firstName: 'Super',
      lastName: 'Admin',
      password: 'SuperAdmin@123',
      roleName: 'SUPERADMIN',
    },
    {
      email: 'admin@npopc.gov.ng',
      firstName: 'Admin',
      lastName: 'User',
      password: 'Admin@123',
      roleName: 'ADMIN',
    },
    {
      email: 'manager@npopc.gov.ng',
      firstName: 'Department',
      lastName: 'Manager',
      password: 'Manager@123',
      roleName: 'MANAGER',
    },
    {
      email: 'operator@npopc.gov.ng',
      firstName: 'Asset',
      lastName: 'Operator',
      password: 'Operator@123',
      roleName: 'OPERATOR',
    },
    {
      email: 'viewer@npopc.gov.ng',
      firstName: 'Read-Only',
      lastName: 'User',
      password: 'Viewer@123',
      roleName: 'VIEWER',
    },
    {
      email: 'auditor.verifier@npopc.gov.ng',
      firstName: 'Auditor',
      lastName: 'Verifier',
      password: 'Auditor@123',
      roleName: 'AUDITOR_VERIFIER',
    },
  ];

  // Create users with hashed passwords
  for (const user of users) {
    const hashedPassword = await hash(user.password, 12);
    const role = await prisma.userRole.findUnique({
      where: { name: user.roleName },
    });

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

  // Create asset categories
  const categories = [
    { name: 'Office Equipment', description: 'Computers, printers, and other office equipment' },
    { name: 'Furniture', description: 'Office furniture and fixtures' },
    { name: 'Vehicles', description: 'Company vehicles and transportation' },
    { name: 'IT Equipment', description: 'Servers, network devices, and IT infrastructure' },
    { name: 'Electronics', description: 'Other electronic devices and gadgets' },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.category.create({
      data: category,
    });
    createdCategories.push(created);
  }
  console.log(`✅ Created ${createdCategories.length} asset categories`);

  // Read location data from JSON file
  const locationDataPath = path.join(__dirname, '../lib/data/nigeria_locations.json');
  console.log(`Reading location data from: ${locationDataPath}`);

  const locationData = JSON.parse(fs.readFileSync(locationDataPath, 'utf-8'));
  const nigeriaStates = locationData.states;
  const nigeriaLgas = locationData.lgas;

  const createdStates = [];
  for (const stateData of nigeriaStates) {
    const state = await prisma.state.create({
      data: {
        name: stateData.name,
        code: stateData.code,
      },
    });
    createdStates.push(state);

    // Find LGAs for this state (using the ID from JSON to map)
    const stateLgas = nigeriaLgas.filter((lga: any) => lga.stateId === stateData.id);

    const createdLgas = await prisma.lGA.createMany({
      data: stateLgas.map((lga: any) => ({
        name: lga.name,
        stateId: state.id,
      })),
    });

    console.log(`✅ Created ${stateLgas.length} LGAs for ${stateData.name}`);
  }
  console.log(`✅ Created ${createdStates.length} states`);

  // Get all LGAs and states for asset creation
  const allLgas = await prisma.lGA.findMany();
  const allStates = await prisma.state.findMany();

  // Create test assets
  const assets = [];

  // Generate 50 test assets
  for (let i = 0; i < 50; i++) {
    const category = faker.helpers.arrayElement(createdCategories);
    const lga = faker.helpers.arrayElement(allLgas);
    const state = allStates.find(s => s.id === lga.stateId) || allStates[0];
    const purchaseDate = faker.date.past({ years: 5 });
    const purchaseValue = parseFloat(faker.finance.amount({ min: 1000, max: 500000, dec: 2 }));
    const usefulLife = faker.number.int({ min: 1, max: 10 });
    const salvageValue = purchaseValue * 0.1; // 10% of purchase value

    // Calculate current value based on depreciation (simplified)
    const yearsOld = (new Date().getFullYear() - purchaseDate.getFullYear());
    const annualDepreciation = (purchaseValue - salvageValue) / usefulLife;
    const currentValue = Math.max(
      purchaseValue - (annualDepreciation * yearsOld),
      salvageValue
    );

    const asset = await prisma.asset.create({
      data: {
        name: `${category.name} - ${faker.commerce.productName()}`,
        description: faker.commerce.productDescription(),
        purchaseValue,
        purchaseDate,
        usefulLife,
        salvageValue,
        currentValue,
        categoryId: category.id,
        stateId: state.id,
        lgaId: lga.id,
      },
    });
    assets.push(asset);
  }
  console.log(`✅ Created ${assets.length} test assets`);

  // Create asset movements
  for (let i = 0; i < 100; i++) {
    const asset = faker.helpers.arrayElement(assets);
    const fromState = faker.helpers.arrayElement(allStates);
    const toState = faker.helpers.arrayElement(allStates.filter(s => s.id !== fromState.id));

    // Get LGAs from the selected states
    const fromLgas = allLgas.filter(l => l.stateId === fromState.id);
    const toLgas = allLgas.filter(l => l.stateId === toState.id);

    if (fromLgas.length === 0 || toLgas.length === 0) continue;

    const fromLga = faker.helpers.arrayElement(fromLgas);
    const toLga = faker.helpers.arrayElement(toLgas);

    await prisma.assetMovement.create({
      data: {
        assetId: asset.id,
        fromStateId: fromState.id,
        fromLgaId: fromLga.id,
        toStateId: toState.id,
        toLgaId: toLga.id,
        movementDate: faker.date.recent({ days: 60 }),
        reason: faker.lorem.sentence(),
        movedBy: faker.person.fullName(),
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentences(2) : null,
      },
    });
  }
  console.log('✅ Created 100 asset movement records');

  // Create annual depreciation records for assets
  for (const asset of assets) {
    const purchaseYear = new Date(asset.purchaseDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const years = currentYear - purchaseYear;

    if (years <= 0) continue;

    const annualDepreciation = (asset.purchaseValue - asset.salvageValue) / asset.usefulLife;
    let currentValue = asset.purchaseValue;

    for (let year = 1; year <= Math.min(years, asset.usefulLife); year++) {
      const yearDepreciation = Math.min(annualDepreciation, currentValue - asset.salvageValue);
      currentValue -= yearDepreciation;

      // Skip some years randomly to make it more realistic
      if (faker.datatype.boolean(0.2)) continue;

      await prisma.depreciation.create({
        data: {
          assetId: asset.id,
          year: purchaseYear + year,
          depreciation: parseFloat(yearDepreciation.toFixed(2)),
          currentValue: parseFloat(currentValue.toFixed(2)),
        },
      });
    }
  }
  console.log('✅ Created depreciation records for all assets');

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
