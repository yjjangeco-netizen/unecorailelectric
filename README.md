# 🚄 유네코레일 전기파트 업무관리 시스템

전기파트의 재고관리, 업무일지, SOP 등을 통합 관리하는 현대적인 웹 애플리케이션입니다.

## 📸 스크린샷

### 🏠 메인 대시보드
![메인 대시보드](public/screenshots/main-dashboard.png)
*전체 시스템 현황을 한눈에 파악할 수 있는 메인 대시보드*

### 📦 재고 관리
![재고 관리](public/screenshots/stock-management.png)
*품목별 재고 현황, 입출고 이력, 재고 조정 기능*

### 📊 재고 통계
![재고 통계](public/screenshots/stock-statistics.png)
*재고 가치, 품목별 분포, 트렌드 분석*

### 🔐 사용자 관리
![사용자 관리](public/screenshots/user-management.png)
*권한별 사용자 관리, 역할 기반 접근 제어*

## ✨ 주요 기능

- **📦 재고 관리**: 실시간 재고 현황, 입출고 처리, 재고 조정
- **📝 업무일지**: 일일 작업 기록, 프로젝트별 이력 관리
- **📋 SOP 관리**: 표준작업절차 문서화 및 관리
- **🔐 권한 관리**: RBAC 기반 사용자 권한 제어
- **📊 감사 로그**: 모든 작업의 상세한 추적 기록
- **📱 반응형 UI**: 모바일/태블릿/데스크톱 최적화

## 🚀 빠른 시작

### 필수 요구사항

- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Supabase 계정 및 프로젝트

### 1. 저장소 클론

```bash
git clone https://github.com/yjjangeco-netizen/unecorailelectric.git
cd unecorailelectric
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 로깅 레벨
NEXT_PUBLIC_LOG_LEVEL=info

# 환경
NODE_ENV=development
```

**⚠️ 보안 주의사항**: 
- 절대 실제 프로덕션 계정 정보를 코드에 하드코딩하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있어야 합니다
- 프로덕션 환경에서는 환경변수 관리 서비스를 사용하세요

### 4. 데이터베이스 설정

#### Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key를 환경변수에 설정

#### 스키마 적용
```bash
# 데이터베이스 스키마 적용
npm run db:migrate

# 또는 수동으로 SQL 실행
psql -h your_host -U your_user -d your_db -f database/tables/closing_tables.sql
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 🗄️ 데이터베이스 관리

### Migration 스크립트

```bash
# 개발 환경 마이그레이션
npm run db:migrate:dev

# 프로덕션 환경 마이그레이션
npm run db:migrate:prod

# 마이그레이션 롤백
npm run db:rollback

# 스키마 상태 확인
npm run db:status
```

### RLS 정책

Row Level Security가 활성화되어 있어 데이터 접근을 사용자 권한에 따라 제한합니다:

```sql
-- 예시: 사용자는 자신의 부서 데이터만 접근 가능
CREATE POLICY "Users can only access their department data" ON items
FOR ALL USING (department = current_setting('app.department'));
```

## 🧪 테스트

### 테스트 실행

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 전체 테스트 스위트
npm run test:all
```

### 성능 테스트

```bash
# 부하 테스트
npm run test:load

# 메모리 누수 테스트
npm run test:memory

# 응답 시간 테스트
npm run test:performance
```

### 보안 테스트

```bash
# 취약점 스캔
npm run test:security

# 권한 테스트
npm run test:auth

# SQL 인젝션 테스트
npm run test:sql-injection
```

## 🔒 보안

### 인증 및 권한

- **JWT 기반 인증**: Supabase Auth 사용
- **RBAC**: 역할 기반 접근 제어
- **세션 관리**: 자동 세션 만료 및 갱신
- **API 보안**: Rate limiting 및 입력 검증

### 데이터 보호

- **암호화**: 저장 시 AES-256, 전송 시 TLS 1.3
- **감사 로그**: 모든 데이터 접근 및 변경 기록
- **백업**: 자동 데이터베이스 백업 (일 1회)

### 보안 체크리스트

- [ ] 환경변수에 민감한 정보 포함 금지
- [ ] 정기적인 의존성 보안 업데이트
- [ ] 로그에 개인정보 노출 금지
- [ ] HTTPS 강제 적용
- [ ] CORS 정책 적절히 설정

## 🚀 배포

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

### Docker 배포

```bash
# Docker 이미지 빌드
docker build -t unecorailelectric .

# 컨테이너 실행
docker run -p 3000:3000 unecorailelectric
```

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

## 🔧 개발 가이드

### 코드 구조

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 라우트
│   ├── components/     # 재사용 가능한 컴포넌트
│   └── pages/          # 페이지 컴포넌트
├── lib/                # 유틸리티 및 헬퍼
├── hooks/              # 커스텀 React 훅
└── types/              # TypeScript 타입 정의
```

### 코딩 컨벤션

- **TypeScript**: 엄격 모드 사용
- **ESLint**: 코드 품질 강제
- **Prettier**: 코드 포맷팅 자동화
- **Husky**: Git 훅으로 품질 검사

### 커밋 메시지

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 변경
```

## 📊 모니터링

### 로그 관리

```bash
# 로그 레벨 설정
NEXT_PUBLIC_LOG_LEVEL=debug  # 개발
NEXT_PUBLIC_LOG_LEVEL=info   # 프로덕션
NEXT_PUBLIC_LOG_LEVEL=warn   # 경고만
NEXT_PUBLIC_LOG_LEVEL=error  # 에러만
```

### 성능 모니터링

- **Core Web Vitals**: Lighthouse 점수 모니터링
- **API 응답 시간**: 평균 응답 시간 추적
- **메모리 사용량**: 메모리 누수 감지
- **에러율**: 4xx, 5xx 에러 비율 모니터링

## 🤝 기여하기

### 개발 환경 설정

1. Fork 저장소
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 이슈 리포트

버그 발견 시 다음 정보를 포함하여 이슈를 생성해주세요:

- **환경**: OS, Node.js 버전, 브라우저
- **재현 단계**: 버그 발생 과정
- **예상 동작**: 정상적인 동작
- **실제 동작**: 버그 발생 시 동작
- **스크린샷**: 가능한 경우 첨부

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

### 공식 채널

- **GitHub Issues**: [이슈 리포트](https://github.com/yjjangeco-netizen/unecorailelectric/issues)
- **GitHub Discussions**: [토론 및 질문](https://github.com/yjjangeco-netizen/unecorailelectric/discussions)
- **Wiki**: [상세 문서](https://github.com/yjjangeco-netizen/unecorailelectric/wiki)

### 커뮤니티

- **개발자 모임**: 월 1회 온라인 모임
- **기술 블로그**: [개발 노트](https://blog.unecorail.com)
- **Slack**: [커뮤니티 채널](https://unecorail.slack.com)

---

**🚀 유네코레일 전기파트와 함께 더 나은 업무 환경을 만들어가세요!**

*마지막 업데이트: 2024년 8월*
