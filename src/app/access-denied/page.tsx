'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/useUser'

export default function AccessDeniedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const from = searchParams.get('from') || ''
  const level = String(user?.level || '')
  const canUseDashboard = level === 'administrator' || level === 'admin' || Number(level) >= 3

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">접근 권한이 없습니다.</h1>
        <p className="mt-3 text-sm text-gray-600">
          이 메뉴는 현재 계정 권한으로 사용할 수 없습니다.
        </p>
        {from && (
          <p className="mt-2 break-all text-xs text-gray-400">
            요청 경로: {from}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => router.back()} variant="outline">
            이전 페이지로
          </Button>
          <Button onClick={() => router.replace(canUseDashboard ? '/dashboard' : '/stock-management')}>
            사용 가능한 화면으로 이동
          </Button>
        </div>
      </div>
    </div>
  )
}
