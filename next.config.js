/** @type {import('next').NextConfig} */
const nextConfig = {
  // 모든 페이지를 동적으로 렌더링
  experimental: {
    forceSwcTransforms: true,
  },
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
  // 출력 설정 - 모든 라우트를 동적으로 처리
  output: 'standalone',
  // 강제 동적 렌더링
  trailingSlash: false,
}

module.exports = nextConfig
