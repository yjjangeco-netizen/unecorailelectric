'use client'

import { useState, useEffect } from 'react'
import CommonHeader from '@/components/CommonHeader'

export default function SimplePage() {
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
        title="간단한 메인 페이지"
        showBackButton={true}
        backUrl="/"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Simple Main Page</h1>
        <p className="text-gray-600">This is a simplified main page for testing.</p>
        <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded">
          <p className="text-blue-800">✅ Basic page rendering is working!</p>
        </div>
        <div className="mt-4">
          <a href="/test-simple" className="text-blue-600 hover:underline">Go to Test Page</a>
        </div>
      </div>
    </div>
  )
}
