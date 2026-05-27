/** @type {import('next').NextConfig} */
const isNetlify = process.env.NETLIFY === 'true';
const CLOUD_RUN_URL = 'https://mededuai-backend-434817580915.us-central1.run.app';

const nextConfig = {
  // standalone output is for Cloud Run Docker (node server.js).
  // Explicitly trigger this ONLY when STANDALONE_BUILD=1 is set (which is true in your Dockerfile).
  ...(process.env.STANDALONE_BUILD === '1' ? { output: 'standalone' } : {}),


  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    middlewareClientMaxBodySize: '50mb',
  },

  async rewrites() {
    if (isNetlify) {
      return [
        {
          source: '/api/:path*',
          // Destination points to the new Cloud Run backend
          destination: 'https://mededuai-backend-434817580915.us-central1.run.app/api/:path*',
        },
      ];
    }
    return [];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'mededuai.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
