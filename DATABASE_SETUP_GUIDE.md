# 데이터베이스 설정 가이드

이 가이드는 unecorailelectric 프로젝트의 완전한 데이터베이스 시스템 구축 방법을 설명합니다.

## 🚀 빠른 시작

### 1. 데이터베이스 초기 설정

```bash
# Windows PowerShell
cd database
.\setup_database.ps1

# Linux/macOS
cd database
chmod +x *.sh
./setup_database.sh
```

### 2. 데이터베이스 백업

```bash
# Windows PowerShell
.\backup_database.ps1 -Compress

# Linux/macOS
./backup_database.sh -c
```

### 3. 데이터베이스 복구

```bash
# Windows PowerShell
.\restore_database.ps1 -BackupFile initial_setup_20241201_120000.sql

# Linux/macOS
./restore_database.sh initial_setup_20241201_120000.sql.gz
```

## 📊 데이터베이스 구조

### 주요 테이블

1. **users** - 사용자 정보 및 권한 관리
2. **projects** - 프로젝트 정보
3. **work_diary** - 업무일지
4. **local_events** - 로컬 일정
5. **project_events** - 프로젝트 이벤트

### 권한 시스템

- **Level 1**: 자신의 데이터만 조회
- **Level 2**: Level 1-2 사용자 데이터 조회, 업무일지 작성
- **Level 3**: Level 1-3 사용자 데이터 조회, 일정 관리
- **Level 4**: Level 1-4 사용자 데이터 조회, 프로젝트 관리
- **Level 5**: Level 1-5 사용자 데이터 조회, 프로젝트 이벤트 관리
- **Administrator**: 모든 데이터 조회 및 관리

## 🔐 보안 기능

### RLS (Row Level Security)

모든 테이블에 RLS가 적용되어 사용자 레벨에 따라 자동으로 데이터 접근이 제한됩니다.

### 자동 필터링

- 업무일지 조회 시 사용자 레벨에 따라 자동 필터링
- 일정 조회 시 참여자 레벨에 따라 자동 필터링
- 프로젝트 이벤트는 Level 5 이상만 생성/수정/삭제 가능

## 🛠️ 관리 도구

### 백업 스크립트

```bash
# 전체 백업
.\backup_database.ps1

# 테이블별 백업
.\backup_database.ps1 -Table

# 데이터만 백업
.\backup_database.ps1 -DataOnly -Compress

# 스키마만 백업
.\backup_database.ps1 -SchemaOnly
```

### 복구 스크립트

```bash
# 특정 백업으로 복구
.\restore_database.ps1 -BackupFile backup_file.sql

# 압축된 백업으로 복구
.\restore_database.ps1 -BackupFile backup_file.sql.zip
```

## 📈 성능 최적화

### 인덱스

- 사용자 ID별 인덱스
- 날짜별 인덱스
- 프로젝트 ID별 인덱스
- 외래키 제약조건

### 쿼리 최적화

- RLS 정책으로 데이터베이스 레벨에서 필터링
- 페이지네이션 지원
- 효율적인 JOIN 쿼리

## 🔄 자동화

### Windows 작업 스케줄러

```powershell
# 매일 새벽 2시에 백업
schtasks /create /tn "DB Backup" /tr "C:\path\to\backup_database.ps1 -Compress" /sc daily /st 02:00
```

### Linux cron

```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 백업
0 2 * * * /path/to/database/backup_database.sh -c
```

## 🚨 문제 해결

### 일반적인 문제

1. **권한 오류**
   - PostgreSQL 사용자 권한 확인
   - RLS 정책 확인

2. **연결 오류**
   - PostgreSQL 서비스 상태 확인
   - 포트 확인 (기본: 5432)

3. **백업/복구 오류**
   - 백업 파일 무결성 확인
   - 디스크 공간 확인

### 로그 확인

```bash
# PostgreSQL 로그
tail -f /var/log/postgresql/postgresql-*.log

# 애플리케이션 로그
tail -f logs/app.log
```

## 📝 주의사항

1. **정기 백업**: 중요한 데이터는 정기적으로 백업하세요.
2. **권한 관리**: 사용자 레벨을 신중하게 설정하세요.
3. **성능 모니터링**: 대용량 데이터 처리를 위해 인덱스를 확인하세요.
4. **보안**: RLS 정책이 올바르게 적용되었는지 정기적으로 확인하세요.

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 로그 파일 확인
2. 데이터베이스 연결 상태 확인
3. 권한 설정 확인
4. 백업 파일 무결성 확인

## 🎯 다음 단계

1. 환경 변수 설정 (.env 파일)
2. 애플리케이션 실행
3. 데이터베이스 연결 테스트
4. 사용자 권한 테스트
5. 백업/복구 테스트

---

**완료!** 이제 완전한 DB 기반 시스템이 구축되었습니다. 모든 기능이 데이터베이스에서 작동하며, 백업과 복구가 가능합니다.
