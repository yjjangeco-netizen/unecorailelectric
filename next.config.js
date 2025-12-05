/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // 개발 환경에서 캐시 비활성화
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                    },
                ],
            },
        ]
    },
}

module.exports = nextConfig