# =============================================
# 데이터베이스 백업 PowerShell 스크립트
# =============================================

param(
    [string]$DBName = "unecorailelectric",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432",
    [switch]$Full,
    [switch]$Table,
    [switch]$DataOnly,
    [switch]$SchemaOnly,
    [switch]$Compress,
    [switch]$Help
)

# 사용법 출력
function Show-Usage {
    Write-Host "사용법: .\backup_database.ps1 [옵션]"
    Write-Host ""
    Write-Host "옵션:"
    Write-Host "  -Full        전체 데이터베이스 백업 (기본값)"
    Write-Host "  -Table       테이블별 백업"
    Write-Host "  -DataOnly    데이터만 백업 (스키마 제외)"
    Write-Host "  -SchemaOnly  스키마만 백업 (데이터 제외)"
    Write-Host "  -Compress    압축 백업"
    Write-Host "  -Help        도움말 표시"
    Write-Host ""
    Write-Host "예시:"
    Write-Host "  .\backup_database.ps1                    # 전체 백업"
    Write-Host "  .\backup_database.ps1 -Table             # 테이블별 백업"
    Write-Host "  .\backup_database.ps1 -Compress          # 압축 백업"
    Write-Host "  .\backup_database.ps1 -DataOnly -Compress # 데이터만 압축 백업"
    exit 1
}

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

# 도움말 표시
if ($Help) {
    Show-Usage
}

# 백업 디렉토리 설정
$BackupDir = ".\backup"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

# 백업 디렉토리 생성
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# 기본 옵션 설정
if (!$Full -and !$Table) {
    $Full = $true
}

# 데이터베이스 존재 확인
Write-LogInfo "데이터베이스 존재 확인 중..."
try {
    $dbExists = psql -h $DBHost -U $DBUser -lqt | Select-String $DBName
    if (!$dbExists) {
        Write-LogError "데이터베이스 '$DBName'이 존재하지 않습니다."
        exit 1
    }
    Write-LogSuccess "데이터베이스 '$DBName'이 확인되었습니다."
} catch {
    Write-LogError "데이터베이스 확인 중 오류가 발생했습니다: $($_.Exception.Message)"
    exit 1
}

# 백업 옵션 설정
$BackupOptions = @()
if ($DataOnly) {
    $BackupOptions += "--data-only"
    Write-LogInfo "데이터만 백업합니다."
} elseif ($SchemaOnly) {
    $BackupOptions += "--schema-only"
    Write-LogInfo "스키마만 백업합니다."
}

# 1. 전체 데이터베이스 백업
if ($Full) {
    Write-LogInfo "전체 데이터베이스 백업 중..."
    $BackupFile = "$BackupDir\full_backup_$Date.sql"
    
    try {
        $backupCmd = "pg_dump -h $DBHost -U $DBUser -d $DBName"
        if ($BackupOptions.Count -gt 0) {
            $backupCmd += " " + ($BackupOptions -join " ")
        }
        
        Invoke-Expression $backupCmd | Out-File -FilePath $BackupFile -Encoding UTF8
        
        if (Test-Path $BackupFile) {
            Write-LogSuccess "전체 백업이 완료되었습니다: $BackupFile"
            
            if ($Compress) {
                Write-LogInfo "백업 파일 압축 중..."
                Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
                Remove-Item $BackupFile
                Write-LogSuccess "압축 완료: $BackupFile.zip"
            }
        } else {
            Write-LogError "백업 파일이 생성되지 않았습니다."
            exit 1
        }
    } catch {
        Write-LogError "전체 백업에 실패했습니다: $($_.Exception.Message)"
        exit 1
    }
}

# 2. 테이블별 백업
if ($Table) {
    Write-LogInfo "테이블별 백업 중..."
    
    try {
        # 테이블 목록 가져오기
        $tablesQuery = "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
        $tables = psql -h $DBHost -U $DBUser -d $DBName -t -c $tablesQuery
        
        foreach ($table in $tables) {
            $table = $table.Trim()
            if ($table -and $table -ne "") {
                Write-LogInfo "테이블 '$table' 백업 중..."
                $BackupFile = "$BackupDir\table_${table}_$Date.sql"
                
                $backupCmd = "pg_dump -h $DBHost -U $DBUser -d $DBName -t $table"
                if ($BackupOptions.Count -gt 0) {
                    $backupCmd += " " + ($BackupOptions -join " ")
                }
                
                Invoke-Expression $backupCmd | Out-File -FilePath $BackupFile -Encoding UTF8
                
                if (Test-Path $BackupFile) {
                    Write-LogSuccess "테이블 '$table' 백업 완료: $BackupFile"
                    
                    if ($Compress) {
                        Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
                        Remove-Item $BackupFile
                        Write-LogSuccess "압축 완료: $BackupFile.zip"
                    }
                } else {
                    Write-LogError "테이블 '$table' 백업에 실패했습니다."
                }
            }
        }
    } catch {
        Write-LogError "테이블별 백업 중 오류가 발생했습니다: $($_.Exception.Message)"
    }
}

# 3. 백업 파일 정보 출력
Write-LogInfo "백업 파일 정보:"
$backupFiles = Get-ChildItem $BackupDir -Filter "*$Date*" | Sort-Object Name
foreach ($file in $backupFiles) {
    $size = [math]::Round($file.Length / 1MB, 2)
    Write-Host "  $($file.Name) ($size MB)"
}

# 4. 오래된 백업 파일 정리 (30일 이상)
Write-LogInfo "오래된 백업 파일 정리 중..."
$oldFiles = Get-ChildItem $BackupDir -Filter "*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
$oldZipFiles = Get-ChildItem $BackupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }

$totalDeleted = $oldFiles.Count + $oldZipFiles.Count
$oldFiles | Remove-Item -Force
$oldZipFiles | Remove-Item -Force

if ($totalDeleted -gt 0) {
    Write-LogSuccess "$totalDeleted 개의 오래된 백업 파일이 정리되었습니다."
}

# 5. 백업 검증
Write-LogInfo "백업 검증 중..."
if ($Full) {
    $BackupFile = "$BackupDir\full_backup_$Date.sql"
    if ($Compress) {
        $BackupFile = "$BackupFile.zip"
    }
    
    if (Test-Path $BackupFile) {
        try {
            if ($Compress) {
                # 압축 파일 검증
                Expand-Archive -Path $BackupFile -DestinationPath $env:TEMP -Force
                $extractedFile = Get-ChildItem $env:TEMP -Filter "full_backup_$Date.sql" | Select-Object -First 1
                if ($extractedFile) {
                    Write-LogSuccess "압축된 백업 파일이 유효합니다."
                    Remove-Item $extractedFile.FullName -Force
                } else {
                    Write-LogError "압축된 백업 파일이 손상되었습니다."
                }
            } else {
                # 일반 백업 파일 검증
                $content = Get-Content $BackupFile -Head 5
                if ($content -match "PostgreSQL database dump") {
                    Write-LogSuccess "백업 파일이 유효합니다."
                } else {
                    Write-LogError "백업 파일이 손상되었습니다."
                }
            }
        } catch {
            Write-LogWarning "백업 검증 중 오류가 발생했습니다: $($_.Exception.Message)"
        }
    }
}

# 6. 백업 통계
$totalSize = (Get-ChildItem $BackupDir | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
$backupCount = (Get-ChildItem $BackupDir -Filter "*$Date*").Count

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "백업 완료 통계" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "백업 시간: $(Get-Date)"
Write-Host "백업 파일 수: $backupCount"
Write-Host "총 백업 크기: $totalSizeMB MB"
Write-Host "백업 디렉토리: $BackupDir"
Write-Host "=============================================" -ForegroundColor Cyan

Write-LogSuccess "데이터베이스 백업이 완료되었습니다!"
