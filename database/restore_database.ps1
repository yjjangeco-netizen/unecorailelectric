# =============================================
# 데이터베이스 복구 PowerShell 스크립트
# =============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
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

# 사용법 출력
function Show-Usage {
    Write-Host "사용법: .\restore_database.ps1 -BackupFile <백업파일명>"
    Write-Host ""
    Write-Host "예시:"
    Write-Host "  .\restore_database.ps1 -BackupFile initial_setup_20241201_120000.sql"
    Write-Host "  .\restore_database.ps1 -BackupFile full_backup_20241201_120000.sql.zip"
    Write-Host ""
    Write-Host "사용 가능한 백업 파일:"
    $backupFiles = Get-ChildItem ".\backup" -Filter "*.sql*" | Sort-Object Name
    foreach ($file in $backupFiles) {
        Write-Host "  $($file.Name)"
    }
    exit 1
}

# 백업 디렉토리 설정
$BackupDir = ".\backup"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

# 백업 파일 경로 설정
if ($BackupFile -notlike "*\*" -and $BackupFile -notlike "/*") {
    $BackupPath = "$BackupDir\$BackupFile"
} else {
    $BackupPath = $BackupFile
}

# 백업 파일 존재 확인
if (!(Test-Path $BackupPath)) {
    Write-LogError "백업 파일을 찾을 수 없습니다: $BackupPath"
    Show-Usage
}

Write-LogInfo "데이터베이스 복구를 시작합니다..."
Write-LogInfo "백업 파일: $BackupPath"

# 1. 현재 데이터베이스 백업 (복구 전)
Write-LogInfo "현재 데이터베이스 백업 중..."
$CurrentBackup = "$BackupDir\backup_before_restore_$Date.sql"
try {
    $dbExists = psql -h $DBHost -U $DBUser -lqt | Select-String $DBName
    if ($dbExists) {
        pg_dump -h $DBHost -U $DBUser -d $DBName | Out-File -FilePath $CurrentBackup -Encoding UTF8
        Write-LogSuccess "현재 데이터베이스가 백업되었습니다: $CurrentBackup"
    } else {
        Write-LogWarning "복구할 데이터베이스가 존재하지 않습니다."
    }
} catch {
    Write-LogWarning "현재 데이터베이스 백업 중 오류가 발생했습니다: $($_.Exception.Message)"
}

# 2. 압축된 백업 파일인 경우 압축 해제
$RestoreFile = $BackupPath
if ($BackupFile -like "*.zip") {
    Write-LogInfo "압축된 백업 파일을 해제 중..."
    try {
        $TempDir = "$env:TEMP\restore_$Date"
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        Expand-Archive -Path $BackupPath -DestinationPath $TempDir -Force
        
        $extractedFiles = Get-ChildItem $TempDir -Filter "*.sql"
        if ($extractedFiles.Count -gt 0) {
            $RestoreFile = $extractedFiles[0].FullName
            Write-LogSuccess "압축 해제 완료: $RestoreFile"
        } else {
            Write-LogError "압축 파일에서 SQL 파일을 찾을 수 없습니다."
            exit 1
        }
    } catch {
        Write-LogError "압축 해제에 실패했습니다: $($_.Exception.Message)"
        exit 1
    }
}

# 3. 데이터베이스 삭제 및 재생성
Write-LogInfo "데이터베이스 재생성 중..."
try {
    psql -h $DBHost -U $DBUser -c "DROP DATABASE IF EXISTS $DBName;" | Out-Null
    psql -h $DBHost -U $DBUser -c "CREATE DATABASE $DBName;" | Out-Null
    Write-LogSuccess "데이터베이스가 재생성되었습니다."
} catch {
    Write-LogError "데이터베이스 재생성에 실패했습니다: $($_.Exception.Message)"
    exit 1
}

# 4. 백업 파일로부터 복구
Write-LogInfo "백업 파일로부터 복구 중..."
try {
    Get-Content $RestoreFile | psql -h $DBHost -U $DBUser -d $DBName
    Write-LogSuccess "데이터베이스 복구가 완료되었습니다."
} catch {
    Write-LogError "데이터베이스 복구에 실패했습니다: $($_.Exception.Message)"
    exit 1
}

# 5. 임시 파일 정리
if ($BackupFile -like "*.zip") {
    try {
        $TempDir = "$env:TEMP\restore_$Date"
        if (Test-Path $TempDir) {
            Remove-Item $TempDir -Recurse -Force
            Write-LogInfo "임시 파일이 정리되었습니다."
        }
    } catch {
        Write-LogWarning "임시 파일 정리 중 오류가 발생했습니다: $($_.Exception.Message)"
    }
}

# 6. 복구 검증
Write-LogInfo "복구 검증 중..."
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

# 7. 외래키 제약조건 검증
Write-LogInfo "외래키 제약조건 검증 중..."
$constraintQuery = @"
SELECT 
    'work_diary' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IN (SELECT id FROM users) THEN 1 END) as valid_user_refs,
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) OR project_id IS NULL THEN 1 END) as valid_project_refs
FROM work_diary
UNION ALL
SELECT 
    'local_events',
    COUNT(*),
    COUNT(CASE WHEN participant_id IN (SELECT id FROM users) THEN 1 END),
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) OR project_id IS NULL THEN 1 END)
FROM local_events
UNION ALL
SELECT 
    'project_events',
    COUNT(*),
    0,
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) THEN 1 END)
FROM project_events;
"@

try {
    psql -h $DBHost -U $DBUser -d $DBName -c $constraintQuery
} catch {
    Write-LogWarning "외래키 제약조건 검증 중 오류가 발생했습니다: $($_.Exception.Message)"
}

Write-LogSuccess "데이터베이스 복구가 성공적으로 완료되었습니다!"
Write-LogInfo "복구 전 백업: $CurrentBackup"
Write-LogInfo "복구된 백업: $BackupPath"
