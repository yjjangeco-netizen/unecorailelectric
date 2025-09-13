# 데이터베이스 관리 시스템

이 디렉토리는 unecorailelectric 프로젝트의 데이터베이스 관리 시스템을 포함합니다.

## 📁 파일 구조

```
database/
├── create_tables.sql          # 테이블 생성 및 RLS 정책
├── sample_data.sql            # 샘플 데이터 삽입
├── backup_restore.sql         # 백업/복구 SQL 스크립트
├── setup_database.sh          # 데이터베이스 초기 설정
├── backup_database.sh         # 데이터베이스 백업
├── restore_database.sh        # 데이터베이스 복구
└── README.md                  # 이 파일
```

## 🚀 빠른 시작

### 1. 데이터베이스 초기 설정

```bash
# 실행 권한 부여
chmod +x *.sh

# 데이터베이스 생성 및 초기 설정
./setup_database.sh
```

### 2. 데이터베이스 백업

```bash
# 전체 백업
./backup_database.sh

# 압축 백업
./backup_database.sh -c

# 테이블별 백업
./backup_database.sh -t

# 데이터만 백업
./backup_database.sh -d -c
```

### 3. 데이터베이스 복구

```bash
# 백업 파일로부터 복구
./restore_database.sh initial_setup_20241201_120000.sql.gz
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **users** - 사용자 정보
   - id (VARCHAR, PK)
   - name (VARCHAR)
   - level (VARCHAR) - 권한 레벨
   - permissions (TEXT[])

2. **projects** - 프로젝트 정보
   - id (SERIAL, PK)
   - project_name (VARCHAR)
   - project_number (VARCHAR, UNIQUE)
   - assembly_date, factory_test_date, site_test_date (DATE)

3. **work_diary** - 업무일지
   - id (SERIAL, PK)
   - user_id (VARCHAR, FK)
   - work_date (DATE)
   - project_id (INTEGER, FK)
   - work_content (TEXT)

4. **local_events** - 로컬 일정
   - id (VARCHAR, PK)
   - category, sub_category, sub_sub_category (VARCHAR)
   - participant_id, created_by_id (VARCHAR, FK)

5. **project_events** - 프로젝트 이벤트
   - id (VARCHAR, PK)
   - project_id (INTEGER, FK)
   - event_type (VARCHAR)
   - event_date (DATE)

## 🔐 권한 시스템

### 사용자 레벨별 권한

- **Level 1**: 자신의 데이터만 조회
- **Level 2**: Level 1-2 사용자 데이터 조회, 업무일지 작성
- **Level 3**: Level 1-3 사용자 데이터 조회, 일정 관리
- **Level 4**: Level 1-4 사용자 데이터 조회, 프로젝트 관리
- **Level 5**: Level 1-5 사용자 데이터 조회, 프로젝트 이벤트 관리
- **Administrator**: 모든 데이터 조회 및 관리

### RLS (Row Level Security) 정책

모든 테이블에 RLS가 적용되어 사용자 레벨에 따라 자동으로 데이터 접근이 제한됩니다.

## 🛠️ 관리 명령어

### PostgreSQL 직접 연결

```bash
# 데이터베이스 연결
psql -h localhost -U postgres -d unecorailelectric

# 테이블 목록 확인
\dt

# 데이터 확인
SELECT * FROM users;
SELECT * FROM projects;
SELECT * FROM work_diary;
```

### 데이터 검증

```sql
-- 레코드 수 확인
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'work_diary', COUNT(*) FROM work_diary
UNION ALL
SELECT 'local_events', COUNT(*) FROM local_events
UNION ALL
SELECT 'project_events', COUNT(*) FROM project_events;

-- 외래키 제약조건 확인
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';
```

## 📈 성능 모니터링

### 테이블 크기 확인

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 인덱스 사용률 확인

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
```

## 🔄 자동화

### cron을 이용한 자동 백업

```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 백업 실행
0 2 * * * /path/to/database/backup_database.sh -c

# 매주 일요일 새벽 3시에 전체 백업
0 3 * * 0 /path/to/database/backup_database.sh -f -c
```

## 🚨 문제 해결

### 일반적인 문제

1. **권한 오류**
   ```bash
   # PostgreSQL 사용자 권한 확인
   psql -h localhost -U postgres -c "\du"
   ```

2. **연결 오류**
   ```bash
   # PostgreSQL 서비스 상태 확인
   systemctl status postgresql
   
   # 포트 확인
   netstat -tlnp | grep 5432
   ```

3. **백업 파일 손상**
   ```bash
   # 백업 파일 검증
   pg_restore --list backup_file.sql
   ```

### 로그 확인

```bash
# PostgreSQL 로그 확인
tail -f /var/log/postgresql/postgresql-*.log

# 백업 로그 확인
tail -f /var/log/backup.log
```

## 📝 주의사항

1. **백업 정기성**: 중요한 데이터는 정기적으로 백업하세요.
2. **권한 관리**: 사용자 레벨을 신중하게 설정하세요.
3. **성능 모니터링**: 대용량 데이터 처리를 위해 인덱스를 확인하세요.
4. **보안**: RLS 정책이 올바르게 적용되었는지 정기적으로 확인하세요.

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 로그 파일 확인
2. 데이터베이스 연결 상태 확인
3. 권한 설정 확인
4. 백업 파일 무결성 확인