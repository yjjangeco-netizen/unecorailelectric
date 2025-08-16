# 🚀 Vercel 배포 문제 해결 가이드

## 🚨 문제 상황
```
Error: No Next.js version detected.
Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

## 🔍 문제 원인 분석

### 1. Root Directory 불일치 (가장 가능성 높음)
- **현재 위치**: `C:\CSHOP\unecorailelectric\`
- **GitHub 저장소**: `unecorailelectric` 서브폴더
- **Vercel 기본 설정**: 저장소 루트에서 package.json 찾기
- **실제 package.json 위치**: `unecorailelectric/package.json`

### 2. vercel.json 설정 문제
- 이전에 `builds` 설정이 있었음
- Vercel이 Next.js 자동 감지를 비활성화

### 3. 경고 메시지
```
WARN! Due to `builds` existing in your configuration file, 
the Build and Development Settings defined in your Project Settings will not apply.
```

## ✅ 해결 방법

### **방법 1: Vercel Root Directory 수정 (권장)**

1. **Vercel Dashboard 접속**
   - [vercel.com](https://vercel.com) → 프로젝트 선택

2. **Settings → General → Root Directory**
   - 현재: `/` (저장소 루트)
   - 변경: `/unecorailelectric` 또는 `unecorailelectric`

3. **저장 후 재배포**

### **방법 2: vercel.json 수정**

```json
{
  "version": 2,
  "framework": "nextjs"
}
```

### **방법 3: vercel.json 완전 제거**

- vercel.json 파일을 삭제하면 Vercel이 자동으로 Next.js 감지

## 🔧 현재 설정 상태

### **package.json** ✅
```json
{
  "dependencies": {
    "next": "15.4.5"
  },
  "scripts": {
    "vercel-build": "next build"
  }
}
```

### **vercel.json** ✅
```json
{
  "version": 2,
  "framework": "nextjs"
}
```

### **next.config.js** ✅
```javascript
module.exports = nextConfig
```

## 📋 Vercel Dashboard 설정 체크리스트

- [ ] **Root Directory**: `/unecorailelectric` 또는 `unecorailelectric`
- [ ] **Framework Preset**: Next.js (자동 감지)
- [ ] **Build Command**: `npm run build`
- [ ] **Output Directory**: `.next`
- [ ] **Install Command**: `npm install`

## 🚀 배포 후 확인사항

1. **빌드 로그 확인**
   - "Next.js version detected" 메시지 확인
   - 빌드 성공 여부 확인

2. **배포 URL 확인**
   - 프로젝트 접근 가능 여부
   - API 라우트 동작 확인

## 💡 추가 팁

### **Root Directory 설정 시 주의사항**
- 슬래시(/) 포함 여부 확인
- 폴더명 정확히 입력
- 저장 후 즉시 재배포

### **vercel.json 우선순위**
1. `framework: "nextjs"` (가장 명확)
2. `builds` 설정 (구체적이지만 복잡)
3. 파일 없음 (자동 감지)

---

## 🎯 결론

**Root Directory를 `unecorailelectric`로 설정하면 문제가 해결됩니다!**

Vercel Dashboard에서:
**Settings → General → Root Directory → `unecorailelectric`**

설정 후 재배포하세요! 🚀
