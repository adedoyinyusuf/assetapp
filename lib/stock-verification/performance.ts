import { stockVerificationConfig } from '@/lib/config/stock-verification';
import { stockVerificationLogger } from './logging';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

/**
 * Performance Optimization Utilities for Stock Verification Module
 * Includes caching, database optimization, and performance monitoring
 */

// Cache configuration
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean;
  tags?: string[];
  version?: string;
}

interface CacheEntry<T = any> {
  data: T | string;
  timestamp: number;
  ttl: number;
  compressed: boolean;
  version?: string;
  tags?: string[];
}

/**
 * Redis-based caching service with compression and tagging
 */
export class StockVerificationCache {
  private static instance: StockVerificationCache;
  private enabled: boolean;
  private defaultTTL: number;
  private keyPrefix: string = 'sv:';

  constructor() {
    this.enabled = stockVerificationConfig.performance.caching.enabled;
    this.defaultTTL = stockVerificationConfig.performance.caching.ttl;
  }

  static getInstance(): StockVerificationCache {
    if (!StockVerificationCache.instance) {
      StockVerificationCache.instance = new StockVerificationCache();
    }
    return StockVerificationCache.instance;
  }

  private generateKey(namespace: string, identifier: string): string {
    return `${this.keyPrefix}${namespace}:${identifier}`;
  }

  private compressData<T>(data: T): string {
    // Simple compression using JSON + base64
    // In production, you might want to use a proper compression library
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64');
  }

  private decompressData<T>(compressedData: string): T {
    const json = Buffer.from(compressedData, 'base64').toString();
    return JSON.parse(json) as T;
  }

  async get<T>(namespace: string, identifier: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const key = this.generateKey(namespace, identifier);
      const cached = await redis.get(key);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if entry has expired
      if (Date.now() > entry.timestamp + (entry.ttl * 1000)) {
        await this.delete(namespace, identifier);
        return null;
      }

      // Decompress if needed
      const data: T = entry.compressed ? this.decompressData<T>(entry.data as string) : (entry.data as T);
      
      await stockVerificationLogger.debug('Cache hit', {
        namespace,
        identifier,
        compressed: entry.compressed,
        age: Date.now() - entry.timestamp,
      });

      return data;
    } catch (error) {
      await stockVerificationLogger.error('Cache get failed', error as Error, {
        namespace,
        identifier,
      });
      return null;
    }
  }

  async set<T>(
    namespace: string,
    identifier: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const key = this.generateKey(namespace, identifier);
      const ttl = options.ttl || this.defaultTTL;
      const compress = options.compress || false;

      const entry: CacheEntry<T> = {
        data: compress ? this.compressData<T>(data) : data,
        timestamp: Date.now(),
        ttl,
        compressed: compress,
        version: options.version,
        tags: options.tags,
      };

      await redis.setEx(key, ttl, JSON.stringify(entry));

      // Store tags for cache invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          const tagKey = `${this.keyPrefix}tag:${tag}`;
          await redis.sAdd(tagKey, key);
          await redis.expire(tagKey, ttl);
        }
      }

      await stockVerificationLogger.debug('Cache set', {
        namespace,
        identifier,
        ttl,
        compressed: compress,
        dataSize: JSON.stringify(data).length,
      });

      return true;
    } catch (error) {
      await stockVerificationLogger.error('Cache set failed', error as Error, {
        namespace,
        identifier,
      });
      return false;
    }
  }

  async delete(namespace: string, identifier: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const key = this.generateKey(namespace, identifier);
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      await stockVerificationLogger.error('Cache delete failed', error as Error, {
        namespace,
        identifier,
      });
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (!this.enabled) {
      return 0;
    }

    try {
      const tagKey = `${this.keyPrefix}tag:${tag}`;
      const keys = await redis.sMembers(tagKey);
      
      if (keys.length === 0) {
        return 0;
      }

      const deletePromises = keys.map(key => redis.del(key));
      const results = await Promise.all(deletePromises);
      
      // Clean up the tag set
      await redis.del(tagKey);
      
      const deletedCount = results.reduce((sum, result) => sum + result, 0);
      
      await stockVerificationLogger.debug('Cache invalidated by tag', {
        tag,
        keysCount: keys.length,
        deletedCount,
      });

      return deletedCount;
    } catch (error) {
      await stockVerificationLogger.error('Cache invalidation by tag failed', error as Error, {
        tag,
      });
      return 0;
    }
  }

  async clear(namespace?: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const pattern = namespace ? `${this.keyPrefix}${namespace}:*` : `${this.keyPrefix}*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) {
        return true;
      }

      await redis.del(keys);
      
      await stockVerificationLogger.info('Cache cleared', {
        namespace,
        keysCount: keys.length,
      });

      return true;
    } catch (error) {
      await stockVerificationLogger.error('Cache clear failed', error as Error, {
        namespace,
      });
      return false;
    }
  }

  async getStats(): Promise<{
    enabled: boolean;
    keyCount: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    if (!this.enabled) {
      return {
        enabled: false,
        keyCount: 0,
        memoryUsage: '0 bytes',
      };
    }

    try {
      const keys = await redis.keys(`${this.keyPrefix}*`);
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        enabled: true,
        keyCount: keys.length,
        memoryUsage,
      };
    } catch (error) {
      return {
        enabled: true,
        keyCount: 0,
        memoryUsage: 'error',
      };
    }
  }
}

/**
 * Database Query Optimization
 */
export class DatabaseOptimizer {
  // Optimize campaign queries with proper includes and selections
  static getCampaignOptimizedQuery(id: number) {
    return prisma.verificationCampaign.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        targetAssetCount: true,
        actualAssetCount: true,
        verificationProgress: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        // Only load essential verification data
        verifications: {
          select: {
            id: true,
            status: true,
            verificationDate: true,
          },
          take: 10, // Limit for performance
          orderBy: {
            createdAt: 'desc',
          }
        },
        _count: {
          select: {
            verifications: true,
          }
        }
      }
    });
  }

  // Optimize verification list queries with pagination and filtering
  static getVerificationsOptimizedQuery(
    campaignId: number,
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      assetType?: string;
      verifierId?: number;
    } = {}
  ) {
    const offset = (page - 1) * limit;
    const where: any = { campaignId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.verifierId) {
      where.verifierId = filters.verifierId;
    }

    return prisma.assetVerification.findMany({
      where,
      select: {
        id: true,
        status: true,
        verificationDate: true,
        notes: true,
        asset: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true,
              }
            },
            lga: {
              select: {
                name: true,
                state: {
                  select: {
                    name: true,
                  }
                }
              }
            },
          }
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        photoUrls: true,
        discrepancies: {
          select: {
            id: true,
            discrepancyType: true,
            severity: true,
            status: true,
          }
        },
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  // Batch asset lookup optimization
  static async getAssetsBatch(assetIds: number[]) {
    // Use IN query instead of multiple individual queries
    return prisma.asset.findMany({
      where: {
        id: {
          in: assetIds,
        }
      },
      select: {
        id: true,
        name: true,
        purchaseValue: true,
        purchaseDate: true,
        usefulLife: true,
        salvageValue: true,
        currentValue: true,
        category: { select: { id: true, name: true } },
        lga: { select: { id: true, name: true, state: { select: { id: true, name: true } } } },
        stateId: true,
        lgaId: true,
        createdAt: true,
        updatedAt: true,
      }
    });
  }

  // Optimize dashboard statistics query
  static async getDashboardStats(campaignId?: number) {
    const where = campaignId ? { campaignId } : {};

    // Use aggregate queries for better performance
    const [
      campaignStats,
      verificationStats,
      discrepancyStats,
    ] = await Promise.all([
      prisma.verificationCampaign.aggregate({
        _count: {
          id: true,
        },
        where: campaignId ? { id: campaignId } : {},
      }),
      prisma.assetVerification.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
        where,
      }),
      prisma.verificationDiscrepancy.groupBy({
        by: ['severity', 'status'],
        _count: {
          severity: true,
        },
        where: campaignId ? {
          verification: {
            campaignId,
          }
        } : {},
      }),
    ]);

    return {
      campaigns: campaignStats._count.id,
      verifications: verificationStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as Record<string, number>),
      discrepancies: discrepancyStats.reduce((acc, stat) => {
        const key = `${stat.severity}_${stat.status}`;
        acc[key] = stat._count.severity;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

/**
 * Performance monitoring and metrics
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTiming(operation: string): () => number {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  static recordMetric(name: string, value: number): void {
    const existing = this.metrics.get(name) || [];
    existing.push(value);
    
    // Keep only last 100 measurements
    if (existing.length > 100) {
      existing.shift();
    }
    
    this.metrics.set(name, existing);
  }

  static getMetrics(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    return {
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, values] of this.metrics) {
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        result[name] = {
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    }
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Caching decorators and utilities
 */
export function withCache<T>(
  namespace: string,
  keyGenerator: (...args: any[]) => string,
  options: CacheOptions = {}
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = StockVerificationCache.getInstance();

    descriptor.value = async function(...args: any[]): Promise<T> {
      const cacheKey = keyGenerator(...args);
      
      // Try to get from cache first
      const cached = await cache.get<T>(namespace, cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      await cache.set(namespace, cacheKey, result, options);
      
      return result;
    };

    return descriptor;
  };
}

export function withPerformanceMonitoring(operationName: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const endTiming = PerformanceMonitor.startTiming(`${operationName}_${propertyName}`);
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = endTiming();
        
        // Log slow operations
        if (duration > 1000) {
          await stockVerificationLogger.warn(
            `Slow operation detected: ${operationName}_${propertyName}`,
            {
              duration,
              operation: `${operationName}_${propertyName}`,
            }
          );
        }
        
        return result;
      } catch (error) {
        endTiming();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Connection pooling and database optimization
 */
export async function optimizeDatabaseConnections(): Promise<void> {
  // Configure Prisma connection pool
  const poolSize = stockVerificationConfig.performance.database.connectionPoolSize;
  
  await stockVerificationLogger.info('Optimizing database connections', {
    poolSize,
    queryTimeout: stockVerificationConfig.performance.database.queryTimeout,
  });

  // You could add more database optimization here
  // like query plan analysis, index recommendations, etc.
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  static formatMemoryUsage(usage: NodeJS.MemoryUsage): Record<string, string> {
    return {
      heapUsed: this.formatBytes(usage.heapUsed),
      heapTotal: this.formatBytes(usage.heapTotal),
      external: this.formatBytes(usage.external),
      rss: this.formatBytes(usage.rss),
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static async monitorMemory(): Promise<void> {
    const usage = this.getMemoryUsage();
    const formatted = this.formatMemoryUsage(usage);
    
    // Log memory usage if it's high
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    if (heapUsedPercent > 80) {
      await stockVerificationLogger.warn('High memory usage detected', {
        heapUsedPercent: Math.round(heapUsedPercent),
        memoryUsage: formatted,
      });
    }

    // Record metrics
    PerformanceMonitor.recordMetric('memory_heap_used', usage.heapUsed);
    PerformanceMonitor.recordMetric('memory_heap_total', usage.heapTotal);
  }

  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      stockVerificationLogger.debug('Garbage collection forced');
    }
  }
}

// Export singleton instances
export const stockVerificationCache = StockVerificationCache.getInstance();

// Initialize performance monitoring
setInterval(() => {
  MemoryManager.monitorMemory();
}, 30000); // Monitor every 30 seconds