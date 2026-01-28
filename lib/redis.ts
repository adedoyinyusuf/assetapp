import { createClient, RedisClientType } from 'redis';

/**
 * Redis Client Configuration
 * Provides a singleton Redis client for the application
 */

let redis: RedisClientType;

declare global {
  var __redis: RedisClientType | undefined;
}

if (process.env.NODE_ENV === 'production') {
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
} else {
  if (!global.__redis) {
    global.__redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        // removed invalid lazyConnect option
      },
    });
  }
  redis = global.__redis;
}

// Handle Redis connection events
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Redis Client Connected');
});

redis.on('ready', () => {
  console.log('Redis Client Ready');
});

redis.on('end', () => {
  console.log('Redis Client Disconnected');
});

// Initialize connection if not already connected and we are in a runtime environment
const initRedis = async () => {
  if (!redis.isOpen) {
    // Skip connection attempts during build if REDIS_URL is not provided
    if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      console.warn('Skipping Redis connection: REDIS_URL not set');
      return;
    }

    try {
      await redis.connect();
    } catch (error) {
      console.warn('Redis connection failed, continuing without Redis:', error);
    }
  }
};

// Initialize Redis connection
initRedis();

export { redis };
export type { RedisClientType };