# 🎉 Supabase & Google Calendar 설정 완료 가이드

## ✅ **완료된 작업**

### 1. 환경변수 파일 생성
- `.env.local` 파일이 성공적으로 생성되었습니다
- 모든 필요한 환경변수 템플릿이 설정되었습니다

### 2. 현재 설정 상태
```
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Calendar API 설정
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# 개발 환경 설정
NODE_ENV=development
NEXT_PUBLIC_LOG_LEVEL=info
```

## 🔧 **다음 단계: 실제 값 설정**

### **1단계: Supabase 설정**

1. **Supabase 프로젝트 생성**
   - [Supabase Dashboard](https://supabase.com/dashboard) 접속
   - "New Project" 클릭
   - 프로젝트 이름: "유네코레일 전기파트 시스템"
   - 데이터베이스 비밀번호 설정

2. **API 키 복사**
   - Settings → API 탭 이동
   - Project URL 복사 → `NEXT_PUBLIC_SUPABASE_URL`에 붙여넣기
   - anon public 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 붙여넣기

3. **데이터베이스 스키마 생성**
   - SQL Editor에서 `database/` 폴더의 SQL 파일들 실행
   - 필요한 테이블들 생성

### **2단계: Google Calendar 설정**

1. **Google Cloud Console 설정**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 새 프로젝트 생성 또는 기존 프로젝트 선택

2. **Google Calendar API 활성화**
   - "API 및 서비스" → "라이브러리" 이동
   - "Google Calendar API" 검색 후 "사용" 클릭

3. **OAuth 2.0 클라이언트 ID 생성**
   - "API 및 서비스" → "사용자 인증 정보" 이동
   - "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" 선택
   - 애플리케이션 유형: "웹 애플리케이션"
   - 승인된 자바스크립트 원본: `http://localhost:3000`
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/google/callback`

4. **클라이언트 ID와 비밀번호 복사**
   - 클라이언트 ID → `GOOGLE_CLIENT_ID`와 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`에 붙여넣기
   - 클라이언트 비밀번호 → `GOOGLE_CLIENT_SECRET`에 붙여넣기

## 🚀 **설정 완료 후 테스트**

### **1. 프로젝트 재시작**
```bash
# 개발 서버 중지 (Ctrl+C)
# 다시 시작
npm run dev
```

### **2. 브라우저에서 확인**
- `http://localhost:3000` 접속
- 브라우저 콘솔(F12)에서 환경변수 로딩 메시지 확인
- "✅ Supabase 환경변수가 정상적으로 설정되었습니다" 메시지 확인

### **3. 기능 테스트**
- 재고 관리 페이지 접속
- 구글 캘린더 연동 버튼 클릭
- 각 기능별 정상 작동 확인

## 🔍 **문제 해결**

### **환경변수가 인식되지 않는 경우**
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 인코딩이 UTF-8인지 확인
3. 프로젝트 재시작

### **Supabase 연결 실패**
1. URL과 키가 올바른지 확인
2. Supabase 프로젝트가 활성 상태인지 확인
3. 데이터베이스 스키마가 생성되었는지 확인

### **Google Calendar 연동 실패**
1. OAuth 클라이언트 ID 설정 확인
2. 리디렉션 URI가 정확한지 확인
3. Google Calendar API가 활성화되었는지 확인

## 📞 **추가 지원**

문제가 지속되는 경우:
1. 브라우저 콘솔의 에러 메시지 확인
2. 터미널의 서버 로그 확인
3. 각 서비스의 대시보드에서 설정 상태 확인

---

**🎯 현재 상태**: 환경변수 템플릿 설정 완료
**⏭️ 다음 단계**: 실제 API 키 값으로 교체
