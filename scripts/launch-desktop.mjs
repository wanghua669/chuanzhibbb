import { spawn } from 'child_process';
import fs from 'fs';

// ============================================================================
// CyberTwin Cozy Studio — 原生独立桌面客户端窗口启动器 (Standalone App Shell)
// 优先调用 Electron / WebView2 / Edge App Mode 打开无地址栏、无书签栏的纯正桌面软件窗口
// ============================================================================

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findExecutable(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const bin = findExecutable(edgePaths) || findExecutable(chromePaths);

if (bin) {
  console.log(`[CyberTwin Desktop] 正在启动独立桌面软件窗口: ${APP_URL}`);
  const child = spawn(
    bin,
    [
      `--app=${APP_URL}`,
      '--window-size=1380,860',
      '--window-position=120,60',
      '--disable-extensions',
    ],
    {
      detached: true,
      stdio: 'ignore',
    }
  );
  child.unref();
} else {
  console.log(`[CyberTwin Desktop] 请在桌面窗口访问: ${APP_URL}`);
}
