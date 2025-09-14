'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <Package className="h-16 w-16 text-gray-400 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전 페이지로
          </Button>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          <p>URL을 다시 확인하거나 메인 페이지로 이동해주세요.</p>
        </div>
      </div>
    </div>
  )
}
