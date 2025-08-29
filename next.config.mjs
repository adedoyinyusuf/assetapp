/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure output
  output: 'standalone',
  
  // Configure images
  images: {
    unoptimized: true,
    domains: ['localhost', '127.0.0.1'],
  },
  
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Configure TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure directory for Next.js build output
  distDir: 'next-build',
  
  // Configure ESLint
  eslint: {
    // Don't fail build on ESLint errors
    ignoreDuringBuilds: true,
  },
  
  // Enable file system routing
  useFileSystemPublicRoutes: true,
  
  // Disable trailing slashes
  trailingSlash: false,
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Use default .next directory for development
  // distDir: 'next-build',
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        dgram: false,
        module: false,
      };
    }
    
    return config;
  },
  
  // Configure headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
