/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.STANDALONE_BUILD === '1' ? { output: 'standalone' } : {}),
    devIndicators: {
        appIsrStatus: false,
        buildActivity: false,
    },
    // Optional: Image domains
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'localhost' },
            { protocol: 'https', hostname: 'mededuai.com' },
        ],
    },
    // CORS headers for API routes
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.ALLOWED_ORIGINS?.split(',')[0] || '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-Requested-With',
                    },
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
