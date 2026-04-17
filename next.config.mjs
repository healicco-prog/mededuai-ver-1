/** @type {import('next').NextConfig} */
const isNetlify = process.env.NETLIFY === 'true';
const CLOUD_RUN_URL = 'https://mededuai-backend-945029424967.us-central1.run.app';

const nextConfig = {
  // standalone output is for Cloud Run Docker (node server.js).
  // On Netlify, the @netlify/plugin-nextjs handles the output — do NOT set standalone.
  ...(isNetlify ? {} : { output: 'standalone' }),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'mededuai.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS?.split(',')[0] || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },

  async rewrites() {
    // When running on Netlify, proxy ALL API calls to Cloud Run.
    // This ensures ZERO backend secrets are needed in the Netlify build/runtime.
    // Netlify's [[redirects]] also provides a CDN-level fallback for this.
    if (isNetlify) {
      return [
        {
          source: '/api/:path*',
          destination: `${CLOUD_RUN_URL}/api/:path*`,
        },
      ];
    }
    // On Cloud Run (standalone): API routes are handled locally by Next.js server.
    return [];
  },
};

export default nextConfig;
