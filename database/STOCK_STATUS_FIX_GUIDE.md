# 품목상태 매핑 문제 완전 해결 가이드

## 🔍 문제 상황
- 품목상태가 "알 수 없음"으로 표시됨
- 같은 중고사용품으로 입력했는데 일부는 "알 수 없음", 일부는 "중고사용품"으로 표시
- 에러 발생 후에도 입고처리가 부분적으로 진행됨
- 데이터베이스 스키마 불일치 및 혼재된 상태값

## 🛠️ 해결 방법

### 1단계: 데이터베이스 함수 업데이트
```sql
-- PostgreSQL에서 실행
\i database/functions/process_stock_in_transaction.sql
\i database/functions/process_bulk_stock_in_transaction.sql
```

### 2단계: 품목상태 매핑 완전 수정
```sql
-- PostgreSQL에서 실행 (권장)
\i database/fix_stock_status_complete.sql

-- 또는 기존 스크립트 실행
\i database/fix_stock_status_mapping.sql
```

### 3단계: 데이터 검증
```sql
-- 수정된 데이터 확인
SELECT 
  'stock_history' as table_name,
  condition_type,
  COUNT(*) as count
FROM stock_history 
GROUP BY condition_type
UNION ALL
SELECT 
  'items' as table_name,
  stock_status,
  COUNT(*) as count
FROM items 
GROUP BY stock_status;
```

## 📊 품목상태 매핑 규칙 (완전 통일)

### 클라이언트 → 데이터베이스
| 클라이언트 | items.stock_status | stock_history.condition_type |
|------------|-------------------|------------------------------|
| 신품       | new               | new                          |
| 중고신품   | used-new          | used-new                    |
| 중고사용품 | used-used         | used-used                   |
| 고장       | broken            | broken                      |

### 데이터베이스 → 클라이언트
| 데이터베이스 | 표시 텍스트 |
|--------------|-------------|
| new          | 신품        |
| used-new     | 중고신품    |
| used-used    | 중고사용품  |
| broken       | 고장        |

## ✅ 개선사항

### 1. 트랜잭션 안정성
- 모든 데이터베이스 작업을 단일 트랜잭션으로 처리
- 에러 발생 시 완전 롤백 보장
- 입력값 검증 강화

### 2. 품목상태 일관성 (완전 보장)
- 클라이언트와 데이터베이스 간 상태값 매핑 완전 통일
- 제약조건으로 유효한 상태값만 허용
- 기본값 설정으로 NULL 상태 방지
- 혼재된 상태값 완전 정리

### 3. 에러 처리 개선
- 상세한 에러 메시지 제공
- 디버깅용 로그 추가
- 사용자 친화적 에러 안내

## 🚀 실행 순서

1. **데이터베이스 함수 업데이트**
   ```bash
   psql -d your_database -f database/functions/process_stock_in_transaction.sql
   psql -d your_database -f database/functions/process_bulk_stock_in_transaction.sql
   ```

2. **품목상태 매핑 완전 수정**
   ```bash
   psql -d your_database -f database/fix_stock_status_complete.sql
   ```

3. **애플리케이션 재시작**
   ```bash
   npm run dev
   ```

4. **테스트**
   - 새로운 품목 입고 테스트
   - 품목상태가 올바르게 표시되는지 확인
   - 에러 발생 시 롤백 확인

## 🔧 문제 해결 확인

### 품목상태 표시 확인
- 테이블에서 "알 수 없음" 상태가 완전히 사라졌는지 확인
- 올바른 상태값(신품, 중고신품, 중고사용품, 고장)이 일관되게 표시되는지 확인
- 같은 상태로 입력한 품목들이 동일하게 표시되는지 확인

### 트랜잭션 안정성 확인
- 에러 발생 시 데이터베이스에 부분 데이터가 남아있지 않는지 확인
- 모든 입고 처리가 완전히 성공하거나 완전히 실패하는지 확인

## 📝 주의사항

1. **데이터 백업**: 실행 전 반드시 데이터베이스 백업
2. **테스트 환경**: 먼저 테스트 환경에서 실행하여 검증
3. **애플리케이션 호환성**: 기존 데이터와의 호환성 확인
4. **권한 확인**: 데이터베이스 수정 권한 확인

## 🆘 문제 발생 시

### 롤백 방법
```sql
-- 백업 테이블에서 데이터 복원
INSERT INTO stock_history SELECT * FROM stock_history_backup_YYYYMMDD;
INSERT INTO items SELECT * FROM items_backup_YYYYMMDD;
```

### 로그 확인
```sql
-- PostgreSQL 로그에서 에러 메시지 확인
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### 연락처
문제 발생 시 개발팀에 문의하세요.

## 🔍 추가 문제 해결

### 혼재된 상태값이 계속 발생하는 경우
```sql
-- 현재 상태값 재확인
SELECT DISTINCT condition_type FROM stock_history;
SELECT DISTINCT stock_status FROM items;

-- 강제로 올바른 값으로 설정
UPDATE stock_history SET condition_type = 'new' WHERE condition_type NOT IN ('new', 'used-new', 'used-used', 'broken');
UPDATE items SET stock_status = 'new' WHERE stock_status NOT IN ('new', 'used-new', 'used-used', 'broken');
```

### 데이터 일관성 문제
```sql
-- items와 stock_history 간 매핑 확인
SELECT 
  i.id,
  i.product,
  i.stock_status,
  sh.condition_type,
  CASE 
    WHEN i.stock_status = 'new' AND sh.condition_type = 'new' THEN '일치'
    WHEN i.stock_status = 'used-new' AND sh.condition_type = 'used-new' THEN '일치'
    WHEN i.stock_status = 'used-used' AND sh.condition_type = 'used-used' THEN '일치'
    WHEN i.stock_status = 'broken' AND sh.condition_type = 'broken' THEN '일치'
    ELSE '불일치'
  END as status_check
FROM items i
JOIN stock_history sh ON i.id = sh.item_id
WHERE sh.event_type = 'IN'
ORDER BY i.stock_status, sh.condition_type;
```
