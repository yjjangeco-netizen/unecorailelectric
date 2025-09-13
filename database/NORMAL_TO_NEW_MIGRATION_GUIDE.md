# Normal → New 상태 변환 마이그레이션 가이드

## 🎯 목적
기존 DB의 `normal` 상태를 새로운 시스템의 `new` 상태로 통일하고, 테이블 구조를 `stock_history` 기반으로 통합합니다.

## 📋 실행 순서

### 1단계: 백업 생성 (권장)
```sql
-- 기존 데이터 백업
CREATE TABLE items_backup AS SELECT * FROM items;
CREATE TABLE stock_history_backup AS SELECT * FROM stock_history;
```

### 2단계: 마이그레이션 실행
```sql
-- 통합 실행 스크립트 실행
\i database/execute_normal_to_new_migration.sql
```

### 3단계: 개별 실행 (필요시)
```sql
-- 1. 현재 상태 확인
SELECT stock_status, COUNT(*) FROM items GROUP BY stock_status;

-- 2. normal → new 변환
UPDATE items SET stock_status = 'new' WHERE stock_status = 'normal';
UPDATE stock_history SET condition_type = 'new' WHERE condition_type = 'normal';

-- 3. 결과 확인
SELECT stock_status, COUNT(*) FROM items GROUP BY stock_status;
```

## 🔧 수정된 함수들

### process_stock_in (수정됨)
- **기존**: `stock_in` 테이블 사용
- **수정**: `stock_history` 테이블 사용
- **파일**: `database/functions/process_stock_in_fixed.sql`

### process_stock_out (수정됨)
- **기존**: `stock_out` 테이블 사용  
- **수정**: `stock_history` 테이블 사용
- **파일**: `database/functions/process_stock_out_fixed.sql`

## ✅ 검증 방법

### 1. 상태 변환 확인
```sql
-- normal 상태가 남아있지 않은지 확인
SELECT COUNT(*) FROM items WHERE stock_status = 'normal';
-- 결과: 0이어야 함
```

### 2. 새로운 상태 분포 확인
```sql
-- new 상태로 통일되었는지 확인
SELECT stock_status, COUNT(*) FROM items GROUP BY stock_status;
-- 결과: new만 있어야 함
```

### 3. 함수 동작 확인
```sql
-- 입고 함수 테스트
SELECT process_stock_in('테스트품목', '테스트규격', '테스트제조사', '테스트위치', 100, 5000.00, 'new', '테스트입고', '테스트용', 'user@test.com');

-- 출고 함수 테스트  
SELECT process_stock_out('테스트품목', '테스트규격', '테스트제조사', '테스트위치', 10, 5000.00, '테스트프로젝트', false, null, '테스트출고', 'user@test.com');
```

## 🚨 주의사항

1. **백업 필수**: 실행 전 반드시 데이터 백업
2. **테스트 환경**: 먼저 테스트 환경에서 실행
3. **권한 확인**: 함수 실행 권한이 있는지 확인
4. **롤백 계획**: 문제 발생 시 백업에서 복원

## 🔄 롤백 방법

```sql
-- 백업에서 복원
DROP TABLE items;
ALTER TABLE items_backup RENAME TO items;

DROP TABLE stock_history;  
ALTER TABLE stock_history_backup RENAME TO stock_history;

-- 함수도 원래대로 복원
-- (기존 함수 파일에서 재생성)
```

## 📞 문제 발생 시

1. **에러 로그 확인**: PostgreSQL 로그에서 상세 에러 확인
2. **권한 문제**: 함수 실행 권한 확인
3. **테이블 존재**: `items`, `stock_history` 테이블 존재 확인
4. **백업 복원**: 문제 발생 시 백업에서 복원

---

**실행 완료 후**: 모든 품목 상태가 `new`로 통일되고, `stock_history` 테이블 기반의 통합 구조가 적용됩니다.
