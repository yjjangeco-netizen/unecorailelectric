# 세션 설정 완전 가이드

## 🚨 문제 상황
```
Error: 세션 설정 실패: Could not find the function public.set_session_user(session_id, user_id) in the schema cache
```

## ✅ 해결 방법

### 1단계: Supabase 대시보드 접속
1. [Supabase 대시보드](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택: `esvpnrqavaeikzhbmydz`
3. **SQL 편집기** 클릭

### 2단계: 통합 스크립트 실행
**`database/complete_session_setup.sql`** 파일의 내용을 복사하여 SQL 편집기에 붙여넣기 후 **실행** 버튼 클릭

### 3단계: 실행 결과 확인
성공적으로 실행되면 다음과 같은 결과가 표시됩니다:

```
✅ 세션 설정 완료!
```

## 🔍 검증 방법

### 함수 존재 확인
```sql
SELECT routine_name, routine_type, data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'set_session_user';
```

### 테이블 존재 확인
```sql
SELECT table_name, table_type, is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs';
```

### 권한 확인
```sql
SELECT grantee, privilege_type, is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'set_session_user';
```

## 🧪 테스트 실행

### 기본 테스트
```sql
SELECT set_session_user('test-session-123', 'test-user-456');
```

### 로그 확인
```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5;
```

## 🚀 애플리케이션 재시작

1. **개발 서버 중지** (Ctrl+C)
2. **개발 서버 재시작**
   ```bash
   npm run dev
   ```
3. **브라우저 새로고침**
4. **로그인 테스트**

## 📋 예상 결과

- ✅ 404 오류 해결
- ✅ 세션 설정 성공
- ✅ 감사 로그 기록
- ✅ 보안 강화

## 🆘 문제 발생 시

### 오류 1: 권한 부족
```sql
-- 관리자 권한으로 실행
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
```

### 오류 2: 함수 중복
```sql
-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS public.set_session_user(TEXT, TEXT);
```

### 오류 3: 테이블 중복
```sql
-- 기존 테이블 삭제 후 재생성 (주의: 데이터 손실)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
```

## 📞 지원

문제가 지속되면 다음 정보와 함께 문의:
- 오류 메시지 전체
- Supabase 프로젝트 ID
- 실행한 SQL 스크립트
- 브라우저 콘솔 로그
