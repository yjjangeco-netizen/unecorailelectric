# 보안 가이드

## 구현된 보안 기능

### 1. 비밀번호 보안
- **bcrypt 해시 암호화**: 비밀번호를 안전하게 해시화하여 저장
- **비밀번호 강도 검증**: 최소 8자, 대소문자, 숫자, 특수문자 포함 필수
- **솔트 라운드**: 12라운드로 해시 강도 보장

### 2. JWT 토큰 인증
- **토큰 기반 인증**: 세션 대신 JWT 토큰 사용
- **토큰 만료**: 24시간 자동 만료 (환경변수로 설정 가능)
- **시크릿 키**: 환경변수로 관리되는 안전한 시크릿 키

### 3. 입력값 검증 및 XSS 방지
- **사용자명 검증**: 영문, 숫자, _, - 만 허용 (3-20자)
- **XSS 방지**: HTML 태그, 따옴표 등 위험한 문자 제거
- **입력값 정제**: 모든 사용자 입력에 대해 sanitizeInput 적용

### 4. 데이터베이스 보안
- **비밀번호 제외**: API 응답에서 비밀번호 필드 제거
- **활성 사용자만**: is_active=true인 사용자만 로그인 허용
- **중복 검증**: 회원가입 시 사용자명 중복 확인

## 환경변수 설정

프로덕션 환경에서는 다음 환경변수를 반드시 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# JWT 보안 설정 (중요!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# 환경 설정
NODE_ENV=production
```

## 추가 보안 권장사항

### 1. HTTPS 강제
- 프로덕션에서는 반드시 HTTPS 사용
- HTTP Strict Transport Security (HSTS) 헤더 설정

### 2. Rate Limiting
- 로그인 시도 횟수 제한 (현재 MAX_LOGIN_ATTEMPTS = 5)
- API 호출 빈도 제한

### 3. 로그 모니터링
- 실패한 로그인 시도 로깅
- 의심스러운 활동 모니터링

### 4. 정기적인 보안 업데이트
- 의존성 패키지 정기 업데이트
- 보안 패치 즉시 적용

## 사용법

### 로그인
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})

const { user, token } = await response.json()
// 토큰을 localStorage나 쿠키에 저장
```

### 인증이 필요한 API 호출
```javascript
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### 회원가입
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'newuser',
    password: 'SecurePass123!',
    name: '홍길동',
    department: '전기팀',
    position: '사원',
    level: '2'
  })
})
```

## 주의사항

1. **JWT_SECRET**: 프로덕션에서는 반드시 강력한 랜덤 문자열로 변경
2. **비밀번호 정책**: 사용자에게 강력한 비밀번호 사용 안내
3. **토큰 관리**: 클라이언트에서 토큰을 안전하게 저장
4. **로그 보안**: 민감한 정보가 로그에 기록되지 않도록 주의
