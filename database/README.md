# 📊 데이터베이스 설정 가이드

## 🚀 **필수 설정 단계**

### **1. 테이블 및 RLS 정책 적용**

Supabase SQL Editor에서 순서대로 실행하세요:

```sql
-- 1. 기본 테이블 및 RLS 정책
\i database/rls-policies.sql

-- 2. 마감 관련 테이블
\i database/tables/closing_tables.sql

-- 3. 저장 프로시저들
\i database/functions/process_stock_in.sql
\i database/functions/process_stock_out.sql
\i database/functions/process_bulk_operations.sql
\i database/functions/process_closing.sql
```

### **2. 환경변수 설정**

`.env.local` 파일 생성:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 추가 설정
NEXT_PUBLIC_LOG_LEVEL=info
NODE_ENV=development
```

### **3. 기능 검증**

```bash
# 개발 서버 시작
npm run dev

# 테스트 실행 (브라우저)
http://localhost:3000/test

# 스트레스 테스트 (E2E)
npm run test:e2e
```

---

## 🔧 **저장 프로시저 상세**

### **📦 process_stock_in**
```sql
SELECT process_stock_in(
  '테스트품목',    -- p_item_name
  100,            -- p_quantity
  5000.00,        -- p_unit_price
  'new',          -- p_condition_type
  '테스트입고',    -- p_reason
  '홍길동',        -- p_ordered_by
  'user@test.com', -- p_received_by
  '테스트용'       -- p_notes
);
```

**특징:**
- ✅ 행 잠금(FOR UPDATE)으로 동시성 보장
- ✅ 가중평균 단가 자동 계산
- ✅ 신규 품목 자동 생성
- ✅ 감사 로그 자동 기록

### **📤 process_stock_out**
```sql
SELECT process_stock_out(
  'item-uuid',     -- p_item_id
  10,              -- p_quantity
  '프로젝트A',      -- p_project
  '테스트출고',     -- p_notes
  false,           -- p_is_rental
  null,            -- p_return_date
  'user@test.com'  -- p_issued_by
);
```

**특징:**
- ✅ 재고 부족 자동 체크
- ✅ 음수 재고 방지
- ✅ 동시성 보장(행 잠금)
- ✅ 저재고 알림 자동 생성

### **📊 process_closing**
```sql
-- 분기 마감
SELECT process_closing(2024, 1, null, 'admin@test.com', false);

-- 월 마감  
SELECT process_closing(2024, null, 3, 'admin@test.com', false);

-- 강제 재마감
SELECT process_closing(2024, 1, null, 'admin@test.com', true);
```

**특징:**
- ✅ 원자적 스냅샷 생성
- ✅ 중복 마감 방지
- ✅ 롤백 지원
- ✅ 승인 워크플로우

---

## 🧪 **테스트 시나리오**

### **기본 기능 테스트**
```bash
# A) 입고: 동일 품목 3건(1, 10, 100개) → 수량·평균단가 갱신 확인
# B) 출고: 현재고보다 1개 많은 수량 요청 → 오류 응답 확인  
# C) 경계: 현재고와 동일 수량 출고 → 0 되며 음수 미발생 확인
# D) 동시성: 동일 품목 출고 2요청 동시 발사 → 한쪽 실패·재시도
# E) 마감: 스냅샷 테이블 도입 후 검증
```

### **스트레스 테스트**
```bash
# 100회 반복 테스트
npx playwright test e2e/stress.spec.ts

# 동시성 테스트
npx playwright test e2e/stress.spec.ts -g "동시성"

# 성능 벤치마크
npx playwright test e2e/stress.spec.ts -g "성능"
```

---

## 📋 **데이터베이스 스키마**

### **핵심 테이블**
```
items                 # 품목 마스터
├── current_stock     # 현재 재고 현황  
├── stock_in         # 입고 이력
├── stock_out        # 출고 이력
├── disposal         # 폐기 이력
└── audit_log        # 감사 로그

stock_snapshot       # 마감 스냅샷
├── closing_runs     # 마감 실행 이력
└── closing_approvals # 마감 승인 워크플로우
```

### **필수 인덱스**
```sql
-- 성능 최적화 인덱스들이 자동 생성됨
idx_items_name
idx_current_stock_status  
idx_stock_in_received_at
idx_stock_out_issued_at
idx_stock_snapshot_period
```

### **RLS 정책 요약**
- **일반 사용자**: 조회만 가능
- **전기팀**: 입출고 처리 가능  
- **관리자**: 모든 작업 + 마감 처리

---

## ⚠️ **주의사항**

### **프로덕션 배포 전 체크리스트**
- [ ] 환경변수 설정 확인
- [ ] RLS 정책 적용 확인  
- [ ] 저장 프로시저 배포 확인
- [ ] 기본 사용자 계정 변경
- [ ] 백업 정책 수립
- [ ] 모니터링 설정

### **성능 고려사항**
- 대량 데이터: process_bulk_operations 사용
- 동시 접근: 저장 프로시저의 행 잠금 활용
- 인덱스: 자동 생성된 인덱스 유지
- 감사 로그: 정기적 아카이빙 고려

### **보안 점검**
- RLS 정책 활성화 상태 확인
- 사용자 권한 최소화 원칙 적용
- API 키 노출 방지
- HTTPS 통신 강제

---

## 🔧 **문제 해결**

### **일반적인 오류**

**1. 저장 프로시저 없음**
```
Error: function process_stock_in does not exist
```
→ 해결: database/functions/ 스크립트들을 Supabase에서 실행

**2. RLS 정책 오류** 
```
Error: new row violates row-level security policy
```
→ 해결: database/rls-policies.sql 실행 및 사용자 권한 확인

**3. 동시성 오류**
```
Error: could not serialize access due to concurrent update  
```
→ 해결: 정상 동작 (재시도 로직이 처리함)

### **디버깅 방법**

**로그 확인:**
```sql
-- 감사 로그 조회
SELECT * FROM audit_log 
WHERE table_name = 'stock_in' 
ORDER BY changed_at DESC LIMIT 10;

-- 마감 이력 확인  
SELECT * FROM closing_runs 
WHERE status = 'failed' 
ORDER BY started_at DESC;
```

**성능 모니터링:**
```sql
-- 느린 쿼리 확인
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%process_stock%'
ORDER BY mean_exec_time DESC;
```

---

## 📞 **지원**

문제 발생 시:
1. 로그 확인 (audit_log 테이블)
2. 환경변수 재확인
3. 저장 프로시저 실행 상태 점검
4. GitHub Issues에 상세 정보와 함께 문의

**마지막 업데이트**: 2024년 1월  
**데이터베이스 버전**: PostgreSQL 15+ (Supabase)  
**호환성**: Next.js 15, React 19
