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
    ignoreBuildErrors: false, // Enable type checking in builds
  },
  
  // Configure ESLint
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint in builds
  },
  
  // Configure directory for Next.js build output
  distDir: 'next-build',
  
  // Enable file system routing
  useFileSystemPublicRoutes: true,
  
  // Disable trailing slashes
  trailingSlash: false,
  
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // Webpack configuration
  webpack(config, { isServer }) {
    // Fixes npm packages that depend on `node:` protocol
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      dgram: false,
      crypto: false,
      http2: false,
      process: false,
      path: false,
      zlib: false,
      bcrypt: false,
    };

    // Exclude bcrypt from client-side builds
    if (!isServer) {
      config.resolve.fallback.bcrypt = false;
      config.externals = [...(config.externals || []), 'bcryptjs'];
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Transpile bcryptjs
  transpilePackages: ['bcryptjs'],
};

export default nextConfig;
