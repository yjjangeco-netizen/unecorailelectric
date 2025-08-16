# 🚀 CI/CD 파이프라인 활성화 가이드

## 🎯 **목표**
GitHub Actions를 사용하여 자동화된 테스트, 빌드, 배포 파이프라인을 활성화합니다.

## 📋 **필요한 GitHub Secrets**

### **1. Supabase 데이터베이스 설정**
```
DATABASE_URL_DEV=https://your-dev-project.supabase.co
DATABASE_URL_PROD=https://your-prod-project.supabase.co
```

### **2. Vercel 배포 설정**
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

### **3. 추가 보안 설정 (선택사항)**
```
NPM_TOKEN=your_npm_token_here
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
```

## 🔧 **설정 단계별 가이드**

### **Step 1: GitHub 저장소 설정**

1. **GitHub 저장소 접속**
   - `https://github.com/yjjangeco-netizen/unecorailelectric` 접속
   - Settings 탭 클릭

2. **Secrets and variables → Actions 선택**
   - 왼쪽 사이드바에서 "Secrets and variables" → "Actions" 클릭
   - "New repository secret" 버튼 클릭

### **Step 2: Supabase Secrets 설정**

1. **DATABASE_URL_DEV 설정**
   ```
   Name: DATABASE_URL_DEV
   Value: https://your-dev-project.supabase.co
   ```

2. **DATABASE_URL_PROD 설정**
   ```
   Name: DATABASE_URL_PROD
   Value: https://your-prod-project.supabase.co
   ```

### **Step 3: Vercel Secrets 설정**

1. **Vercel 토큰 생성**
   - [Vercel Dashboard](https://vercel.com/account/tokens) 접속
   - "Create Token" 클릭
   - 토큰 이름 입력 (예: "GitHub Actions")
   - 토큰 생성 및 복사

2. **VERCEL_TOKEN 설정**
   ```
   Name: VERCEL_TOKEN
   Value: [복사한 토큰]
   ```

3. **Vercel 프로젝트 정보 확인**
   - Vercel 프로젝트 설정에서 확인
   - Project ID와 Org ID 복사

4. **VERCEL_ORG_ID 설정**
   ```
   Name: VERCEL_ORG_ID
   Value: [복사한 Org ID]
   ```

5. **VERCEL_PROJECT_ID 설정**
   ```
   Name: VERCEL_PROJECT_ID
   Value: [복사한 Project ID]
   ```

### **Step 4: 파이프라인 활성화 확인**

1. **Actions 탭 확인**
   - GitHub 저장소의 Actions 탭 클릭
   - "Test & Build Pipeline" 워크플로우 확인

2. **수동 실행 테스트**
   - "Run workflow" 버튼 클릭
   - 브랜치 선택 (main)
   - "Run workflow" 클릭

## 🧪 **파이프라인 테스트 및 검증**

### **1. 코드 품질 검사 테스트**
```bash
# 로컬에서 테스트
npm run lint
npm run type-check
npm run format:check
```

### **2. 단위 테스트 실행**
```bash
# 로컬에서 테스트
npm run test -- --coverage --watchAll=false
```

### **3. E2E 테스트 실행**
```bash
# 로컬에서 테스트
npm run test:e2e
```

### **4. 빌드 테스트**
```bash
# 로컬에서 테스트
npm run build
```

## 📊 **파이프라인 모니터링**

### **실행 상태 확인**
- **Actions 탭**: 모든 워크플로우 실행 상태
- **실시간 로그**: 각 단계별 실행 로그
- **아티팩트**: 테스트 결과 및 빌드 파일

### **성공/실패 알림**
- **GitHub 알림**: 저장소 설정에서 알림 활성화
- **이메일 알림**: GitHub 계정 설정에서 이메일 알림 활성화
- **Slack/Discord 연동**: 웹훅 설정으로 자동 알림

## 🔍 **문제 해결 가이드**

### **일반적인 오류 및 해결방법**

#### **1. 권한 오류**
```
Error: Permission denied
```
**해결방법**: GitHub Secrets가 올바르게 설정되었는지 확인

#### **2. 데이터베이스 연결 오류**
```
Error: Connection refused
```
**해결방법**: DATABASE_URL이 올바른지, Supabase 프로젝트가 활성 상태인지 확인

#### **3. Vercel 배포 오류**
```
Error: Invalid token
```
**해결방법**: VERCEL_TOKEN이 유효한지, 프로젝트 권한이 있는지 확인

#### **4. 의존성 설치 오류**
```
Error: npm ci failed
```
**해결방법**: package-lock.json이 최신 상태인지, Node.js 버전이 맞는지 확인

### **디버깅 팁**
1. **로컬에서 먼저 테스트**: CI/CD에서 실패하는 경우 로컬에서 동일한 명령어 실행
2. **로그 상세 분석**: GitHub Actions 로그에서 정확한 오류 위치 파악
3. **단계별 테스트**: 전체 파이프라인이 아닌 개별 단계별로 테스트

## 📈 **성능 최적화**

### **캐시 활용**
- **npm 캐시**: 의존성 설치 시간 단축
- **Docker 레이어 캐시**: 컨테이너 빌드 시간 단축
- **Git 캐시**: 코드 체크아웃 시간 단축

### **병렬 실행**
- **독립적인 작업**: 동시에 실행 가능한 작업 병렬 처리
- **의존성 최적화**: 작업 간 의존성 최소화

### **리소스 관리**
- **Runner 선택**: 적절한 GitHub-hosted runner 선택
- **타임아웃 설정**: 각 단계별 적절한 타임아웃 설정

## 🔄 **지속적 개선**

### **정기적인 검토**
- **주간**: 파이프라인 성공률 및 실행 시간 분석
- **월간**: 새로운 도구 및 최적화 기법 적용
- **분기별**: 전체 CI/CD 전략 검토 및 개선

### **메트릭 수집**
- **실행 시간**: 각 단계별 실행 시간 추적
- **성공률**: 전체 파이프라인 및 개별 단계 성공률
- **리소스 사용량**: CPU, 메모리, 네트워크 사용량 모니터링

## 🎉 **완료 후 다음 단계**

CI/CD 파이프라인이 성공적으로 활성화되면 다음 단계로 진행합니다:

1. **테스트 실행**: 새로 추가된 테스트 스크립트 검증
2. **문서 업데이트**: 실제 사용 사례 및 트러블슈팅 가이드 추가
3. **모니터링 설정**: 파이프라인 성능 및 상태 모니터링

---

**💡 팁**: CI/CD 파이프라인은 개발 생산성과 코드 품질을 크게 향상시킵니다. 
처음에는 간단하게 시작하고 점진적으로 개선해나가세요.
