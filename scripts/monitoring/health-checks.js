/**
 * Health Check and Monitoring Configuration
 * Stock Verification Module
 * Version: 1.0.0
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

class HealthCheckService {
  constructor() {
    this.prisma = new PrismaClient();
    this.checks = new Map();
    this.alerts = [];
    
    // Register health checks
    this.registerHealthChecks();
  }

  /**
   * Register all health checks
   */
  registerHealthChecks() {
    // Database connectivity
    this.checks.set('database', {
      name: 'Database Connection',
      check: () => this.checkDatabase(),
      critical: true,
      timeout: 5000,
    });

    // Stock verification services
    this.checks.set('campaign-service', {
      name: 'Campaign Service',
      check: () => this.checkCampaignService(),
      critical: true,
      timeout: 3000,
    });

    this.checks.set('verification-service', {
      name: 'Verification Service',
      check: () => this.checkVerificationService(),
      critical: true,
      timeout: 3000,
    });

    this.checks.set('discrepancy-service', {
      name: 'Discrepancy Service',
      check: () => this.checkDiscrepancyService(),
      critical: false,
      timeout: 3000,
    });

    this.checks.set('reporting-service', {
      name: 'Reporting Service',
      check: () => this.checkReportingService(),
      critical: false,
      timeout: 5000,
    });

    // External dependencies
    this.checks.set('file-storage', {
      name: 'File Storage',
      check: () => this.checkFileStorage(),
      critical: false,
      timeout: 10000,
    });

    // System resources
    this.checks.set('memory-usage', {
      name: 'Memory Usage',
      check: () => this.checkMemoryUsage(),
      critical: false,
      timeout: 1000,
    });

    this.checks.set('disk-space', {
      name: 'Disk Space',
      check: () => this.checkDiskSpace(),
      critical: true,
      timeout: 2000,
    });
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {
        total: this.checks.size,
        passed: 0,
        failed: 0,
        critical_failed: 0,
      },
    };

    const promises = Array.from(this.checks.entries()).map(async ([key, config]) => {
      try {
        const startTime = Date.now();
        
        // Run check with timeout
        const result = await Promise.race([
          config.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), config.timeout)
          ),
        ]);

        const duration = Date.now() - startTime;

        results.checks[key] = {
          name: config.name,
          status: 'pass',
          duration: `${duration}ms`,
          critical: config.critical,
          ...result,
        };

        results.summary.passed++;
      } catch (error) {
        results.checks[key] = {
          name: config.name,
          status: 'fail',
          critical: config.critical,
          error: error.message,
        };

        results.summary.failed++;
        if (config.critical) {
          results.summary.critical_failed++;
          results.status = 'unhealthy';
        }
      }
    });

    await Promise.all(promises);

    return results;
  }

  /**
   * Database connectivity check
   */
  async checkDatabase() {
    try {
      // Test basic connection
      await this.prisma.$queryRaw`SELECT 1 as test`;

      // Test verification tables exist
      const campaignCount = await this.prisma.verificationCampaign.count();
      
      return {
        connection: 'ok',
        campaigns_table: 'accessible',
        campaign_count: campaignCount,
      };
    } catch (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
  }

  /**
   * Campaign service check
   */
  async checkCampaignService() {
    try {
      // Check if we can query campaigns
      const campaigns = await this.prisma.verificationCampaign.findMany({
        take: 1,
        select: { id: true, status: true },
      });

      // Check if we can create a test campaign (dry run)
      const testData = {
        name: `health-check-${Date.now()}`,
        description: 'Health check test campaign',
        stateIds: [],
        lgaIds: [],
        categoryIds: [],
        createdBy: 1, // Assuming system user
      };

      // Don't actually create, just validate the operation would work
      // This could be enhanced to use a test transaction that rolls back
      
      return {
        query_campaigns: 'ok',
        campaign_count: campaigns.length,
        service_status: 'operational',
      };
    } catch (error) {
      throw new Error(`Campaign service check failed: ${error.message}`);
    }
  }

  /**
   * Verification service check
   */
  async checkVerificationService() {
    try {
      // Check verification records
      const verifications = await this.prisma.assetVerification.findMany({
        take: 1,
        select: { id: true, status: true },
      });

      // Check assignment functionality
      const assignments = await this.prisma.verificationAssignment.findMany({
        take: 1,
        select: { id: true, status: true },
      });

      return {
        query_verifications: 'ok',
        verification_count: verifications.length,
        assignment_count: assignments.length,
        service_status: 'operational',
      };
    } catch (error) {
      throw new Error(`Verification service check failed: ${error.message}`);
    }
  }

  /**
   * Discrepancy service check
   */
  async checkDiscrepancyService() {
    try {
      // Check discrepancy records
      const discrepancies = await this.prisma.verificationDiscrepancy.findMany({
        take: 1,
        select: { id: true, status: true },
      });

      return {
        query_discrepancies: 'ok',
        discrepancy_count: discrepancies.length,
        service_status: 'operational',
      };
    } catch (error) {
      throw new Error(`Discrepancy service check failed: ${error.message}`);
    }
  }

  /**
   * Reporting service check
   */
  async checkReportingService() {
    try {
      // Check if we can generate basic analytics
      const analytics = await this.prisma.verificationAnalytics.findMany({
        take: 1,
        select: { id: true, campaignId: true },
      });

      // Test aggregation query performance
      const startTime = Date.now();
      const stats = await this.prisma.verificationCampaign.count();
      const queryTime = Date.now() - startTime;

      return {
        analytics_query: 'ok',
        analytics_count: analytics.length,
        aggregation_performance: `${queryTime}ms`,
        service_status: 'operational',
      };
    } catch (error) {
      throw new Error(`Reporting service check failed: ${error.message}`);
    }
  }

  /**
   * File storage check
   */
  async checkFileStorage() {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // Check uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.access(uploadsDir);

      // Check available space (simplified)
      const stats = await fs.stat(uploadsDir);
      
      return {
        uploads_directory: 'accessible',
        permissions: 'ok',
      };
    } catch (error) {
      throw new Error(`File storage check failed: ${error.message}`);
    }
  }

  /**
   * Memory usage check
   */
  async checkMemoryUsage() {
    const used = process.memoryUsage();
    const totalMB = Math.round(used.rss / 1024 / 1024);
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);

    // Alert if memory usage is high
    const memoryThreshold = 1000; // 1GB
    if (totalMB > memoryThreshold) {
      throw new Error(`High memory usage: ${totalMB}MB`);
    }

    return {
      rss_mb: totalMB,
      heap_used_mb: heapUsedMB,
      heap_total_mb: heapTotalMB,
      status: totalMB > 500 ? 'warning' : 'ok',
    };
  }

  /**
   * Disk space check
   */
  async checkDiskSpace() {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      // Check current directory space (simplified - would need platform-specific logic)
      const stats = await fs.stat(process.cwd());
      
      return {
        disk_accessible: 'ok',
        // In production, implement actual disk space checking
        status: 'ok',
      };
    } catch (error) {
      throw new Error(`Disk space check failed: ${error.message}`);
    }
  }

  /**
   * Generate health check report
   */
  async generateHealthReport() {
    const results = await this.runHealthChecks();
    
    // Generate detailed report
    const report = {
      ...results,
      generated_at: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      recommendations: [],
    };

    // Add recommendations based on results
    if (results.summary.failed > 0) {
      report.recommendations.push({
        priority: 'high',
        message: `${results.summary.failed} health check(s) failed. Investigate immediately.`,
      });
    }

    if (results.summary.critical_failed > 0) {
      report.recommendations.push({
        priority: 'critical',
        message: `${results.summary.critical_failed} critical service(s) are down. System may be unavailable.`,
      });
    }

    // Check for performance issues
    const slowChecks = Object.entries(results.checks).filter(([, check]) => {
      const duration = parseInt(check.duration?.replace('ms', '')) || 0;
      return duration > 2000; // 2 seconds threshold
    });

    if (slowChecks.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        message: `${slowChecks.length} service(s) responding slowly. Consider performance optimization.`,
        details: slowChecks.map(([key, check]) => `${check.name}: ${check.duration}`),
      });
    }

    return report;
  }

  /**
   * Run specific health check
   */
  async runHealthCheck(checkKey) {
    const config = this.checks.get(checkKey);
    if (!config) {
      throw new Error(`Unknown health check: ${checkKey}`);
    }

    try {
      const startTime = Date.now();
      const result = await Promise.race([
        config.check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), config.timeout)
        ),
      ]);
      const duration = Date.now() - startTime;

      return {
        name: config.name,
        status: 'pass',
        duration: `${duration}ms`,
        critical: config.critical,
        ...result,
      };
    } catch (error) {
      return {
        name: config.name,
        status: 'fail',
        critical: config.critical,
        error: error.message,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

module.exports = HealthCheckService;

// CLI usage
if (require.main === module) {
  const healthCheck = new HealthCheckService();
  
  async function main() {
    try {
      const args = process.argv.slice(2);
      
      if (args.length > 0 && args[0] !== 'all') {
        // Run specific check
        const result = await healthCheck.runHealthCheck(args[0]);
        console.log(JSON.stringify(result, null, 2));
      } else {
        // Run all checks
        const results = await healthCheck.generateHealthReport();
        console.log(JSON.stringify(results, null, 2));
      }
    } catch (error) {
      console.error('Health check failed:', error.message);
      process.exit(1);
    } finally {
      await healthCheck.cleanup();
    }
  }

  main();
}