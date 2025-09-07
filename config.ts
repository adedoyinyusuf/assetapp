// Environment variables configuration
export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/asset_management',
  
  // Authentication
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // API
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

// Validate required environment variables in production
if (config.isProduction) {
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
