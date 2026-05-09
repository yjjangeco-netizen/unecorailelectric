import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yjjangeco.unecorailelectric',
  appName: 'unecorailelectric',
  webDir: 'out',
  server: {
    // 완전 고정 메인 주소 (이걸 써야 디자인이 영구적으로 자동 업데이트 됩니다)
    url: 'https://unecorailelectric.vercel.app',
    allowNavigation: [
      "*" // 어떤 리다이렉션이 발생해도 절대 크롬으로 튕기지 않도록 강력 통제!
    ],
    cleartext: true
  }
};

export default config;
