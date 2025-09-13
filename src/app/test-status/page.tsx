'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CommonHeader from '@/components/CommonHeader'
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  FileText
} from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export default function TestStatusPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  const runTests = async () => {
    setIsLoading(true)
    const results: TestResult[] = []

    try {
      // 1. 데이터베이스 연결 테스트
      try {
        const response = await fetch('/api/test/db-check')
        if (response.ok) {
          results.push({
            name: '데이터베이스 연결',
            status: 'success',
            message: '데이터베이스 연결이 정상입니다.'
          })
        } else {
          results.push({
            name: '데이터베이스 연결',
            status: 'error',
            message: '데이터베이스 연결에 실패했습니다.'
          })
        }
      } catch (error) {
        results.push({
          name: '데이터베이스 연결',
          status: 'error',
          message: '데이터베이스 연결 테스트 중 오류가 발생했습니다.'
        })
      }

      // 2. 인증 테스트
      try {
        const response = await fetch('/api/test/auth-check')
        if (response.ok) {
          results.push({
            name: '인증 시스템',
            status: 'success',
            message: '인증 시스템이 정상입니다.'
          })
        } else {
          results.push({
            name: '인증 시스템',
            status: 'error',
            message: '인증 시스템에 문제가 있습니다.'
          })
        }
      } catch (error) {
        results.push({
          name: '인증 시스템',
          status: 'error',
          message: '인증 시스템 테스트 중 오류가 발생했습니다.'
        })
      }

      // 3. 제약 조건 테스트
      try {
        const response = await fetch('/api/test/check-constraints')
        if (response.ok) {
          results.push({
            name: '데이터베이스 제약 조건',
            status: 'success',
            message: '데이터베이스 제약 조건이 정상입니다.'
          })
        } else {
          results.push({
            name: '데이터베이스 제약 조건',
            status: 'error',
            message: '데이터베이스 제약 조건에 문제가 있습니다.'
          })
        }
      } catch (error) {
        results.push({
          name: '데이터베이스 제약 조건',
          status: 'error',
          message: '데이터베이스 제약 조건 테스트 중 오류가 발생했습니다.'
        })
      }

      // 4. 기본 API 테스트
      try {
        const response = await fetch('/api/test')
        if (response.ok) {
          results.push({
            name: '기본 API',
            status: 'success',
            message: '기본 API가 정상입니다.'
          })
        } else {
          results.push({
            name: '기본 API',
            status: 'error',
            message: '기본 API에 문제가 있습니다.'
          })
        }
      } catch (error) {
        results.push({
          name: '기본 API',
          status: 'error',
          message: '기본 API 테스트 중 오류가 발생했습니다.'
        })
      }

    } catch (error) {
      results.push({
        name: '전체 테스트',
        status: 'error',
        message: '테스트 실행 중 예상치 못한 오류가 발생했습니다.'
      })
    }

    setTestResults(results)
    setIsLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 공통 헤더 추가 */}
      <CommonHeader
        currentUser={currentUser}
        isAdmin={currentUser?.role === 'admin'}
        title="시스템 상태 테스트"
        showBackButton={true}
        backUrl="/"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">시스템 상태 테스트</h1>
              <p className="text-gray-600 mt-2">
                데이터베이스, API, 인증 시스템의 상태를 확인합니다.
              </p>
            </div>
            <Button onClick={runTests} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? '테스트 중...' : '테스트 실행'}
            </Button>
          </div>
        </div>

        {/* 테스트 결과 */}
        <div className="grid gap-6">
          {testResults.map((result, index) => (
            <Card key={index} className={`${getStatusColor(result.status)}`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{result.name}</h3>
                    <p className="text-gray-700">{result.message}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status === 'success' ? '정상' :
                     result.status === 'error' ? '오류' : '경고'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 요약 */}
        {testResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>테스트 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">정상</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">오류</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {testResults.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-600">경고</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
