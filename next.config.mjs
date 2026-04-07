/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'mededuai.com' },
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
    // When running on Netlify, completely proxy all backend APIs to Cloud Run
    // This allows Netlify to purely serve the frontend without needing backend secrets
    if (process.env.NETLIFY === 'true') {
      return [
        {
          source: '/api/:path*',
          destination: 'https://mededuai-backend-945029424967.us-central1.run.app/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
