import { test, expect } from '@playwright/test'

// 스트레스 테스트: 100회 반복 시나리오
test.describe('재고관리 스트레스 테스트', () => {
  const STRESS_COUNT = 100
  
  test.beforeEach(async ({ page }) => {
    // 테스트 페이지로 이동
    await page.goto('/test')
    await page.waitForLoadState('networkidle')
  })

  test('입고/출고/검색 100회 스트레스 테스트', async ({ page }) => {
    const results = {
      success: 0,
      failed: 0,
      times: [] as number[]
    }

    for (let i = 1; i <= STRESS_COUNT; i++) {
      const startTime = Date.now()
      
      try {
        // 1. 테스트 데이터 초기화
        await page.click('button:has-text("결과 초기화")')
        await page.waitForTimeout(100)

        // 2. 입고 테스트
        await page.click('button:has-text("입고 테스트")')
        await page.waitForSelector('.test-result:has-text("입고 테스트") .status-passed', { timeout: 5000 })

        // 3. 출고 테스트
        await page.click('button:has-text("출고 테스트")')
        await page.waitForSelector('.test-result:has-text("출고 테스트") .status-passed', { timeout: 5000 })

        // 4. 검색 테스트
        await page.click('button:has-text("검색 테스트")')
        await page.waitForSelector('.test-result:has-text("검색 테스트") .status-passed', { timeout: 5000 })

        const endTime = Date.now()
        const duration = endTime - startTime
        results.times.push(duration)
        results.success++

        console.log(`✅ 반복 ${i}/${STRESS_COUNT}: ${duration}ms`)

      } catch (error) {
        results.failed++
        console.error(`❌ 반복 ${i}/${STRESS_COUNT} 실패:`, error)
      }

      // 서버 부하 완화를 위한 간격
      if (i % 10 === 0) {
        await page.waitForTimeout(1000)
      }
    }

    // 결과 분석
    const avgTime = results.times.reduce((a, b) => a + b, 0) / results.times.length
    const maxTime = Math.max(...results.times)
    const minTime = Math.min(...results.times)
    const successRate = (results.success / STRESS_COUNT) * 100

    console.log('\n📊 스트레스 테스트 결과:')
    console.log(`성공: ${results.success}/${STRESS_COUNT} (${successRate.toFixed(1)}%)`)
    console.log(`실패: ${results.failed}/${STRESS_COUNT}`)
    console.log(`평균 시간: ${avgTime.toFixed(0)}ms`)
    console.log(`최대 시간: ${maxTime}ms`)
    console.log(`최소 시간: ${minTime}ms`)

    // 성능 기준 검증
    expect(successRate).toBeGreaterThanOrEqual(95) // 95% 이상 성공률
    expect(avgTime).toBeLessThan(3000) // 평균 3초 이내
    expect(maxTime).toBeLessThan(10000) // 최대 10초 이내
  })

  test('동시성 테스트: 동일 품목 출고 경합', async ({ page, context }) => {
    // 여러 페이지에서 동시 출고 시도
    const pages = [page]
    
    // 추가 페이지 생성
    for (let i = 1; i < 5; i++) {
      const newPage = await context.newPage()
      await newPage.goto('/test')
      await newPage.waitForLoadState('networkidle')
      pages.push(newPage)
    }

    try {
      // 1. 테스트 품목 생성 (충분한 재고)
      await page.click('button:has-text("테스트 데이터 초기화")')
      await page.waitForTimeout(1000)

      await page.click('button:has-text("입고 테스트")')
      await page.waitForSelector('.test-result:has-text("입고 테스트") .status-passed')

      // 2. 모든 페이지에서 동시에 출고 시도
      const concurrentTests = pages.map(async (p, index) => {
        try {
          await p.click('button:has-text("출고 테스트")')
          await p.waitForSelector('.test-result:has-text("출고 테스트")', { timeout: 10000 })
          
          const status = await p.$('.test-result:has-text("출고 테스트") .status-passed')
          return { page: index, success: !!status }
        } catch (error) {
          return { page: index, success: false, error }
        }
      })

      const results = await Promise.all(concurrentTests)
      
      // 결과 분석
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      console.log('\n🔄 동시성 테스트 결과:')
      console.log(`성공한 페이지: ${successCount}/${pages.length}`)
      console.log(`실패한 페이지: ${failCount}/${pages.length}`)

      // 최소 1개는 성공해야 함 (재고가 있으므로)
      expect(successCount).toBeGreaterThanOrEqual(1)

    } finally {
      // 추가 생성한 페이지 정리
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close()
      }
    }
  })

  test('대량 데이터 성능 테스트', async ({ page }) => {
    // 대량 데이터 시나리오
    const testCases = [
      { name: '소량 테스트', iterations: 10 },
      { name: '중량 테스트', iterations: 50 },
      { name: '대량 테스트', iterations: 100 }
    ]

    for (const testCase of testCases) {
      console.log(`\n📊 ${testCase.name} (${testCase.iterations}회)`)
      const startTime = Date.now()

      // 테스트 초기화
      await page.click('button:has-text("결과 초기화")')
      await page.waitForTimeout(500)

      // 지정된 횟수만큼 입고/출고 반복
      for (let i = 0; i < testCase.iterations; i++) {
        try {
          // 입고
          await page.click('button:has-text("입고 테스트")')
          await page.waitForSelector('.test-result:has-text("입고 테스트") .status-passed', { timeout: 5000 })

          // 간헐적 출고 (재고 소진 방지)
          if (i % 3 === 0) {
            await page.click('button:has-text("출고 테스트")')
            await page.waitForSelector('.test-result:has-text("출고 테스트")', { timeout: 5000 })
          }

        } catch (error) {
          console.error(`${testCase.name} ${i+1}회차 실패:`, error)
        }

        // 진행률 표시
        if ((i + 1) % 10 === 0) {
          console.log(`  진행률: ${i + 1}/${testCase.iterations}`)
        }
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      const avgTimePerOperation = totalTime / testCase.iterations

      console.log(`  완료 시간: ${totalTime}ms`)
      console.log(`  평균 시간: ${avgTimePerOperation.toFixed(1)}ms/회`)

      // 성능 기준 (반복 횟수에 따라 조정)
      const maxTimePerOperation = testCase.iterations <= 10 ? 1000 : 
                                  testCase.iterations <= 50 ? 2000 : 3000

      expect(avgTimePerOperation).toBeLessThan(maxTimePerOperation)
    }
  })

  test('메모리 누수 감지 테스트', async ({ page }) => {
    // 메모리 사용량 모니터링
    const performanceEntries: number[] = []

    for (let i = 0; i < 50; i++) {
      // 테스트 실행
      await page.click('button:has-text("전체 테스트 실행")')
      await page.waitForSelector('.overall-results', { timeout: 10000 })

      // 메모리 사용량 측정 (브라우저 내 힙 사이즈)
      const memoryInfo = await page.evaluate(() => {
        return (window.performance as any).memory ? {
          usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize
        } : null
      })

      if (memoryInfo) {
        performanceEntries.push(memoryInfo.usedJSHeapSize)
      }

      // 테스트 초기화
      await page.click('button:has-text("결과 초기화")')
      await page.waitForTimeout(100)

      if (i % 10 === 0) {
        console.log(`메모리 테스트 진행률: ${i + 1}/50`)
      }
    }

    if (performanceEntries.length > 0) {
      const firstMemory = performanceEntries[0]
      const lastMemory = performanceEntries[performanceEntries.length - 1]
      const memoryGrowth = lastMemory - firstMemory
      const memoryGrowthPercent = (memoryGrowth / firstMemory) * 100

      console.log('\n🧠 메모리 사용량 분석:')
      console.log(`초기 메모리: ${(firstMemory / 1024 / 1024).toFixed(1)}MB`)
      console.log(`최종 메모리: ${(lastMemory / 1024 / 1024).toFixed(1)}MB`)
      console.log(`메모리 증가: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB (${memoryGrowthPercent.toFixed(1)}%)`)

      // 메모리 누수 기준: 50% 이상 증가하면 의심
      expect(memoryGrowthPercent).toBeLessThan(50)
    }
  })

  test('네트워크 실패 복구 테스트', async ({ page, context }) => {
    // 네트워크 차단 시뮬레이션
    await context.setOffline(true)

    // 오프라인 상태에서 테스트 시도
    await page.click('button:has-text("입고 테스트")')
    
    // 네트워크 오류 메시지 확인
    await expect(page.locator('.test-result:has-text("네트워크") .status-failed')).toBeVisible({ timeout: 5000 })

    // 네트워크 복구
    await context.setOffline(false)
    await page.waitForTimeout(1000)

    // 복구 후 정상 동작 확인
    await page.click('button:has-text("입고 테스트")')
    await expect(page.locator('.test-result:has-text("입고 테스트") .status-passed')).toBeVisible({ timeout: 10000 })
  })

  test('API 응답 시간 분포 분석', async ({ page }) => {
    const responseTimes = {
      stockIn: [] as number[],
      stockOut: [] as number[],
      search: [] as number[]
    }

    for (let i = 0; i < 30; i++) {
      // 입고 테스트 응답 시간
      const stockInStart = Date.now()
      await page.click('button:has-text("입고 테스트")')
      await page.waitForSelector('.test-result:has-text("입고 테스트") .status-passed')
      responseTimes.stockIn.push(Date.now() - stockInStart)

      // 출고 테스트 응답 시간
      const stockOutStart = Date.now()
      await page.click('button:has-text("출고 테스트")')
      await page.waitForSelector('.test-result:has-text("출고 테스트")')
      responseTimes.stockOut.push(Date.now() - stockOutStart)

      // 검색 테스트 응답 시간
      const searchStart = Date.now()
      await page.click('button:has-text("검색 테스트")')
      await page.waitForSelector('.test-result:has-text("검색 테스트") .status-passed')
      responseTimes.search.push(Date.now() - searchStart)

      await page.click('button:has-text("결과 초기화")')
      await page.waitForTimeout(100)
    }

    // 통계 분석
    for (const [apiName, times] of Object.entries(responseTimes)) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length
      const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
      const p99 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)]

      console.log(`\n📈 ${apiName} API 응답 시간:`)
      console.log(`  평균: ${avg.toFixed(0)}ms`)
      console.log(`  95분위: ${p95}ms`)
      console.log(`  99분위: ${p99}ms`)

      // SLA 기준
      expect(avg).toBeLessThan(2000) // 평균 2초 이내
      expect(p95).toBeLessThan(5000) // 95분위 5초 이내
    }
  })
})
