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
};

export default nextConfig;
