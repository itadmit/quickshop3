/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Disable output file tracing for Vercel deployment
  // This is a workaround for Next.js 15 deployment issues
  output: 'standalone',
};

export default nextConfig;

