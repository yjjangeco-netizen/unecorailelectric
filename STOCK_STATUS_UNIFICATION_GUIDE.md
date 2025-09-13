# 품목 상태 통일 가이드

## 개요
품목 상태를 데이터베이스와 프로그램 간에 일관되게 통일합니다.

## 타입 정의
```typescript
type StockStatus = 'new' | 'used-new' | 'used-used' | 'broken'
```

## 상태값 매핑
| 한국어 | 데이터베이스 값 | 설명 |
|--------|----------------|------|
| 신품 | `new` | 새로 제조된 제품으로 미사용 상태 |
| 중고신품 | `used-new` | 중고이지만 거의 새것과 같은 상태 |
| 중고사용품 | `used-used` | 사용된 흔적이 있는 중고 제품 |
| 불량품 | `broken` | 고장나거나 불량한 제품 |

## 데이터베이스 제약조건
```sql
-- stock_history.condition_type
CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'))

-- items.stock_status  
CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'))
```

## 마이그레이션 스크립트
기존 데이터를 새로운 표준으로 변환:

```sql
-- stock_history 테이블 변환
UPDATE stock_history SET condition_type = 'used-new' WHERE condition_type = 'used-new';
UPDATE stock_history SET condition_type = 'used-used' WHERE condition_type = 'used-used';
UPDATE stock_history SET condition_type = 'broken' WHERE condition_type = 'broken';

-- items 테이블 변환
UPDATE items SET stock_status = 'used-new' WHERE stock_status = 'used-new';
UPDATE items SET stock_status = 'used-used' WHERE stock_status = 'used-used';
UPDATE items SET stock_status = 'broken' WHERE stock_status = 'broken';
```

## 제약조건 설정
```sql
-- stock_history.condition_type 제약조건
ALTER TABLE stock_history 
ADD CONSTRAINT stock_history_condition_type_check 
CHECK (condition_type IN ('new', 'used-new', 'used-used', 'broken'));

-- items.stock_status 제약조건
ALTER TABLE items 
ADD CONSTRAINT items_stock_status_check 
CHECK (stock_status IN ('new', 'used-new', 'used-used', 'broken'));
```

## 사용법
1. 데이터베이스 마이그레이션 실행
2. 제약조건 설정
3. 프로그램 코드에서 새로운 타입 사용

## 검증
```sql
-- 잘못된 상태값 확인
SELECT * FROM stock_history WHERE condition_type NOT IN ('new', 'used-new', 'used-used', 'broken');
SELECT * FROM items WHERE stock_status NOT IN ('new', 'used-new', 'used-used', 'broken');
```
