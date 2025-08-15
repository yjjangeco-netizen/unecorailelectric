# 유네코레일 전기파트 업무관리 시스템

전기파트의 재고관리, 업무일지, SOP 등을 통합 관리하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **재고관리**: 입고/출고, 재고 현황, 이력 관리
- **업무일지**: 캘린더 기반 일지 작성 및 관리
- **메뉴얼 관리**: 업무 매뉴얼 및 가이드 문서 관리
- **SOP**: 표준작업절차 관리
- **재고 마감**: 분기별 마감 및 보고서 생성

## 🛠️ 기술 스택

- **Frontend**: Next.js 15.4.5, React 19.1.0, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Local Storage
- **UI Components**: Radix UI + Custom Components

## 📋 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정

#### 개발 환경
`.env.example`을 복사하여 `.env.local` 파일을 생성하세요:

```bash
cp .env.example .env.local
```

그리고 실제 값으로 업데이트하세요:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth / Calendar (선택)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Node 환경
NODE_ENV=development
```

#### 🗄️ **데이터베이스 환경별 설정**

**🔧 프로토타입/학습용 (빠른 테스트):**
- **허용**: SQLite 또는 MS Access - 로컬 개발, 빠른 검증
- **제약**: 단일 사용자, 데이터 지속성 제한

**🚀 개발/프로덕션 환경 (권장/필수):**
- **필수**: Supabase (PostgreSQL) + RLS 정책 + 인덱스
- **보안**: `.env` 파일로 비밀키 관리, RLS 정책 적용
- **설정**: `database/rls-policies.sql` 스크립트 실행 필요
- **확장성**: 다중 사용자, 실시간 동기화, 백업/복구

**💡 현재 프로젝트**: Supabase 기반으로 구성됨 (프로덕션 레디)

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 품질 체크 (배포 전 필수)
```bash
npm run check
```

이 명령어는 다음을 순차적으로 실행합니다:
- TypeScript 타입 체크
- ESLint 검사 (경고=에러)
- 단위 테스트 (커버리지 포함)

### 5. 프로덕션 빌드
```bash
npm run build
npm start
```

## 🔐 보안 설정

### 사용자 권한 체계
- **관리자 (admin)**: 모든 기능 접근 가능
- **전기팀 (electric)**: 입고/출고/현황/검색
- **일반사용자 (user)**: 현황/검색만 가능

### 기본 계정 (개발용)
- **관리자**: admin / admin
- **전기팀**: electric / electric

⚠️ **주의**: 프로덕션 환경에서는 반드시 기본 계정을 변경하세요!

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx          # 메인 페이지
│   ├── stock-management/ # 재고관리
│   ├── work-diary/      # 업무일지
│   ├── manual-management/# 메뉴얼관리
│   ├── sop/             # SOP 관리
│   └── work-tool/       # 업무도구
├── components/           # 재사용 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트
│   ├── StockInModal.tsx # 입고 모달
│   ├── StockOutModal.tsx# 출고 모달
│   └── ...
├── lib/                  # 유틸리티 및 설정
│   ├── supabase.ts      # Supabase 클라이언트
│   └── utils.ts         # 공통 유틸리티
└── types/               # TypeScript 타입 정의
```

## 🧪 테스트

### 단위 테스트
```bash
npm run test
```

### E2E 테스트
```bash
npm run test:e2e
```

### 테스트 커버리지
```bash
npm run test:coverage
```

## 📊 성능 최적화

- React.memo를 사용한 컴포넌트 최적화
- useCallback/useMemo를 사용한 함수/값 메모이제이션
- 가상화 스크롤 (대용량 데이터)
- 이미지 최적화 및 지연 로딩

## 🚨 에러 처리

- 전역 에러 바운더리
- 사용자 친화적 에러 메시지
- 에러 로깅 및 추적
- 성능 모니터링

## 📝 코딩 컨벤션

### TypeScript
- 엄격한 타입 체크 사용
- any 타입 사용 금지
- 인터페이스 우선 설계

### React
- 함수형 컴포넌트 사용
- Hooks 규칙 준수
- Props 인터페이스 정의

### CSS
- Tailwind CSS 클래스 우선
- 컴포넌트별 스타일 모듈화
- 반응형 디자인 원칙

## 🔄 배포

### Vercel (권장)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t unecorailelectric .
docker run -p 3000:3000 unecorailelectric
```

## 📞 지원

- **개발팀**: JYJ
- **문의**: [이메일 또는 연락처]
- **이슈**: GitHub Issues

## 📄 라이선스

© 2025 JYJ. All rights reserved.

---

## 🚀 빠른 시작

1. 저장소 클론
2. 의존성 설치: `npm install`
3. 환경변수 설정: `.env.local` 생성
4. 개발 서버 실행: `npm run dev`
5. 브라우저에서 `http://localhost:3000` 접속

## 🔧 개발 팁

- **Hot Reload**: 코드 변경 시 자동 새로고침
- **TypeScript**: 컴파일 오류 실시간 확인
- **ESLint**: 코드 품질 자동 검사
- **Prettier**: 코드 포맷팅 자동화
