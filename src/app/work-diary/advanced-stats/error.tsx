'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('고급 통계 검색 페이지 에러:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-200 to-pink-200 rounded-full flex items-center justify-center mb-4 shadow-md">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">페이지 로드 오류</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-red-700 mb-6">
            고급 통계 검색 페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/work-diary'}
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              업무일지로 돌아가기
            </Button>
          </div>
          {error.digest && (
            <div className="mt-4 p-3 bg-red-100 rounded-lg">
              <p className="text-xs text-red-600 font-mono">
                에러 ID: {error.digest}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
