import './globals.css'
import type { Metadata, Viewport } from 'next'
import ClientLayout from './ClientLayout'
import ReactQueryProvider from '@/components/ReactQueryProvider'

import { UserProvider } from '@/context/UserContext'

export const metadata: Metadata = {
  title: '유네코레일 전기팀 자재관리 시스템',
  description: '유네코레일 전기팀의 자재 입출고 및 재고 관리 시스템',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
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
