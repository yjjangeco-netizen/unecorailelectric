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
    ignoreBuildErrors: false,
  },
  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
