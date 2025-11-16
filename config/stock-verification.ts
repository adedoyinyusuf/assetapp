/**
 * Stock Verification Module Configuration
 * Centralized configuration management for the Stock Verification system
 */

export interface StockVerificationConfig {
  // Feature Flags
  features: {
    photoUpload: boolean;
    autoAssignment: boolean;
    advancedReporting: boolean;
    realTimeNotifications: boolean;
    bulkOperations: boolean;
    mobileApp: boolean;
    offlineMode: boolean;
    aiAssistedVerification: boolean;
  };

  // Campaign Settings
  campaigns: {
    maxActiveCampaigns: number;
    defaultDurationDays: number;
    maxAssetsPerCampaign: number;
    autoArchiveDays: number;
    reminderIntervalDays: number;
  };

  // File Upload Settings
  upload: {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    maxFilesPerVerification: number;
    storageProvider: 'local' | 'aws-s3' | 'cloudinary';
    compressionQuality: number;
    thumbnailSizes: { width: number; height: number }[];
  };

  // Notification Settings
  notifications: {
    enabled: boolean;
    channels: ('email' | 'sms' | 'push' | 'webhook')[];
    templates: {
      campaignAssigned: string;
      verificationReminder: string;
      discrepancyFound: string;
      campaignCompleted: string;
    };
    batchSize: number;
    retryAttempts: number;
  };

  // Security Settings
  security: {
    rateLimiting: {
      enabled: boolean;
      windowMs: number;
      maxRequests: number;
    };
    encryption: {
      algorithm: string;
      keyRotationDays: number;
    };
    audit: {
      enabled: boolean;
      retentionDays: number;
    };
  };

  // Assignment Settings
  assignment: {
    maxAssignmentBatchSize: number;
    excludeRecentlyVerified: boolean;
    excludeRecentlyVerifiedDays: number;
    autoBalancingEnabled: boolean;
    defaultWorkloadDistribution: 'even' | 'capacity' | 'geographic' | 'expertise';
    maxVerificationsPerUser: number;
    prioritizationEnabled: boolean;
  };

  // Performance Settings
  performance: {
    caching: {
      enabled: boolean;
      ttl: number;
      maxSize: number;
    };
    pagination: {
      defaultLimit: number;
      maxLimit: number;
    };
    database: {
      connectionPoolSize: number;
      queryTimeout: number;
    };
  };

  // Integration Settings
  integrations: {
    analytics: {
      provider: 'google' | 'mixpanel' | 'custom';
      trackingId?: string;
    };
    storage: {
      provider: 'local' | 'aws-s3' | 'azure' | 'gcp';
      bucket?: string;
      region?: string;
    };
    maps: {
      provider: 'google' | 'mapbox' | 'openstreetmap';
      apiKey?: string;
    };
  };
}

// Environment-based configuration
const getConfig = (): StockVerificationConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  const baseConfig: StockVerificationConfig = {
    features: {
      photoUpload: process.env.STOCK_VERIFICATION_PHOTO_UPLOAD === 'true',
      autoAssignment: process.env.STOCK_VERIFICATION_AUTO_ASSIGNMENT === 'true',
      advancedReporting: process.env.STOCK_VERIFICATION_ADVANCED_REPORTING === 'true',
      realTimeNotifications: process.env.STOCK_VERIFICATION_REAL_TIME_NOTIFICATIONS === 'true',
      bulkOperations: process.env.STOCK_VERIFICATION_BULK_OPERATIONS === 'true',
      mobileApp: process.env.STOCK_VERIFICATION_MOBILE_APP === 'true',
      offlineMode: process.env.STOCK_VERIFICATION_OFFLINE_MODE === 'true',
      aiAssistedVerification: process.env.STOCK_VERIFICATION_AI_ASSISTED === 'true',
    },

    campaigns: {
      maxActiveCampaigns: parseInt(process.env.STOCK_VERIFICATION_MAX_ACTIVE_CAMPAIGNS || '10'),
      defaultDurationDays: parseInt(process.env.STOCK_VERIFICATION_DEFAULT_DURATION_DAYS || '30'),
      maxAssetsPerCampaign: parseInt(process.env.STOCK_VERIFICATION_MAX_ASSETS_PER_CAMPAIGN || '10000'),
      autoArchiveDays: parseInt(process.env.STOCK_VERIFICATION_AUTO_ARCHIVE_DAYS || '90'),
      reminderIntervalDays: parseInt(process.env.STOCK_VERIFICATION_REMINDER_INTERVAL_DAYS || '7'),
    },

    upload: {
      maxFileSize: parseInt(process.env.STOCK_VERIFICATION_MAX_FILE_SIZE || '10485760'), // 10MB
      allowedMimeTypes: (process.env.STOCK_VERIFICATION_ALLOWED_MIME_TYPES || 
        'image/jpeg,image/png,image/webp,image/heic').split(','),
      maxFilesPerVerification: parseInt(process.env.STOCK_VERIFICATION_MAX_FILES_PER_VERIFICATION || '5'),
      storageProvider: (process.env.STOCK_VERIFICATION_STORAGE_PROVIDER || 'local') as 'local' | 'aws-s3' | 'cloudinary',
      compressionQuality: parseInt(process.env.STOCK_VERIFICATION_COMPRESSION_QUALITY || '80'),
      thumbnailSizes: [
        { width: 150, height: 150 }, // thumbnail
        { width: 400, height: 400 }, // medium
        { width: 800, height: 600 }, // large
      ],
    },

    notifications: {
      enabled: process.env.STOCK_VERIFICATION_NOTIFICATIONS_ENABLED === 'true',
      channels: (process.env.STOCK_VERIFICATION_NOTIFICATION_CHANNELS || 'email').split(',') as ('email' | 'sms' | 'push' | 'webhook')[],
      templates: {
        campaignAssigned: process.env.STOCK_VERIFICATION_TEMPLATE_CAMPAIGN_ASSIGNED || 'campaign-assigned',
        verificationReminder: process.env.STOCK_VERIFICATION_TEMPLATE_VERIFICATION_REMINDER || 'verification-reminder',
        discrepancyFound: process.env.STOCK_VERIFICATION_TEMPLATE_DISCREPANCY_FOUND || 'discrepancy-found',
        campaignCompleted: process.env.STOCK_VERIFICATION_TEMPLATE_CAMPAIGN_COMPLETED || 'campaign-completed',
      },
      batchSize: parseInt(process.env.STOCK_VERIFICATION_NOTIFICATION_BATCH_SIZE || '50'),
      retryAttempts: parseInt(process.env.STOCK_VERIFICATION_NOTIFICATION_RETRY_ATTEMPTS || '3'),
    },

    security: {
      rateLimiting: {
        enabled: process.env.STOCK_VERIFICATION_RATE_LIMITING_ENABLED === 'true',
        windowMs: parseInt(process.env.STOCK_VERIFICATION_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        maxRequests: parseInt(process.env.STOCK_VERIFICATION_RATE_LIMIT_MAX_REQUESTS || '100'),
      },
      encryption: {
        algorithm: process.env.STOCK_VERIFICATION_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
        keyRotationDays: parseInt(process.env.STOCK_VERIFICATION_KEY_ROTATION_DAYS || '90'),
      },
      audit: {
        enabled: process.env.STOCK_VERIFICATION_AUDIT_ENABLED === 'true',
        retentionDays: parseInt(process.env.STOCK_VERIFICATION_AUDIT_RETENTION_DAYS || '365'),
      },
    },

    assignment: {
      maxAssignmentBatchSize: parseInt(process.env.STOCK_VERIFICATION_MAX_ASSIGNMENT_BATCH_SIZE || '500'),
      excludeRecentlyVerified: process.env.STOCK_VERIFICATION_EXCLUDE_RECENTLY_VERIFIED === 'true',
      excludeRecentlyVerifiedDays: parseInt(process.env.STOCK_VERIFICATION_EXCLUDE_RECENTLY_VERIFIED_DAYS || '30'),
      autoBalancingEnabled: process.env.STOCK_VERIFICATION_AUTO_BALANCING_ENABLED === 'true',
      defaultWorkloadDistribution: (process.env.STOCK_VERIFICATION_DEFAULT_WORKLOAD_DISTRIBUTION || 'even') as 'even' | 'capacity' | 'geographic' | 'expertise',
      maxVerificationsPerUser: parseInt(process.env.STOCK_VERIFICATION_MAX_VERIFICATIONS_PER_USER || '100'),
      prioritizationEnabled: process.env.STOCK_VERIFICATION_PRIORITIZATION_ENABLED === 'true',
    },

    performance: {
      caching: {
        enabled: process.env.STOCK_VERIFICATION_CACHING_ENABLED === 'true',
        ttl: parseInt(process.env.STOCK_VERIFICATION_CACHE_TTL || '300'), // 5 minutes
        maxSize: parseInt(process.env.STOCK_VERIFICATION_CACHE_MAX_SIZE || '1000'),
      },
      pagination: {
        defaultLimit: parseInt(process.env.STOCK_VERIFICATION_PAGINATION_DEFAULT_LIMIT || '20'),
        maxLimit: parseInt(process.env.STOCK_VERIFICATION_PAGINATION_MAX_LIMIT || '100'),
      },
      database: {
        connectionPoolSize: parseInt(process.env.STOCK_VERIFICATION_DB_POOL_SIZE || '10'),
        queryTimeout: parseInt(process.env.STOCK_VERIFICATION_DB_QUERY_TIMEOUT || '30000'), // 30 seconds
      },
    },

    integrations: {
      analytics: {
        provider: (process.env.STOCK_VERIFICATION_ANALYTICS_PROVIDER || 'google') as 'google' | 'mixpanel' | 'custom',
        trackingId: process.env.STOCK_VERIFICATION_ANALYTICS_TRACKING_ID,
      },
      storage: {
        provider: (process.env.STOCK_VERIFICATION_STORAGE_PROVIDER || 'local') as 'local' | 'aws-s3' | 'azure' | 'gcp',
        bucket: process.env.STOCK_VERIFICATION_STORAGE_BUCKET,
        region: process.env.STOCK_VERIFICATION_STORAGE_REGION,
      },
      maps: {
        provider: (process.env.STOCK_VERIFICATION_MAPS_PROVIDER || 'google') as 'google' | 'mapbox' | 'openstreetmap',
        apiKey: process.env.STOCK_VERIFICATION_MAPS_API_KEY,
      },
    },
  };

  // Environment-specific overrides
  if (env === 'development') {
    baseConfig.features.photoUpload = true;
    baseConfig.features.autoAssignment = true;
    baseConfig.features.realTimeNotifications = false;
    baseConfig.security.rateLimiting.enabled = false;
    baseConfig.performance.caching.enabled = false;
    baseConfig.notifications.enabled = false;
    baseConfig.assignment.excludeRecentlyVerified = false;
    baseConfig.assignment.autoBalancingEnabled = true;
    baseConfig.assignment.prioritizationEnabled = true;
  }

  if (env === 'test') {
    baseConfig.features.photoUpload = false;
    baseConfig.features.autoAssignment = false;
    baseConfig.features.realTimeNotifications = false;
    baseConfig.notifications.enabled = false;
    baseConfig.security.audit.enabled = false;
    baseConfig.performance.caching.enabled = false;
    baseConfig.campaigns.maxActiveCampaigns = 5;
    baseConfig.campaigns.maxAssetsPerCampaign = 100;
  }

  if (env === 'production') {
    baseConfig.features.photoUpload = true;
    baseConfig.features.autoAssignment = true;
    baseConfig.features.advancedReporting = true;
    baseConfig.features.realTimeNotifications = true;
    baseConfig.security.rateLimiting.enabled = true;
    baseConfig.security.audit.enabled = true;
    baseConfig.performance.caching.enabled = true;
    baseConfig.notifications.enabled = true;
  }

  return baseConfig;
};

export const stockVerificationConfig = getConfig();

// Configuration validation
export const validateConfig = (config: StockVerificationConfig): string[] => {
  const errors: string[] = [];

  // Validate required environment variables for production
  if (process.env.NODE_ENV === 'production') {
    if (config.integrations.storage.provider !== 'local' && !config.integrations.storage.bucket) {
      errors.push('Storage bucket is required for non-local storage providers in production');
    }
    
    if (config.features.realTimeNotifications && !process.env.PUSHER_APP_KEY) {
      errors.push('Pusher configuration is required for real-time notifications');
    }
    
    if (config.notifications.enabled && config.notifications.channels.includes('email') && !process.env.SMTP_HOST) {
      errors.push('SMTP configuration is required for email notifications');
    }
  }

  // Validate numeric ranges
  if (config.campaigns.maxActiveCampaigns < 1) {
    errors.push('Max active campaigns must be at least 1');
  }

  if (config.upload.maxFileSize < 1024) {
    errors.push('Max file size must be at least 1KB');
  }

  if (config.performance.pagination.defaultLimit > config.performance.pagination.maxLimit) {
    errors.push('Default pagination limit cannot exceed max limit');
  }

  return errors;
};

// Helper functions
export const isFeatureEnabled = (feature: keyof StockVerificationConfig['features']): boolean => {
  return stockVerificationConfig.features[feature];
};

export const getCacheKey = (prefix: string, ...parts: string[]): string => {
  return `stock_verification:${prefix}:${parts.join(':')}`;
};

export const getUploadPath = (type: 'verification' | 'campaign' | 'temp', id: string): string => {
  return `stock-verification/${type}/${id}`;
};