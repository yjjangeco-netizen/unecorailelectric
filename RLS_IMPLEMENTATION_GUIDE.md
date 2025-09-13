# 🔐 장기적 RLS 해결책 구현 가이드

## 📋 개요

이 문서는 유네코레일 전기파트 시스템의 Row Level Security(RLS) 문제를 장기적으로 해결하기 위한 구현 가이드입니다.

## 🎯 해결 전략

### **1단계: 데이터베이스 권한 시스템 구축**
- 커스텀 인증과 연동되는 RLS 정책 구현
- 권한 기반 접근 제어 함수 생성
- 세션별 사용자 ID 관리 시스템

### **2단계: 애플리케이션 권한 관리 통합**
- TypeScript 기반 권한 검증 모듈
- React 훅과 연동된 권한 확인 시스템
- 데이터베이스 작업 전 권한 사전 검증

### **3단계: 보안 강화 및 모니터링**
- 감사 로그 시스템 연동
- 권한 위반 시나리오 대응
- 정기적인 보안 검토 프로세스

## 🚀 구현 단계

### **1단계: Supabase SQL Editor에서 실행**

```sql
-- database/fix_rls_production.sql 파일 실행
-- 또는 아래 내용을 복사하여 실행

-- 기존 RLS 정책 정리
DROP POLICY IF EXISTS "모든 인증 사용자가 품목을 조회할 수 있음" ON items;
-- ... (다른 정책들도 동일하게 삭제)

-- 권한 확인 함수들 생성
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id TEXT,
  required_permission TEXT DEFAULT 'level1'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_id 
    AND (
      users.permissions @> ARRAY[required_permission]::TEXT[] 
      OR users.permissions @> ARRAY['administrator']::TEXT[]
      OR users.department = '전기팀'
    )
    AND users.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 새로운 권한 기반 RLS 정책 생성
CREATE POLICY "품목_조회_권한" ON items
  FOR SELECT USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level1'
    )
  );

CREATE POLICY "품목_생성수정_권한" ON items
  FOR ALL USING (
    check_user_permission(
      current_setting('app.current_user_id', true),
      'level2'
    )
  );

-- ... (다른 테이블들도 동일한 패턴으로 정책 생성)
```

### **2단계: 애플리케이션 코드 수정**

#### **A. 데이터베이스 권한 관리 모듈 생성**
```typescript
// src/lib/databaseAuth.ts
export class DatabaseAuthManager {
  // 사용자 세션 설정
  async setUserSession(userId: string): Promise<void>
  
  // 권한 확인
  async checkUserPermission(requiredPermission: string): Promise<boolean>
  
  // 권한 기반 작업 실행
  async executeWithPermission<T>(
    operation: () => Promise<T>,
    requiredPermission: string
  ): Promise<T>
}
```

#### **B. React 훅 통합**
```typescript
// src/hooks/useUser.ts
export function useUser() {
  // 기존 함수들...
  
  // 데이터베이스 권한 관련 함수들
  const checkDbPermission = async (requiredPermission: string): Promise<boolean>
  const executeWithDbPermission = async <T>(operation: () => Promise<T>, permission: string): Promise<T>
}
```

#### **C. 컴포넌트에서 권한 기반 작업 실행**
```typescript
// src/components/StockInModal.tsx
export default function StockInModal() {
  const { executeWithDbPermission, checkDbPermission } = useUser()
  
  const saveStockInToDB = async (data: StockInFormData) => {
    // 권한 확인
    const hasPermission = await checkDbPermission('level2')
    if (!hasPermission) {
      throw new Error('입고 권한이 부족합니다.')
    }
    
    // 권한 기반으로 데이터베이스 작업 실행
    await executeWithDbPermission(async () => {
      // 데이터베이스 작업들...
    }, 'level2')
  }
}
```

## 🔒 권한 레벨 정의

### **기본 권한 구조**
```typescript
export type PermissionType = 
  | 'level1'      // 조회만 가능
  | 'level2'      // 입출고 처리 가능
  | 'level3'      // 폐기 처리 가능
  | 'level4'      // 사용자 관리 가능
  | 'level5'      // 시스템 설정 가능
  | 'administrator' // 모든 권한
```

### **부서별 접근 제어**
```typescript
export type DepartmentType = 
  | '전기팀'      // 모든 재고 작업 가능
  | 'AS'         // 제한된 재고 작업
  | '기계'       // 제한된 재고 작업
  | '구매'       // 조회만 가능
  | '영업'       // 조회만 가능
```

## 🛡️ 보안 특징

### **1. 다층 보안**
- **애플리케이션 레벨**: React 컴포넌트에서 권한 사전 검증
- **데이터베이스 레벨**: RLS 정책으로 최종 보안 강화
- **세션 레벨**: 사용자별 고유 세션 ID로 접근 추적

### **2. 권한 상속**
- **관리자**: 모든 권한 자동 부여
- **전기팀**: 재고 관련 모든 권한 자동 부여
- **일반 사용자**: 명시적으로 부여된 권한만 사용

### **3. 세션 관리**
- **자동 만료**: 24시간 후 세션 자동 정리
- **고유 식별**: 브라우저별 고유 세션 ID 생성
- **추적 가능**: 모든 데이터베이스 작업에 사용자 ID 기록

## 📊 성능 최적화

### **1. 권한 확인 최적화**
```sql
-- 인덱스 생성으로 권한 확인 성능 향상
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN(permissions);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
```

### **2. 세션 관리 최적화**
```sql
-- 정기적인 세션 정리
SELECT cleanup_expired_sessions();

-- 세션 테이블 파티셔닝 (대용량 시스템용)
-- CREATE TABLE session_users_partitioned PARTITION OF session_users
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 🧪 테스트 방법

### **1. 권한 테스트**
```bash
# 다양한 권한 레벨로 테스트
npm run test:auth

# 권한별 기능 접근 테스트
npm run test:permissions
```

### **2. 보안 테스트**
```bash
# SQL 인젝션 방지 테스트
npm run test:security

# 권한 우회 시도 테스트
npm run test:auth-bypass
```

### **3. 성능 테스트**
```bash
# 동시 접근 테스트
npm run test:concurrency

# 대용량 데이터 처리 테스트
npm run test:load
```

## 🔧 문제 해결

### **일반적인 오류**

#### **1. 권한 확인 실패**
```sql
-- 사용자 권한 상태 확인
SELECT id, username, permissions, department, is_active 
FROM users 
WHERE id = 'user_id_here';
```

#### **2. 세션 설정 실패**
```sql
-- 세션 상태 확인
SELECT * FROM session_users 
WHERE session_id = 'session_id_here';
```

#### **3. RLS 정책 오류**
```sql
-- RLS 정책 상태 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'items';
```

### **디버깅 방법**

#### **1. 로그 확인**
```typescript
// 브라우저 콘솔에서 권한 확인 로그
console.log('현재 사용자 ID:', databaseAuth.getCurrentUserId())
console.log('권한 확인 결과:', await databaseAuth.checkUserPermission('level2'))
```

#### **2. 데이터베이스 로그**
```sql
-- 감사 로그 확인
SELECT * FROM audit_log 
WHERE table_name = 'stock_in' 
ORDER BY changed_at DESC LIMIT 10;
```

## 📈 모니터링 및 유지보수

### **1. 정기 점검 항목**
- [ ] 권한 정책 상태 확인
- [ ] 세션 테이블 크기 모니터링
- [ ] 권한 위반 로그 분석
- [ ] 성능 지표 추적

### **2. 보안 업데이트**
- [ ] 정기적인 권한 정책 검토
- [ ] 새로운 보안 위협 대응
- [ ] 사용자 권한 최소화 원칙 적용
- [ ] 감사 로그 분석 및 개선

### **3. 성능 최적화**
- [ ] 권한 확인 쿼리 성능 분석
- [ ] 세션 관리 최적화
- [ ] 인덱스 사용률 모니터링
- [ ] 캐싱 전략 개선

## 🎉 구현 완료 체크리스트

### **데이터베이스 레벨**
- [ ] RLS 정책 적용 완료
- [ ] 권한 확인 함수 생성 완료
- [ ] 세션 관리 함수 생성 완료
- [ ] 인덱스 최적화 완료

### **애플리케이션 레벨**
- [ ] DatabaseAuthManager 클래스 구현 완료
- [ ] useUser 훅 통합 완료
- [ ] 컴포넌트 권한 검증 적용 완료
- [ ] 에러 처리 및 로깅 완료

### **테스트 및 검증**
- [ ] 권한별 기능 테스트 완료
- [ ] 보안 테스트 완료
- [ ] 성능 테스트 완료
- [ ] 사용자 시나리오 테스트 완료

## 📞 지원 및 문의

구현 과정에서 문제가 발생하면:

1. **로그 확인**: 브라우저 콘솔 및 데이터베이스 로그
2. **권한 상태 점검**: 사용자 권한 및 RLS 정책 상태
3. **세션 상태 확인**: 세션 테이블 및 사용자 ID 설정
4. **GitHub Issues**: 상세한 오류 정보와 함께 문의

---

**🚀 이 가이드를 따라 구현하면 안전하고 확장 가능한 권한 기반 보안 시스템을 구축할 수 있습니다!**
