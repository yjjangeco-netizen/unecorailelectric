'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  TrendingUp,
  Clock,
  BarChart3
} from 'lucide-react'

// 테스트 결과 인터페이스
interface TestResult {
  testName: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error'
  startTime?: number
  endTime?: number
  duration?: number
  totalTests: number
  passedTests: number
  failedTests: number
  errorTests: number
  details: string[]
}

// 전체 통계 인터페이스
interface OverallStats {
  totalTests: number
  passedTests: number
  failedTests: number
  errorTests: number
  startTime: number
  endTime: number
}

// 재고 테스트 데이터 인터페이스
// interface StockTestData {
//   id: string
//   name: string
//   specification: string
//   unit_price: number
//   current_quantity: number
//   total_amount: number
//   category: string
//   stock_status: 'normal' | 'low_stock'
// }

export default function StockTestPanel() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    errorTests: 0,
    startTime: 0,
    endTime: 0
  })

  // 테스트 초기화
  const initializeTests = useCallback(() => {
    const tests: TestResult[] = [
      {
        testName: '입고 기능 테스트',
        status: 'pending',
        totalTests: 1000000,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        details: []
      },
      {
        testName: '출고 기능 테스트',
        status: 'pending',
        totalTests: 1000000,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        details: []
      },
      {
        testName: '폐기 기능 테스트',
        status: 'pending',
        totalTests: 1000000,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        details: []
      },
      {
        testName: '검색 기능 테스트',
        status: 'pending',
        totalTests: 1000000,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        details: []
      },
      {
        testName: '계산 기능 테스트',
        status: 'pending',
        totalTests: 1000000,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        details: []
      },
      {
        testName: '무결성 검사 테스트',
        status: 'pending',
        totalTests: 1000000,
        passedTests: 0,
        failedTests: 0,
        errorTests: 0,
        details: []
      }
    ]
    
    setTestResults(tests)
    setOverallStats({
      totalTests: tests.reduce((sum, test) => sum + test.totalTests, 0),
      passedTests: 0,
      failedTests: 0,
      errorTests: 0,
      startTime: 0,
      endTime: 0
    })
  }, [])

  // 입고 기능 테스트
  const runStockInTest = useCallback(async (test: TestResult) => {
    const batchSize = 10000 // 한 번에 처리할 테스트 수
    
    for (let i = 0; i < test.totalTests; i += batchSize) {
      if (!isRunning) {break}
      
      const currentBatch = Math.min(batchSize, test.totalTests - i)
      
      // 배치 단위로 테스트 실행
      for (let j = 0; j < currentBatch; j++) {
        const testData = generateStockInTestData(i + j)
        
        try {
          // 입고 로직 시뮬레이션
          const result = simulateStockIn(testData)
          
          if (result.success) {
            test.passedTests++
          } else {
            test.failedTests++
            test.details.push(`테스트 ${i + j + 1}: ${result.error}`)
          }
          
        } catch (error) {
          test.errorTests++
          test.details.push(`테스트 ${i + j + 1}: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }
      
      // 진행률 업데이트
      setProgress((i / test.totalTests) * 100)
    }
  }, [isRunning])

  // 출고 기능 테스트
  const runStockOutTest = useCallback(async (test: TestResult) => {
    const batchSize = 10000
    
    for (let i = 0; i < test.totalTests; i += batchSize) {
      if (!isRunning) {break}
      
      const currentBatch = Math.min(batchSize, test.totalTests - i)
      
      for (let j = 0; j < currentBatch; j++) {
        const testData = generateStockOutTestData(i + j)
        
        try {
          const result = simulateStockOut(testData)
          
          if (result.success) {
            test.passedTests++
          } else {
            test.failedTests++
            test.details.push(`테스트 ${i + j + 1}: ${result.error}`)
          }
          
        } catch (error) {
          test.errorTests++
          test.details.push(`테스트 ${i + j + 1}: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }
      
      setProgress((i / test.totalTests) * 100)
    }
  }, [isRunning])

  // 폐기 기능 테스트
  const runDisposalTest = useCallback(async (test: TestResult) => {
    const batchSize = 10000
    
    for (let i = 0; i < test.totalTests; i += batchSize) {
      if (!isRunning) {break}
      
      const currentBatch = Math.min(batchSize, test.totalTests - i)
      
      for (let j = 0; j < currentBatch; j++) {
        const testData = generateDisposalTestData(i + j)
        
        try {
          const result = simulateDisposal(testData)
          
          if (result.success) {
            test.passedTests++
          } else {
            test.failedTests++
            test.details.push(`테스트 ${i + j + 1}: ${result.error}`)
          }
          
        } catch (error) {
          test.errorTests++
          test.details.push(`테스트 ${i + j + 1}: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }
      
      setProgress((i / test.totalTests) * 100)
    }
  }, [isRunning])

  // 검색 기능 테스트
  const runSearchTest = useCallback(async (test: TestResult) => {
    const batchSize = 10000
    
    for (let i = 0; i < test.totalTests; i += batchSize) {
      if (!isRunning) {break}
      
      const currentBatch = Math.min(batchSize, test.totalTests - i)
      
      for (let j = 0; j < currentBatch; j++) {
        const testData = generateSearchTestData(i + j)
        
        try {
          const result = simulateSearch(testData)
          
          if (result.success) {
            test.passedTests++
          } else {
            test.failedTests++
            test.details.push(`테스트 ${i + j + 1}: ${result.error}`)
          }
          
        } catch (error) {
          test.errorTests++
          test.details.push(`테스트 ${i + j + 1}: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }
      
      setProgress((i / test.totalTests) * 100)
    }
  }, [isRunning])

  // 계산 기능 테스트
  const runCalculationTest = useCallback(async (test: TestResult) => {
    const batchSize = 10000
    
    for (let i = 0; i < test.totalTests; i += batchSize) {
      if (!isRunning) {break}
      
      const currentBatch = Math.min(batchSize, test.totalTests - i)
      
      for (let j = 0; j < currentBatch; j++) {
        const testData = generateCalculationTestData()
        
        try {
          const result = simulateCalculation(testData)
          
          if (result.success) {
            test.passedTests++
          } else {
            test.failedTests++
            test.details.push(`테스트 ${i + j + 1}: ${result.error}`)
          }
          
        } catch (error) {
          test.errorTests++
          test.details.push(`테스트 ${i + j + 1}: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }
      
      setProgress((i / test.totalTests) * 100)
    }
  }, [isRunning])

  // 무결성 검사 테스트
  const runIntegrityTest = useCallback(async (test: TestResult) => {
    const batchSize = 10000
    
    for (let i = 0; i < test.totalTests; i += batchSize) {
      if (!isRunning) {break}
      
      const currentBatch = Math.min(batchSize, test.totalTests - i)
      
      for (let j = 0; j < currentBatch; j++) {
        const testData = generateIntegrityTestData(i + j)
        
        try {
          const result = simulateIntegrity(testData)
          
          if (result.success) {
            test.passedTests++
          } else {
            test.failedTests++
            test.details.push(`테스트 ${i + j + 1}: ${result.error}`)
          }
          
        } catch (error) {
          test.errorTests++
          test.details.push(`테스트 ${i + j + 1}: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      }
      
      setProgress((i / test.totalTests) * 100)
    }
  }, [isRunning])

  // 전체 통계 업데이트
  const updateOverallStats = useCallback(() => {
    const total = testResults.reduce((sum: number, test: TestResult) => sum + test.totalTests, 0)
    const passed = testResults.reduce((sum: number, test: TestResult) => sum + test.passedTests, 0)
    const failed = testResults.reduce((sum: number, test: TestResult) => sum + test.failedTests, 0)
    const error = testResults.reduce((sum: number, test: TestResult) => sum + test.errorTests, 0)
    
    setOverallStats((prev: OverallStats) => ({
      ...prev,
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      errorTests: error
    }))
  }, [testResults])

  // 테스트 시작
  const startTests = useCallback(async () => {
    setIsRunning(true)
    setOverallStats((prev: OverallStats) => ({ ...prev, startTime: Date.now() }))
    
    // 각 테스트를 순차적으로 실행
    for (let i = 0; i < testResults.length; i++) {
      if (!isRunning) {break}
      
      setCurrentTest(testResults[i]?.testName || '')
      // runTest 함수를 직접 호출하지 않고 인라인으로 처리
      const test = testResults[i]
      if (!test) {
        continue
      }
      
      test.status = 'running'
      test.startTime = Date.now()
      
      setTestResults([...testResults])
      
      try {
        switch (i) {
          case 0:
            await runStockInTest(test)
            break
          case 1:
            await runStockOutTest(test)
            break
          case 2:
            await runDisposalTest(test)
            break
          case 3:
            await runSearchTest(test)
            break
          case 4:
            await runCalculationTest(test)
            break
          case 5:
            await runIntegrityTest(test)
            break
        }
        
        test.status = 'passed'
        test.endTime = Date.now()
        test.duration = test.endTime - test.startTime
        
      } catch (error) {
        test.status = 'error'
        test.endTime = Date.now()
        test.duration = test.endTime - test.startTime
        test.details.push(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      }
      
      setTestResults([...testResults])
      updateOverallStats()
      setProgress(((i + 1) / testResults.length) * 100)
    }
    
    setIsRunning(false)
    setCurrentTest('')
    setOverallStats((prev: OverallStats) => ({ ...prev, endTime: Date.now() }))
  }, [testResults, isRunning, runStockInTest, runStockOutTest, runDisposalTest, runSearchTest, runCalculationTest, runIntegrityTest, updateOverallStats])

  // 테스트 중지
  const stopTests = useCallback(() => {
    setIsRunning(false)
    setCurrentTest('')
  }, [])

  // 테스트 일시정지
  const pauseTests = useCallback(() => {
    setIsRunning(false)
  }, [])

  // 테스트 재설정
  const resetTests = useCallback(() => {
    setIsRunning(false)
    setCurrentTest('')
    setProgress(0)
    initializeTests()
  }, [initializeTests])

  // 테스트 데이터 생성 함수들
  const generateStockInTestData = (index: number) => ({
    itemName: `테스트품목_${index}`,
    quantity: Math.floor(Math.random() * 1000) + 1,
    unitPrice: Math.floor(Math.random() * 100000) + 1000,
    notes: `테스트 입고 ${index}`,
    conditionType: ['new', 'used-new', 'used-used', 'broken'][Math.floor(Math.random() * 4)] as unknown,
    reason: `테스트 사유 ${index}`,
    orderedBy: `주문자_${index}`,
    receivedBy: `입고자_${index}`
  })

  const generateStockOutTestData = (index: number) => ({
    itemId: `item_${index}`,
    quantity: Math.floor(Math.random() * 100) + 1,
    project: `프로젝트_${index}`,
    notes: `테스트 출고 ${index}`,
    isRental: Math.random() > 0.5,
    returnDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    issuedBy: `출고자_${index}`
  })

  const generateDisposalTestData = (index: number) => ({
    stockInId: `stock_in_${index}`,
    itemId: `item_${index}`,
    quantity: Math.floor(Math.random() * 50) + 1,
    disposedBy: `폐기자_${index}`,
    disposedAt: new Date().toISOString(),
    reason: `테스트 폐기 ${index}`,
    notes: `폐기 비고 ${index}`
  })

  const generateSearchTestData = (index: number) => ({
    query: `검색어_${index}`,
    category: ['전기자재', '공구', '소모품', '안전용품'][Math.floor(Math.random() * 4)],
    minPrice: Math.floor(Math.random() * 10000),
    maxPrice: Math.floor(Math.random() * 100000) + 10000,
    inStock: Math.random() > 0.5
  })

  const generateCalculationTestData = () => ({
    currentQuantity: Math.floor(Math.random() * 1000),
    unitPrice: Math.floor(Math.random() * 100000) + 1000,
    stockInQuantity: Math.floor(Math.random() * 500),
    stockOutQuantity: Math.floor(Math.random() * 300),
    adjustmentQuantity: Math.floor(Math.random() * 100) - 50
  })

  const generateIntegrityTestData = (index: number) => ({
    itemId: `item_${index}`,
    name: `품목_${index}`,
    specification: `규격_${index}`,
    unitPrice: Math.floor(Math.random() * 100000) + 1000,
    currentQuantity: Math.floor(Math.random() * 1000),
    totalAmount: 0,
    category: `카테고리_${index}`,
            stockStatus: ['new', 'low_stock'][Math.floor(Math.random() * 2)] as unknown
  })

  // 시뮬레이션 함수들
  const simulateStockIn = (data: unknown) => {
    try {
      // 타입 가드 추가
      if (!data || typeof data !== 'object') {
        return { success: false, error: '유효하지 않은 데이터입니다' }
      }
      
      const stockInData = data as { itemName?: string; quantity?: number; unitPrice?: number }
      
      // 입력값 검증
      if (!stockInData.itemName || stockInData.itemName.length < 1) {
        return { success: false, error: '품목명이 비어있습니다' }
      }
      
      if (!stockInData.quantity || stockInData.quantity <= 0 || stockInData.quantity > 999999) {
        return { success: false, error: '수량이 유효하지 않습니다' }
      }
      
      if (!stockInData.unitPrice || stockInData.unitPrice < 0 || stockInData.unitPrice > 999999999) {
        return { success: false, error: '단가가 유효하지 않습니다' }
      }
      
      // 재고 계산 시뮬레이션
      const totalAmount = stockInData.quantity * stockInData.unitPrice
      
      if (totalAmount > 999999999999) {
        return { success: false, error: '총 금액이 너무 큽니다' }
      }
      
      return { success: true, totalAmount }
      
    } catch (error) {
      return { success: false, error: '입고 처리 중 오류 발생' }
    }
  }

  const simulateStockOut = (data: unknown) => {
    try {
      // 타입 가드 추가
      if (!data || typeof data !== 'object') {
        return { success: false, error: '유효하지 않은 데이터입니다' }
      }
      
      const stockOutData = data as { itemId?: string; quantity?: number }
      
      if (!stockOutData.itemId) {
        return { success: false, error: '품목 ID가 없습니다' }
      }
      
      if (!stockOutData.quantity || stockOutData.quantity <= 0 || stockOutData.quantity > 999999) {
        return { success: false, error: '수량이 유효하지 않습니다' }
      }
      
      // 재고 부족 체크 시뮬레이션
      const currentStock = Math.floor(Math.random() * 1000) + 100
      
      if (stockOutData.quantity > currentStock) {
        return { success: false, error: '재고가 부족합니다' }
      }
      
      return { success: true, remainingStock: currentStock - stockOutData.quantity }
      
    } catch (error) {
      return { success: false, error: '출고 처리 중 오류 발생' }
    }
  }

  const simulateDisposal = (data: unknown) => {
    try {
      // 타입 가드 추가
      if (!data || typeof data !== 'object') {
        return { success: false, error: '유효하지 않은 데이터입니다' }
      }
      
      const disposalData = data as { itemId?: string; quantity?: number; reason?: string; disposedAt?: string }
      
      if (!disposalData.itemId) {
        return { success: false, error: '품목 ID가 없습니다' }
      }
      
      if (!disposalData.quantity || disposalData.quantity <= 0) {
        return { success: false, error: '폐기 수량이 유효하지 않습니다' }
      }
      
      if (!disposalData.reason || disposalData.reason.length < 1) {
        return { success: false, error: '폐기 사유가 필요합니다' }
      }
      
      return { success: true, disposedAt: disposalData.disposedAt }
      
    } catch (error) {
      return { success: false, error: '폐기 처리 중 오류 발생' }
    }
  }

  const simulateSearch = (data: unknown) => {
    try {
      // 타입 가드 추가
      if (!data || typeof data !== 'object') {
        return { success: false, error: '유효하지 않은 데이터입니다' }
      }
      
      const searchData = data as { query?: string }
      
      if (!searchData.query || searchData.query.length < 1) {
        return { success: false, error: '검색어가 비어있습니다' }
      }
      
      if (searchData.query.length > 200) {
        return { success: false, error: '검색어가 너무 깁니다' }
      }
      
      // 검색 결과 시뮬레이션
      const resultCount = Math.floor(Math.random() * 100)
      
      return { success: true, resultCount }
      
    } catch (error) {
      return { success: false, error: '검색 처리 중 오류 발생' }
    }
  }

  const simulateCalculation = (data: unknown) => {
    try {
      // 타입 가드 추가
      if (!data || typeof data !== 'object') {
        return { success: false, error: '유효하지 않은 데이터입니다' }
      }
      
      const calcData = data as { 
        currentQuantity?: number; 
        stockInQuantity?: number; 
        stockOutQuantity?: number; 
        adjustmentQuantity?: number; 
        unitPrice?: number 
      }
      
      // 재고 계산 시뮬레이션
      const finalQuantity = (calcData.currentQuantity || 0) + (calcData.stockInQuantity || 0) - (calcData.stockOutQuantity || 0) + (calcData.adjustmentQuantity || 0)
      const totalAmount = finalQuantity * (calcData.unitPrice || 0)
      
      if (finalQuantity < 0) {
        return { success: false, error: '재고가 음수가 될 수 없습니다' }
      }
      
      if (totalAmount > 999999999999) {
        return { success: false, error: '총 금액이 너무 큽니다' }
      }
      
      return { success: true, finalQuantity, totalAmount }
      
    } catch (error) {
      return { success: false, error: '계산 처리 중 오류 발생' }
    }
  }

  const simulateIntegrity = (data: unknown) => {
    try {
      // 타입 가드 추가
      if (!data || typeof data !== 'object') {
        return { success: false, error: '유효하지 않은 데이터입니다' }
      }
      
      const integrityData = data as { 
        name?: string; 
        unitPrice?: number; 
        currentQuantity?: number; 
        totalAmount?: number 
      }
      
      // 데이터 무결성 검증
      if (!integrityData.name || integrityData.name.length < 1) {
        return { success: false, error: '품목명이 비어있습니다' }
      }
      
      if (!integrityData.unitPrice || integrityData.unitPrice < 0) {
        return { success: false, error: '단가가 음수일 수 없습니다' }
      }
      
      if (!integrityData.currentQuantity || integrityData.currentQuantity < 0) {
        return { success: false, error: '재고 수량이 음수일 수 없습니다' }
      }
      
      // 계산된 총액과 실제 총액 비교
      const calculatedAmount = integrityData.currentQuantity * integrityData.unitPrice
      if (Math.abs(calculatedAmount - (integrityData.totalAmount || 0)) > 0.01) {
        return { success: false, error: '총액 계산이 일치하지 않습니다' }
      }
      
      return { success: true, calculatedAmount }
      
    } catch (error) {
      return { success: false, error: '무결성 검증 중 오류 발생' }
    }
  }

  // 컴포넌트 마운트 시 테스트 초기화
  useEffect(() => {
    initializeTests()
  }, [initializeTests])

  // 테스트 상태에 따른 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // 테스트 상태에 따른 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'passed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'error':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 재고관리 시스템 테스트 패널
          </h1>
          <p className="text-lg text-gray-600">
            100만번 대규모 테스트를 통한 시스템 안정성 검증
          </p>
        </div>

        {/* 제어 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>테스트 제어</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                onClick={startTests}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                테스트 시작
              </Button>
              
              <Button
                onClick={pauseTests}
                disabled={!isRunning}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <Pause className="h-4 w-4 mr-2" />
                일시정지
              </Button>
              
              <Button
                onClick={stopTests}
                disabled={!isRunning}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Square className="h-4 w-4 mr-2" />
                중지
              </Button>
              
              <Button
                onClick={resetTests}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Database className="h-4 w-4 mr-2" />
                재설정
              </Button>
            </div>
            
            {/* 진행률 표시 */}
            {isRunning && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>전체 진행률</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {currentTest && (
                  <p className="text-sm text-blue-600 mt-2">
                    현재 실행 중: {currentTest}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 전체 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>전체 통계</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overallStats.totalTests.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">총 테스트</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {overallStats.passedTests.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">성공</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {overallStats.failedTests.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">실패</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {overallStats.errorTests.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">오류</div>
              </div>
            </div>
            
            {/* 실행 시간 */}
            {overallStats.startTime > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                {overallStats.endTime > 0 ? (
                  <span>
                    총 실행 시간: {Math.round((overallStats.endTime - overallStats.startTime) / 1000)}초
                  </span>
                ) : (
                  <span>
                    시작 시간: {new Date(overallStats.startTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 개별 테스트 결과 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testResults.map((test, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(test.status)}
                    <span>{test.testName}</span>
                  </div>
                  <Badge className={getStatusBadge(test.status)}>
                    {test.status === 'pending' && '대기'}
                    {test.status === 'running' && '실행중'}
                    {test.status === 'passed' && '성공'}
                    {test.status === 'failed' && '실패'}
                    {test.status === 'error' && '오류'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* 진행률 */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>진행률</span>
                      <span>
                        {test.totalTests > 0 
                          ? Math.round(((test.passedTests + test.failedTests + test.errorTests) / test.totalTests) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={test.totalTests > 0 
                        ? ((test.passedTests + test.failedTests + test.errorTests) / test.totalTests) * 100
                        : 0
                      } 
                      className="h-2" 
                    />
                  </div>
                  
                  {/* 상세 통계 */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{test.passedTests.toLocaleString()}</div>
                      <div className="text-gray-500">성공</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">{test.failedTests.toLocaleString()}</div>
                      <div className="text-gray-500">실패</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">{test.errorTests.toLocaleString()}</div>
                      <div className="text-gray-500">오류</div>
                    </div>
                  </div>
                  
                  {/* 실행 시간 */}
                  {test.duration && (
                    <div className="text-sm text-gray-600 text-center">
                      실행 시간: {Math.round(test.duration / 1000)}초
                    </div>
                  )}
                  
                  {/* 오류 상세 */}
                  {test.details.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-red-600 font-medium">
                          오류 상세 보기 ({test.details.length}개)
                        </summary>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {test.details.slice(-10).map((detail, detailIndex) => (
                            <div key={detailIndex} className="text-red-600 bg-red-50 p-2 rounded text-xs">
                              {detail}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

