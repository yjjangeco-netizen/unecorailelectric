-- =============================================
-- 데이터베이스 백업 및 복구 스크립트
-- =============================================

-- 1. 백업 스크립트 (backup_database.sql)
-- =============================================

-- 전체 데이터베이스 백업
-- pg_dump -h localhost -U postgres -d unecorailelectric > backup_$(date +%Y%m%d_%H%M%S).sql

-- 테이블별 백업
-- pg_dump -h localhost -U postgres -d unecorailelectric -t users > backup_users_$(date +%Y%m%d_%H%M%S).sql
-- pg_dump -h localhost -U postgres -d unecorailelectric -t projects > backup_projects_$(date +%Y%m%d_%H%M%S).sql
-- pg_dump -h localhost -U postgres -d unecorailelectric -t work_diary > backup_work_diary_$(date +%Y%m%d_%H%M%S).sql
-- pg_dump -h localhost -U postgres -d unecorailelectric -t local_events > backup_local_events_$(date +%Y%m%d_%H%M%S).sql
-- pg_dump -h localhost -U postgres -d unecorailelectric -t project_events > backup_project_events_$(date +%Y%m%d_%H%M%S).sql

-- 2. 복구 스크립트 (restore_database.sql)
-- =============================================

-- 전체 데이터베이스 복구
-- psql -h localhost -U postgres -d unecorailelectric < backup_20241201_120000.sql

-- 테이블별 복구
-- psql -h localhost -U postgres -d unecorailelectric < backup_users_20241201_120000.sql
-- psql -h localhost -U postgres -d unecorailelectric < backup_projects_20241201_120000.sql
-- psql -h localhost -U postgres -d unecorailelectric < backup_work_diary_20241201_120000.sql
-- psql -h localhost -U postgres -d unecorailelectric < backup_local_events_20241201_120000.sql
-- psql -h localhost -U postgres -d unecorailelectric < backup_project_events_20241201_120000.sql

-- 3. 데이터베이스 초기화 및 재생성
-- =============================================

-- 기존 데이터베이스 삭제 및 재생성
-- DROP DATABASE IF EXISTS unecorailelectric;
-- CREATE DATABASE unecorailelectric;
-- \c unecorailelectric;

-- 4. 자동 백업 스크립트 (backup_auto.sh)
-- =============================================

-- #!/bin/bash
-- # 자동 백업 스크립트
-- 
-- BACKUP_DIR="/backup/unecorailelectric"
-- DB_NAME="unecorailelectric"
-- DB_USER="postgres"
-- DB_HOST="localhost"
-- 
-- # 백업 디렉토리 생성
-- mkdir -p $BACKUP_DIR
-- 
-- # 날짜 형식
-- DATE=$(date +%Y%m%d_%H%M%S)
-- 
-- # 전체 데이터베이스 백업
-- pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/full_backup_$DATE.sql
-- 
-- # 압축
-- gzip $BACKUP_DIR/full_backup_$DATE.sql
-- 
-- # 30일 이상 된 백업 파일 삭제
-- find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +30 -delete
-- 
-- echo "백업 완료: $BACKUP_DIR/full_backup_$DATE.sql.gz"

-- 5. 데이터 검증 스크립트 (verify_data.sql)
-- =============================================

-- 데이터 무결성 검증
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'work_diary', COUNT(*) FROM work_diary
UNION ALL
SELECT 'local_events', COUNT(*) FROM local_events
UNION ALL
SELECT 'project_events', COUNT(*) FROM project_events;

-- 외래키 제약조건 검증
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 6. 성능 모니터링 쿼리 (performance_monitor.sql)
-- =============================================

-- 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- 7. 데이터 마이그레이션 스크립트 (migrate_data.sql)
-- =============================================

-- 기존 데이터를 새 테이블 구조로 마이그레이션
-- (필요시 기존 데이터 변환 로직)

-- 8. 롤백 스크립트 (rollback.sql)
-- =============================================

-- 특정 시점으로 롤백
-- BEGIN;
-- -- 백업에서 복구
-- \i backup_20241201_120000.sql
-- COMMIT;

-- 9. 데이터 정리 스크립트 (cleanup.sql)
-- =============================================

-- 오래된 데이터 정리 (예: 1년 이상 된 업무일지)
-- DELETE FROM work_diary 
-- WHERE work_date < CURRENT_DATE - INTERVAL '1 year';

-- 삭제된 사용자의 데이터 정리
-- DELETE FROM work_diary 
-- WHERE user_id NOT IN (SELECT id FROM users);

-- 10. 백업 검증 스크립트 (verify_backup.sql)
-- =============================================

-- 백업 파일 검증
-- pg_restore --list backup_file.sql > /dev/null && echo "백업 파일이 유효합니다" || echo "백업 파일이 손상되었습니다"

-- 복구 후 데이터 검증
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM projects;
-- SELECT COUNT(*) FROM work_diary;
-- SELECT COUNT(*) FROM local_events;
-- SELECT COUNT(*) FROM project_events;
