import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포를 위한 설정
  experimental: {
    optimizeCss: true
  },
  // Vercel에서 Next.js 감지를 위한 설정
  poweredByHeader: false,
  compress: true
}

export default nextConfig
