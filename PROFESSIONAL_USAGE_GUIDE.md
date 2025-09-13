# 🎯 SQLite 기반 전문적인 재고 관리 시스템 사용법

## 🚀 **1단계: 데이터베이스 설정**

**Supabase SQL Editor에서 실행:**
```sql
-- database/sqlite_professional_structure.sql 파일 내용을 복사해서 실행
```

**실행 후 확인:**
- `Items` 테이블 생성 ✅ (기본키: ItemID)
- `StockHistory` 테이블 생성 ✅ (입출고 이력 통합)
- `Disposals` 테이블 생성 ✅ (폐기 상세)
- `v_CurrentStock` 뷰 생성 ✅ (현재고 계산)
- `v_ItemLedger` 뷰 생성 ✅ (품목별 원장)
- 트리거 생성 ✅ (음수 재고 방지)
- 샘플 데이터 자동 삽입 ✅

## 🔧 **2단계: 컴포넌트 교체**

**기존 컴포넌트를 전문적인 버전으로 교체:**

```tsx
// 기존: src/components/StockInModal.tsx
// 새로: src/components/ProfessionalStockInModal.tsx

// 기존: 복잡한 재고 테이블
// 새로: src/components/ProfessionalStockTable.tsx
```

## 📱 **3단계: 메인 페이지에서 사용**

**`src/app/page.tsx` 또는 메인 페이지에서:**

```tsx
import ProfessionalStockTable from '@/components/ProfessionalStockTable'

export default function Home() {
  return (
    <div>
      <ProfessionalStockTable />
    </div>
  )
}
```

## 🎯 **4단계: 전문적인 입고 테스트**

### **새 품목 등록 테스트:**
1. **"전문적인 입고" 버튼 클릭** 🖱️
2. **"새 품목 등록" 버튼 클릭**
3. **품목명**: "베어링6205" 입력
4. **규격**: "Ø25xØ52x15" 입력
5. **제조사**: "SKF" 입력
6. **수량**: "100" 입력
7. **"전문적인 입고 처리" 버튼 클릭** ✅

### **기존 품목 재입고 테스트:**
1. **"전문적인 입고" 버튼 클릭** 🖱️
2. **검색창에 "베어링" 입력**
3. **검색 결과에서 "베어링6205" 선택**
4. **수량**: "50" 입력 (추가 입고)
5. **"전문적인 입고 처리" 버튼 클릭** ✅

## 🏗️ **전문적인 구조의 핵심 장점**

### ✅ **기본키 기반 자유도**
- **`ItemID`가 기본키**: 각 품목마다 고유 식별자
- **같은 품목명+규격으로도 여러 번 입고 가능**
- **중복 제약 조건 없음**

### ✅ **뷰 기반 실시간 현재고**
- **`v_CurrentStock`**: 입출고 이력을 실시간 계산
- **정확한 현재고 표시**: 수동 계산 불필요
- **데이터 일관성 보장**

### ✅ **트리거 기반 보안**
- **음수 재고 방지**: 자동으로 안전성 보장
- **데이터 무결성**: 비즈니스 룰 강제 적용
- **사용자 실수 방지**

### ✅ **이벤트 기반 추적**
- **모든 재고 변동 기록**: IN, OUT, PLUS, MINUS, DISPOSAL
- **완전한 감사 추적**: 언제, 무엇을, 얼마나
- **품목별 원장 보기**: `v_ItemLedger`로 상세 이력

## 📊 **전문적인 테이블 구조**

| 테이블 | 주요 컬럼 | 용도 | 특징 |
|--------|-----------|------|------|
| **Items** | ItemID(PK), Name, Spec, Maker | 제품 마스터 | 기본키로 중복 허용 |
| **StockHistory** | HistoryID(PK), ItemID(FK), EventType, Quantity | 재고 이력 | 모든 변동 통합 관리 |
| **Disposals** | DisposalID(PK), HistoryID(FK) | 폐기 상세 | 폐기 사유 및 승인자 |
| **v_CurrentStock** | (뷰) ItemID, Name, CurrentQty | 현재고 계산 | 실시간 집계 |
| **v_ItemLedger** | (뷰) HistoryID, EventType, Quantity | 품목별 원장 | 상세 이력 보기 |

## 🔄 **전문적인 데이터 흐름**

```
새 품목 등록 → Items 테이블에 ItemID 자동 생성
     ↓
입고 처리 → StockHistory 테이블에 IN 이벤트 기록
     ↓
현재고 계산 → v_CurrentStock 뷰에서 실시간 집계
     ↓
재고 현황 → ProfessionalStockTable에서 표시
```

## 🎯 **실제 사용 시나리오**

### **시나리오 1: 동일 품목 여러 번 입고**
```
1차 입고: 베어링6205 - 100개 (ItemID: 1)
2차 입고: 베어링6205 - 50개 (ItemID: 2) ← 같은 품목+규격이지만 다른 ID
3차 입고: 베어링6205 - 30개 (ItemID: 3) ← 또 다른 ID

결과: 총 3개의 독립적인 품목으로 관리, 각각 개별 이력 추적
```

### **시나리오 2: 출고 및 조정**
```
출고: ItemID 1에서 20개 출고 → StockHistory에 OUT 이벤트
실사조정: ItemID 1에서 +5개 조정 → StockHistory에 PLUS 이벤트
폐기: ItemID 1에서 3개 폐기 → StockHistory에 DISPOSAL 이벤트
```

## 🚨 **주의사항**

### ⚠️ **개발용 설정**
- **RLS 정책이 모든 사용자에게 열려있음**
- **운영 환경에서는 권한 설정 필요**

### ⚠️ **데이터 정합성**
- **현재고는 뷰를 통해 자동 계산**
- **트리거로 음수 재고 방지**
- **외래키로 데이터 무결성 보장**

## 🎉 **완성!**

**이제 기본키 기반으로 같은 품목+규격도 자유롭게 여러 번 입고할 수 있습니다!**

**"베어링6205" + "Ø25xØ52x15" 규격으로 100번 입고해도 각각 고유한 ItemID로 관리됩니다!** 🚀

## 🔍 **추가 기능 (향후 개발 예정)**

- **출고 관리**: OUT 이벤트 처리
- **재고 조정**: PLUS/MINUS 이벤트 처리
- **폐기 관리**: DISPOSAL 이벤트 처리
- **재고 알림**: 부족 재고 자동 알림
- **보고서 생성**: 기간별 입출고 보고서
