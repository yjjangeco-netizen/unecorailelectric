import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * 로컬 개발 환경(Windows 등)에서 Playwright가 설치한 Chromium 실행 파일 경로를 자동 감지합니다.
 * ms-playwright 폴더 내의 chromium-* 폴더를 찾아 chrome.exe 경로를 반환합니다.
 */
function getLocalChromiumPath(): string | undefined {
  try {
    const homeDir = os.homedir();
    const playwrightCacheDir = path.join(homeDir, 'AppData', 'Local', 'ms-playwright');
    if (!fs.existsSync(playwrightCacheDir)) {
      return undefined;
    }

    const folders = fs.readdirSync(playwrightCacheDir);
    // 'chromium-'로 시작하는 폴더 검색
    const chromiumFolder = folders.find((f) => f.startsWith('chromium-'));
    if (!chromiumFolder) {
      return undefined;
    }

    // Windows 환경의 chrome.exe 경로 (32비트/64비트 폴더 모두 탐색)
    const exePath64 = path.join(playwrightCacheDir, chromiumFolder, 'chrome-win64', 'chrome.exe');
    const exePath32 = path.join(playwrightCacheDir, chromiumFolder, 'chrome-win', 'chrome.exe');
    
    if (fs.existsSync(exePath64)) {
      return exePath64;
    }
    if (fs.existsSync(exePath32)) {
      return exePath32;
    }
  } catch (error) {
    console.error('[BrowserPath] 로컬 Chromium 경로 검색 오류:', error);
  }
  return undefined;
}

export const chromiumPath = getLocalChromiumPath();
