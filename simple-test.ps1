# 간단한 재고관리 시스템 테스트 스크립트

Write-Host "🧪 재고관리 시스템 간단 테스트 시작!" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# 1. 서버 연결 테스트
Write-Host "1. 서버 연결 테스트..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Get -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ 서버 연결 성공: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 서버 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 테스트 데이터 설정
Write-Host "2. 테스트 데이터 설정..." -ForegroundColor Yellow
try {
    $setupResponse = Invoke-WebRequest -Uri "$baseUrl/api/test/setup" -Method Post -UseBasicParsing -Body "{}" -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 테스트 데이터 설정 성공: $($setupResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 테스트 데이터 설정 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 검색 기능 테스트
Write-Host "3. 검색 기능 테스트..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-WebRequest -Uri "$baseUrl/api/test/search?q=test" -Method Get -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ 검색 기능 성공: $($searchResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 검색 기능 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 입고 기능 테스트
Write-Host "4. 입고 기능 테스트..." -ForegroundColor Yellow
try {
    $stockInData = @{
        itemName = "테스트 품목 $(Get-Date -Format 'yyyyMMddHHmmss')"
        quantity = 100
        unitPrice = 5000
        notes = "간단 테스트 입고"
        conditionType = "new"
        reason = "테스트"
        orderedBy = "테스트 주문자"
        receivedBy = "테스트 입고자"
    } | ConvertTo-Json
    
    $stockInResponse = Invoke-WebRequest -Uri "$baseUrl/api/test/stock-in" -Method Post -UseBasicParsing -Body $stockInData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ 입고 기능 성공: $($stockInResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 입고 기능 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎯 간단 테스트 완료!" -ForegroundColor Cyan
