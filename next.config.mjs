/** @type {import('next').NextConfig} */
const isNetlify = process.env.NETLIFY === 'true';
const CLOUD_RUN_URL = 'https://mededuai-backend-945029424967.us-central1.run.app';

const nextConfig = {
  // standalone output is for Cloud Run Docker (node server.js).
  // Explicitly trigger this ONLY when STANDALONE_BUILD=1 is set (which is true in your Dockerfile).
  ...(process.env.STANDALONE_BUILD === '1' ? { output: 'standalone' } : {}),

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'mededuai.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // CORS is handled dynamically by src/middleware.ts (per-origin check).
  // Do NOT add static Access-Control-Allow-Origin headers here — a single
  // comma-joined multi-origin value is invalid and browsers will reject it.

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
