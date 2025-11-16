/**
 * Database Management Utilities
 * Stock Verification Module
 * Version: 1.0.0
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

class DatabaseUtils {
  constructor() {
    this.logFile = path.join(__dirname, 'db-utils.log');
  }

  /**
   * Log messages to console and file
   */
  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    
    try {
      await fs.appendFile(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  /**
   * Get database connection status
   */
  async getConnectionStatus() {
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      return {
        status: 'connected',
        database: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get database schema information
   */
  async getSchemaInfo() {
    try {
      // Get all tables
      const tables = await prisma.$queryRaw`
        SELECT table_name, table_schema 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%verification%' OR table_name LIKE '%Verification%'
        ORDER BY table_name;
      `;

      // Get table counts
      const tableCounts = {};
      for (const table of tables) {
        try {
          const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
          tableCounts[table.table_name] = parseInt(result[0].count);
        } catch (error) {
          tableCounts[table.table_name] = 'Error: ' + error.message;
        }
      }

      // Get indexes
      const indexes = await prisma.$queryRaw`
        SELECT schemaname, tablename, indexname, indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND (tablename LIKE '%verification%' OR tablename LIKE '%Verification%')
        ORDER BY tablename, indexname;
      `;

      return {
        tables: tables.length,
        tableDetails: tables,
        tableCounts,
        indexes: indexes.length,
        indexDetails: indexes,
      };
    } catch (error) {
      throw new Error(`Failed to get schema info: ${error.message}`);
    }
  }

  /**
   * Backup verification data
   */
  async backupVerificationData(outputPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(outputPath || process.cwd(), `verification-backup-${timestamp}.json`);

    await this.log(`Starting backup to: ${backupFile}`);

    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {},
      };

      // Backup verification data in order
      const tables = [
        'verificationTemplate',
        'verificationSchedule', 
        'verificationCampaign',
        'verificationAssignment',
        'assetVerification',
        'verificationDiscrepancy',
        'verificationAnalytics',
      ];

      for (const tableName of tables) {
        try {
          await this.log(`Backing up table: ${tableName}`);
          backupData.data[tableName] = await prisma[tableName].findMany();
          await this.log(`  ✓ Backed up ${backupData.data[tableName].length} records from ${tableName}`);
        } catch (error) {
          await this.log(`  ✗ Failed to backup ${tableName}: ${error.message}`, 'ERROR');
          backupData.data[tableName] = { error: error.message };
        }
      }

      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      await this.log(`Backup completed successfully: ${backupFile}`);
      
      return {
        success: true,
        file: backupFile,
        tables: Object.keys(backupData.data).length,
        totalRecords: Object.values(backupData.data).reduce((sum, table) => {
          return sum + (Array.isArray(table) ? table.length : 0);
        }, 0),
      };

    } catch (error) {
      await this.log(`Backup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Restore verification data from backup
   */
  async restoreVerificationData(backupFile) {
    await this.log(`Starting restore from: ${backupFile}`);

    try {
      const backupContent = await fs.readFile(backupFile, 'utf8');
      const backupData = JSON.parse(backupContent);

      if (!backupData.data) {
        throw new Error('Invalid backup file format');
      }

      await this.log('Clearing existing verification data...');
      
      // Clear tables in reverse dependency order
      const clearOrder = [
        'verificationAnalytics',
        'verificationDiscrepancy',
        'assetVerification',
        'verificationAssignment',
        'verificationSchedule',
        'verificationCampaign',
        'verificationTemplate',
      ];

      for (const tableName of clearOrder) {
        try {
          await prisma[tableName].deleteMany({});
          await this.log(`  ✓ Cleared ${tableName}`);
        } catch (error) {
          await this.log(`  ✗ Failed to clear ${tableName}: ${error.message}`, 'ERROR');
        }
      }

      // Restore data in dependency order
      const restoreOrder = [
        'verificationTemplate',
        'verificationSchedule',
        'verificationCampaign', 
        'verificationAssignment',
        'assetVerification',
        'verificationDiscrepancy',
        'verificationAnalytics',
      ];

      const results = {};

      for (const tableName of restoreOrder) {
        const tableData = backupData.data[tableName];
        
        if (!Array.isArray(tableData)) {
          await this.log(`  ! Skipping ${tableName} (no data or error)`);
          continue;
        }

        try {
          await this.log(`Restoring table: ${tableName} (${tableData.length} records)`);
          
          for (const record of tableData) {
            await prisma[tableName].create({ data: record });
          }
          
          results[tableName] = tableData.length;
          await this.log(`  ✓ Restored ${tableData.length} records to ${tableName}`);
        } catch (error) {
          await this.log(`  ✗ Failed to restore ${tableName}: ${error.message}`, 'ERROR');
          results[tableName] = { error: error.message };
        }
      }

      await this.log('Restore completed successfully');
      
      return {
        success: true,
        results,
        totalRestored: Object.values(results).reduce((sum, count) => {
          return sum + (typeof count === 'number' ? count : 0);
        }, 0),
      };

    } catch (error) {
      await this.log(`Restore failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Clean up orphaned records
   */
  async cleanupOrphanedRecords() {
    await this.log('Starting cleanup of orphaned records...');

    const cleanupResults = {
      discrepancies: 0,
      verifications: 0,
      assignments: 0,
      photos: 0,
      analytics: 0,
    };

    try {
      // Clean up discrepancies with missing verifications
      const orphanedDiscrepancies = await prisma.verificationDiscrepancy.findMany({
        where: {
          verification: null,
        },
      });
      
      if (orphanedDiscrepancies.length > 0) {
        await prisma.verificationDiscrepancy.deleteMany({
          where: {
            id: { in: orphanedDiscrepancies.map(d => d.id) },
          },
        });
        cleanupResults.discrepancies = orphanedDiscrepancies.length;
        await this.log(`  ✓ Cleaned up ${orphanedDiscrepancies.length} orphaned discrepancies`);
      }

      // Clean up verifications with missing campaigns
      const orphanedVerifications = await prisma.assetVerification.findMany({
        where: {
          campaign: null,
        },
      });
      
      if (orphanedVerifications.length > 0) {
        await prisma.assetVerification.deleteMany({
          where: {
            id: { in: orphanedVerifications.map(v => v.id) },
          },
        });
        cleanupResults.verifications = orphanedVerifications.length;
        await this.log(`  ✓ Cleaned up ${orphanedVerifications.length} orphaned verifications`);
      }

      // Clean up assignments with missing campaigns
      const orphanedAssignments = await prisma.verificationAssignment.findMany({
        where: {
          campaign: null,
        },
      });
      
      if (orphanedAssignments.length > 0) {
        await prisma.verificationAssignment.deleteMany({
          where: {
            id: { in: orphanedAssignments.map(a => a.id) },
          },
        });
        cleanupResults.assignments = orphanedAssignments.length;
        await this.log(`  ✓ Cleaned up ${orphanedAssignments.length} orphaned assignments`);
      }

      // Clean up photos with missing verifications
+      // Photo cleanup skipped: photos are stored as filenames in AssetVerification.photoUrls
+      await this.log('  ⓘ Photo cleanup skipped (using AssetVerification.photoUrls)');

      // Clean up analytics with missing campaigns
      const orphanedAnalytics = await prisma.verificationAnalytics.findMany({
        where: {
          campaign: null,
        },
      });
      
      if (orphanedAnalytics.length > 0) {
        await prisma.verificationAnalytics.deleteMany({
          where: {
            id: { in: orphanedAnalytics.map(a => a.id) },
          },
        });
        cleanupResults.analytics = orphanedAnalytics.length;
        await this.log(`  ✓ Cleaned up ${orphanedAnalytics.length} orphaned analytics`);
      }

      const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);
      await this.log(`Cleanup completed. Total records removed: ${totalCleaned}`);

      return {
        success: true,
        cleanupResults,
        totalCleaned,
      };

    } catch (error) {
      await this.log(`Cleanup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Reset verification module data
   */
  async resetVerificationData() {
    await this.log('Starting verification data reset...');

    try {
      const tables = [
        'verificationAnalytics',
        'verificationDiscrepancy',
        'assetVerification',
        'verificationAssignment',
        'verificationSchedule',
        'verificationCampaign',
        'verificationTemplate',
      ];

      const deleteCounts = {};

      for (const tableName of tables) {
        try {
          const count = await prisma[tableName].count();
          await prisma[tableName].deleteMany({});
          deleteCounts[tableName] = count;
          await this.log(`  ✓ Deleted ${count} records from ${tableName}`);
        } catch (error) {
          await this.log(`  ✗ Failed to delete from ${tableName}: ${error.message}`, 'ERROR');
          deleteCounts[tableName] = { error: error.message };
        }
      }

      const totalDeleted = Object.values(deleteCounts).reduce((sum, count) => {
        return sum + (typeof count === 'number' ? count : 0);
      }, 0);

      await this.log(`Reset completed. Total records deleted: ${totalDeleted}`);

      return {
        success: true,
        deleteCounts,
        totalDeleted,
      };

    } catch (error) {
      await this.log(`Reset failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Get verification data statistics
   */
  async getVerificationStats() {
    try {
      const stats = {
        campaigns: {
          total: await prisma.verificationCampaign.count(),
          active: await prisma.verificationCampaign.count({ where: { status: 'ACTIVE' } }),
          completed: await prisma.verificationCampaign.count({ where: { status: 'COMPLETED' } }),
          draft: await prisma.verificationCampaign.count({ where: { status: 'DRAFT' } }),
        },
        verifications: {
          total: await prisma.assetVerification.count(),
          pending: await prisma.assetVerification.count({ where: { status: 'PENDING' } }),
          verified: await prisma.assetVerification.count({ where: { status: 'VERIFIED' } }),
          approved: await prisma.assetVerification.count({ where: { status: 'APPROVED' } }),
          rejected: await prisma.assetVerification.count({ where: { status: 'REJECTED' } }),
        },
        discrepancies: {
          total: await prisma.verificationDiscrepancy.count(),
          open: await prisma.verificationDiscrepancy.count({ where: { status: 'OPEN' } }),
          inProgress: await prisma.verificationDiscrepancy.count({ where: { status: 'IN_PROGRESS' } }),
          resolved: await prisma.verificationDiscrepancy.count({ where: { status: 'RESOLVED' } }),
          closed: await prisma.verificationDiscrepancy.count({ where: { status: 'CLOSED' } }),
        },
        assignments: {
          total: await prisma.verificationAssignment.count(),
          active: await prisma.verificationAssignment.count({ where: { status: 'ACTIVE' } }),
          completed: await prisma.verificationAssignment.count({ where: { status: 'COMPLETED' } }),
        },
        templates: {
          total: await prisma.verificationTemplate.count(),
          active: await prisma.verificationTemplate.count({ where: { isActive: true } }),
        },
        schedules: {
          total: await prisma.verificationSchedule.count(),
          active: await prisma.verificationSchedule.count({ where: { isActive: true } }),
        },
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity() {
    await this.log('Starting data integrity validation...');

    const issues = [];

    try {
      // Check for verifications without campaigns
      const verificationsWithoutCampaigns = await prisma.assetVerification.count({
        where: {
          campaign: null,
        },
      });
      if (verificationsWithoutCampaigns > 0) {
        issues.push(`${verificationsWithoutCampaigns} verifications have missing campaigns`);
      }

      // Check for discrepancies without verifications
      const discrepanciesWithoutVerifications = await prisma.verificationDiscrepancy.count({
        where: {
          verification: null,
        },
      });
      if (discrepanciesWithoutVerifications > 0) {
        issues.push(`${discrepanciesWithoutVerifications} discrepancies have missing verifications`);
      }

      // Check for assignments without campaigns
      const assignmentsWithoutCampaigns = await prisma.verificationAssignment.count({
        where: {
          campaign: null,
        },
      });
      if (assignmentsWithoutCampaigns > 0) {
        issues.push(`${assignmentsWithoutCampaigns} assignments have missing campaigns`);
      }

      // Check for photos without verifications
+      // Photo integrity check skipped: photos tracked via AssetVerification.photoUrls
+      await this.log('  ⓘ Photo integrity check skipped (using AssetVerification.photoUrls)');

      await this.log(`Data integrity validation completed. Found ${issues.length} issues.`);
      
      if (issues.length > 0) {
        issues.forEach(issue => this.log(`  ! ${issue}`, 'WARNING'));
      }

      return {
        valid: issues.length === 0,
        issues,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      await this.log(`Validation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const dbUtils = new DatabaseUtils();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'status':
        const status = await dbUtils.getConnectionStatus();
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'schema':
        const schema = await dbUtils.getSchemaInfo();
        console.log(JSON.stringify(schema, null, 2));
        break;

      case 'backup':
        const outputPath = args[0];
        const backupResult = await dbUtils.backupVerificationData(outputPath);
        console.log(JSON.stringify(backupResult, null, 2));
        break;

      case 'restore':
        const backupFile = args[0];
        if (!backupFile) {
          throw new Error('Backup file path is required');
        }
        const restoreResult = await dbUtils.restoreVerificationData(backupFile);
        console.log(JSON.stringify(restoreResult, null, 2));
        break;

      case 'cleanup':
        const cleanupResult = await dbUtils.cleanupOrphanedRecords();
        console.log(JSON.stringify(cleanupResult, null, 2));
        break;

      case 'reset':
        const resetResult = await dbUtils.resetVerificationData();
        console.log(JSON.stringify(resetResult, null, 2));
        break;

      case 'stats':
        const stats = await dbUtils.getVerificationStats();
        console.log(JSON.stringify(stats, null, 2));
        break;

      case 'validate':
        const validation = await dbUtils.validateDataIntegrity();
        console.log(JSON.stringify(validation, null, 2));
        break;

      case 'help':
      default:
        console.log(`
Database Utilities for Stock Verification Module

Usage: node db-utils.js <command> [args]

Commands:
  status                    Check database connection status
  schema                    Get verification schema information
  backup [output-path]      Backup verification data to JSON file
  restore <backup-file>     Restore verification data from backup
  cleanup                   Remove orphaned records
  reset                     Reset all verification data (DESTRUCTIVE)
  stats                     Show verification data statistics
  validate                  Validate data integrity
  help                      Show this help message

Examples:
  node db-utils.js status
  node db-utils.js backup ./backups
  node db-utils.js restore ./backups/backup-file.json
  node db-utils.js stats
        `);
        break;
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await dbUtils.cleanup();
  }
}

module.exports = DatabaseUtils;

if (require.main === module) {
  main();
}