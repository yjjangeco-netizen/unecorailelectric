# 재고관리 시스템 PowerShell 테스트 스크립트
# PowerShell에서 실행하여 각 기능을 테스트합니다

param(
    [string]$BaseUrl = "http://localhost:3000",
    [int]$TestCount = 10
)

# 테스트 결과 저장
$Global:TestResults = @()
$Global:StartTime = Get-Date

# 로그 함수
function Write-TestLog {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch ($Type) {
        "Success" { "Green" }
        "Error" { "Red" }
        "Warning" { "Yellow" }
        "Info" { "Cyan" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

# 테스트 실행 함수
function Invoke-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestScript
    )
    
    Write-TestLog "🧪 $TestName 테스트 시작..." "Info"
    $testStartTime = Get-Date
    
    try {
        $result = & $TestScript
        $testEndTime = Get-Date
        $duration = ($testEndTime - $testStartTime).TotalMilliseconds
        
        $testResult = @{
            Test = $TestName
            Status = "Success"
            Duration = [math]::Round($duration, 2)
            Result = $result
            Timestamp = Get-Date
        }
        
        $Global:TestResults += $testResult
        Write-TestLog "✅ $TestName 성공 ($([math]::Round($duration, 2))ms)" "Success"
        return $testResult
        
    } catch {
        $testEndTime = Get-Date
        $duration = ($testEndTime - $testStartTime).TotalMilliseconds
        
        $testResult = @{
            Test = $TestName
            Status = "Error"
            Duration = [math]::Round($duration, 2)
            Error = $_.Exception.Message
            Timestamp = Get-Date
        }
        
        $Global:TestResults += $testResult
        Write-TestLog "❌ $TestName 실패 ($([math]::Round($duration, 2))ms): $($_.Exception.Message)" "Error"
        return $testResult
    }
}

# 1. 입고 기능 테스트
function Test-StockIn {
    $testData = @{
        itemName = "테스트 품목 $(Get-Date -Format 'yyyyMMddHHmmss')"
        quantity = 100
        unitPrice = 5000
        notes = "PowerShell 자동 테스트 입고"
        conditionType = "new"
        reason = "테스트 사유"
        orderedBy = "PowerShell 테스트 주문자"
        receivedBy = "PowerShell 테스트 입고자"
    }
    
    $jsonBody = $testData | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/test/stock-in" -Method Post -Body $jsonBody -ContentType "application/json"
        
        if (-not $response.ok) {
            throw "입고 실패: $($response.error)"
        }
        
        # 데이터 검증
        if ($response.data.quantity -ne $testData.quantity) {
            throw "수량 불일치: 예상 $($testData.quantity), 실제 $($response.data.quantity)"
        }
        
        if ($response.data.unitPrice -ne $testData.unitPrice) {
            throw "단가 불일치: 예상 $($testData.unitPrice), 실제 $($response.data.unitPrice)"
        }
        
        return $response.data
        
    } catch {
        throw "입고 테스트 오류: $($_.Exception.Message)"
    }
}

# 2. 출고 기능 테스트
function Test-StockOut {
    try {
        # 먼저 현재 재고 확인
        $stockResponse = Invoke-RestMethod -Uri "$BaseUrl/api/test/search?q=테스트" -Method Get
        
        if (-not $stockResponse.data.results -or $stockResponse.data.results.Count -eq 0) {
            throw "테스트할 재고가 없습니다"
        }
        
        $testStock = $stockResponse.data.results[0]
        $testQuantity = [math]::Min(10, [math]::Floor($testStock.current_quantity / 2))
        
        if ($testQuantity -le 0) {
            throw "출고할 수량이 부족합니다"
        }
        
        $testData = @{
            itemId = $testStock.id
            quantity = $testQuantity
            project = "PowerShell 자동 테스트 프로젝트"
            notes = "PowerShell 자동 테스트 출고"
            isRental = $false
            issuedBy = "PowerShell 테스트 출고자"
        }
        
        $jsonBody = $testData | ConvertTo-Json
        
        $stockOutResponse = Invoke-RestMethod -Uri "$BaseUrl/api/test/stock-out" -Method Post -Body $jsonBody -ContentType "application/json"
        
        if (-not $stockOutResponse.ok) {
            throw "출고 실패: $($stockOutResponse.error)"
        }
        
        # 출고 후 재고 감소 확인
        if ($stockOutResponse.data.newQuantity -ne ($stockOutResponse.data.previousQuantity - $testQuantity)) {
            throw "재고 감소 계산 오류"
        }
        
        return $stockOutResponse.data
        
    } catch {
        throw "출고 테스트 오류: $($_.Exception.Message)"
    }
}

# 3. 폐기 기능 테스트
function Test-Disposal {
    try {
        # 먼저 현재 재고 확인
        $stockResponse = Invoke-RestMethod -Uri "$BaseUrl/api/test/search?q=테스트" -Method Get
        
        if (-not $stockResponse.data.results -or $stockResponse.data.results.Count -eq 0) {
            throw "테스트할 재고가 없습니다"
        }
        
        $testStock = $stockResponse.data.results[0]
        $testQuantity = [math]::Min(5, [math]::Floor($testStock.current_quantity / 4))
        
        if ($testQuantity -le 0) {
            throw "폐기할 수량이 부족합니다"
        }
        
        $testData = @{
            itemId = $testStock.id
            quantity = $testQuantity
            reason = "PowerShell 자동 테스트 폐기"
            notes = "PowerShell 자동 테스트 폐기 비고"
            disposedBy = "PowerShell 테스트 폐기자"
        }
        
        $jsonBody = $testData | ConvertTo-Json
        
        $disposalResponse = Invoke-RestMethod -Uri "$BaseUrl/api/test/disposal" -Method Post -Body $jsonBody -ContentType "application/json"
        
        if (-not $disposalResponse.ok) {
            throw "폐기 실패: $($disposalResponse.error)"
        }
        
        # 폐기 후 재고 감소 확인
        if ($disposalResponse.data.newQuantity -ne ($disposalResponse.data.previousQuantity - $testQuantity)) {
            throw "재고 감소 계산 오류"
        }
        
        return $disposalResponse.data
        
    } catch {
        throw "폐기 테스트 오류: $($_.Exception.Message)"
    }
}

# 4. 검색 기능 테스트
function Test-Search {
    $testQueries = @(
        @{ query = "테스트"; category = ""; minPrice = 0; maxPrice = 100000; inStock = $true },
        @{ query = "전기"; category = "전기자재"; minPrice = 1000; maxPrice = 20000; inStock = $true },
        @{ query = "케이블"; category = ""; minPrice = 0; maxPrice = 0; inStock = $false }
    )
    
    $results = @()
    
    foreach ($queryData in $testQueries) {
        try {
            $jsonBody = $queryData | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/test/search" -Method Post -Body $jsonBody -ContentType "application/json"
            
            if (-not $response.ok) {
                throw "검색 쿼리 실패: $($queryData.query)"
            }
            
            # 검색 결과 검증
            if ($response.data.resultCount -isnot [int]) {
                throw "검색 결과 수가 유효하지 않습니다"
            }
            
            $results += @{
                query = $queryData.query
                resultCount = $response.data.resultCount
                totalQuantity = $response.data.totalQuantity
                totalValue = $response.data.totalValue
            }
            
        } catch {
            throw "검색 테스트 오류: $($_.Exception.Message)"
        }
    }
    
    return $results
}

# 5. 재고 계산 테스트
function Test-StockCalculation {
    try {
        # 현재 재고 조회
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/test/search?q=테스트" -Method Get
        
        if (-not $response.data.results -or $response.data.results.Count -eq 0) {
            throw "테스트할 재고가 없습니다"
        }
        
        $calculationErrors = 0
        $calculationSuccess = 0
        
        foreach ($stock in $response.data.results) {
            # 음수 재고 체크
            if ($stock.current_quantity -lt 0) {
                $calculationErrors++
                Write-TestLog "음수 재고 발견: $($stock.name) ($($stock.current_quantity))" "Warning"
            }
            
            # 총액 계산 정확성 체크
            $calculatedAmount = $stock.current_quantity * $stock.unit_price
            $tolerance = 0.01 # 부동소수점 오차 허용
            
            if ([math]::Abs($calculatedAmount - $stock.total_amount) -gt $tolerance) {
                $calculationErrors++
                Write-TestLog "총액 계산 오류: $($stock.name) (계산: $calculatedAmount, 저장: $($stock.total_amount))" "Warning"
            } else {
                $calculationSuccess++
            }
        }
        
        if ($calculationErrors -gt 0) {
            throw "재고 계산 오류 $calculationErrors건, 성공 $calculationSuccess건"
        }
        
        return @{
            totalItems = $response.data.results.Count
            calculationSuccess = $calculationSuccess
            calculationErrors = $calculationErrors
        }
        
    } catch {
        throw "재고 계산 테스트 오류: $($_.Exception.Message)"
    }
}

# 6. 데이터 무결성 테스트
function Test-DataIntegrity {
    try {
        # 모든 재고 데이터 조회
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/test/search?q=" -Method Get
        
        if (-not $response.data.results) {
            throw "재고 데이터가 없습니다"
        }
        
        $integrityErrors = 0
        $integritySuccess = 0
        
        foreach ($stock in $response.data.results) {
            # 기본 데이터 검증
            if (-not $stock.id -or -not $stock.name -or $stock.unit_price -lt 0) {
                $integrityErrors++
                continue
            }
            
            # 재고 수량 검증
            if ($stock.current_quantity -lt 0) {
                $integrityErrors++
                continue
            }
            
            # 총액 계산 검증
            $calculatedAmount = $stock.current_quantity * $stock.unit_price
            if ([math]::Abs($calculatedAmount - $stock.total_amount) -gt 0.01) {
                $integrityErrors++
                continue
            }
            
            $integritySuccess++
        }
        
        $integrityRate = if ($response.data.results.Count -gt 0) { ($integritySuccess / $response.data.results.Count) * 100 } else { 0 }
        
        if ($integrityRate -lt 95) {
            throw "데이터 무결성 낮음: $([math]::Round($integrityRate, 1))% (성공: $integritySuccess, 오류: $integrityErrors)"
        }
        
        return @{
            totalItems = $response.data.results.Count
            integritySuccess = $integritySuccess
            integrityErrors = $integrityErrors
            integrityRate = "$([math]::Round($integrityRate, 1))%"
        }
        
    } catch {
        throw "데이터 무결성 테스트 오류: $($_.Exception.Message)"
    }
}

# 반복 테스트 실행
function Invoke-RepeatedTests {
    param([int]$Count = 10)
    
    Write-TestLog "🚀 재고관리 시스템 반복 테스트 시작! ($Count회)" "Info"
    Write-Host "=" * 50
    
    for ($i = 1; $i -le $Count; $i++) {
        Write-TestLog "🔄 반복 테스트 $i/$Count 시작..." "Info"
        
        try {
            # 각 테스트 실행
            Invoke-Test "입고 기능 (반복 $i)" { Test-StockIn }
            Start-Sleep -Seconds 1
            
            Invoke-Test "출고 기능 (반복 $i)" { Test-StockOut }
            Start-Sleep -Seconds 1
            
            Invoke-Test "폐기 기능 (반복 $i)" { Test-Disposal }
            Start-Sleep -Seconds 1
            
            Invoke-Test "검색 기능 (반복 $i)" { Test-Search }
            Start-Sleep -Seconds 1
            
            Invoke-Test "재고 계산 (반복 $i)" { Test-StockCalculation }
            Start-Sleep -Seconds 1
            
            Invoke-Test "데이터 무결성 (반복 $i)" { Test-DataIntegrity }
            
            Write-TestLog "✅ 반복 테스트 $i/$Count 완료" "Success"
            
        } catch {
            Write-TestLog "❌ 반복 테스트 $i/$Count 실패: $($_.Exception.Message)" "Error"
        }
        
        if ($i -lt $Count) {
            Write-TestLog "⏳ 다음 테스트까지 2초 대기..." "Info"
            Start-Sleep -Seconds 2
        }
    }
}

# 전체 테스트 실행
function Invoke-AllTests {
    Write-TestLog "🚀 재고관리 시스템 전체 테스트 시작!" "Info"
    Write-Host "=" * 50
    
    try {
        # 각 테스트 실행
        Invoke-Test "입고 기능" { Test-StockIn }
        Invoke-Test "출고 기능" { Test-StockOut }
        Invoke-Test "폐기 기능" { Test-Disposal }
        Invoke-Test "검색 기능" { Test-Search }
        Invoke-Test "재고 계산" { Test-StockCalculation }
        Invoke-Test "데이터 무결성" { Test-DataIntegrity }
        
        $endTime = Get-Date
        $totalTime = ($endTime - $Global:StartTime).TotalMilliseconds
        
        # 결과 요약
        $successCount = ($Global:TestResults | Where-Object { $_.Status -eq "Success" }).Count
        $errorCount = ($Global:TestResults | Where-Object { $_.Status -eq "Error" }).Count
        $successRate = if ($Global:TestResults.Count -gt 0) { [math]::Round(($successCount / $Global:TestResults.Count) * 100, 1) } else { 0 }
        
        Write-Host "=" * 50
        Write-TestLog "🎯 테스트 완료!" "Success"
        Write-TestLog "총 테스트: $($Global:TestResults.Count)" "Info"
        Write-TestLog "성공: $successCount" "Success"
        Write-TestLog "실패: $errorCount" "Error"
        Write-TestLog "성공률: $successRate%" "Info"
        Write-TestLog "총 소요시간: $([math]::Round($totalTime, 2))ms" "Info"
        Write-Host "=" * 50
        
        # 상세 결과 출력
        Write-TestLog "📊 상세 테스트 결과:" "Info"
        for ($i = 0; $i -lt $Global:TestResults.Count; $i++) {
            $result = $Global:TestResults[$i]
            $icon = if ($result.Status -eq "Success") { "✅" } else { "❌" }
            Write-TestLog "$($i + 1). $icon $($result.Test): $($result.Status) ($($result.Duration)ms)" "Info"
            if ($result.Status -eq "Error" -and $result.Error) {
                Write-TestLog "   오류: $($result.Error)" "Error"
            }
        }
        
        return @{
            totalTests = $Global:TestResults.Count
            successCount = $successCount
            errorCount = $errorCount
            successRate = "$successRate%"
            totalTime = "$([math]::Round($totalTime, 2))ms"
            results = $Global:TestResults
        }
        
    } catch {
        Write-TestLog "❌ 전체 테스트 실행 중 오류: $($_.Exception.Message)" "Error"
        throw
    }
}

# 메인 실행
try {
    Write-TestLog "🧪 재고관리 시스템 PowerShell 테스트 스크립트 로드 완료!" "Info"
    Write-TestLog "사용 가능한 함수들:" "Info"
    Write-TestLog "  - Invoke-AllTests: 전체 테스트 실행" "Info"
    Write-TestLog "  - Invoke-RepeatedTests -Count 10: 10회 반복 테스트" "Info"
    Write-TestLog "  - Test-StockIn: 입고 기능 테스트" "Info"
    Write-TestLog "  - Test-StockOut: 출고 기능 테스트" "Info"
    Write-TestLog "  - Test-Disposal: 폐기 기능 테스트" "Info"
    Write-TestLog "  - Test-Search: 검색 기능 테스트" "Info"
    Write-TestLog "  - Test-StockCalculation: 재고 계산 테스트" "Info"
    Write-TestLog "  - Test-DataIntegrity: 데이터 무결성 테스트" "Info"
    
    # 자동으로 전체 테스트 실행
    Write-TestLog "자동으로 전체 테스트를 실행합니다..." "Info"
    $result = Invoke-AllTests
    
    # 반복 테스트 실행 (사용자가 원할 경우)
    if ($TestCount -gt 1) {
        Write-TestLog "반복 테스트를 실행합니다 ($TestCount회)..." "Info"
        Invoke-RepeatedTests -Count $TestCount
    }
    
} catch {
    Write-TestLog "❌ 테스트 실행 중 오류 발생: $($_.Exception.Message)" "Error"
    exit 1
}
