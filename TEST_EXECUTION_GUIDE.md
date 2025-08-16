# 🧪 테스트 실행 및 검증 가이드

## 🎯 **목표**
새로 추가된 성능, 보안, 부하 테스트 스크립트들을 실행하고 검증하여 시스템의 안정성과 성능을 확인합니다.

## 📋 **테스트 스크립트 목록**

### **1. 🚀 성능 테스트**
- **메모리 누수 테스트**: `npm run test:memory`
- **성능 벤치마크**: `npm run test:performance`
- **부하 테스트**: `npm run test:load`

### **2. 🛡️ 보안 테스트**
- **보안 감사**: `npm run test:security`
- **인증 테스트**: `npm run test:auth`
- **SQL 인젝션 테스트**: `npm run test:sql-injection`

### **3. 📊 통합 테스트**
- **전체 테스트 스위트**: `npm run test:all`
- **E2E 테스트**: `npm run test:e2e`
- **스트레스 테스트**: `npm run test:stress`

## 🔧 **테스트 환경 준비**

### **Step 1: 의존성 설치**
```bash
# 기본 의존성 설치
npm install

# 테스트 관련 추가 의존성 설치
npm install --save-dev artillery lighthouse-cli
```

### **Step 2: 환경변수 설정**
```bash
# .env.local 파일에 테스트 환경 설정 추가
NODE_ENV=test
TESTING=true
MOCK_EXTERNAL_SERVICES=true
```

### **Step 3: 테스트 데이터베이스 준비**
```bash
# 테스트용 데이터베이스 설정
TEST_DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db
```

## 🧪 **테스트 실행 단계별 가이드**

### **Phase 1: 기본 테스트 검증**

#### **1.1 코드 품질 검사**
```bash
# 린트 검사
npm run lint

# 타입 체크
npm run type-check

# 포맷 검사
npm run format:check
```

#### **1.2 단위 테스트**
```bash
# 기본 테스트 실행
npm run test

# 커버리지 포함 테스트
npm run test:coverage

# 특정 테스트 파일만 실행
npm run test -- --testPathPattern=auth
```

#### **1.3 E2E 테스트**
```bash
# Playwright 브라우저 설치
npx playwright install --with-deps

# E2E 테스트 실행
npm run test:e2e

# UI 모드로 테스트 실행
npm run test:e2e:ui
```

### **Phase 2: 성능 테스트 실행**

#### **2.1 메모리 누수 테스트**
```bash
# 메모리 테스트 실행
npm run test:memory

# 결과 확인
cat tests/performance/memory-test-report.json
```

**예상 결과**:
- 메모리 사용량 스냅샷 생성
- 메모리 성장률 분석
- 잠재적 메모리 누수 감지

#### **2.2 성능 벤치마크**
```bash
# 개발 서버 시작
npm run dev

# 새 터미널에서 성능 테스트 실행
npm run test:performance
```

**예상 결과**:
- Lighthouse 성능 점수
- Core Web Vitals 측정
- 성능 최적화 권장사항

#### **2.3 부하 테스트**
```bash
# Artillery 설치 확인
npm list -g artillery

# 부하 테스트 실행
npm run test:load

# 환경별 테스트
npm run test:load -- --environment=development
```

**예상 결과**:
- 응답 시간 통계
- 처리량 측정
- 오류율 분석

### **Phase 3: 보안 테스트 실행**

#### **3.1 보안 감사**
```bash
# npm 보안 감사
npm audit

# 보안 테스트 실행
npm run test:security
```

**예상 결과**:
- 취약점 보고서
- 보안 권장사항
- 의존성 보안 상태

#### **3.2 인증 테스트**
```bash
# 인증 관련 테스트만 실행
npm run test:auth
```

**예상 결과**:
- 로그인/로그아웃 테스트
- 권한 검증 테스트
- 세션 관리 테스트

#### **3.3 SQL 인젝션 테스트**
```bash
# 보안 테스트 실행
npm run test:sql-injection
```

**예상 결과**:
- SQL 인젝션 취약점 검사
- 입력 검증 테스트
- 데이터베이스 보안 테스트

### **Phase 4: 통합 테스트 실행**

#### **4.1 전체 테스트 스위트**
```bash
# 모든 테스트 실행
npm run test:all
```

**예상 결과**:
- 모든 테스트 통과
- 전체 커버리지 리포트
- 성능 메트릭 요약

#### **4.2 스트레스 테스트**
```bash
# 스트레스 테스트 실행
npm run test:stress
```

**예상 결과**:
- 고부하 상황에서의 안정성
- 메모리 및 CPU 사용량
- 응답 시간 저하 패턴

## 📊 **테스트 결과 분석**

### **성능 메트릭 해석**

#### **메모리 테스트 결과**
```json
{
  "summary": {
    "totalSnapshots": 12,
    "initialMemory": 45,
    "finalMemory": 52,
    "memoryGrowth": 7
  }
}
```

**해석 가이드**:
- **memoryGrowth < 10MB**: 정상
- **memoryGrowth 10-50MB**: 주의 필요
- **memoryGrowth > 50MB**: 메모리 누수 의심

#### **부하 테스트 결과**
```yaml
# Artillery 결과 예시
http.response_time:
  min: 45
  max: 1250
  median: 89
  p95: 156
  p99: 234
```

**해석 가이드**:
- **p95 < 200ms**: 우수
- **p95 200-500ms**: 양호
- **p95 > 500ms**: 개선 필요

### **보안 테스트 결과**

#### **npm audit 결과**
```
# 보안 취약점 수준
Low: 0
Moderate: 2
High: 0
Critical: 0
```

**해석 가이드**:
- **Critical/High**: 즉시 수정 필요
- **Moderate**: 계획적 수정 권장
- **Low**: 선택적 수정

## 🔍 **문제 해결 가이드**

### **일반적인 테스트 오류**

#### **1. 메모리 테스트 실패**
```
Error: Cannot read property 'rss' of undefined
```
**해결방법**: Node.js 버전 확인, process.memoryUsage() 지원 여부 확인

#### **2. 부하 테스트 실패**
```
Error: Artillery not found
```
**해결방법**: `npm install -g artillery` 또는 `npx artillery` 사용

#### **3. 성능 테스트 실패**
```
Error: Lighthouse failed
```
**해결방법**: Chrome 브라우저 설치, 네트워크 연결 상태 확인

#### **4. 보안 테스트 실패**
```
Error: npm audit failed
```
**해결방법**: npm 버전 업데이트, package-lock.json 재생성

### **성능 최적화 팁**

#### **메모리 사용량 최적화**
1. **가비지 컬렉션**: 주기적인 메모리 정리
2. **스트림 처리**: 대용량 데이터 스트리밍 처리
3. **캐시 관리**: 메모리 캐시 크기 제한

#### **응답 시간 최적화**
1. **데이터베이스 쿼리**: 인덱스 최적화, 쿼리 튜닝
2. **API 응답**: 응답 데이터 크기 최소화
3. **캐싱 전략**: Redis, 메모리 캐시 활용

## 📈 **테스트 자동화 설정**

### **GitHub Actions 통합**
```yaml
# .github/workflows/test.yml
name: Automated Testing
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:all
```

### **로컬 자동화**
```bash
# package.json에 스크립트 추가
"scripts": {
  "test:automated": "npm run lint && npm run type-check && npm run test:all"
}
```

## 🔄 **지속적 테스트 개선**

### **정기적인 테스트 계획**
- **일일**: 기본 단위 테스트
- **주간**: 성능 및 보안 테스트
- **월간**: 전체 테스트 스위트 및 스트레스 테스트

### **테스트 커버리지 개선**
- **코드 커버리지**: 80% 이상 목표
- **기능 커버리지**: 주요 비즈니스 로직 100% 커버
- **에러 시나리오**: 예외 상황 테스트 케이스 추가

## 🎉 **완료 후 다음 단계**

테스트 실행 및 검증이 완료되면 다음 단계로 진행합니다:

1. **문서 업데이트**: 실제 사용 사례 및 트러블슈팅 가이드 추가
2. **모니터링 설정**: 테스트 결과 자동 수집 및 분석
3. **성능 최적화**: 테스트 결과를 바탕으로 시스템 개선

---

**💡 팁**: 테스트는 시스템의 안정성과 성능을 보장하는 핵심 요소입니다. 
정기적으로 실행하고 결과를 분석하여 지속적으로 개선해나가세요.
