import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS 방지
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // MIME 타입 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // 참조자 정책
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // 권한 정책
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co https://vercel.live",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  },
  
  // 환경 변수 검증
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 이미지 최적화 설정
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 실험적 기능
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components/ui', 'lucide-react', '@radix-ui/react-dialog'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // 웹팩 설정
  webpack: (config, { dev, isServer }) => {
    // 프로덕션에서 콘솔 로그 제거
    if (!dev && !isServer) {
      config.optimization.minimizer?.forEach((minimizer: any) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.terserOptions.compress.drop_console = true
        }
      })
    }
    
    return config
  }
}

export default nextConfig
