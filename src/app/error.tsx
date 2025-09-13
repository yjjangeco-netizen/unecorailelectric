'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          예상치 못한 오류가 발생했습니다
        </h2>
        <p className="text-gray-600 mb-6">
          시스템에서 오류가 발생했습니다. 다시 시도하거나 페이지를 새로고침해주세요.
        </p>
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            메인으로 돌아가기
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              개발자 정보 (클릭하여 확장)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
              <div><strong>Error:</strong> {error.message}</div>
              {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
              <div><strong>Stack:</strong></div>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
