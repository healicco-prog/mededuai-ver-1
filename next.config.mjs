/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
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
