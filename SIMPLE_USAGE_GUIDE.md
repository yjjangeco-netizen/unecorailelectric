# 🎯 간단한 재고 관리 시스템 사용법

## 🚀 **1단계: 데이터베이스 설정**

**Supabase SQL Editor에서 실행:**
```sql
-- database/simple_structure.sql 파일 내용을 복사해서 실행
```

**실행 후 확인:**
- `Current_Stock` 테이블 생성 ✅
- `Stock_In` 테이블 생성 ✅  
- `Stock_Out` 테이블 생성 ✅
- `Disposal` 테이블 생성 ✅
- 샘플 데이터 3개 자동 삽입 ✅

## 🔧 **2단계: 컴포넌트 교체**

**기존 복잡한 컴포넌트를 간단한 버전으로 교체:**

```tsx
// 기존: src/components/StockInModal.tsx
// 새로: src/components/SimpleStockInModal.tsx

// 기존: 복잡한 재고 테이블
// 새로: src/components/SimpleStockTable.tsx
```

## 📱 **3단계: 메인 페이지에서 사용**

**`src/app/page.tsx` 또는 메인 페이지에서:**

```tsx
import SimpleStockTable from '@/components/SimpleStockTable'

export default function Home() {
  return (
    <div>
      <SimpleStockTable />
    </div>
  )
}
```

## 🎯 **4단계: 테스트**

**간단한 입고 테스트:**
1. **"입고" 버튼 클릭** 🖱️
2. **품목명**: "자전거" 입력
3. **규격**: "88" 입력  
4. **수량**: "99" 입력
5. **"입고 처리" 버튼 클릭** ✅

**결과:**
- ✅ **중복 제약 조건 오류 없음**
- ✅ **즉시 재고 현황에 반영**
- ✅ **간단하고 빠른 처리**

## 🏗️ **새로운 구조의 장점**

### ✅ **단순함**
- **복잡한 외래키 관계 없음**
- **각 테이블이 독립적으로 작동**
- **제약 조건 최소화**

### ✅ **유연함**
- **같은 품명+규격으로 여러 번 입고 가능**
- **각 입고마다 독립적인 기록**
- **현재고는 자동으로 합산**

### ✅ **성능**
- **복잡한 JOIN 쿼리 불필요**
- **빠른 데이터 처리**
- **간단한 인덱스 구조**

## 📊 **테이블 구조 요약**

| 테이블 | 주요 컬럼 | 용도 |
|--------|-----------|------|
| **Current_Stock** | Name, Spec, Total_qunty | 현재 재고 현황 |
| **Stock_In** | Name, Spec, In_data | 입고 이력 |
| **Stock_Out** | Name, Spec, Out_data | 출고 이력 |
| **Disposal** | Name, Spec, Disposal_qunty | 폐기 이력 |

## 🔄 **데이터 흐름**

```
입고 → Stock_In 테이블에 기록
     ↓
     Current_Stock 테이블 업데이트 (UPSERT)
     ↓
     재고 현황에 즉시 반영
```

## 🚨 **주의사항**

### ⚠️ **개발용 설정**
- **RLS 정책이 모든 사용자에게 열려있음**
- **운영 환경에서는 권한 설정 필요**

### ⚠️ **데이터 정합성**
- **현재고는 입고-출고-폐기로 계산**
- **수동으로 직접 수정 가능**

## 🎉 **완성!**

**이제 복잡한 제약 조건 없이 자유롭게 입고가 가능합니다!**

**"자전거" + "88" 규격으로 100번 입고해도 문제없습니다!** 🚀
