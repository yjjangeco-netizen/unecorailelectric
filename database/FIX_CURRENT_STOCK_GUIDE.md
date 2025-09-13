# current_stock 테이블 문제 해결 가이드

## 문제 상황
- PostgREST 오류: `PGRST200` - `current_stock`과 `items` 테이블 간 관계를 찾을 수 없음
- 400 Bad Request 오류 발생
- 재고 관리 페이지에서 데이터를 불러올 수 없음
- **권한 문제로 인한 접근 거부**

## 원인
현재 두 가지 다른 데이터베이스 스키마가 혼재되어 있습니다:
1. **`execute_all.sql`**: `current_stock`을 별도 테이블로 생성
2. **`unified_stock_fix_postgresql.sql`**: `current_stock`을 VIEW로 생성

코드는 VIEW 구조를 기대하고 있지만, 실제로는 테이블이 생성되어 있어 JOIN이 실패합니다.

## 해결 방법

### 1단계: 데이터베이스 스키마 수정
Supabase SQL 편집기에서 다음 스크립트를 실행하세요:

```sql
-- fix_current_stock_rls.sql 실행
\i fix_current_stock_rls.sql
```

이 스크립트는:
- 기존 `current_stock` 테이블을 삭제
- `current_stock`을 VIEW로 재생성 (items 테이블과 직접 연결)
- 필요한 컬럼들을 items 테이블에 추가
- RLS 정책 설정
- 샘플 데이터 확인 및 추가

### 2단계: 권한 문제 해결 ⚠️ 중요!
스키마 수정 후에도 권한 문제가 발생할 수 있습니다. 다음 스크립트를 실행하세요:

```sql
-- fix_permissions.sql 실행
\i fix_permissions.sql
```

이 스크립트는:
- `current_stock` VIEW와 `items` 테이블에 대한 모든 권한 설정
- RLS 정책 재설정
- 스키마 및 테이블 생성 권한 부여
- 권한 테스트 및 검증

### 3단계: 코드 수정 완료
다음 파일들이 이미 수정되었습니다:
- ✅ `src/hooks/useStockQuery.ts` - JOIN 구문 제거
- ✅ `src/app/stock-management/page.tsx` - JOIN 구문 제거
- ✅ `src/components/StockOutListModal.tsx` - JOIN 구문 제거

### 4단계: 테스트
1. 재고 관리 페이지 새로고침
2. 콘솔에서 오류 메시지 확인
3. 데이터가 정상적으로 로드되는지 확인

## 변경된 구조

### 이전 (문제 상황)
```
current_stock (테이블) ←→ items (테이블)
    ↓
JOIN 시도 → 외래키 관계 없음 → 오류 발생
```

### 현재 (해결된 상황)
```
current_stock (VIEW) ← items (테이블)
    ↓
직접 조회 → 데이터 정상 로드
```

## 주의사항
- `current_stock`은 이제 VIEW이므로 직접 INSERT/UPDATE/DELETE 불가
- 모든 데이터 수정은 `items` 테이블에서 수행
- VIEW는 자동으로 `items` 테이블의 변경사항을 반영
- **권한 설정이 제대로 되지 않으면 여전히 접근 거부 오류 발생**

## 문제가 지속될 경우
1. Supabase 대시보드에서 테이블 구조 확인
2. `\dt` 명령으로 테이블 목록 확인
3. `\d current_stock` 명령으로 VIEW 구조 확인
4. 로그에서 구체적인 오류 메시지 확인
5. **권한 상태 확인**: `\dp current_stock`, `\dp items`

## 실행 순서 요약
```sql
-- 1. 스키마 수정
\i fix_current_stock_rls.sql

-- 2. 권한 설정 (중요!)
\i fix_permissions.sql

-- 3. 테스트
SELECT COUNT(*) FROM current_stock;
SELECT COUNT(*) FROM items;
```

## 완료 메시지
스크립트 실행 후 다음 메시지가 표시되어야 합니다:
```
✅ current_stock VIEW 생성 및 외래키 관계 수정 완료!
✅ PostgREST 오류 해결됨 - items와 current_stock 간 관계 정상화
✅ 권한 문제 해결 완료!
✅ 이제 재고 관리 페이지에서 데이터를 정상적으로 불러올 수 있습니다.
```
