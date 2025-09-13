# 환경변수 설정 가이드

## 🚨 현재 문제 상황
프로젝트에서 "재고 내역을 불러오는 중 오류가 발생했습니다" 에러가 발생하고 있습니다.

## 🔍 문제 원인
1. **환경변수 누락**: Supabase 연결 정보가 설정되지 않음
2. **데이터베이스 연결 실패**: 기본값으로 설정된 더미 URL로 연결 시도
3. **테이블 스키마 누락**: 필요한 데이터베이스 테이블이 생성되지 않음

## 🛠️ 해결 방법

### 1단계: 환경변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하세요:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2단계: Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에 로그인
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Settings > API에서 URL과 anon key 복사
4. `.env.local` 파일에 붙여넣기

### 3단계: 데이터베이스 스키마 생성

`database/tables/` 폴더의 SQL 파일들을 실행하여 필요한 테이블을 생성하세요:

```bash
# 개발 환경
npm run db:migrate:dev

# 또는 수동으로 SQL 실행
psql $DATABASE_URL_DEV -f database/tables/closing_tables.sql
```

### 4단계: 프로젝트 재시작

환경변수를 설정한 후 프로젝트를 재시작하세요:

```bash
npm run dev
```

## 📋 필요한 테이블

- `users` - 사용자 정보
- `items` - 품목 정보
- `current_stock` - 현재 재고
- `stock_in` - 입고 내역
- `stock_out` - 출고 내역

## 🔧 문제 해결 체크리스트

- [ ] `.env.local` 파일 생성
- [ ] Supabase URL 설정
- [ ] Supabase Anon Key 설정
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 프로젝트 재시작
- [ ] 브라우저 콘솔에서 에러 메시지 확인

## 🚀 추가 도움말

문제가 지속되는 경우:

1. **브라우저 콘솔 확인**: F12 > Console에서 구체적인 에러 메시지 확인
2. **네트워크 탭 확인**: API 요청/응답 상태 확인
3. **Supabase 대시보드**: 테이블 생성 상태 및 RLS 정책 확인

## 📞 지원

추가 도움이 필요한 경우:
- 프로젝트 이슈 등록
- 개발팀 문의
- Supabase 공식 문서 참조
