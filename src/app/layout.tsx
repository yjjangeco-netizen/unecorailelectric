import './globals.css'
import type { Metadata, Viewport } from 'next'
import ClientLayout from './ClientLayout'
import ReactQueryProvider from '@/components/ReactQueryProvider'

import { UserProvider } from '@/context/UserContext'

export const metadata: Metadata = {
  title: '유네코레일 전기팀 업무관리 시스템',
  description: '유네코레일 전기팀의 업무관리 시스템',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '유네코레일',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4DA3FF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* 구글폰트: 깔끔한 본문(Noto Sans KR) + 귀여운 설명(Jua) — 한글 포함 전체 로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA 메타 태그 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4DA3FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="유네코레일" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* iOS 스플래시 스크린 */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* 브라우저 캐시 방지 메타 태그 */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body>
        <ReactQueryProvider>
          <UserProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </UserProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
