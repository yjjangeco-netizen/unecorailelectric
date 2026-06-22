# 작업 목록 (코드↔DB 대조 / 보안 정리)

> 기준일: 2026-06-22 · DB 라이브 스키마 대조 기반

## ✅ 완료 (이번 세션)

- [x] **인증 우회 차단** — 미들웨어에서 클라가 보낸 `x-user-id`/`x-user-level` 제거 후 검증된 JWT로만 주입 (API 38곳 일괄) · `src/middleware.ts`
- [x] **JWT fail-closed** — 하드코딩 기본키 제거, 시크릿 없으면 검증 거부 · `src/lib/security.ts`, `src/middleware.ts`
- [x] **cron 무인증 차단** — `CRON_SECRET` 가드 · `src/app/api/nara-monitoring/cron/route.ts`
- [x] **유령 테이블 `calendar_events` 버그픽스** → 실제 `events` 테이블 + `participant_id` · `src/app/api/work-diary/missing/route.ts`
- [x] **죽은 코드 제거** — `stock/close` 라우트 삭제(호출처 0, Supabase Auth+없는 RPC)
- [x] **마이그레이션 생성** — `database/create_audit_logs.sql`, `database/create_closing_history.sql`
- [x] **빌드 산출물 정리** — `.next`/`out` git 추적 해제, 잡파일 삭제 스테이징, `.gitignore` 보강
- [x] 전체 타입체크 0 에러 확인

## 🚨 배포 전 필수 (사용자 작업 — 코드로 해결 불가)

- [ ] **Vercel `JWT_SECRET` 설정 확인** — 없으면 fail-closed로 전원 로그인 불가
- [ ] **Supabase 마이그레이션 실행**
  - [ ] `database/create_audit_logs.sql`
  - [ ] `database/create_closing_history.sql`
  - [ ] 기타 staged `create_*.sql` 중 미실행분 (telegram_users, app_settings, memos, assistant_automation 등)
- [ ] (선택) Vercel `CRON_SECRET` 설정 — nara cron 보호 시
- [ ] 변경분 커밋 / 배포

## 🔧 코드 후속 (선택 — 안 해도 동작)

- [x] **#4 `closing-process` 인증 교체** — 커스텀 JWT(`getApiUser`)+DB 권한 재확인으로 교체, 죽은 `exec_sql` DDL 제거 · `src/app/api/stock/closing-process/route.ts`
- [x] **`closing-history` 인증 가드** — GET 로그인 필수 / POST 관리자 전용 (무인증 조회·위조 차단) · `src/app/api/stock/closing-history/route.ts`
- [ ] **`.or()` 입력검증** — `getAssistantOwnerById` PostgREST 필터 인젝션 위생 (입력이 검증된 JWT라 위험은 낮음) · `src/lib/assistantAccessServer.ts:12`
- [ ] **텔레그램 link fail-open 차단** — `TELEGRAM_LINK_CODE` 미설정 시 누구나 타 계정 연결 가능 · `src/lib/assistantTelegram.ts:132`
- [ ] **`leave_type` 정합성** — DB CHECK는 `annual`/`half_day`만 허용, 코드 라벨맵의 `sick`/`personal`/`early_leave`는 죽은 분기 · `src/lib/assistantTelegram.ts:265`
- [ ] **봇 토큰 평문 저장 검토** — nara config의 `telegramBotToken`이 `app_settings`에 평문 · `src/app/api/nara-monitoring/cron/route.ts:31`

## 🔎 참고 (정보)

- `users` 테이블 `depart`(레거시)·`department` 중복 — 코드는 `department` 사용, `depart`는 죽은 컬럼
- `events.project_id`(text) vs `projects.id`(integer) 타입 불일치 (기존)
- autoLogin 쿠키 10년 vs JWT exp 24h — 24h마다 재로그인 필요 (회귀 아님, 페이지는 원래 그랬음)

## ✔️ 검증 체크

- [ ] 로컬에서 DevTools로 `x-user-id`를 타인 값으로 바꿔 `/api/todos` 호출 → 본인 토큰 기준으로만 처리되는지 확인
- [ ] `npm run build` 1회 통과 확인
