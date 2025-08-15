// 재고관리 시스템 테스트 스크립트
// 브라우저 콘솔에서 실행하거나 Node.js 환경에서 실행

const BASE_URL = 'http://localhost:3000/api/test'

// 테스트 결과 저장
const testResults = []

// 테스트 헬퍼 함수
const runTest = async (testName, testFunction) => {
  console.log(`🧪 ${testName} 테스트 시작...`)
  const startTime = Date.now()
  
  try {
    const result = await testFunction()
    const endTime = Date.now()
    const duration = endTime - startTime
    
    const testResult = {
      test: testName,
      status: 'success',
      duration: `${duration}ms`,
      result: result,
      timestamp: new Date().toISOString()
    }
    
    testResults.push(testResult)
    console.log(`✅ ${testName} 성공 (${duration}ms)`)
    return testResult
    
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    const testResult = {
      test: testName,
      status: 'error',
      duration: `${duration}ms`,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    
    testResults.push(testResult)
    console.error(`❌ ${testName} 실패 (${duration}ms):`, error.message)
    return testResult
  }
}

// 1. 입고 기능 테스트
const testStockIn = async () => {
  const testData = {
    itemName: '테스트 품목 ' + Date.now(),
    quantity: 100,
    unitPrice: 5000,
    notes: '자동 테스트 입고',
    conditionType: 'new',
    reason: '테스트 사유',
    orderedBy: '테스트 주문자',
    receivedBy: '테스트 입고자'
  }
  
  const response = await fetch(`${BASE_URL}/stock-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  
  const result = await response.json()
  
  // 응답 검증
  if (!result.ok) {
    throw new Error(result.error || '입고 실패')
  }
  
  // 데이터 검증
  if (result.data.quantity !== testData.quantity) {
    throw new Error(`수량 불일치: 예상 ${testData.quantity}, 실제 ${result.data.quantity}`)
  }
  
  if (result.data.unitPrice !== testData.unitPrice) {
    throw new Error(`단가 불일치: 예상 ${testData.unitPrice}, 실제 ${result.data.unitPrice}`)
  }
  
  return result.data
}

// 2. 출고 기능 테스트
const testStockOut = async () => {
  // 먼저 현재 재고 확인
  const stockResponse = await fetch(`${BASE_URL}/search?q=테스트`)
  if (!stockResponse.ok) {
    throw new Error('재고 조회 실패')
  }
  
  const stockResult = await stockResponse.json()
  if (!stockResult.data.results || stockResult.data.results.length === 0) {
    throw new Error('테스트할 재고가 없습니다')
  }
  
  const testStock = stockResult.data.results[0]
  const testQuantity = Math.min(10, Math.floor(testStock.current_quantity / 2))
  
  if (testQuantity <= 0) {
    throw new Error('출고할 수량이 부족합니다')
  }
  
  const testData = {
    itemId: testStock.id,
    quantity: testQuantity,
    project: '자동 테스트 프로젝트',
    notes: '자동 테스트 출고',
    isRental: false,
    issuedBy: '테스트 출고자'
  }
  
  const response = await fetch(`${BASE_URL}/stock-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  
  const result = await response.json()
  
  if (!result.ok) {
    throw new Error(result.error || '출고 실패')
  }
  
  // 출고 후 재고 감소 확인
  if (result.data.newQuantity !== result.data.previousQuantity - testQuantity) {
    throw new Error('재고 감소 계산 오류')
  }
  
  return result.data
}

// 3. 폐기 기능 테스트
const testDisposal = async () => {
  // 먼저 현재 재고 확인
  const stockResponse = await fetch(`${BASE_URL}/search?q=테스트`)
  if (!stockResponse.ok) {
    throw new Error('재고 조회 실패')
  }
  
  const stockResult = await stockResponse.json()
  if (!stockResult.data.results || stockResult.data.results.length === 0) {
    throw new Error('테스트할 재고가 없습니다')
  }
  
  const testStock = stockResult.data.results[0]
  const testQuantity = Math.min(5, Math.floor(testStock.current_quantity / 4))
  
  if (testQuantity <= 0) {
    throw new Error('폐기할 수량이 부족합니다')
  }
  
  const testData = {
    itemId: testStock.id,
    quantity: testQuantity,
    reason: '자동 테스트 폐기',
    notes: '자동 테스트 폐기 비고',
    disposedBy: '테스트 폐기자'
  }
  
  const response = await fetch(`${BASE_URL}/disposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  }
  
  const result = await response.json()
  
  if (!result.ok) {
    throw new Error(result.error || '폐기 실패')
  }
  
  // 폐기 후 재고 감소 확인
  if (result.data.newQuantity !== result.data.previousQuantity - testQuantity) {
    throw new Error('재고 감소 계산 오류')
  }
  
  return result.data
}

// 4. 검색 기능 테스트
const testSearch = async () => {
  const testQueries = [
    { query: '테스트', category: '', minPrice: 0, maxPrice: 100000, inStock: true },
    { query: '전기', category: '전기자재', minPrice: 1000, maxPrice: 20000, inStock: true },
    { query: '케이블', category: '', minPrice: 0, maxPrice: 0, inStock: false }
  ]
  
  const results = []
  
  for (const queryData of testQueries) {
    const response = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryData)
    })
    
    if (!response.ok) {
      throw new Error(`검색 쿼리 실패: ${queryData.query}`)
    }
    
    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(result.error || '검색 실패')
    }
    
    // 검색 결과 검증
    if (typeof result.data.resultCount !== 'number') {
      throw new Error('검색 결과 수가 유효하지 않습니다')
    }
    
    results.push({
      query: queryData.query,
      resultCount: result.data.resultCount,
      totalQuantity: result.data.totalQuantity,
      totalValue: result.data.totalValue
    })
  }
  
  return results
}

// 5. 재고 계산 테스트
const testStockCalculation = async () => {
  // 현재 재고 조회
  const response = await fetch(`${BASE_URL}/search?q=테스트`)
  if (!response.ok) {
    throw new Error('재고 조회 실패')
  }
  
  const result = await response.json()
  if (!result.data.results || result.data.results.length === 0) {
    throw new Error('테스트할 재고가 없습니다')
  }
  
  let calculationErrors = 0
  let calculationSuccess = 0
  
  for (const stock of result.data.results) {
    // 음수 재고 체크
    if (stock.current_quantity < 0) {
      calculationErrors++
      console.warn(`음수 재고 발견: ${stock.name} (${stock.current_quantity})`)
    }
    
    // 총액 계산 정확성 체크
    const calculatedAmount = stock.current_quantity * stock.unit_price
    const tolerance = 0.01 // 부동소수점 오차 허용
    
    if (Math.abs(calculatedAmount - stock.total_amount) > tolerance) {
      calculationErrors++
      console.warn(`총액 계산 오류: ${stock.name} (계산: ${calculatedAmount}, 저장: ${stock.total_amount})`)
    } else {
      calculationSuccess++
    }
  }
  
  if (calculationErrors > 0) {
    throw new Error(`재고 계산 오류 ${calculationErrors}건, 성공 ${calculationSuccess}건`)
  }
  
  return {
    totalItems: result.data.results.length,
    calculationSuccess,
    calculationErrors
  }
}

// 6. 데이터 무결성 테스트
const testDataIntegrity = async () => {
  // 모든 재고 데이터 조회
  const response = await fetch(`${BASE_URL}/search?q=`)
  if (!response.ok) {
    throw new Error('전체 재고 조회 실패')
  }
  
  const result = await response.json()
  if (!result.data.results) {
    throw new Error('재고 데이터가 없습니다')
  }
  
  let integrityErrors = 0
  let integritySuccess = 0
  
  for (const stock of result.data.results) {
    // 기본 데이터 검증
    if (!stock.id || !stock.name || stock.unit_price < 0) {
      integrityErrors++
      continue
    }
    
    // 재고 수량 검증
    if (stock.current_quantity < 0) {
      integrityErrors++
      continue
    }
    
    // 총액 계산 검증
    const calculatedAmount = stock.current_quantity * stock.unit_price
    if (Math.abs(calculatedAmount - stock.total_amount) > 0.01) {
      integrityErrors++
      continue
    }
    
    integritySuccess++
  }
  
  const integrityRate = (integritySuccess / result.data.results.length) * 100
  
  if (integrityRate < 95) {
    throw new Error(`데이터 무결성 낮음: ${integrityRate.toFixed(1)}% (성공: ${integritySuccess}, 오류: ${integrityErrors})`)
  }
  
  return {
    totalItems: result.data.results.length,
    integritySuccess,
    integrityErrors,
    integrityRate: integrityRate.toFixed(1) + '%'
  }
}

// 전체 테스트 실행
const runAllTests = async () => {
  console.log('🚀 재고관리 시스템 전체 테스트 시작!')
  console.log('=' * 50)
  
  const startTime = Date.now()
  
  try {
    // 각 테스트 실행
    await runTest('입고 기능', testStockIn)
    await runTest('출고 기능', testStockOut)
    await runTest('폐기 기능', testDisposal)
    await runTest('검색 기능', testSearch)
    await runTest('재고 계산', testStockCalculation)
    await runTest('데이터 무결성', testDataIntegrity)
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // 결과 요약
    const successCount = testResults.filter(r => r.status === 'success').length
    const errorCount = testResults.filter(r => r.status === 'error').length
    const successRate = ((successCount / testResults.length) * 100).toFixed(1)
    
    console.log('=' * 50)
    console.log('🎯 테스트 완료!')
    console.log(`총 테스트: ${testResults.length}`)
    console.log(`성공: ${successCount}`)
    console.log(`실패: ${errorCount}`)
    console.log(`성공률: ${successRate}%`)
    console.log(`총 소요시간: ${totalTime}ms`)
    console.log('=' * 50)
    
    // 상세 결과 출력
    console.log('\n📊 상세 테스트 결과:')
    testResults.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : '❌'
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.status} (${result.duration})`)
      if (result.status === 'error' && result.error) {
        console.log(`   오류: ${result.error}`)
      }
    })
    
    return {
      totalTests: testResults.length,
      successCount,
      errorCount,
      successRate: successRate + '%',
      totalTime: totalTime + 'ms',
      results: testResults
    }
    
  } catch (error) {
    console.error('❌ 전체 테스트 실행 중 오류:', error)
    throw error
  }
}

// 브라우저에서 실행할 수 있도록 전역 함수로 노출
if (typeof window !== 'undefined') {
  window.runStockTests = runAllTests
  window.testResults = testResults
  console.log('🧪 재고관리 시스템 테스트 스크립트 로드 완료!')
  console.log('테스트 실행: runStockTests()')
  console.log('결과 확인: testResults')
}

// Node.js 환경에서 실행
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testResults,
    runTest
  }
}
