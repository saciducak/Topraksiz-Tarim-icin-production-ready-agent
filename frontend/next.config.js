/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.API_URL
                    ? `${process.env.API_URL}/api/:path*`
                    : 'http://host.docker.internal:8001/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
