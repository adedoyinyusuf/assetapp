/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use a custom dist directory to avoid Windows EPERM on the default .next
  distDir: 'next-build',
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    domains: ['localhost'],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Add webpack configuration for better Windows compatibility
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        module: false,
        dgram: false,
        path: false,
      };
    }
    
    // Important: return the modified config
    return config;
  },
  // Handle Windows path issues
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
  // Add support for importing TypeScript files without extension
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Enable React strict mode
  reactStrictMode: true,
}

module.exports = nextConfig
