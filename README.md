# Uneco Rail Electric Part Management System

전기 파트 재고 관리 및 업무 관리 시스템

## 🚀 Vercel 배포 가이드

### 1. GitHub 저장소 연결
- GitHub에서 새 저장소 생성: `unecorailelectric`
- 로컬 프로젝트를 GitHub에 푸시

### 2. Vercel 프로젝트 생성
- [Vercel](https://vercel.com) 접속
- "New Project" 클릭
- GitHub 저장소 선택: `yjjangeco-netizen/unecorailelectric`
- Framework Preset: Next.js (자동 감지)

### 3. 환경변수 설정
배포 완료 후 Settings → Environment Variables에서 설정:

```
NEXT_PUBLIC_SUPABASE_URL = https://pnmyxzgyeipbvvnnwtoi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubXl4emd5ZWlwYnZ2bm53dG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjQyMjUsImV4cCI6MjA2OTgwMDIyNX0.-0N6pDO0HjjTZd7WqqXJBwf0eBHvGIP_zPQlKpwealA
```

### 4. 재배포
환경변수 저장 후 "Redeploy" 클릭

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Deployment**: Vercel
- **UI Components**: Radix UI, Shadcn/ui

## 📱 주요 기능

- 🔐 사용자 인증 및 권한 관리
- 📦 재고 관리 (입고/출고/이력)
- 📚 메뉴얼 관리
- 📅 업무 일지 및 Google Calendar 연동
- 👥 사용자 관리

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

## �� 라이선스

MIT License
