# 입고 순서 인덱스 기반 데이터베이스 마이그레이션 가이드

## 개요

기존 UUID 기반 데이터베이스를 **입고 순서대로 인덱스 번호를 생성하여 기본키로 사용**하는 새로운 스키마로 마이그레이션하는 가이드입니다.

## 주요 변경사항

### 1. 기본키 변경
- **기존**: `items.id` = UUID (랜덤 생성)
- **변경**: `items.id` = INTEGER SERIAL/AUTOINCREMENT (1, 2, 3... 순차 생성)

### 2. 외래키 변경
- `current_stock.item_id` → INTEGER
- `stock_in.item_id` → INTEGER  
- `stock_out.item_id` → INTEGER

### 3. 품목 상태 필드 추가
- `stock_status` 필드 추가 (new, used-new, used-used, broken)

## 마이그레이션 전 준비사항

### 1. 데이터 백업
```bash
# PostgreSQL
pg_dump your_database > backup_before_migration.sql

# SQLite
cp your_database.db backup_before_migration.db
```

### 2. 애플리케이션 중지
- 모든 사용자 접속 차단
- 백그라운드 작업 중지
- 데이터베이스 연결 풀 정리

## 마이그레이션 실행

### PostgreSQL용

```sql
-- 1. 마이그레이션 스크립트 실행
\i database/migrate_to_sequential_index.sql

-- 2. 마이그레이션 결과 확인
SELECT 'items' as table_name, COUNT(*) as record_count FROM items
UNION ALL
SELECT 'current_stock' as table_name, COUNT(*) as record_count FROM current_stock
UNION ALL
SELECT 'stock_in' as table_name, COUNT(*) as record_count FROM stock_in
UNION ALL
SELECT 'stock_out' as table_name, COUNT(*) as record_count FROM stock_out;
```

### SQLite용

```sql
-- 1. 마이그레이션 스크립트 실행
.read database/migrate_to_sequential_index_sqlite.sql

-- 2. 마이그레이션 결과 확인
SELECT 'items' as table_name, COUNT(*) as record_count FROM items
UNION ALL
SELECT 'current_stock' as table_name, COUNT(*) as record_count FROM current_stock
UNION ALL
SELECT 'stock_in' as table_name, COUNT(*) as record_count FROM stock_in
UNION ALL
SELECT 'stock_out' as table_name, COUNT(*) as record_count FROM stock_out;
```

## 마이그레이션 후 확인사항

### 1. 데이터 무결성 검증
```sql
-- 외래키 제약 확인
SELECT 
  'current_stock' as table_name,
  COUNT(*) as orphaned_records
FROM current_stock cs
LEFT JOIN items i ON cs.item_id = i.id
WHERE i.id IS NULL

UNION ALL

SELECT 
  'stock_in' as table_name,
  COUNT(*) as orphaned_records
FROM stock_in si
LEFT JOIN items i ON si.item_id = i.id
WHERE i.id IS NULL

UNION ALL

SELECT 
  'stock_out' as table_name,
  COUNT(*) as orphaned_records
FROM stock_out so
LEFT JOIN items i ON so.item_id = i.id
WHERE i.id IS NULL;
```

### 2. 인덱스 성능 확인
```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM items WHERE id = 1;

-- SQLite
EXPLAIN QUERY PLAN SELECT * FROM items WHERE id = 1;
```

### 3. 애플리케이션 테스트
- 입고 기능 테스트
- 출고 기능 테스트
- 재고 조회 기능 테스트
- 엑셀 일괄 업로드 테스트

## 롤백 계획

### 1. 백업 테이블에서 복원
```sql
-- PostgreSQL
DROP TABLE IF EXISTS items, current_stock, stock_in, stock_out;
CREATE TABLE items AS SELECT * FROM items_backup;
CREATE TABLE current_stock AS SELECT * FROM current_stock_backup;
CREATE TABLE stock_in AS SELECT * FROM stock_in_backup;
CREATE TABLE stock_out AS SELECT * FROM stock_out_backup;

-- SQLite
DROP TABLE IF EXISTS items, current_stock, stock_in, stock_out;
CREATE TABLE items AS SELECT * FROM items_backup;
CREATE TABLE current_stock AS SELECT * FROM current_stock_backup;
CREATE TABLE stock_in AS SELECT * FROM stock_in_backup;
CREATE TABLE stock_out AS SELECT * FROM stock_out_backup;
```

### 2. 백업 파일에서 복원
```bash
# PostgreSQL
psql your_database < backup_before_migration.sql

# SQLite
cp backup_before_migration.db your_database.db
```

## 주의사항

### 1. 데이터 손실 위험
- 마이그레이션 중 전원 차단 시 데이터 손실 가능
- 반드시 백업 후 실행

### 2. 애플리케이션 호환성
- 기존 UUID 기반 코드 수정 필요
- `StockInModal.tsx` 등 관련 컴포넌트 업데이트 완료

### 3. 성능 영향
- INTEGER 기본키로 인한 조회 성능 향상
- 인덱스 재생성으로 인한 일시적 성능 저하

## 마이그레이션 완료 후 정리

### 1. 백업 테이블 삭제 (선택사항)
```sql
-- PostgreSQL
DROP TABLE IF EXISTS items_backup, current_stock_backup, stock_in_backup, stock_out_backup;

-- SQLite
DROP TABLE IF EXISTS items_backup, current_stock_backup, stock_in_backup, stock_out_backup;
```

### 2. 로그 정리
- 마이그레이션 로그 보관
- 성능 모니터링 데이터 수집

### 3. 사용자 교육
- 새로운 인덱스 체계 설명
- 입고 순서의 중요성 강조

## 문제 해결

### 1. 외래키 제약 오류
```sql
-- 외래키 제약 확인
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

### 2. 시퀀스 오류
```sql
-- PostgreSQL 시퀀스 재설정
SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));

-- SQLite AUTOINCREMENT 확인
SELECT 'items' as table_name, MAX(id) as max_id FROM items;
```

## 연락처

마이그레이션 중 문제 발생 시:
- 개발팀: 병삼아
- 데이터베이스 관리자: 양재준
- 긴급 연락: 시스템 관리자
