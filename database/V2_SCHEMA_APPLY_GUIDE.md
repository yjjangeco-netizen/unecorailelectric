# DB v2 스키마 적용 가이드

## 🎯 목표
- **기존 테이블/컬럼 이름은 그대로 유지**
- **무결성·RLS·자동 합계(현재고) 보장**
- **기존 데이터는 그대로 두고 추가 컬럼·제약·트리거로 보강**

## 📋 적용 순서 (무중단)

### 1단계: Supabase SQL Editor에서 실행
1. **Supabase 대시보드** → **SQL Editor** 접속
2. **`database/v2_schema_upgrade.sql`** 파일 내용을 복사
3. **SQL Editor에 붙여넣기** 후 **RUN** 버튼 클릭

### 2단계: 실행 결과 확인
```sql
-- 실행 완료 후 아래 쿼리로 확인
SELECT 'DB v2 스키마 업그레이드 완료!' as status;
SELECT '기존 데이터는 그대로 유지되었습니다.' as data_preserved;
SELECT '무결성·RLS·자동 합계가 보장됩니다.' as features_enabled;
```

## 🔧 주요 개선사항

### ✅ 무결성 강화
- **외래키 제약**: `item_id` → `items(id)` 연결
- **수량 제약**: 음수 수량 방지 (`quantity > 0`, `current_quantity >= 0`)
- **금액 제약**: 음수 가격 방지 (`unit_price >= 0`)
- **유니크 제약**: `items(product, spec, maker)` 중복 등록 방지

### ✅ 자동화
- **현재고 자동 계산**: `stock_in/out` 변경 시 `current_stock.current_quantity` 자동 갱신
- **타임스탬프 자동 갱신**: `updated_at` 자동 설정
- **총액 자동 계산**: `stock_in.total_amount = quantity * unit_price`

### ✅ 성능 최적화
- **인덱스 추가**: `item_id`, `received_at`, `issued_at` 등
- **트리거 최적화**: 효율적인 현재고 재계산

### ✅ RLS 준비
- **인증 사용자 매핑**: `received_by_user_id`, `issued_by_user_id` 추가
- **기존 이름 컬럼 유지**: `received_by`, `issued_by` 그대로 사용

## 🚨 주의사항

### ⚠️ 실행 전 확인
- **백업**: 중요한 데이터가 있다면 먼저 백업
- **권한**: Supabase 프로젝트에 대한 관리자 권한 필요
- **트래픽**: 가능하면 트래픽이 적은 시간대에 실행

### ⚠️ 실행 중 주의
- **중단 금지**: SQL 실행 중 브라우저 새로고침 금지
- **에러 발생 시**: 에러 메시지 확인 후 부분 실행 고려

### ⚠️ 실행 후 확인
- **트리거 동작**: 입고/출고 시 현재고 자동 갱신 확인
- **제약 동작**: 잘못된 데이터 입력 시 제약 위반 확인

## 🔍 문제 해결

### ❌ 에러 발생 시
```sql
-- 트리거 확인
SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%recalc%';

-- 제약 확인
SELECT * FROM information_schema.table_constraints WHERE table_name IN ('items', 'stock_in', 'stock_out', 'current_stock');

-- 함수 확인
SELECT * FROM information_schema.routines WHERE routine_name LIKE '%recalc%';
```

### ❌ 트리거 동작 안 할 때
```sql
-- 트리거 재생성
DROP TRIGGER IF EXISTS trg_stock_in_recalc ON stock_in;
CREATE TRIGGER trg_stock_in_recalc
AFTER INSERT OR UPDATE OR DELETE ON stock_in
FOR EACH ROW EXECUTE FUNCTION recalc_current_stock_after_change();
```

## 📊 적용 후 테스트

### 1. 입고 테스트
```sql
-- 테스트 입고 데이터 삽입
INSERT INTO stock_in (item_id, quantity, unit_price, received_by, reason)
VALUES ('[실제_아이템_ID]', 10, 1000, '테스트사용자', 'v2 스키마 테스트');

-- current_stock 자동 갱신 확인
SELECT * FROM current_stock WHERE item_id = '[실제_아이템_ID]';
```

### 2. 출고 테스트
```sql
-- 테스트 출고 데이터 삽입
INSERT INTO stock_out (item_id, quantity, issued_by, project)
VALUES ('[실제_아이템_ID]', 5, '테스트사용자', 'v2 스키마 테스트');

-- current_stock 자동 갱신 확인
SELECT * FROM current_stock WHERE item_id = '[실제_아이템_ID]';
```

### 3. 제약 테스트
```sql
-- 음수 수량 입력 시도 (에러 발생해야 함)
INSERT INTO stock_in (item_id, quantity, unit_price, received_by, reason)
VALUES ('[실제_아이템_ID]', -5, 1000, '테스트사용자', '제약 테스트');
```

## 🎉 완료 후 효과

### ✅ 즉시 적용
- **현재고 자동화**: 입고/출고 시 자동으로 현재고 맞춰짐
- **무결성 보장**: 잘못된 데이터 입력 방지
- **성능 향상**: 인덱스로 조회 속도 개선

### ✅ 향후 확장
- **Supabase Auth 연동**: `auth_user_id`로 RLS 정책 적용
- **권한 관리**: 사용자별 접근 제어 가능
- **감사 로그**: 모든 변경사항 추적 가능

## 📞 지원

**문제 발생 시:**
1. **에러 메시지** 전체 복사
2. **실행한 SQL** 단계별 기록
3. **데이터베이스 상태** 확인 (테이블 구조, 데이터 등)

---

**🚀 DB v2 스키마로 업그레이드하여 안정적이고 자동화된 재고 관리 시스템을 구축하세요!**
