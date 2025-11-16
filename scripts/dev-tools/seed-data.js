/**
 * Stock Verification Module - Seed Data Generator
 * Version: 1.0.0
 * Description: Generate realistic test data for development and testing
 */

const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Configuration
const SEED_CONFIG = {
  users: 50,
  states: 5,
  lgas: 20,
  categories: 8,
  assets: 500,
  campaigns: 10,
  assignments_per_campaign: 5,
  verifications_per_campaign: 100,
  discrepancies_percentage: 15, // 15% of verifications will have discrepancies
  templates: 5,
  schedules: 3,
};

// Sample data
const SAMPLE_DATA = {
  states: [
    { name: 'Lagos', code: 'LA' },
    { name: 'Abuja', code: 'FC' },
    { name: 'Kano', code: 'KN' },
    { name: 'Rivers', code: 'RI' },
    { name: 'Oyo', code: 'OY' },
  ],
  lgas: [
    'Ikeja', 'Victoria Island', 'Lekki', 'Surulere', 'Yaba',
    'Wuse', 'Garki', 'Asokoro', 'Maitama',
    'Fagge', 'Dala', 'Gwale', 'Tarauni',
    'Port Harcourt', 'Obio-Akpor', 'Eleme', 'Ikwerre',
    'Ibadan North', 'Ibadan South', 'Egbeda', 'Oluyole',
  ],
  categories: [
    { name: 'IT Equipment', code: 'IT' },
    { name: 'Office Furniture', code: 'OF' },
    { name: 'Vehicles', code: 'VH' },
    { name: 'Building & Infrastructure', code: 'BI' },
    { name: 'Medical Equipment', code: 'ME' },
    { name: 'Security Equipment', code: 'SE' },
    { name: 'Communications', code: 'CM' },
    { name: 'General Equipment', code: 'GE' },
  ],
  roles: [
    'CAMPAIGN_MANAGER',
    'SUPERVISOR', 
    'LEAD_VERIFIER',
    'FIELD_VERIFIER',
    'REVIEWER'
  ],
  physicalConditions: [
    'EXCELLENT',
    'GOOD', 
    'FAIR',
    'POOR',
    'DAMAGED'
  ],
  discrepancyTypes: [
    'MISSING_ASSET',
    'LOCATION_MISMATCH',
    'CONDITION_MISMATCH',
    'DATA_INCONSISTENCY',
    'PHYSICAL_DAMAGE',
    'FUNCTIONAL_ISSUE',
    'OTHER'
  ],
  priorities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  templateTypes: ['STANDARD', 'DETAILED', 'QUICK_CHECK', 'CUSTOM'],
};

class SeedDataGenerator {
  constructor() {
    this.createdData = {
      users: [],
      states: [],
      lgas: [],
      categories: [],
      assets: [],
      campaigns: [],
      templates: [],
      schedules: [],
      assignments: [],
      verifications: [],
      discrepancies: [],
    };
  }

  /**
   * Generate all seed data
   */
  async generateAllData() {
    console.log('🌱 Starting seed data generation...\n');

    try {
      // Clear existing data (optional)
      await this.clearExistingData();

      // Generate base data
      await this.generateUsers();
      await this.generateStates();
      await this.generateLGAs();
      await this.generateCategories();
      await this.generateAssets();

      // Generate verification-specific data
      await this.generateTemplates();
      await this.generateSchedules();
      await this.generateCampaigns();
      await this.generateAssignments();
      await this.generateVerifications();
      await this.generateDiscrepancies();

      console.log('✅ Seed data generation completed successfully!\n');
      this.printSummary();

    } catch (error) {
      console.error('❌ Seed data generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Clear existing verification data
   */
  async clearExistingData() {
    console.log('🧹 Clearing existing verification data...');

    // Delete in reverse dependency order
    await prisma.verificationDiscrepancy.deleteMany({});
    await prisma.assetVerification.deleteMany({});
    await prisma.verificationAssignment.deleteMany({});
    await prisma.verificationSchedule.deleteMany({});
    await prisma.verificationCampaign.deleteMany({});
    await prisma.verificationTemplate.deleteMany({});
    await prisma.verificationAnalytics.deleteMany({});

    console.log('   ✓ Existing verification data cleared\n');
  }

  /**
   * Generate sample users
   */
  async generateUsers() {
    console.log('👥 Generating users...');

    for (let i = 0; i < SEED_CONFIG.users; i++) {
      const userData = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        isActive: faker.datatype.boolean(0.9), // 90% active
        role: faker.helpers.arrayElement(['ADMIN', 'USER', 'MANAGER']),
        department: faker.helpers.arrayElement([
          'IT', 'Finance', 'Operations', 'HR', 'Security', 'Facilities'
        ]),
        createdAt: faker.date.past({ years: 2 }),
      };

      try {
        const user = await prisma.user.create({ data: userData });
        this.createdData.users.push(user);
      } catch (error) {
        // Skip if user already exists (email uniqueness)
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }

    console.log(`   ✓ Created ${this.createdData.users.length} users\n`);
  }

  /**
   * Generate sample states
   */
  async generateStates() {
    console.log('🗺️ Generating states...');

    for (const stateData of SAMPLE_DATA.states) {
      try {
        const state = await prisma.state.create({
          data: {
            name: stateData.name,
            code: stateData.code,
            isActive: true,
          }
        });
        this.createdData.states.push(state);
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }

    console.log(`   ✓ Created ${this.createdData.states.length} states\n`);
  }

  /**
   * Generate sample LGAs
   */
  async generateLGAs() {
    console.log('🏘️ Generating LGAs...');

    for (let i = 0; i < SAMPLE_DATA.lgas.length; i++) {
      const lgaName = SAMPLE_DATA.lgas[i];
      const state = faker.helpers.arrayElement(this.createdData.states);

      try {
        const lga = await prisma.lGA.create({
          data: {
            name: lgaName,
            stateId: state.id,
            code: lgaName.substring(0, 3).toUpperCase(),
            isActive: true,
          }
        });
        this.createdData.lgas.push(lga);
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }

    console.log(`   ✓ Created ${this.createdData.lgas.length} LGAs\n`);
  }

  /**
   * Generate sample categories
   */
  async generateCategories() {
    console.log('📂 Generating categories...');

    for (const categoryData of SAMPLE_DATA.categories) {
      try {
        const category = await prisma.assetCategory.create({
          data: {
            name: categoryData.name,
            code: categoryData.code,
            description: `Assets related to ${categoryData.name}`,
            isActive: true,
          }
        });
        this.createdData.categories.push(category);
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }

    console.log(`   ✓ Created ${this.createdData.categories.length} categories\n`);
  }

  /**
   * Generate sample assets
   */
  async generateAssets() {
    console.log('💼 Generating assets...');

    for (let i = 0; i < SEED_CONFIG.assets; i++) {
      const category = faker.helpers.arrayElement(this.createdData.categories);
      const state = faker.helpers.arrayElement(this.createdData.states);
      const lga = this.createdData.lgas.find(l => l.stateId === state.id) || 
                  faker.helpers.arrayElement(this.createdData.lgas);
      const createdBy = faker.helpers.arrayElement(this.createdData.users);

      const assetData = {
        name: this.generateAssetName(category.name),
        description: faker.commerce.productDescription(),
        serialNumber: faker.string.alphanumeric(10).toUpperCase(),
        model: faker.commerce.productName(),
        manufacturer: faker.company.name(),
        categoryId: category.id,
        stateId: state.id,
        lgaId: lga.id,
        location: faker.location.streetAddress(),
        purchaseDate: faker.date.past({ years: 5 }),
        purchasePrice: parseFloat(faker.commerce.price({ min: 1000, max: 100000 })),
        currentValue: parseFloat(faker.commerce.price({ min: 500, max: 80000 })),
        condition: faker.helpers.arrayElement(SAMPLE_DATA.physicalConditions),
        isActive: faker.datatype.boolean(0.95), // 95% active
        createdBy: createdBy.id,
        createdAt: faker.date.past({ years: 3 }),
      };

      try {
        const asset = await prisma.asset.create({ data: assetData });
        this.createdData.assets.push(asset);
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          throw error;
        }
      }
    }

    console.log(`   ✓ Created ${this.createdData.assets.length} assets\n`);
  }

  /**
   * Generate verification templates
   */
  async generateTemplates() {
    console.log('📋 Generating verification templates...');

    const templateConfigs = [
      {
        name: 'Standard Asset Verification',
        type: 'STANDARD',
        checklistItems: [
          { id: 'physical_check', label: 'Physical condition check', required: true },
          { id: 'location_verify', label: 'Verify asset location', required: true },
          { id: 'tag_readable', label: 'Asset tag is readable', required: true },
          { id: 'functional_test', label: 'Basic functional test', required: false },
        ],
        requiredPhotos: ['BEFORE', 'GENERAL'],
      },
      {
        name: 'IT Equipment Detailed Check',
        type: 'DETAILED',
        checklistItems: [
          { id: 'power_test', label: 'Power on test', required: true },
          { id: 'network_check', label: 'Network connectivity', required: true },
          { id: 'software_verify', label: 'Software verification', required: false },
          { id: 'security_scan', label: 'Security scan', required: true },
        ],
        requiredPhotos: ['BEFORE', 'AFTER', 'GENERAL'],
      },
      {
        name: 'Quick Spot Check',
        type: 'QUICK_CHECK',
        checklistItems: [
          { id: 'presence_check', label: 'Asset is present', required: true },
          { id: 'tag_check', label: 'Tag matches record', required: true },
        ],
        requiredPhotos: ['GENERAL'],
      },
      {
        name: 'Vehicle Inspection',
        type: 'DETAILED',
        checklistItems: [
          { id: 'exterior_check', label: 'Exterior condition', required: true },
          { id: 'interior_check', label: 'Interior condition', required: true },
          { id: 'engine_check', label: 'Engine functionality', required: true },
          { id: 'documents_check', label: 'Vehicle documents', required: true },
        ],
        requiredPhotos: ['BEFORE', 'GENERAL', 'DAMAGE'],
      },
      {
        name: 'Furniture & Equipment',
        type: 'STANDARD',
        checklistItems: [
          { id: 'structural_check', label: 'Structural integrity', required: true },
          { id: 'wear_assessment', label: 'Wear and tear assessment', required: true },
          { id: 'safety_check', label: 'Safety compliance', required: false },
        ],
        requiredPhotos: ['GENERAL'],
      },
    ];

    for (const config of templateConfigs) {
      const createdBy = faker.helpers.arrayElement(this.createdData.users);
      const categoryIds = faker.helpers.arrayElements(
        this.createdData.categories.map(c => c.id),
        faker.number.int({ min: 1, max: 3 })
      );

      const templateData = {
        name: config.name,
        description: `${config.name} template for verification processes`,
        type: config.type,
        categoryIds: categoryIds,
        checklistItems: config.checklistItems,
        requiredPhotos: config.requiredPhotos,
        instructions: faker.lorem.paragraph(),
        isActive: true,
        createdBy: createdBy.id,
      };

      const template = await prisma.verificationTemplate.create({ data: templateData });
      this.createdData.templates.push(template);
    }

    console.log(`   ✓ Created ${this.createdData.templates.length} templates\n`);
  }

  /**
   * Generate verification schedules
   */
  async generateSchedules() {
    console.log('📅 Generating verification schedules...');

    const scheduleConfigs = [
      {
        name: 'Monthly IT Equipment Check',
        type: 'MONTHLY',
        frequency: 1,
        dayOfMonth: 15,
      },
      {
        name: 'Quarterly Asset Review',
        type: 'QUARTERLY',
        frequency: 1,
        dayOfMonth: 1,
      },
      {
        name: 'Annual Comprehensive Audit',
        type: 'ANNUALLY',
        frequency: 1,
        dayOfMonth: 1,
        month: 1,
      },
    ];

    for (const config of scheduleConfigs) {
      const createdBy = faker.helpers.arrayElement(this.createdData.users);
      const template = faker.helpers.arrayElement(this.createdData.templates);
      const stateIds = faker.helpers.arrayElements(
        this.createdData.states.map(s => s.id),
        faker.number.int({ min: 1, max: 3 })
      );
      const categoryIds = faker.helpers.arrayElements(
        this.createdData.categories.map(c => c.id),
        faker.number.int({ min: 1, max: 3 })
      );

      const scheduleData = {
        name: config.name,
        description: `Automated schedule for ${config.name}`,
        type: config.type,
        status: 'ACTIVE',
        stateIds: stateIds,
        lgaIds: [], // Empty for broader scope
        categoryIds: categoryIds,
        templateId: template.id,
        startDate: faker.date.future(),
        frequency: config.frequency,
        dayOfMonth: config.dayOfMonth,
        month: config.month,
        isActive: true,
        createdBy: createdBy.id,
      };

      const schedule = await prisma.verificationSchedule.create({ data: scheduleData });
      this.createdData.schedules.push(schedule);
    }

    console.log(`   ✓ Created ${this.createdData.schedules.length} schedules\n`);
  }

  /**
   * Generate verification campaigns
   */
  async generateCampaigns() {
    console.log('🎯 Generating verification campaigns...');

    for (let i = 0; i < SEED_CONFIG.campaigns; i++) {
      const createdBy = faker.helpers.arrayElement(this.createdData.users);
      const stateIds = faker.helpers.arrayElements(
        this.createdData.states.map(s => s.id),
        faker.number.int({ min: 1, max: 3 })
      );
      const categoryIds = faker.helpers.arrayElements(
        this.createdData.categories.map(c => c.id),
        faker.number.int({ min: 1, max: 4 })
      );

      const startDate = faker.date.recent({ days: 30 });
      const endDate = faker.date.future({ refDate: startDate });

      const campaignData = {
        name: `${faker.helpers.arrayElement(['Q1', 'Q2', 'Q3', 'Q4'])} ${faker.date.recent().getFullYear()} ${faker.helpers.arrayElement(['Asset', 'Equipment', 'Infrastructure'])} Verification`,
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']),
        priority: faker.helpers.arrayElement(SAMPLE_DATA.priorities),
        startDate: startDate,
        endDate: endDate,
        stateIds: stateIds,
        lgaIds: [], // Broader scope
        categoryIds: categoryIds,
        instructions: faker.lorem.paragraphs(2),
        targetAssetCount: faker.number.int({ min: 50, max: 200 }),
        createdBy: createdBy.id,
        createdAt: faker.date.past({ years: 1 }),
      };

      // Set campaign start/completion dates based on status
      if (campaignData.status === 'ACTIVE' || campaignData.status === 'COMPLETED') {
        campaignData.startedAt = startDate;
      }
      if (campaignData.status === 'COMPLETED') {
        campaignData.completedAt = faker.date.between({ from: startDate, to: endDate });
      }

      const campaign = await prisma.verificationCampaign.create({ data: campaignData });
      this.createdData.campaigns.push(campaign);
    }

    console.log(`   ✓ Created ${this.createdData.campaigns.length} campaigns\n`);
  }

  /**
   * Generate verification assignments
   */
  async generateAssignments() {
    console.log('👷 Generating verification assignments...');

    for (const campaign of this.createdData.campaigns) {
      const numAssignments = faker.number.int({ min: 3, max: SEED_CONFIG.assignments_per_campaign });
      
      for (let i = 0; i < numAssignments; i++) {
        const user = faker.helpers.arrayElement(this.createdData.users);
        const role = faker.helpers.arrayElement(SAMPLE_DATA.roles);

        // Avoid duplicate assignments
        const existingAssignment = this.createdData.assignments.find(
          a => a.campaignId === campaign.id && a.userId === user.id
        );
        if (existingAssignment) continue;

        const assignmentData = {
          campaignId: campaign.id,
          userId: user.id,
          role: role,
          stateIds: campaign.stateIds.length > 0 ? 
            faker.helpers.arrayElements(campaign.stateIds, faker.number.int({ min: 1, max: campaign.stateIds.length })) : 
            [],
          lgaIds: [],
          categoryIds: campaign.categoryIds.length > 0 ?
            faker.helpers.arrayElements(campaign.categoryIds, faker.number.int({ min: 1, max: campaign.categoryIds.length })) :
            [],
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          dailyTarget: faker.number.int({ min: 5, max: 20 }),
          totalTarget: faker.number.int({ min: 20, max: 100 }),
          completedCount: faker.number.int({ min: 0, max: 50 }),
          status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'COMPLETED']),
          instructions: faker.lorem.paragraph(),
          permissions: faker.helpers.arrayElements([
            'VIEW_ASSIGNMENTS', 'VERIFY_ASSETS', 'CREATE_DISCREPANCIES', 
            'UPLOAD_PHOTOS', 'UPDATE_STATUS'
          ], faker.number.int({ min: 2, max: 5 })),
          mobileAccess: faker.datatype.boolean(0.8),
          offlineAccess: faker.datatype.boolean(0.3),
        };

        const assignment = await prisma.verificationAssignment.create({ data: assignmentData });
        this.createdData.assignments.push(assignment);
      }
    }

    console.log(`   ✓ Created ${this.createdData.assignments.length} assignments\n`);
  }

  /**
   * Generate asset verifications
   */
  async generateVerifications() {
    console.log('✅ Generating asset verifications...');

    for (const campaign of this.createdData.campaigns) {
      const campaignAssets = this.createdData.assets.filter(asset => 
        (campaign.stateIds.length === 0 || campaign.stateIds.includes(asset.stateId)) &&
        (campaign.categoryIds.length === 0 || campaign.categoryIds.includes(asset.categoryId))
      );

      const numVerifications = Math.min(
        faker.number.int({ min: 20, max: SEED_CONFIG.verifications_per_campaign }),
        campaignAssets.length
      );

      const selectedAssets = faker.helpers.arrayElements(campaignAssets, numVerifications);
      const campaignAssignments = this.createdData.assignments.filter(a => a.campaignId === campaign.id);

      for (const asset of selectedAssets) {
        const assignment = faker.helpers.arrayElement(campaignAssignments);
        const verifier = this.createdData.users.find(u => u.id === assignment.userId);

        const scheduledDate = faker.date.between({ 
          from: campaign.startDate || new Date(), 
          to: campaign.endDate || new Date() 
        });

        const verificationData = {
          campaignId: campaign.id,
          assetId: asset.id,
          verifierId: verifier.id,
          assignmentId: assignment.id,
          status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'VERIFIED', 'APPROVED', 'REJECTED']),
          physicalCondition: faker.helpers.arrayElement(SAMPLE_DATA.physicalConditions),
          functionalStatus: faker.helpers.arrayElement(['Working', 'Partially Working', 'Not Working', 'Needs Maintenance']),
          location: asset.location,
          coordinates: {
            lat: faker.location.latitude(),
            lng: faker.location.longitude()
          },
          notes: faker.lorem.sentences(2),
          scheduledDate: scheduledDate,
          verificationDuration: faker.number.int({ min: 10, max: 120 }), // minutes
        };

        // Set verification date for completed verifications
        if (['VERIFIED', 'APPROVED', 'REJECTED'].includes(verificationData.status)) {
          verificationData.verificationDate = faker.date.between({ 
            from: scheduledDate, 
            to: new Date() 
          });
        }

        // Add reviewer for approved/rejected items
        if (['APPROVED', 'REJECTED'].includes(verificationData.status)) {
          const reviewer = faker.helpers.arrayElement(this.createdData.users);
          verificationData.reviewerId = reviewer.id;
          verificationData.reviewDate = faker.date.between({ 
            from: verificationData.verificationDate, 
            to: new Date() 
          });
          verificationData.reviewNotes = faker.lorem.paragraph();
        }

        const verification = await prisma.assetVerification.create({ data: verificationData });
        this.createdData.verifications.push(verification);
      }
    }

    console.log(`   ✓ Created ${this.createdData.verifications.length} verifications\n`);
  }

  /**
   * Generate discrepancies
   */
  async generateDiscrepancies() {
    console.log('⚠️ Generating discrepancies...');

    const discrepancyCount = Math.floor(
      this.createdData.verifications.length * (SEED_CONFIG.discrepancies_percentage / 100)
    );

    const verificationsWithIssues = faker.helpers.arrayElements(
      this.createdData.verifications,
      discrepancyCount
    );

    for (const verification of verificationsWithIssues) {
      const campaign = this.createdData.campaigns.find(c => c.id === verification.campaignId);
      const asset = this.createdData.assets.find(a => a.id === verification.assetId);
      const reporter = this.createdData.users.find(u => u.id === verification.verifierId);
      const assignee = faker.helpers.arrayElement(this.createdData.users);
      
      const discrepancyType = faker.helpers.arrayElement(SAMPLE_DATA.discrepancyTypes);
      
      const discrepancyData = {
        verificationId: verification.id,
        campaignId: campaign.id,
        assetId: asset.id,
        reporterId: reporter.id,
        assigneeId: faker.datatype.boolean(0.7) ? assignee.id : null, // 70% assigned
        type: discrepancyType,
        severity: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        status: faker.helpers.arrayElement(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
        title: this.generateDiscrepancyTitle(discrepancyType),
        description: faker.lorem.paragraphs(2),
        expectedValue: this.generateExpectedValue(discrepancyType),
        actualValue: this.generateActualValue(discrepancyType),
        location: asset.location,
        coordinates: {
          lat: faker.location.latitude(),
          lng: faker.location.longitude()
        },
        photoEvidence: faker.helpers.arrayElements([
          'photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg'
        ], faker.number.int({ min: 1, max: 3 })),
        reference: `DISC-${faker.date.recent().getFullYear()}-${faker.string.numeric(6)}`,
        reportedAt: verification.verificationDate || faker.date.recent(),
      };

      // Set resolution details for resolved/closed discrepancies
      if (['RESOLVED', 'CLOSED'].includes(discrepancyData.status)) {
        const resolver = faker.helpers.arrayElement(this.createdData.users);
        discrepancyData.resolverId = resolver.id;
        discrepancyData.resolvedAt = faker.date.between({
          from: discrepancyData.reportedAt,
          to: new Date()
        });
        discrepancyData.resolutionNotes = faker.lorem.paragraph();
      }

      // Set assignment date for assigned discrepancies
      if (discrepancyData.assigneeId) {
        discrepancyData.assignedAt = faker.date.between({
          from: discrepancyData.reportedAt,
          to: discrepancyData.resolvedAt || new Date()
        });
      }

      const discrepancy = await prisma.verificationDiscrepancy.create({ data: discrepancyData });
      this.createdData.discrepancies.push(discrepancy);
    }

    console.log(`   ✓ Created ${this.createdData.discrepancies.length} discrepancies\n`);
  }

  /**
   * Helper methods
   */
  generateAssetName(categoryName) {
    const prefixes = {
      'IT Equipment': ['Dell Laptop', 'HP Desktop', 'Cisco Router', 'Canon Printer', 'iPad'],
      'Office Furniture': ['Office Chair', 'Conference Table', 'Filing Cabinet', 'Reception Desk'],
      'Vehicles': ['Toyota Camry', 'Ford Transit', 'Honda Civic', 'Nissan Patrol'],
      'Medical Equipment': ['X-Ray Machine', 'Ultrasound Scanner', 'Blood Pressure Monitor'],
      'Security Equipment': ['CCTV Camera', 'Access Control Panel', 'Metal Detector'],
    };

    const categoryPrefixes = prefixes[categoryName] || ['Generic Asset'];
    const prefix = faker.helpers.arrayElement(categoryPrefixes);
    const suffix = faker.string.alphanumeric(4).toUpperCase();
    
    return `${prefix} - ${suffix}`;
  }

  generateDiscrepancyTitle(type) {
    const titles = {
      'MISSING_ASSET': 'Asset not found at recorded location',
      'LOCATION_MISMATCH': 'Asset found at different location',
      'CONDITION_MISMATCH': 'Asset condition differs from records',
      'DATA_INCONSISTENCY': 'Asset data does not match records',
      'PHYSICAL_DAMAGE': 'Physical damage identified',
      'FUNCTIONAL_ISSUE': 'Asset functionality compromised',
      'OTHER': 'General discrepancy identified',
    };

    return titles[type] || 'Verification discrepancy';
  }

  generateExpectedValue(type) {
    const values = {
      'MISSING_ASSET': 'Asset present at location',
      'LOCATION_MISMATCH': 'Room 204, Building A',
      'CONDITION_MISMATCH': 'Good condition',
      'DATA_INCONSISTENCY': 'Model: XYZ-123',
      'PHYSICAL_DAMAGE': 'No visible damage',
      'FUNCTIONAL_ISSUE': 'Fully functional',
      'OTHER': 'As per asset records',
    };

    return values[type] || 'Expected value';
  }

  generateActualValue(type) {
    const values = {
      'MISSING_ASSET': 'Asset not found',
      'LOCATION_MISMATCH': 'Room 301, Building B', 
      'CONDITION_MISMATCH': 'Fair condition with wear',
      'DATA_INCONSISTENCY': 'Model: ABC-456',
      'PHYSICAL_DAMAGE': 'Scratches and dents visible',
      'FUNCTIONAL_ISSUE': 'Partially working',
      'OTHER': 'Differs from records',
    };

    return values[type] || 'Actual value found';
  }

  /**
   * Print generation summary
   */
  printSummary() {
    console.log('📊 SEED DATA GENERATION SUMMARY');
    console.log('=====================================');
    console.log(`Users: ${this.createdData.users.length}`);
    console.log(`States: ${this.createdData.states.length}`);
    console.log(`LGAs: ${this.createdData.lgas.length}`);
    console.log(`Categories: ${this.createdData.categories.length}`);
    console.log(`Assets: ${this.createdData.assets.length}`);
    console.log(`Templates: ${this.createdData.templates.length}`);
    console.log(`Schedules: ${this.createdData.schedules.length}`);
    console.log(`Campaigns: ${this.createdData.campaigns.length}`);
    console.log(`Assignments: ${this.createdData.assignments.length}`);
    console.log(`Verifications: ${this.createdData.verifications.length}`);
    console.log(`Discrepancies: ${this.createdData.discrepancies.length}`);
    console.log('=====================================');
    console.log('🎉 Ready for development and testing!');
  }
}

// CLI execution
async function main() {
  const generator = new SeedDataGenerator();

  try {
    await generator.generateAllData();
  } catch (error) {
    console.error('Seed generation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in other scripts
module.exports = SeedDataGenerator;

// Run if called directly
if (require.main === module) {
  main();
}