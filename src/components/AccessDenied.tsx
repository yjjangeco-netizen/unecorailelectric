'use client'

import { AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AccessDeniedProps {
  requiredLevel?: number | string
  currentLevel?: number | string
  feature?: string
  onBack?: () => void
}

export default function AccessDenied({ 
  requiredLevel, 
  currentLevel, 
  feature = '이 기능',
  onBack 
}: AccessDeniedProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-red-200">
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-red-800 mb-4">접근 안됨</h2>
          
          <div className="space-y-3 mb-6">
            <p className="text-red-700 text-lg">
              {feature}에 접근할 권한이 없습니다.
            </p>
            
            {requiredLevel && currentLevel && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-semibold text-red-800">권한 부족</span>
                </div>
                <div className="text-sm text-red-700">
                  <div>현재 레벨: <span className="font-bold">Level {currentLevel}</span></div>
                  <div>필요 레벨: <span className="font-bold">Level {requiredLevel} 이상</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleBack}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              이전 페이지로 돌아가기
            </Button>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              대시보드로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
