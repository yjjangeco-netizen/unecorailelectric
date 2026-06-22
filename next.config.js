/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium'],
        // Vercel 배포 시 @sparticuz/chromium의 bin 폴더 내 바이너리 에셋이 유실되지 않도록 강제 포함 지정
        outputFileTracingIncludes: {
            '/api/nara-monitoring/**/*': [
                'node_modules/@sparticuz/chromium/**/*'
            ]
        }
    },
    // API 라우트 번들 시에도 강제로 외부 모듈로 남기도록 webpack 설정 보완
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [...(config.externals || []), 'playwright-core', '@sparticuz/chromium']
        }
        return config;
    }
}

module.exports = nextConfig