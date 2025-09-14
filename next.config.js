/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 파일 서빙 설정
  async rewrites() {
    return [
      {
        source: '/stock-management',
        destination: '/stock-management/',
      },
    ]
  },
  // 타입스크립트 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
