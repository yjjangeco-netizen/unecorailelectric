import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - 유네코레일 전기파트 시스템', () => {
  test('메인 페이지 로드 및 기본 네비게이션', async ({ page }) => {
    // 메인 페이지 로드
    await page.goto('/');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/유네코레일/);
    
    // 주요 네비게이션 링크 존재 확인
    await expect(page.getByText('재고관리')).toBeVisible();
    await expect(page.getByText('업무일지')).toBeVisible();
    await expect(page.getByText('메뉴얼 관리')).toBeVisible();
    await expect(page.getByText('SOP')).toBeVisible();
  });

  test('재고관리 페이지 접근 및 기본 UI', async ({ page }) => {
    await page.goto('/stock-management');
    
    // 재고관리 페이지 로드 확인
    await expect(page.getByText('재고 현황')).toBeVisible();
    
    // 주요 버튼들 존재 확인
    await expect(page.getByText('입고')).toBeVisible();
    await expect(page.getByText('출고')).toBeVisible();
    await expect(page.getByText('검색')).toBeVisible();
  });

  test('업무일지 페이지 접근 및 캘린더 표시', async ({ page }) => {
    await page.goto('/work-diary');
    
    // 업무일지 페이지 로드 확인
    await expect(page.getByText('업무일지')).toBeVisible();
    
    // 캘린더 또는 날짜 관련 요소 확인
    await expect(page.locator('[role="grid"], .calendar, input[type="date"]')).toBeVisible();
  });

  test('SOP 페이지 접근 및 문서 관리', async ({ page }) => {
    await page.goto('/sop');
    
    // SOP 페이지 로드 확인
    await expect(page.getByText('SOP 관리') || page.getByText('표준작업절차')).toBeVisible();
  });

  test('메뉴얼 관리 페이지 접근', async ({ page }) => {
    await page.goto('/manual-management');
    
    // 메뉴얼 관리 페이지 로드 확인
    await expect(page.getByText('메뉴얼 관리')).toBeVisible();
  });

  test('재고 마감 페이지 접근', async ({ page }) => {
    await page.goto('/stock-closing');
    
    // 재고 마감 페이지 로드 확인
    await expect(page.getByText('재고 마감') || page.getByText('분기별 마감')).toBeVisible();
  });

  test('API 헬스체크 - 재고 API 응답', async ({ request }) => {
    // 재고 API 엔드포인트 테스트
    const response = await request.get('/api/stock/in');
    
    // API가 응답하는지 확인 (401 Unauthorized는 정상 - 인증 필요)
    expect([200, 401, 403].includes(response.status())).toBeTruthy();
  });

  test('반응형 디자인 - 모바일 뷰포트', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 메인 페이지가 모바일에서도 로드되는지 확인
    await expect(page.getByText('유네코레일')).toBeVisible();
    
    // 모바일 메뉴 또는 네비게이션 확인
    await expect(page.locator('button, [role="button"]')).toBeVisible();
  });

  test('페이지 성능 - 초기 로드 시간', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 5초 이내 로드 확인 (성능 임계값)
    expect(loadTime).toBeLessThan(5000);
  });

  test('오류 페이지 처리 - 404', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // 404 오류 처리 확인 (Next.js 기본 404 또는 커스텀 404)
    await expect(page.getByText('404') || page.getByText('Not Found') || page.getByText('페이지를 찾을 수 없습니다')).toBeVisible();
  });
});
