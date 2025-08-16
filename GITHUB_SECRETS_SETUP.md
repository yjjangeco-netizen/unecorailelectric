# 🔐 GitHub Secrets 실제 설정 가이드

## 🎯 **목표**
GitHub Actions CI/CD 파이프라인을 활성화하기 위해 필요한 실제 Secrets를 설정합니다.

## 📋 **필요한 GitHub Secrets 목록**

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

## 🔧 **실제 설정 단계**

### **Step 1: Supabase 프로젝트 정보 확인**

1. **Supabase 대시보드 접속**
   - [Supabase Dashboard](https://supabase.com/dashboard) 접속
   - 프로젝트 선택

2. **프로젝트 URL 확인**
   - Settings → API 탭
   - Project URL 복사 (예: `https://abcdefghijklmnop.supabase.co`)

3. **API Keys 확인**
   - `anon` `public` 키 복사
   - `service_role` `secret` 키 복사 (관리자용)

### **Step 2: Vercel 프로젝트 정보 확인**

1. **Vercel 대시보드 접속**
   - [Vercel Dashboard](https://vercel.com/dashboard) 접속
   - 프로젝트 선택

2. **프로젝트 정보 확인**
   - Settings → General 탭
   - Project ID 복사
   - Team/Org ID 확인

3. **API 토큰 생성**
   - [Vercel Account Tokens](https://vercel.com/account/tokens) 접속
   - "Create Token" 클릭
   - 토큰 이름: "GitHub Actions"
   - 토큰 생성 및 복사

### **Step 3: GitHub 저장소에 Secrets 설정**

1. **GitHub 저장소 접속**
   - `https://github.com/yjjangeco-netizen/unecorailelectric` 접속
   - Settings 탭 클릭

2. **Secrets and variables → Actions 선택**
   - 왼쪽 사이드바에서 "Secrets and variables" → "Actions" 클릭
   - "New repository secret" 버튼 클릭

3. **각 Secret 설정**

#### **DATABASE_URL_DEV**
```
Name: DATABASE_URL_DEV
Value: https://[YOUR_PROJECT_ID].supabase.co
```

#### **DATABASE_URL_PROD**
```
Name: DATABASE_URL_PROD
Value: https://[YOUR_PROJECT_ID].supabase.co
```

#### **VERCEL_TOKEN**
```
Name: VERCEL_TOKEN
Value: [복사한 Vercel 토큰]
```

#### **VERCEL_ORG_ID**
```
Name: VERCEL_ORG_ID
Value: [복사한 Org ID]
```

#### **VERCEL_PROJECT_ID**
```
Name: VERCEL_PROJECT_ID
Value: [복사한 Project ID]
```

## 🧪 **설정 검증**

### **로컬에서 테스트**
```bash
# 코드 품질 검사
npm run lint
npm run type-check
npm run format:check

# 빌드 테스트
npm run build

# 테스트 실행
npm run test
```

### **GitHub Actions에서 테스트**
1. **Actions 탭 확인**
   - GitHub 저장소의 Actions 탭 클릭
   - "Test & Build Pipeline" 워크플로우 확인

2. **수동 실행 테스트**
   - "Run workflow" 버튼 클릭
   - 브랜치 선택 (main)
   - "Run workflow" 클릭

## 🔍 **문제 해결**

### **일반적인 오류**

#### **1. "Permission denied" 오류**
- GitHub Secrets가 올바르게 설정되었는지 확인
- 저장소 권한 확인

#### **2. "Connection refused" 오류**
- DATABASE_URL이 올바른지 확인
- Supabase 프로젝트가 활성 상태인지 확인

#### **3. "Invalid token" 오류**
- VERCEL_TOKEN이 유효한지 확인
- 프로젝트 권한이 있는지 확인

## 📊 **설정 완료 후 모니터링**

### **실행 상태 확인**
- **Actions 탭**: 모든 워크플로우 실행 상태
- **실시간 로그**: 각 단계별 실행 로그
- **아티팩트**: 테스트 결과 및 빌드 파일

### **성공/실패 알림**
- **GitHub 알림**: 저장소 설정에서 알림 활성화
- **이메일 알림**: GitHub 계정 설정에서 이메일 알림 활성화

## 🎉 **완료 후 다음 단계**

GitHub Secrets 설정이 완료되면:

1. **CI/CD 파이프라인 테스트**: 워크플로우 수동 실행
2. **테스트 스크립트 검증**: 새로 추가된 테스트 실행
3. **README 업데이트**: 실제 스크린샷 삽입

---

**💡 팁**: 처음에는 개발 환경(DEV)만 설정하고, 프로덕션 환경(PROD)은 나중에 설정해도 됩니다.
단계별로 진행하여 각 단계가 정상 작동하는지 확인하세요.
