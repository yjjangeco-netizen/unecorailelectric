'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logError } from '@/lib/utils'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅
    logError('페이지 레벨 에러', error, {
      digest: error.digest,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
    })
  }, [error])

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          페이지를 불러오는 중 오류가 발생했습니다
        </h1>
        
        <p className="text-sm text-gray-600 mb-6">
          요청하신 페이지에서 문제가 발생했습니다. 
          다시 시도하거나 메인 페이지로 돌아가주세요.
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

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="flex items-center justify-center gap-2"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
          
          <Button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            메인으로
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            문제가 지속되면 관리자에게 문의하세요.
            <br />
            오류 ID: {error.digest || error.name || 'UNKNOWN'}
          </p>
        </div>
      </div>
    </div>
  )
}
