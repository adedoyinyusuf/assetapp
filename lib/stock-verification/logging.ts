

/**
 * Stock Verification Module Logging System
 * Provides structured logging with context, correlation IDs, and performance tracking
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string | number;
  sessionId?: string | number;
  requestId?: string | number;
  correlationId?: string | number;
  campaignId?: string | number;
  assetId?: string | number;
  verificationId?: string | number;
  discrepancyId?: string | number;
  module?: string;
  action?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  module: 'stock-verification';
  environment: string;
  version: string;
  performance?: {
    duration?: number;
    memoryUsage?: NodeJS.MemoryUsage;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class StockVerificationLogger {
  private static instance: StockVerificationLogger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableFile: boolean;
  private enableExternal: boolean;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.enableConsole = process.env.NODE_ENV !== 'production';
    this.enableFile = true;
    this.enableExternal = process.env.NODE_ENV === 'production';
  }

  static getInstance(): StockVerificationLogger {
    if (!StockVerificationLogger.instance) {
      StockVerificationLogger.instance = new StockVerificationLogger();
    }
    return StockVerificationLogger.instance;
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error,
    performance?: { duration?: number }
  ): LogEntry {
    const normalizedContext = this.normalizeContext({ module: 'stock-verification', ...context });
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: normalizedContext,
      module: 'stock-verification',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
    };

    if (performance) {
      entry.performance = {
        duration: performance.duration,
        memoryUsage: process.memoryUsage(),
      };
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private normalizeContext(context: LogContext = {}): LogContext {
    const normalize = (v: string | number | undefined) => (v === undefined ? undefined : String(v));
    return {
      ...context,
      userId: normalize(context.userId),
      sessionId: normalize(context.sessionId),
      requestId: normalize(context.requestId),
      correlationId: normalize(context.correlationId),
      campaignId: normalize(context.campaignId),
      assetId: normalize(context.assetId),
      verificationId: normalize(context.verificationId),
      discrepancyId: normalize(context.discrepancyId),
    };
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const promises: Promise<void>[] = [];

    // Console output
    if (this.enableConsole) {
      promises.push(this.writeToConsole(entry));
    }

    // File output
    if (this.enableFile) {
      promises.push(this.writeToFile(entry));
    }

    // External logging services
    if (this.enableExternal) {
      promises.push(this.writeToExternal(entry));
    }

    await Promise.allSettled(promises);
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelColors = ['\x1b[37m', '\x1b[36m', '\x1b[33m', '\x1b[31m', '\x1b[35m'];
    const resetColor = '\x1b[0m';

    const color = levelColors[entry.level] || '';
    const levelName = levelNames[entry.level] || 'UNKNOWN';

    const logOutput = `${color}[${entry.timestamp}] [${levelName}] [${entry.context.module}] ${entry.message}${resetColor}`;

    console.log(logOutput);

    if (entry.context && Object.keys(entry.context).length > 1) {
      console.log('  Context:', JSON.stringify(entry.context, null, 2));
    }

    if (entry.error) {
      console.error('  Error:', entry.error);
    }

    if (entry.performance) {
      console.log('  Performance:', entry.performance);
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      const logFile = path.join(logsDir, 'stock-verification.log');
      const logLine = JSON.stringify(entry) + '\n';

      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  private async writeToExternal(entry: LogEntry): Promise<void> {
    try {
      // Send to external logging service (e.g., Datadog, Sentry, etc.)
      // This is a placeholder for actual external logging integration

      if (process.env.DATADOG_API_KEY) {
        // Send to Datadog
        await this.sendToDatadog(entry);
      }

      if (process.env.SENTRY_DSN && entry.level >= LogLevel.ERROR) {
        // Send errors to Sentry
        await this.sendToSentry(entry);
      }

    } catch (error) {
      console.error('Failed to write log to external service:', error);
    }
  }

  private async sendToDatadog(entry: LogEntry): Promise<void> {
    // Placeholder for Datadog integration
    // In a real implementation, you would use the Datadog SDK
    console.debug('Would send to Datadog:', entry);
  }

  private async sendToSentry(entry: LogEntry): Promise<void> {
    // Placeholder for Sentry integration
    // In a real implementation, you would use the Sentry SDK
    console.debug('Would send to Sentry:', entry);
  }

  // Public logging methods
  async debug(message: string, context?: LogContext): Promise<void> {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    await this.writeLog(entry);
  }

  async info(message: string, context?: LogContext): Promise<void> {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    await this.writeLog(entry);
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    await this.writeLog(entry);
  }

  async error(message: string, error?: Error, context?: LogContext): Promise<void> {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    await this.writeLog(entry);
  }

  async fatal(message: string, error?: Error, context?: LogContext): Promise<void> {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
    await this.writeLog(entry);
  }

  // Performance tracking
  async logPerformance(
    message: string,
    duration: number,
    context?: LogContext
  ): Promise<void> {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.createLogEntry(
      LogLevel.INFO,
      message,
      context,
      undefined,
      { duration }
    );
    await this.writeLog(entry);
  }

  // Business event logging
  async logBusinessEvent(
    event: string,
    data: Record<string, any>,
    context?: LogContext
  ): Promise<void> {
    const enrichedContext = {
      ...context,
      action: event,
      metadata: data,
    };

    await this.info(`Business Event: ${event}`, enrichedContext);
  }

  // Security event logging
  async logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): Promise<void> {
    const level = severity === 'critical' ? LogLevel.FATAL :
      severity === 'high' ? LogLevel.ERROR :
        severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    const enrichedContext = {
      ...context,
      action: 'security_event',
      metadata: { event, severity },
    };

    const entry = this.createLogEntry(level, `Security Event: ${event}`, enrichedContext);
    await this.writeLog(entry);
  }

  // Audit logging
  async logAudit(
    action: string,
    resourceType: string,
    resourceId: string,
    userId: string,
    changes?: Record<string, any>,
    context?: LogContext
  ): Promise<void> {
    const auditContext = {
      ...context,
      userId,
      action: `audit_${action}`,
      metadata: {
        resourceType,
        resourceId,
        changes,
        timestamp: new Date().toISOString(),
      },
    };

    await this.info(`Audit: ${action} ${resourceType}:${resourceId}`, auditContext);
  }
}

// Performance measurement decorator
export function logPerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;
  const logger = StockVerificationLogger.getInstance();

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const context: LogContext = {
      module: 'stock-verification',
      action: `${target.constructor.name}.${propertyName}`,
    };

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;

      await logger.logPerformance(
        `Method ${propertyName} completed`,
        duration,
        context
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await logger.error(
        `Method ${propertyName} failed`,
        error as Error,
        { ...context, performance: { duration } }
      );

      throw error;
    }
  };

  return descriptor;
}

// Utility functions
export const createCorrelationId = (): string => {
  return `sv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Export singleton instance
export const stockVerificationLogger = StockVerificationLogger.getInstance();

// Structured logging for specific Stock Verification events
export class StockVerificationEventLogger {
  private logger = stockVerificationLogger;

  async campaignCreated(campaignId: string, userId: string, data: any): Promise<void> {
    await this.logger.logBusinessEvent('campaign_created', data, {
      campaignId,
      userId,
      action: 'create_campaign'
    });
  }

  async campaignStarted(campaignId: string, userId: string): Promise<void> {
    await this.logger.logBusinessEvent('campaign_started', {}, {
      campaignId,
      userId,
      action: 'start_campaign'
    });
  }

  async verificationCompleted(verificationId: string, assetId: string, userId: string, result: any): Promise<void> {
    await this.logger.logBusinessEvent('verification_completed', result, {
      verificationId,
      assetId,
      userId,
      action: 'complete_verification'
    });
  }

  async discrepancyFound(discrepancyId: string, verificationId: string, assetId: string, severity: string): Promise<void> {
    await this.logger.logBusinessEvent('discrepancy_found', { severity }, {
      discrepancyId,
      verificationId,
      assetId,
      action: 'create_discrepancy'
    });
  }

  async photoUploaded(verificationId: string, assetId: string, userId: string, metadata: any): Promise<void> {
    await this.logger.logBusinessEvent('photo_uploaded', metadata, {
      verificationId,
      assetId,
      userId,
      action: 'upload_photo'
    });
  }
}

export const stockVerificationEventLogger = new StockVerificationEventLogger();