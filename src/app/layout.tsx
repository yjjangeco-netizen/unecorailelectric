import './globals.css'
import type { Metadata, Viewport } from 'next'
import ClientLayout from './ClientLayout'
import ReactQueryProvider from '@/components/ReactQueryProvider'

import { UserProvider } from '@/context/UserContext'

export const metadata: Metadata = {
  title: '유네코레일 전기팀 자재관리 시스템',
  description: '유네코레일 전기팀의 자재 입출고 및 재고 관리 시스템',
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
        
        {/* 
          서비스 워커 강제 해제 스크립트 
          ERR_FAILED 문제를 해결하기 위해 기존 등록된 모든 서비스 워커를 제거합니다.
        */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                  console.log('Service Worker unregistered');
                }
              }).catch(function(err) {
                console.log('Service Worker unregistration failed: ', err);
              });
              
              // 캐시 저장소 비우기 (선택적)
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (let name of names) {
                    caches.delete(name);
                  }
                });
              }
            }
          `
        }} />
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
