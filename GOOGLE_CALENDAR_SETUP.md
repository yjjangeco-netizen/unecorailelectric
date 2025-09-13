# 구글 캘린더 연동 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: "유네코레일 전기파트 시스템"

### 1.2 Google Calendar API 활성화
1. Google Cloud Console에서 "API 및 서비스" > "라이브러리" 이동
2. "Google Calendar API" 검색 후 선택
3. "사용" 버튼 클릭하여 API 활성화

### 1.3 OAuth 2.0 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보" 이동
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: "유네코레일 전기파트 시스템"
5. 승인된 자바스크립트 원본:
   - `http://localhost:3000` (개발용)
   - `https://yourdomain.com` (프로덕션용)
6. 승인된 리디렉션 URI:
   - `http://localhost:3000/api/auth/google/callback` (개발용)
   - `https://yourdomain.com/api/auth/google/callback` (프로덕션용)
7. "만들기" 클릭하여 클라이언트 ID와 비밀번호 생성

## 2. 환경변수 설정

`.env.local` 파일에 다음 환경변수 추가:

```env
# Google Calendar API 설정
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## 3. 기능 설명

### 3.1 일정 조회
- 구글 캘린더에서 등록된 일정을 자동으로 동기화
- 월간/일간 캘린더 뷰로 일정 확인
- 실시간 일정 업데이트

### 3.2 일정 생성
- 구글 캘린더에서 직접 일정 생성
- 팀원들과 일정 공유
- 알림 및 리마인더 설정

### 3.3 권한 관리
- Level 3 이상 사용자만 일정 관리 기능 접근
- 구글 계정 연동을 통한 보안 인증

## 4. 사용 방법

### 4.1 구글 캘린더 연동
1. 일정 관리 페이지 접속
2. "구글 캘린더 연동" 버튼 클릭
3. 구글 계정으로 로그인 및 권한 승인
4. 연동 완료 후 실제 일정 데이터 확인

### 4.2 일정 관리
1. 구글 캘린더에서 일정 생성/수정/삭제
2. 시스템에서 자동으로 동기화된 일정 확인
3. 팀원들과 일정 공유 및 협업

## 5. 문제 해결

### 5.1 연동 실패
- 환경변수 설정 확인
- Google Cloud Console에서 API 활성화 상태 확인
- 리디렉션 URI 설정 확인

### 5.2 일정 동기화 오류
- 구글 계정 권한 확인
- 토큰 만료 시 재연동 필요
- 네트워크 연결 상태 확인

## 6. 보안 고려사항

- OAuth 2.0을 통한 안전한 인증
- 토큰은 서버에서만 처리
- 사용자별 개별 권한 관리
- HTTPS 필수 (프로덕션 환경)
