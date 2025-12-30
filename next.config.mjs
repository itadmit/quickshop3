import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable to prevent double renders in dev
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Explicitly set the tracing root so Vercel doesn't try to walk up the tree
  outputFileTracingRoot: path.join(__dirname),
  // Temporarily ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['react-icons'],
  },
  // Faster page transitions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Reduce dev recompilations
  onDemandEntries: {
    // Keep pages in memory for longer
    maxInactiveAge: 60 * 1000, // 60 seconds
    // Keep more pages in memory
    pagesBufferLength: 5,
  },
};

export default nextConfig;

