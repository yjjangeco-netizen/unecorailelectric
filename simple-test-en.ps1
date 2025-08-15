# Simple Inventory Management System Test Script

Write-Host "🧪 Inventory Management System Simple Test Started!" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# 1. Server Connection Test
Write-Host "1. Server Connection Test..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Get -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Server Connection Success: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Server Connection Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Test Data Setup
Write-Host "2. Test Data Setup..." -ForegroundColor Yellow
try {
    $setupResponse = Invoke-WebRequest -Uri "$baseUrl/api/test/setup" -Method Post -UseBasicParsing -Body "{}" -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Test Data Setup Success: $($setupResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Test Data Setup Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Search Function Test
Write-Host "3. Search Function Test..." -ForegroundColor Yellow
try {
    $searchResponse = Invoke-WebRequest -Uri "$baseUrl/api/test/search?q=test" -Method Get -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ Search Function Success: $($searchResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Search Function Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Stock In Function Test
Write-Host "4. Stock In Function Test..." -ForegroundColor Yellow
try {
    $stockInData = @{
        itemName = "Test Item $(Get-Date -Format 'yyyyMMddHHmmss')"
        quantity = 100
        unitPrice = 5000
        notes = "Simple Test Stock In"
        conditionType = "new"
        reason = "Test"
        orderedBy = "Test Orderer"
        receivedBy = "Test Receiver"
    } | ConvertTo-Json
    
    $stockInResponse = Invoke-WebRequest -Uri "$baseUrl/api/test/stock-in" -Method Post -UseBasicParsing -Body $stockInData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Stock In Function Success: $($stockInResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Stock In Function Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎯 Simple Test Completed!" -ForegroundColor Cyan
