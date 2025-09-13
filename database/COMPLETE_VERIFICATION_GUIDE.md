# 🎯 v2 스키마 완전 검증 가이드

## 📋 **검증 순서 (단계별)**

### **1단계: 기본 v2 스키마 적용**
```sql
-- Supabase SQL Editor에서 실행
-- database/v2_schema_upgrade.sql 파일 내용 복사 후 실행
```

### **2단계: 관계 검증**
```sql
-- database/verify_v2_schema.sql 파일 내용 복사 후 실행
-- FK, 트리거, 제약조건이 제대로 설정되었는지 확인
```

### **3단계: 선택적 users FK 강화**
```sql
-- database/enhance_users_fk.sql 파일 내용 복사 후 실행
-- stock_in/out와 users.auth_user_id 연결 (선택사항)
```

## 🔍 **검증 포인트별 확인사항**

### ✅ **1. FK 관계 확인**
**예상 결과:**
- `stock_in.item_id` → `items(id)` (CASCADE/RESTRICT)
- `stock_out.item_id` → `items(id)` (CASCADE/RESTRICT)  
- `current_stock.item_id` → `items(id)` (CASCADE/CASCADE)

**확인 SQL:**
```sql
SELECT 
  conname as fk_name,
  conrelid::regclass as child_table,
  confrelid::regclass as parent_table,
  confupdtype as update_action,
  confdeltype as delete_action
FROM pg_constraint
WHERE contype = 'f'
ORDER BY 2, 1;
```

### ✅ **2. current_stock item_id 유니크 확인**
**예상 결과:**
- `current_stock_item_uniq` 인덱스 존재
- 품목당 한 행만 허용

**확인 SQL:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'current_stock' 
  AND indexname ILIKE '%item_uniq%';
```

### ✅ **3. 트리거 확인**
**예상 결과:**
- `trg_stock_in_recalc` (stock_in 테이블)
- `trg_stock_out_recalc` (stock_out 테이블)
- `trg_items_updated_at` (items 테이블)
- `trg_current_stock_updated` (current_stock 테이블)

**확인 SQL:**
```sql
SELECT 
  event_object_table as table_name, 
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('stock_in', 'stock_out', 'current_stock', 'items')
ORDER BY 1, 2;
```

### ✅ **4. 제약 조건 확인**
**예상 결과:**
- **수량 제약**: `quantity > 0`, `current_quantity >= 0`
- **금액 제약**: `unit_price >= 0`
- **유니크 제약**: `items(product, spec, maker)`

**확인 SQL:**
```sql
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_name IN ('items', 'current_stock', 'stock_in', 'stock_out')
ORDER BY tc.table_name, tc.constraint_name;
```

### ✅ **5. 함수 확인**
**예상 결과:**
- `recalc_current_stock()` - 현재고 재계산 함수
- `recalc_current_stock_after_change()` - 트리거 함수
- `set_updated_at()` - 타임스탬프 갱신 함수

**확인 SQL:**
```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%recalc%' 
   OR routine_name LIKE '%updated%'
ORDER BY routine_name;
```

## 🚨 **문제 발생 시 해결방법**

### ❌ **FK 제약 에러**
```sql
-- FK 제약 확인
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';

-- 제약 삭제 후 재생성
ALTER TABLE stock_in DROP CONSTRAINT IF EXISTS stock_in_item_fk;
ALTER TABLE stock_in 
  ADD CONSTRAINT stock_in_item_fk 
  FOREIGN KEY (item_id) REFERENCES items(id);
```

### ❌ **트리거 동작 안 함**
```sql
-- 트리거 재생성
DROP TRIGGER IF EXISTS trg_stock_in_recalc ON stock_in;
CREATE TRIGGER trg_stock_in_recalc
AFTER INSERT OR UPDATE OR DELETE ON stock_in
FOR EACH ROW EXECUTE FUNCTION recalc_current_stock_after_change();
```

### ❌ **함수 에러**
```sql
-- 함수 재생성
CREATE OR REPLACE FUNCTION recalc_current_stock(p_item uuid) 
RETURNS void AS $$
-- 함수 내용
$$ LANGUAGE plpgsql;
```

## 📊 **테스트 시나리오**

### **1. 입고 테스트**
```sql
-- 테스트 입고
INSERT INTO stock_in (item_id, quantity, unit_price, received_by, reason)
VALUES ('[실제_아이템_ID]', 10, 1000, '테스트사용자', 'v2 스키마 테스트');

-- current_stock 자동 갱신 확인
SELECT * FROM current_stock WHERE item_id = '[실제_아이템_ID]';
```

### **2. 출고 테스트**
```sql
-- 테스트 출고
INSERT INTO stock_out (item_id, quantity, issued_by, project)
VALUES ('[실제_아이템_ID]', 5, '테스트사용자', 'v2 스키마 테스트');

-- current_stock 자동 갱신 확인
SELECT * FROM current_stock WHERE item_id = '[실제_아이템_ID]';
```

### **3. 제약 테스트**
```sql
-- 음수 수량 입력 시도 (에러 발생해야 함)
INSERT INTO stock_in (item_id, quantity, unit_price, received_by, reason)
VALUES ('[실제_아이템_ID]', -5, 1000, '테스트사용자', '제약 테스트');
```

## 🎉 **검증 완료 기준**

### ✅ **모든 관계가 정립됨**
- **items (1) —< stock_in (N)**: 입고 이력
- **items (1) —< stock_out (N)**: 출고 이력  
- **items (1) — (1) current_stock (1)**: 현재고 (1:1)

### ✅ **무결성 보장**
- **외래키 제약**: 모든 `item_id`가 유효한 `items.id` 참조
- **수량 제약**: 음수 수량/가격 방지
- **유니크 제약**: 중복 품목 등록 방지

### ✅ **자동화 작동**
- **현재고 자동 계산**: 입고/출고 시 자동으로 `current_stock` 갱신
- **타임스탬프 자동 갱신**: `updated_at` 자동 설정
- **총액 자동 계산**: `total_amount = quantity * unit_price`

### ✅ **성능 최적화**
- **인덱스**: `item_id`, `received_at`, `issued_at` 등
- **트리거**: 효율적인 현재고 재계산

## 📞 **최종 확인**

**모든 검증이 통과되면:**
```sql
SELECT '🎉 v2 스키마 검증 완료!' as status;
SELECT '✅ 모든 관계가 정립되었습니다!' as relationships;
SELECT '✅ 무결성·RLS·자동 합계가 보장됩니다!' as features;
SELECT '✅ 안정적이고 자동화된 재고 관리 시스템이 구축되었습니다!' as result;
```

---

**🚀 이제 v2 스키마로 완벽한 재고 관리 시스템을 운영하세요!**
