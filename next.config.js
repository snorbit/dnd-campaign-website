/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['*'], // Allow all external images for the map portal
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    }
};

module.exports = nextConfig;
