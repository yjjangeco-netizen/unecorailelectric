'use client'

import { useState, useEffect } from 'react'
import CommonHeader from '@/components/CommonHeader'

export default function TestSimplePage() {
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string } | null>(null)

  useEffect(() => {
    // 로그인 상태 확인
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setCurrentUser(userData)
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* 공통 헤더 추가 */}
      <CommonHeader
        currentUser={currentUser}
        isAdmin={currentUser?.role === 'admin'}
        title="간단한 테스트 페이지"
        showBackButton={true}
        backUrl="/"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Simple Test Page</h1>
        <p className="text-gray-600">This is a simple test page without complex dependencies.</p>
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <p className="text-green-800">✅ If you can see this, the basic page rendering is working!</p>
        </div>
      </div>
    </div>
  )
}
