import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel 배포를 위한 설정
  experimental: {
    optimizeCss: true
  }
}

export default nextConfig
