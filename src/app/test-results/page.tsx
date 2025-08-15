'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Database
} from 'lucide-react'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details: Record<string, unknown>
}

interface TestSummary {
  totalTests: number
  successCount: number
  errorCount: number
  warningCount: number
  totalTime: string
  successRate: string
}

export default function TestResultsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [lastRun, setLastRun] = useState<string>('')

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setSummary(null)
    
    try {
      const response = await fetch('/api/test/run-all', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        setTestResults(result.results)
        setSummary(result.summary)
        setLastRun(new Date().toLocaleString())
      } else {
        throw new Error('테스트 실행 실패')
      }
    } catch (error) {
      console.error('테스트 실행 오류:', error)
      setTestResults([{
        test: '테스트 실행',
        status: 'error',
        message: '테스트 실행 중 오류가 발생했습니다',
        details: { error: error instanceof Error ? error.message : '알 수 없는 오류' }
      }])
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '성공'
      case 'error':
        return '실패'
      case 'warning':
        return '경고'
      default:
        return '대기'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 재고관리 시스템 테스트 결과
          </h1>
          <p className="text-lg text-gray-600">
            핵심 기능들의 실제 동작 검증 결과
          </p>
        </div>

        {/* 제어 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>테스트 제어</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    테스트 실행 중...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    전체 테스트 실행
                  </>
                )}
              </Button>
              
              {lastRun && (
                <div className="text-sm text-gray-600">
                  마지막 실행: {lastRun}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 테스트 요약 */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>테스트 요약</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.totalTests}
                  </div>
                  <div className="text-sm text-gray-600">총 테스트</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {summary.successCount}
                  </div>
                  <div className="text-sm text-gray-600">성공</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {summary.errorCount}
                  </div>
                  <div className="text-sm text-gray-600">실패</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary.warningCount}
                  </div>
                  <div className="text-sm text-gray-600">경고</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.successRate}
                  </div>
                  <div className="text-sm text-gray-600">성공률</div>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-600">
                총 실행 시간: {summary.totalTime}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 개별 테스트 결과 */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">테스트 결과 상세</h2>
            
            {testResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span>{result.test}</span>
                    </div>
                    <Badge className={getStatusBadge(result.status)}>
                      {getStatusText(result.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-700">{result.message}</p>
                    
                    {result.details && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 font-medium">
                          상세 정보 보기
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 테스트 안내 */}
        {testResults.length === 0 && !isRunning && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>테스트 안내</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-600">
                <p>이 페이지에서는 재고관리 시스템의 핵심 기능들을 테스트할 수 있습니다:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>입고 기능:</strong> 새 품목 등록 및 기존 품목 수량 증가</li>
                  <li><strong>출고 기능:</strong> 선택된 품목 출고 및 재고 감소</li>
                  <li><strong>폐기 기능:</strong> 품목 폐기 처리 및 이력 관리</li>
                  <li><strong>검색 기능:</strong> 품명, 규격, 분류별 검색 및 필터링</li>
                  <li><strong>재고 계산:</strong> 입출고 후 재고 수량 및 총액 계산 정확성</li>
                  <li><strong>데이터 무결성:</strong> 음수 재고 방지 및 계산 정확성 검증</li>
                </ul>
                <p className="mt-4">
                  <Button onClick={runAllTests} className="bg-blue-600 hover:bg-blue-700">
                    <Play className="h-4 w-4 mr-2" />
                    테스트 시작하기
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
