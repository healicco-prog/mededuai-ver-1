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

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // or specify mededuai.com
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-secret' },
        ],
      },
    ];
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
