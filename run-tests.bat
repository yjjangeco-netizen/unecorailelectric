@echo off
chcp 65001 >nul
title 재고관리 시스템 테스트 실행기

echo.
echo ========================================
echo 🧪 재고관리 시스템 테스트 실행기
echo ========================================
echo.

:menu
echo 선택하세요:
echo.
echo 1. 개발 서버 시작
echo 2. 웹 브라우저 테스트 실행
echo 3. PowerShell 테스트 실행
echo 4. API 직접 테스트
echo 5. 모든 테스트 실행 (100회)
echo 6. 종료
echo.
set /p choice="선택 (1-6): "

if "%choice%"=="1" goto start-server
if "%choice%"=="2" goto web-test
if "%choice%"=="3" goto powershell-test
if "%choice%"=="4" goto api-test
if "%choice%"=="5" goto run-all-tests
if "%choice%"=="6" goto exit
echo 잘못된 선택입니다. 다시 선택해주세요.
goto menu

:start-server
echo.
echo 🚀 개발 서버를 시작합니다...
echo 포트 3000에서 실행됩니다.
echo.
echo 브라우저에서 http://localhost:3000 으로 접속하세요.
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요.
echo.
npm run dev
goto menu

:web-test
echo.
echo 🌐 웹 브라우저 테스트를 실행합니다...
echo.
echo 1. 브라우저에서 http://localhost:3000/test.html 접속
echo 2. "전체 테스트 실행" 버튼 클릭
echo 3. 테스트 결과 확인
echo.
pause
goto menu

:powershell-test
echo.
echo 💻 PowerShell 테스트를 실행합니다...
echo.
echo 테스트 스크립트를 로드하고 실행합니다...
echo.
powershell -ExecutionPolicy Bypass -File "test-powershell.ps1"
echo.
pause
goto menu

:api-test
echo.
echo 🔌 API 직접 테스트를 실행합니다...
echo.
echo 테스트 데이터를 생성합니다...
curl -X POST http://localhost:3000/api/test/setup
echo.
echo.
echo 입고 테스트를 실행합니다...
curl -X POST http://localhost:3000/api/test/stock-in -H "Content-Type: application/json" -d "{\"itemName\":\"테스트품목\",\"quantity\":100,\"unitPrice\":5000}"
echo.
echo.
echo 출고 테스트를 실행합니다...
curl -X POST http://localhost:3000/api/test/stock-out -H "Content-Type: application/json" -d "{\"itemId\":\"test_stock_1\",\"quantity\":10}"
echo.
echo.
echo 폐기 테스트를 실행합니다...
curl -X POST http://localhost:3000/api/test/disposal -H "Content-Type: application/json" -d "{\"itemId\":\"test_stock_1\",\"quantity\":5,\"reason\":\"테스트폐기\"}"
echo.
echo.
echo 검색 테스트를 실행합니다...
curl -X POST http://localhost:3000/api/test/search -H "Content-Type: application/json" -d "{\"query\":\"테스트\",\"category\":\"\",\"minPrice\":0,\"maxPrice\":100000,\"inStock\":true}"
echo.
echo.
pause
goto menu

:run-all-tests
echo.
echo 🚀 모든 테스트를 100회 실행합니다...
echo.
echo 이 작업은 시간이 오래 걸릴 수 있습니다.
echo 계속하시겠습니까? (Y/N)
set /p confirm="계속: "
if /i "%confirm%"=="Y" goto run-100-tests
echo 테스트가 취소되었습니다.
pause
goto menu

:run-100-tests
echo.
echo 🧪 100회 반복 테스트를 시작합니다...
echo.
echo 테스트 진행 상황을 모니터링합니다...
echo.
powershell -ExecutionPolicy Bypass -File "test-powershell.ps1" -TestCount 100
echo.
echo 100회 테스트가 완료되었습니다!
pause
goto menu

:exit
echo.
echo 👋 테스트 실행기를 종료합니다.
echo.
pause
exit

:error
echo.
echo ❌ 오류가 발생했습니다.
echo.
echo 문제 해결 방법:
echo 1. 개발 서버가 실행 중인지 확인
echo 2. 포트 3000이 사용 가능한지 확인
echo 3. 필요한 패키지가 설치되었는지 확인
echo 4. 환경 변수가 올바르게 설정되었는지 확인
echo.
pause
goto menu
