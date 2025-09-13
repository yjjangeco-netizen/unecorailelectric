'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupWorkDiaryPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSetup = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/setup/work-diary-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (response.ok) {
        setMessage('✅ 업무일지 테이블이 성공적으로 생성되었습니다!')
      } else {
        setMessage(`❌ 오류: ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>업무일지 테이블 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            데이터베이스에 업무일지 관련 테이블을 생성합니다.
          </p>
          
          <Button 
            onClick={handleSetup}
            disabled={loading}
            className="w-full"
          >
            {loading ? '설정 중...' : '테이블 생성하기'}
          </Button>
          
          {message && (
            <div className={`p-3 rounded-md ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
