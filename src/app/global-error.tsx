'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logError } from '@/lib/utils'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 글로벌 에러 로깅
    logError('글로벌 에러', error, {
      digest: error.digest,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      isCritical: true
    })
  }, [error])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              심각한 오류가 발생했습니다
            </h1>
            
            <p className="text-sm text-gray-600 mb-6">
              애플리케이션에서 예상치 못한 심각한 오류가 발생했습니다. 
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  개발자 정보 (클릭하여 확장)
                </summary>
                <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>에러:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div className="mb-2">
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {error.stack}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            <div className="flex flex-col gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </button>
              
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                페이지 새로고침
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                문제가 지속되면 관리자에게 문의하세요.
                <br />
                오류 ID: {error.digest || error.name || 'CRITICAL_ERROR'}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
