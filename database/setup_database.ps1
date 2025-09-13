# =============================================
# 데이터베이스 설정 및 초기화 PowerShell 스크립트
# =============================================

param(
    [string]$DBName = "unecorailelectric",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432"
)

# 로그 함수
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 백업 디렉토리 설정
$BackupDir = ".\backup"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

# 백업 디렉토리 생성
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-LogInfo "데이터베이스 설정을 시작합니다..."

# 1. 기존 데이터베이스 백업 (존재하는 경우)
Write-LogInfo "기존 데이터베이스 백업 중..."
try {
    $dbExists = psql -h $DBHost -U $DBUser -lqt | Select-String $DBName
    if ($dbExists) {
        $backupFile = "$BackupDir\backup_before_setup_$Date.sql"
        pg_dump -h $DBHost -U $DBUser -d $DBName | Out-File -FilePath $backupFile -Encoding UTF8
        Write-LogSuccess "기존 데이터베이스가 백업되었습니다: $backupFile"
    } else {
        Write-LogWarning "기존 데이터베이스가 존재하지 않습니다."
    }
} catch {
    Write-LogWarning "백업 중 오류가 발생했습니다: $($_.Exception.Message)"
}

# 2. 데이터베이스 생성
Write-LogInfo "데이터베이스 생성 중..."
try {
    psql -h $DBHost -U $DBUser -c "DROP DATABASE IF EXISTS $DBName;" | Out-Null
    psql -h $DBHost -U $DBUser -c "CREATE DATABASE $DBName;" | Out-Null
    Write-LogSuccess "데이터베이스 '$DBName'이 생성되었습니다."
} catch {
    Write-LogError "데이터베이스 생성에 실패했습니다: $($_.Exception.Message)"
    exit 1
}

# 3. 테이블 생성
Write-LogInfo "테이블 생성 중..."
try {
    psql -h $DBHost -U $DBUser -d $DBName -f "create_tables.sql" | Out-Null
    Write-LogSuccess "테이블이 생성되었습니다."
} catch {
    Write-LogError "테이블 생성에 실패했습니다: $($_.Exception.Message)"
    exit 1
}

# 4. 샘플 데이터 삽입
Write-LogInfo "샘플 데이터 삽입 중..."
try {
    psql -h $DBHost -U $DBUser -d $DBName -f "sample_data.sql" | Out-Null
    Write-LogSuccess "샘플 데이터가 삽입되었습니다."
} catch {
    Write-LogError "샘플 데이터 삽입에 실패했습니다: $($_.Exception.Message)"
    exit 1
}

# 5. 데이터 검증
Write-LogInfo "데이터 검증 중..."
$validationQuery = @"
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'work_diary', COUNT(*) FROM work_diary
UNION ALL
SELECT 'local_events', COUNT(*) FROM local_events
UNION ALL
SELECT 'project_events', COUNT(*) FROM project_events;
"@

try {
    psql -h $DBHost -U $DBUser -d $DBName -c $validationQuery
} catch {
    Write-LogWarning "데이터 검증 중 오류가 발생했습니다: $($_.Exception.Message)"
}

# 6. 최종 백업 생성
Write-LogInfo "최종 백업 생성 중..."
try {
    $finalBackup = "$BackupDir\initial_setup_$Date.sql"
    pg_dump -h $DBHost -U $DBUser -d $DBName | Out-File -FilePath $finalBackup -Encoding UTF8
    Write-LogSuccess "데이터베이스 설정이 완료되었습니다!"
    Write-LogInfo "백업 파일: $finalBackup"
} catch {
    Write-LogWarning "최종 백업 생성 중 오류가 발생했습니다: $($_.Exception.Message)"
}

# 7. 연결 정보 출력
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "데이터베이스 연결 정보" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "호스트: $DBHost"
Write-Host "포트: $DBPort"
Write-Host "데이터베이스: $DBName"
Write-Host "사용자: $DBUser"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 8. 다음 단계 안내
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 환경 변수 설정 (.env 파일)"
Write-Host "2. 애플리케이션 실행"
Write-Host "3. 데이터베이스 연결 테스트"
Write-Host ""

Write-LogSuccess "설정 완료!"
